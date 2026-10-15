"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Badge, Card, Empty, PinInfo } from "@/components/ui";

function CenterRow({ c }) {
  const { safe, loadMap } = useApp();
  const [av, setAv] = useState(c.available);
  const [st, setSt] = useState(c.status);
  const save = safe(async () => {
    await api("/centers/" + c.id, { m: "PUT", b: { available: av, status: st } });
    await loadMap();
  });
  return (
    <Card>
      <b>{c.name}</b> <Badge s={c.status} /><br />
      <small className="m">Updated {fmt(c.updated_at)}</small>
      <div className="row">
        <input type="number" value={av} onChange={(e) => setAv(e.target.value)} style={{ width: 70 }} />
        <small className="m" style={{ alignSelf: "center" }}>/ {c.capacity}</small>
        <select value={st} onChange={(e) => setSt(e.target.value)} style={{ width: 90 }}>
          <option>OPEN</option><option>CLOSED</option>
        </select>
        <button onClick={save}>Save</button>
      </div>
    </Card>
  );
}

export default function CentersPage() {
  const { safe, pin, MD, loadMap } = useApp();
  const [f, setF] = useState({ name: "", capacity: "", available: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = safe(async () => {
    if (!pin) throw Error("Tap the map to place the center");
    await api("/centers", { m: "POST", b: { ...f, lat: pin.lat, lng: pin.lng } });
    setF({ name: "", capacity: "", available: "" });
    await loadMap();
  });
  return (
    <>
      <h3>Relief centers</h3>
      <Card>
        <PinInfo />
        <input value={f.name} onChange={set("name")} placeholder="Center name" />
        <div className="row">
          <input type="number" value={f.capacity} onChange={set("capacity")} placeholder="Capacity" style={{ width: "48%" }} />
          <input type="number" value={f.available} onChange={set("available")} placeholder="Available" style={{ width: "48%" }} />
        </div>
        <button onClick={add}>Add center</button>
      </Card>
      {MD.centers.length ? MD.centers.map((c) => <CenterRow key={c.id + c.updated_at} c={c} />) : <Empty />}
    </>
  );
}
