"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Badge, Card } from "@/components/ui";

export default function NearbyPage() {
  const { pin, safe, flyTo } = useApp();
  const [res, setRes] = useState([]);
  const find = safe(async () => {
    const p = pin || await new Promise((ok, no) =>
      navigator.geolocation.getCurrentPosition(
        (x) => ok({ lat: x.coords.latitude, lng: x.coords.longitude }),
        () => no(Error("Drop a pin or allow location"))));
    setRes(await api(`/centers/nearby?lat=${p.lat}&lng=${p.lng}`));
  });
  return (
    <>
      <h3>Nearby relief centers</h3>
      <p className="m">Uses your pin, otherwise your device location.</p>
      <button onClick={find}>Find nearest</button>
      {res.map((c) => (
        <Card key={c.id}>
          <b>{c.name}</b> <Badge s={c.status} /><br />
          {c.km.toFixed(1)} km · {c.available}/{c.capacity} spaces<br />
          <small className="m">Updated {fmt(c.updated_at)}</small><br />
          <button className="g" onClick={() => flyTo(c.lat, c.lng)}>Show</button>
        </Card>
      ))}
    </>
  );
}
