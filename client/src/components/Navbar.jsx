"use client";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";

export default function Navbar() {
  const { user, setUser, MD } = useApp();
  const logout = async () => {
    try { await api("/auth/logout", { m: "POST" }); } catch {}
    setUser(null);
    window.location.href = "/login"; // full reload clears pin, map state, etc.
  };
  return (
    <header>
      <b>🌊 FloodSafe</b>
      <div id="chips">
        <span className="chip"><b>{MD.reports.length}</b>verified reports</span>
        <span className="chip"><b>{MD.zones.length}</b>flood zones</span>
        <span className="chip"><b>{MD.centers.filter((c) => c.status === "OPEN").length}</b>open centers</span>
      </div>
      {user && (
        <span>
          {user.name} <small className="m">({user.role})</small>{" "}
          <button className="g" onClick={logout}>Logout</button>
        </span>
      )}
    </header>
  );
}
