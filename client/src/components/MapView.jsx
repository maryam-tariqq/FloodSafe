"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useApp } from "@/lib/AppContext";
import { esc, fmt } from "@/lib/format";

const CDN = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/";
const SEV = { High: "#e5645a", Medium: "#e6b84a", Low: "#4caf7d" };

export default function MapView() {
  const { MD, pin, setPin, mode, zpts, setZpts, mapRef } = useApp();
  const el = useRef(null);
  const Lr = useRef(null), layers = useRef(null), pinM = useRef(null), zl = useRef(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [ready, setReady] = useState(false);

  // create the map once, client-side only (Leaflet needs `window`)
  useEffect(() => {
    let m, dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead) return;
      Lr.current = L;
      m = L.map(el.current).setView([31.52, 74.35], 11);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Tiles © Esri" }).addTo(m);
      layers.current = L.layerGroup().addTo(m);
      m.on("click", (e) => {
        if (modeRef.current === "zone") setZpts((p) => [...p, [e.latlng.lat, e.latlng.lng]]);
        else setPin(e.latlng);
      });
      mapRef.current = m;
      setReady(true);
    })();
    return () => { dead = true; m && m.remove(); mapRef.current = null; setReady(false); };
  }, []);

  // verified reports, flood zones, relief centers
  useEffect(() => {
    if (!ready) return;
    const L = Lr.current, g = layers.current;
    g.clearLayers();
    MD.zones.forEach((z) =>
      L.geoJSON(z.g, { style: { color: SEV[z.severity] || "#e6b84a", fillOpacity: 0.25, weight: 2 } })
        .bindPopup(`<b>${esc(z.name)}</b><br>Flood zone · ${esc(z.severity)}`).addTo(g));
    MD.reports.forEach((r) =>
      L.circleMarker([r.g.coordinates[1], r.g.coordinates[0]], { radius: 8, color: "#e5645a", fillOpacity: 0.9 })
        .bindPopup(`<b>Verified flood report</b><br>${esc(r.description)}${r.photo ? `<br><img width=160 src="/uploads/${esc(r.photo)}">` : ""}<br>${fmt(r.created_at)}`)
        .addTo(g));
    MD.centers.forEach((c) =>
      L.circleMarker([c.g.coordinates[1], c.g.coordinates[0]], {
        radius: 10, fillOpacity: 0.9,
        color: c.status !== "OPEN" ? "#888" : c.available <= 0 ? "#e6b84a" : "#4caf7d",
      }).bindPopup(`<b>${esc(c.name)}</b><br>${esc(c.status)} · ${c.available}/${c.capacity} spaces<br><small>Updated ${fmt(c.updated_at)}</small>`)
        .addTo(g));
  }, [ready, MD]);

  // dropped pin (explicit icon URLs: Leaflet's default icon paths break under bundlers)
  useEffect(() => {
    if (!ready) return;
    pinM.current?.remove();
    pinM.current = null;
    if (pin) {
      const L = Lr.current;
      const icon = L.icon({ iconUrl: CDN + "marker-icon.png", iconRetinaUrl: CDN + "marker-icon-2x.png",
        shadowUrl: CDN + "marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41] });
      pinM.current = L.marker(pin, { icon }).addTo(mapRef.current);
    }
  }, [ready, pin]);

  // flood zone being drawn
  useEffect(() => {
    if (!ready) return;
    zl.current?.remove();
    zl.current = zpts.length ? Lr.current.polygon(zpts, { color: "#e0875a", dashArray: "4" }).addTo(mapRef.current) : null;
  }, [ready, zpts]);

  return <div id="map" ref={el} />;
}
