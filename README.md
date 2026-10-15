# FloodSafe (Next.js + Express)

server/  Express + PostGIS API on :4000  (cp .env.example .env, load schema.sql, npm i, npm run dev)
client/  Next.js on :3000                (npm i, npm run dev; optional .env.local with API_URL)

Auth: httpOnly session cookie set by Express, signed with a random key made at startup,
so restarting Express logs everyone out.
