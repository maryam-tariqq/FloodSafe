"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Badge, Card, Empty, PinInfo, Select } from "@/components/ui";

function CenterRow({ c }) {
  const { safe, loadMap, pin, setPin } = useApp();
  const [nm, setNm] = useState(c.name);
  const [cap, setCap] = useState(c.capacity);
  const [av, setAv] = useState(c.available);
  const [st, setSt] = useState(c.status);
  const [move, setMove] = useState(false);
  const save = safe(async () => {
    if (!nm.trim()) throw Error("Center name is required");
    if (!(+cap >= 0) || !(+av >= 0))
      throw Error("Capacity and available must be 0 or more");
    if (+av > +cap)
      throw Error("Available spaces can't be more than the total capacity");
    const b = { name: nm, capacity: cap, available: av, status: st };
    if (move) {
      if (!pin) throw Error("Tap the map to choose the new location");
      b.lat = pin.lat;
      b.lng = pin.lng;
    }
    await api("/centers/" + c.id, { m: "PUT", b });
    if (move) setPin(null);
    await loadMap();
  });
  const del = safe(async () => {
    if (!confirm("Delete this relief center?")) return;
    await api("/centers/" + c.id, { m: "DELETE" });
    await loadMap();
  });
  return (
    <Card>
      <input value={nm} onChange={(e) => setNm(e.target.value)} />
      <Badge s={c.status} />
      <br />
      <small className="m">Updated {fmt(c.updated_at)}</small>
      <div className="row">
        <input
          type="number"
          value={av}
          onChange={(e) => setAv(e.target.value)}
          style={{ width: 70 }}
        />
        <small className="m" style={{ alignSelf: "center" }}>
          /
        </small>
        <input
          type="number"
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          style={{ width: 70 }}
        />
        <Select
          value={st}
          onChange={setSt}
          options={[
            { value: "OPEN", label: "OPEN" },
            { value: "CLOSED", label: "CLOSED" },
          ]}
          style={{ width: 120 }}
        />
        <button onClick={save}>Save</button>
      </div>
      <div className="row">
        <label className="m">
          <input
            type="checkbox"
            checked={move}
            onChange={(e) => setMove(e.target.checked)}
            style={{ width: "auto" }}
          />{" "}
          Move to the pin on the map{move && !pin ? " (tap the map first)" : ""}
        </label>
        <button className="r" onClick={del}>
          Delete
        </button>
      </div>
    </Card>
  );
}

export default function CentersPage() {
  const { safe, pin, MD, loadMap } = useApp();
  const [f, setF] = useState({ name: "", capacity: "", available: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = safe(async () => {
    if (!f.name.trim()) throw Error("Center name is required");
    if (f.capacity === "" || f.available === "")
      throw Error("Enter both capacity and available spaces");
    if (!(+f.capacity >= 0) || !(+f.available >= 0))
      throw Error("Capacity and available must be 0 or more");
    if (+f.available > +f.capacity)
      throw Error("Available spaces can't be more than the total capacity");
    if (!pin) throw Error("Tap the map to place the center");
    await api("/centers", {
      m: "POST",
      b: { ...f, lat: pin.lat, lng: pin.lng },
    });
    setF({ name: "", capacity: "", available: "" });
    await loadMap();
  });
  return (
    <>
      <h3>Relief centers</h3>
      <Card>
        <PinInfo />
        <input
          value={f.name}
          onChange={set("name")}
          placeholder="Center name"
        />
        <div className="row">
          <input
            type="number"
            value={f.capacity}
            onChange={set("capacity")}
            placeholder="Capacity"
            style={{ width: "48%" }}
          />
          <input
            type="number"
            value={f.available}
            onChange={set("available")}
            placeholder="Available"
            style={{ width: "48%" }}
          />
        </div>
        <button onClick={add}>Add center</button>
      </Card>
      {MD.centers.length ? (
        MD.centers.map((c) => <CenterRow key={c.id + c.updated_at} c={c} />)
      ) : (
        <Empty />
      )}
    </>
  );
}
