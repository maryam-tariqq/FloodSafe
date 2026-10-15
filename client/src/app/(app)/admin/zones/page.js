"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { Card, Empty } from "@/components/ui";

export default function ZonesPage() {
  const { msg, safe, MD, loadMap, mode, setMode, zpts, setZpts } = useApp();
  const [name, setName] = useState("");
  const [sev, setSev] = useState("Medium");
  const draw = (clear) => { setMode(clear ? null : "zone"); setZpts([]); msg(clear ? "Cleared" : "Tap map to add points"); };
  const save = safe(async () => {
    if (zpts.length < 3) throw Error("Need 3+ points");
    const ring = zpts.map((p) => [p[1], p[0]]);
    ring.push(ring[0]);
    await api("/zones", { m: "POST", b: { name, severity: sev, geometry: { type: "Polygon", coordinates: [ring] } } });
    setName(""); setZpts([]); setMode(null);
    await loadMap();
  });
  const del = safe(async (id) => { await api("/zones/" + id, { m: "DELETE" }); await loadMap(); });
  return (
    <>
      <h3>Flood zone editor</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Zone name" />
      <select value={sev} onChange={(e) => setSev(e.target.value)}>
        <option>Low</option><option>Medium</option><option>High</option>
      </select>
      <p className="m">Press Draw, then tap map points (3+). {mode === "zone" && `${zpts.length} placed.`}</p>
      <div className="row">
        <button onClick={() => draw()}>Draw</button>
        <button onClick={save}>Save</button>
        <button className="g" onClick={() => draw(true)}>Clear</button>
      </div>
      <h3>Existing</h3>
      {MD.zones.length ? MD.zones.map((z) => (
        <Card key={z.id}><b>{z.name}</b> · {z.severity} <button className="r" onClick={() => del(z.id)}>Remove</button></Card>
      )) : <Empty />}
    </>
  );
}
