"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Badge, Card, Tank } from "@/components/ui";

export default function NearbyPage() {
  const { safe, flyTo, pin, msg } = useApp();
  const [res, setRes] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const find = safe(async () => {
    setLoading(true);
    setSearched(false);
    setRes([]);
    try {
      // no device location (blocked or unsupported): use the pin dropped on the map instead
      const noLoc = (text) => {
        if (!pin) throw Error(text + " Or tap the map to drop a pin and try again.");
        msg("Using the pin you dropped on the map");
        return { lat: pin.lat, lng: pin.lng };
      };
      const p = !navigator.geolocation
        ? noLoc("Your browser doesn't support location.")
        : await new Promise((ok, no) =>
            navigator.geolocation.getCurrentPosition(
              (x) => ok({ lat: x.coords.latitude, lng: x.coords.longitude }),
              (err) => {
                try {
                  ok(
                    noLoc(
                      err.code === 1
                        ? "Location is blocked. Allow it in your browser's site settings."
                        : "Couldn't get your location.",
                    ),
                  );
                } catch (e) {
                  no(e);
                }
              },
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
          <div className="split">
            <div>
              <b>{c.name}</b> <Badge s={c.status} />
              <br />
              {c.km.toFixed(1)} km · {c.available}/{c.capacity} spaces
              <br />
              <small className="m">Updated {fmt(c.updated_at)}</small>
              <br />
              <button className="g" onClick={() => flyTo(c.lat, c.lng)}>
                Show
              </button>
            </div>
            <Tank free={c.available} total={c.capacity} />
          </div>
        </Card>
      ))}
    </>
  );
}
