// The login cookie travels automatically (same origin via the Next proxy).
export async function api(p, o = {}) {
  const r = await fetch("/api" + p, {
    method: o.m || "GET",
    headers: o.fd ? {} : { "Content-Type": "application/json" },
    body: o.fd || (o.b ? JSON.stringify(o.b) : undefined),
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) {
    // session ended (expired or server restarted): clear the cookie, go to login
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
    throw Error("Session ended – please log in again");
  }
  if (!r.ok) throw Error(j.error || "Request failed");
  return j;
}
