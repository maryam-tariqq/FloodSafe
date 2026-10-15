"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import { useApp } from "./AppContext";

// fetch on mount; returns [data, reload]
export function useLoad(path) {
  const { msg } = useApp();
  const [data, setData] = useState(null);
  const load = useCallback(() => api(path).then(setData).catch((e) => msg(e.message)), [path, msg]);
  useEffect(() => { load(); }, [load]);
  return [data, load];
}
