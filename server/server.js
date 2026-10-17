require("dotenv").config();

const express = require("express"),
  { Pool } = require("pg"),
  bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken"),
  cookieParser = require("cookie-parser"),
  multer = require("multer"),
  fs = require("fs"),
  path = require("path");

const db = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
});

// random on every start: restarting the server invalidates every existing login
const SECRET = require("crypto").randomBytes(32).toString("hex");

fs.mkdirSync("uploads", { recursive: true });
const up = multer({
  storage: multer.diskStorage({
    destination: "uploads",
    filename: (r, f, cb) =>
      cb(null, Date.now() + (f.mimetype == "image/png" ? ".png" : ".jpg")),
  }),
  limits: { fileSize: 2e6 },
  fileFilter: (r, f, cb) => cb(null, /^image\/(jpeg|png)$/.test(f.mimetype)),
});
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
const q = (s, p) => db.query(s, p).then((r) => r.rows);
const wrap = (f) => (req, res) =>
  f(req, res).catch((e) => {
    console.error(e.message); // full detail stays in the server log only
    if (e.code == 401) return res.status(401).json({ error: e.message });
    if (e.code === "23505")
      return res.status(409).json({ error: "That already exists." });
    if (e.code)
      return res
        .status(400)
        .json({ error: "Something went wrong. Please try again." });
    res.status(400).json({ error: e.message });
  });
const auth =
  (...roles) =>
  (req, res, next) => {
    try {
      req.user = jwt.verify(req.cookies?.token || "", SECRET);
    } catch {
      return res.status(401).json({ error: "Login required" });
    }
    if (roles.length && !roles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
const sign = (u) =>
  jwt.sign({ id: u.id, role: u.role, name: u.name }, SECRET, {
    expiresIn: "12h",
  });
// session cookie: the browser drops it on close
const setSession = (res, u) =>
  res.cookie("token", sign(u), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
const PT = "ST_SetSRID(ST_MakePoint(%lng,%lat),4326)";
const LL = "ST_Y(geom) lat,ST_X(geom) lng";
const okLL = (a, b) =>
  +a >= -90 && +a <= 90 && +b >= -180 && +b <= 180 && a !== "" && b !== "";

// ---- auth
app.post(
  "/api/auth/register",
  wrap(async (req, res) => {
    const { name, contact, password, role } = req.body;
    if (
      !name?.trim() ||
      !contact?.trim() ||
      (password || "").length < 6 ||
      !["resident", "volunteer"].includes(role)
    )
      throw Error("Invalid details (password 6+ chars)");
    const [u] = await q(
      "insert into users(name,contact,password_hash,role) values($1,$2,$3,$4) returning id,name,role",
      [name.trim(), contact.trim(), await bcrypt.hash(password, 10), role],
    ).catch((e) => {
      if (e.code === "23505")
        throw Error(
          "An account with this phone or email already exists. Try logging in.",
        );
      throw e;
    });
    setSession(res, u);
    res.json({ user: u });
  }),
);
app.post(
  "/api/auth/login",
  wrap(async (req, res) => {
    const [u] = await q("select * from users where contact=$1", [
      req.body.contact,
    ]);
    if (!u || !(await bcrypt.compare(req.body.password || "", u.password_hash)))
      throw Error("Wrong credentials");
    if (req.body.role && u.role !== req.body.role)
      throw Error(
        "This is not a " +
          ({ resident: "user", authority: "admin" }[u.role] || u.role) +
          " account",
      );
    setSession(res, u);
    res.json({ user: { id: u.id, name: u.name, role: u.role } });
  }),
);

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: 1 });
});
// who is logged in? null for guests; a stale cookie (e.g. after a restart) is cleared
app.get("/api/auth/me", (req, res) => {
  try {
    const { id, name, role } = jwt.verify(req.cookies?.token || "", SECRET);
    res.json({ id, name, role });
  } catch {
    if (req.cookies?.token) res.clearCookie("token");
    res.json(null);
  }
});

// ---- public map (verified data only)
app.get(
  "/api/map",
  wrap(async (req, res) => {
    const [reports, zones, centers] = await Promise.all([
      q(
        `select id,description,photo,created_at,ST_AsGeoJSON(geom)::json g from reports where status='VERIFIED'`,
      ),
      q(`select id,name,severity,ST_AsGeoJSON(geom)::json g from flood_zones`),
      q(
        `select id,name,capacity,available,status,updated_at,ST_AsGeoJSON(geom)::json g from relief_centers`,
      ),
    ]);
    res.json({ reports, zones, centers });
  }),
);
// PostGIS KNN: nearest centers, distance in km via geography
app.get(
  "/api/centers/nearby",
  wrap(async (req, res) => {
    const { lat, lng } = req.query;
    if (!okLL(lat, lng)) throw Error("Bad location");
    res.json(
      await q(
        `select id,name,capacity,available,status,updated_at,${LL},
    ST_Distance(geom::geography,ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)/1000 km
    from relief_centers
    where ST_DWithin(geom::geography,ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,$3)
    order by (status='OPEN' and available>0) desc, geom<->ST_SetSRID(ST_MakePoint($1,$2),4326) limit 5`,
        [+lng, +lat, 50000],
      ),
    );
  }),
);

// ---- reports
app.post(
  "/api/reports",
  auth("resident"),
  up.single("photo"),
  wrap(async (req, res) => {
    const { lat, lng, description } = req.body;
    if (!okLL(lat, lng) || !(description || "").trim())
      throw Error("Location and description required");
    res.json(
      (
        await q(
          `insert into reports(user_id,description,photo,geom) values($1,$2,$3,ST_SetSRID(ST_MakePoint($4,$5),4326)) returning id`,
          [
            req.user.id,
            description.slice(0, 500),
            req.file?.filename,
            +lng,
            +lat,
          ],
        )
      )[0],
    );
  }),
);
app.get(
  "/api/reports/mine",
  auth("resident"),
  wrap(async (req, res) =>
    res.json(
      await q(
        "select id,description,status,created_at from reports where user_id=$1 order by id desc",
        [req.user.id],
      ),
    ),
  ),
);
app.get(
  "/api/reports",
  auth("authority"),
  wrap(async (req, res) =>
    res.json(
      await q(
        `select r.id,r.description,r.photo,r.status,r.created_at,u.name,ST_Y(r.geom) lat,ST_X(r.geom) lng from reports r join users u on u.id=r.user_id where r.status=$1 order by r.created_at`,
        [req.query.status || "PENDING"],
      ),
    ),
  ),
);
app.patch(
  "/api/reports/:id",
  auth("authority"),
  wrap(async (req, res) => {
    if (!["VERIFIED", "REJECTED", "ARCHIVED"].includes(req.body.status))
      throw Error("Bad status");
    await q("update reports set status=$1,decided_at=now() where id=$2", [
      req.body.status,
      req.params.id,
    ]);
    res.json({ ok: 1 });
  }),
);

// ---- flood zones
app.post(
  "/api/zones",
  auth("authority"),
  wrap(async (req, res) => {
    const { name, severity, geometry } = req.body;
    if (!name || geometry?.type != "Polygon")
      throw Error("Name and polygon required");
    res.json(
      (
        await q(
          "insert into flood_zones(name,severity,geom) values($1,$2,ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON($3),4326))) returning id",
          [name, severity, JSON.stringify(geometry)],
        )
      )[0],
    );
  }),
);
app.delete(
  "/api/zones/:id",
  auth("authority"),
  wrap(async (req, res) => {
    await q("delete from flood_zones where id=$1", [req.params.id]);
    res.json({ ok: 1 });
  }),
);

// ---- relief centers
app.post(
  "/api/centers",
  auth("authority"),
  wrap(async (req, res) => {
    const { name, lat, lng, capacity, available, status } = req.body;
    if (!name || !okLL(lat, lng)) throw Error("Name and location required");
    res.json(
      (
        await q(
          "insert into relief_centers(name,geom,capacity,available,status) values($1,ST_SetSRID(ST_MakePoint($2,$3),4326),$4,$5,$6) returning id",
          [name, +lng, +lat, +capacity, +available, status || "OPEN"],
        )
      )[0],
    );
  }),
);
app.put(
  "/api/centers/:id",
  auth("authority"),
  wrap(async (req, res) => {
    await q(
      "update relief_centers set available=$1,status=$2,updated_at=now() where id=$3",
      [+req.body.available, req.body.status, req.params.id],
    );
    res.json({ ok: 1 });
  }),
);

// ---- assistance requests
app.post(
  "/api/requests",
  auth("resident"),
  wrap(async (req, res) => {
    const { center_id, people, need, lat, lng } = req.body;
    if (!okLL(lat, lng) || !need?.trim())
      throw Error("Location and need required");
    res.json(
      (
        await q(
          "insert into requests(user_id,center_id,people,need,geom) values($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326)) returning id",
          [
            req.user.id,
            center_id || null,
            +people,
            need.slice(0, 300),
            +lng,
            +lat,
          ],
        )
      )[0],
    );
  }),
);
app.get(
  "/api/requests/mine",
  auth("resident"),
  wrap(async (req, res) =>
    res.json(
      await q(
        `select r.id,r.people,r.need,r.status,r.created_at,c.name center from requests r left join relief_centers c on c.id=r.center_id where r.user_id=$1 order by r.id desc`,
        [req.user.id],
      ),
    ),
  ),
);
app.get(
  "/api/requests",
  auth("authority"),
  wrap(async (req, res) =>
    res.json(
      await q(
        `select r.id,r.people,r.need,r.status,r.created_at,u.name,u.contact,c.name center,ST_Y(r.geom) lat,ST_X(r.geom) lng,t.priority,t.status task_status,v.name volunteer
   from requests r join users u on u.id=r.user_id left join relief_centers c on c.id=r.center_id left join tasks t on t.request_id=r.id left join users v on v.id=t.volunteer_id order by r.id desc`,
      ),
    ),
  ),
);
app.post(
  "/api/requests/:id/accept",
  auth("authority"),
  wrap(async (req, res) => {
    await q(
      `update requests set status='ACCEPTED' where id=$1 and status='PENDING'`,
      [req.params.id],
    );
    res.json({ ok: 1 });
  }),
);
app.post(
  "/api/requests/:id/assign",
  auth("authority"),
  wrap(async (req, res) => {
    const { volunteer_id, priority } = req.body;
    if (!["Low", "Medium", "High"].includes(priority))
      throw Error("Pick priority");
    const c = await db.connect();
    try {
      await c.query("begin");
      const r = await c.query(
        `update requests set status='ASSIGNED' where id=$1 and status='ACCEPTED'`,
        [req.params.id],
      );
      if (!r.rowCount) throw Error("Accept the request first");
      await c.query(
        "insert into tasks(request_id,volunteer_id,priority) values($1,$2,$3)",
        [req.params.id, volunteer_id, priority],
      );
      await c.query("commit");
      res.json({ ok: 1 });
    } catch (e) {
      await c.query("rollback");
      throw e;
    } finally {
      c.release();
    }
  }),
);
app.get(
  "/api/volunteers",
  auth("authority"),
  wrap(async (req, res) =>
    res.json(
      await q(`select id,name from users where role='volunteer' order by name`),
    ),
  ),
);

// ---- volunteer tasks (request details only for the assigned volunteer)
app.get(
  "/api/tasks/mine",
  auth("volunteer"),
  wrap(async (req, res) =>
    res.json(
      await q(
        `select t.id,t.priority,t.status,r.people,r.need,u.name resident,u.contact,c.name center,ST_Y(r.geom) lat,ST_X(r.geom) lng
   from tasks t join requests r on r.id=t.request_id join users u on u.id=r.user_id left join relief_centers c on c.id=r.center_id where t.volunteer_id=$1 order by t.id desc`,
        [req.user.id],
      ),
    ),
  ),
);
app.patch(
  "/api/tasks/:id",
  auth("volunteer"),
  wrap(async (req, res) => {
    const { status } = req.body;
    if (!["IN_PROGRESS", "COMPLETED"].includes(status))
      throw Error("Bad status");
    const [t] = await q(
      "update tasks set status=$1,updated_at=now() where id=$2 and volunteer_id=$3 returning request_id",
      [status, req.params.id, req.user.id],
    );
    if (!t) throw Error("Not your task");
    await q("update requests set status=$1 where id=$2", [
      status == "COMPLETED" ? "RESOLVED" : "IN_PROGRESS",
      t.request_id,
    ]);
    res.json({ ok: 1 });
  }),
);

// ---- authority dashboard (spatial join: verified reports inside flood zones)
app.get(
  "/api/stats",
  auth("authority"),
  wrap(async (req, res) =>
    res.json(
      (
        await q(
          `select (select count(*) from reports where status='PENDING')::int pending,(select count(*) from reports where status='VERIFIED')::int verified,
   (select count(*) from flood_zones)::int zones,(select count(*) from relief_centers where status='OPEN')::int open_centers,
   (select coalesce(sum(available),0) from relief_centers where status='OPEN')::int spaces,
   (select count(*) from requests where status<>'RESOLVED')::int active_requests,
   (select count(distinct r.id) from reports r join flood_zones z on ST_Intersects(r.geom,z.geom) where r.status='VERIFIED')::int in_zones`,
        )
      )[0],
    ),
  ),
);

(async () => {
  const [a] = await q(`select 1 from users where role='authority'`);
  if (!a)
    await q(
      `insert into users(name,contact,password_hash,role) values('Administrator',$1,$2,'authority')`,
      [
        process.env.ADMIN_CONTACT || "admin@floodsafe.pk",
        await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10),
      ],
    );
  app.listen(process.env.PORT || 3000, () =>
    console.log("FloodSafe on http://localhost:" + (process.env.PORT || 3000)),
  );
})().catch((e) => {
  console.error("Startup failed (is schema.sql loaded?):", e.message);
  process.exit(1);
});
