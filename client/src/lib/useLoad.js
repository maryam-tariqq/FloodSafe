"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import { useApp } from "./AppContext";

// fetch on mount; returns [data, reload]. Pass poll (ms) to refresh quietly in the background.
export function useLoad(path, poll) {
  const { msg } = useApp();
  const [data, setData] = useState(null);
  const load = useCallback(() => api(path).then(setData).catch((e) => msg(e.message)), [path, msg]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!poll) return;
    const t = setInterval(() => {
      api(path)
        .then((d) => setData((prev) => (JSON.stringify(prev) === JSON.stringify(d) ? prev : d)))
        .catch(() => {});
    }, poll);
    return () => clearInterval(t);
  }, [path, poll]);
  return [data, load];
}
