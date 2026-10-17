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

export default function ZonesPage() {
  const { safe, MD, loadMap, pin, setPin, setZpts } = useApp();
  const [name, setName] = useState("");
  const [sev, setSev] = useState("Medium");
  const [radius, setRadius] = useState(500);

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
    if (!pin) throw Error("Tap the map to set the circle's center");
    if (!(radius > 0)) throw Error("Enter a radius in meters");
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

  const del = safe(async (id) => {
    await api("/zones/" + id, { m: "DELETE" });
    await loadMap();
  });

  return (
    <>
      <h3>Flood zone editor</h3>
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
        Tap the map to set the center, then choose the radius.
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
        <button onClick={save}>Save zone</button>
        <button className="g" onClick={() => setPin(null)}>
          Clear
        </button>
      </div>
      <h3>Existing</h3>
      {MD.zones.length ? (
        MD.zones.map((z) => (
          <Card key={z.id}>
            <b>{z.name}</b> · {z.severity}{" "}
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
