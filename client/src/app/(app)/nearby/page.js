"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Badge, Card } from "@/components/ui";

export default function NearbyPage() {
  const { safe, flyTo } = useApp();
  const [res, setRes] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const find = safe(async () => {
    setLoading(true);
    setSearched(false);
    setRes([]);
    try {
      if (!navigator.geolocation)
        throw Error("Your browser doesn't support location");
      const p = await new Promise((ok, no) =>
        navigator.geolocation.getCurrentPosition(
          (x) => ok({ lat: x.coords.latitude, lng: x.coords.longitude }),
          (err) =>
            no(
              Error(
                err.code === 1
                  ? "Location is blocked. Allow it in your browser's site settings and try again."
                  : "Couldn't get your location. Try again.",
              ),
            ),
          { enableHighAccuracy: true, timeout: 10000 },
        ),
      );
      setRes(await api(`/centers/nearby?lat=${p.lat}&lng=${p.lng}`));
      setSearched(true);
    } finally {
      setLoading(false);
    }
  });

  return (
    <>
      <h3>Nearby relief centers</h3>
      <p className="m">Uses your device's current location.</p>
      <button onClick={find} disabled={loading}>
        {loading ? "Searching…" : "Find nearest"}
      </button>
      {loading && (
        <p className="m">
          <span className="spin" /> Getting your location and checking nearby
          centers…
        </p>
      )}

      {searched && !loading && res.length === 0 && (
        <p className="m">No relief centres within 50km of you yet</p>
      )}

      {res.map((c) => (
        <Card key={c.id}>
          <b>{c.name}</b> <Badge s={c.status} />
          <br />
          {c.km.toFixed(1)} km · {c.available}/{c.capacity} spaces
          <br />
          <small className="m">Updated {fmt(c.updated_at)}</small>
          <br />
          <button className="g" onClick={() => flyTo(c.lat, c.lng)}>
            Show
          </button>
        </Card>
      ))}
    </>
  );
}
