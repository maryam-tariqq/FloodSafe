"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PUBLIC_PATHS } from "./roles";
import { api } from "./api";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState("");
  const [MD, setMD] = useState({ zones: [], reports: [], centers: [] });
  const [pin, setPin] = useState(null);
  const [mode, setMode] = useState(null); // "zone" while drawing
  const [zpts, setZpts] = useState([]);
  const mapRef = useRef(null);
  const path = usePathname();
  const router = useRouter();

  // who am I? null = guest. A stale login (after a server restart) also ends up here.
  useEffect(() => {
    api("/auth/me")
      .then((u) => {
        setUser(u);
        if (!u && !PUBLIC_PATHS.includes(path)) router.replace("/login");
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const msg = useCallback((t) => {
    setToast(t);
    setTimeout(() => setToast(""), 3500);
  }, []);
  const safe = useCallback((f) => async (...a) => { try { await f(...a); } catch (e) { msg(e.message); } }, [msg]);

  const loadMap = useCallback(() => api("/map").then(setMD).catch(() => {}), []);
  useEffect(() => {
    loadMap();
    const t = setInterval(loadMap, 5000);
    return () => clearInterval(t);
  }, [loadMap]);

  // leaving a page cancels zone drawing
  useEffect(() => { setMode(null); setZpts([]); }, [path]);

  const flyTo = (lat, lng) => mapRef.current?.flyTo([lat, lng], 15);

  return (
    <Ctx.Provider value={{ ready, user, setUser, msg, safe, MD, loadMap, pin, setPin, mode, setMode, zpts, setZpts, mapRef, flyTo }}>
      {children}
      <div id="toast" style={{ display: toast ? "block" : "none" }}>{toast}</div>
    </Ctx.Provider>
  );
}
