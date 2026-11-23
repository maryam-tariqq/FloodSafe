"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { Card, Empty } from "@/components/ui";

// 64 points around a center; r is in meters
function circleRing({ lat, lng }, r) {
  const pts = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    pts.push([
      lat + (r * Math.cos(a)) / 111320,
      lng + (r * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180)),
    ]);
  }
  return pts;
}

// center and radius of a zone drawn by this editor (a 64-point circle), read back from its GeoJSON
function zoneCircle(g) {
  const ring = g.coordinates[0].slice(0, -1);
  const lat = ring.reduce((a, p) => a + p[1], 0) / ring.length;
  const lng = ring.reduce((a, p) => a + p[0], 0) / ring.length;
  const r = Math.round(Math.abs(ring[0][1] - lat) * 111320);
  return { lat, lng, r };
}

export default function ZonesPage() {
  const { safe, MD, loadMap, pin, setPin, setZpts, flyTo } = useApp();
  const [name, setName] = useState("");
  const [sev, setSev] = useState("Medium");
  const [radius, setRadius] = useState(500);
  const [editId, setEditId] = useState(null); // zone being edited, null = adding a new one
  const [orig, setOrig] = useState(null); // the edited zone's current center and radius

  // start with no pin, and clear the preview when leaving the page
  useEffect(() => {
    setPin(null);
    return () => setZpts([]);
  }, []);

  // live preview: a dashed circle around the pin
  useEffect(() => {
    setZpts(pin && radius > 0 ? circleRing(pin, +radius) : []);
  }, [pin, radius]);

  const save = safe(async () => {
    if (!name.trim()) throw Error("Enter a zone name");
    if (!editId && !pin) throw Error("Tap the map to set the circle's center");
    if (pin && !(radius > 0)) throw Error("Enter a radius in meters");
    if (editId) {
      // the shape is replaced only when the center or radius was changed
      let geometry;
      const moved =
        pin &&
        (!orig ||
          Math.abs(pin.lat - orig.lat) > 1e-9 ||
          Math.abs(pin.lng - orig.lng) > 1e-9 ||
          +radius !== orig.r);
      if (moved) {
        const r = circleRing(pin, +radius).map((p) => [p[1], p[0]]);
        r.push(r[0]);
        geometry = { type: "Polygon", coordinates: [r] };
      }
      await api("/zones/" + editId, { m: "PUT", b: { name, severity: sev, geometry } });
      cancel();
      await loadMap();
      return;
    }
    const ring = circleRing(pin, +radius).map((p) => [p[1], p[0]]);
    ring.push(ring[0]);
    await api("/zones", {
      m: "POST",
      b: {
        name,
        severity: sev,
        geometry: { type: "Polygon", coordinates: [ring] },
      },
    });
    setName("");
    setPin(null);
    await loadMap();
  });

  const cancel = () => {
    setEditId(null);
    setOrig(null);
    setRadius(500);
    setName("");
    setSev("Medium");
    setPin(null);
  };

  const del = safe(async (id) => {
    await api("/zones/" + id, { m: "DELETE" });
    await loadMap();
  });

  return (
    <>
      <h3>{editId ? "Edit flood zone" : "Flood zone editor"}</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Zone name"
      />
      <select value={sev} onChange={(e) => setSev(e.target.value)}>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <p className="m">
        {editId
          ? "Change the name or severity. To move the zone tap a new center on the map; to resize it change the radius."
          : "Tap the map to set the center, then choose the radius."}
      </p>
      <input
        type="number"
        min={50}
        step={50}
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        placeholder="Radius in meters"
      />
      <div className="row">
        <button onClick={save}>{editId ? "Update zone" : "Save zone"}</button>
        {editId ? (
          <button className="g" onClick={cancel}>Cancel</button>
        ) : (
          <button className="g" onClick={() => setPin(null)}>Clear</button>
        )}
      </div>
      <h3>Existing</h3>
      {MD.zones.length ? (
        MD.zones.map((z) => (
          <Card key={z.id}>
            <b>{z.name}</b> · {z.severity}{" "}
            <button
              className="g"
              onClick={() => {
                const c = zoneCircle(z.g);
                setEditId(z.id);
                setOrig(c);
                setName(z.name);
                setSev(z.severity);
                setRadius(c.r);
                setPin({ lat: c.lat, lng: c.lng });
                flyTo(c.lat, c.lng);
              }}
            >
              Edit
            </button>{" "}
            <button className="r" onClick={() => del(z.id)}>
              Remove
            </button>
          </Card>
        ))
      ) : (
        <Empty />
      )}
    </>
  );
}
