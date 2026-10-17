"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useApp } from "@/lib/AppContext";
import { esc, fmt } from "@/lib/format";

const SEV = { High: "#e5645a", Medium: "#e6b84a", Low: "#4caf7d" };
// MUI "FloodRounded" icon path (Material Design icons, Apache-2.0)
const FLOOD_PATH =
  "M18.67 19c-1.95 0-2.09 1-3.33 1-1.19 0-1.42-1-3.33-1-1.95 0-2.1 1-3.34 1-1.24 0-1.38-1-3.33-1-1.54 0-1.96.62-2.67.88-.4.15-.67.52-.67.95 0 .71.72 1.19 1.38.94.77-.29 1.11-.77 1.96-.77 1.24 0 1.38 1 3.33 1 1.95 0 2.1-1 3.34-1 1.22 0 1.4 1 3.33 1 1.93 0 2.1-1 3.33-1 .84 0 1.18.47 1.95.77.66.26 1.38-.23 1.38-.94v-.01c0-.42-.27-.8-.67-.94-.71-.26-1.12-.88-2.66-.88zm-9.99-1.5c1.95 0 2.09-1 3.33-1 1.19 0 1.42 1 3.33 1 1.95 0 2.09-1 3.33-1 .82 0 1.17.46 1.93.76.66.26 1.38-.23 1.38-.94 0-.42-.26-.79-.65-.94-.29-.11-.54-.27-.83-.43l-2.02-7.53 1.17.47c.51.21 1.09-.04 1.29-.55.21-.51-.05-1.1-.57-1.29l-9.24-3.54c-.81-.31-1.72-.06-2.27.61l-6.23 7.7c-.35.43-.28 1.06.16 1.4.43.34 1.06.26 1.39-.17l.78-1 .93 3.48c-.18-.02-.35-.05-.56-.05-1.54 0-1.95.62-2.66.88-.4.17-.67.55-.67.97 0 .7.69 1.19 1.35.95.8-.29 1.18-.78 2-.78 1.19 0 1.42 1 3.33 1zm5.36-7.32 1.42 5.31c-1.34.09-1.47-.99-3.47-.99-.36 0-.65.04-.91.1l-.91-3.39 3.87-1.03z";

const floodPin = (L, color) =>
  L.divIcon({
    className: "flood-pin",
    html: `<svg width="44" height="54" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 52C22 52 3 34 3 21a19 19 0 0 1 38 0C41 34 22 52 22 52Z" fill="${color}" stroke="#fff" stroke-width="2.5"/>
      <g transform="translate(10 9)"><path d="${FLOOD_PATH}" fill="#fff"/></g>
    </svg>`,
    iconSize: [44, 54],
    iconAnchor: [22, 52],
    popupAnchor: [0, -50],
  });

export default function MapView() {
  const { MD, pin, setPin, mode, zpts, setZpts, mapRef } = useApp();
  const el = useRef(null);
  const Lr = useRef(null),
    layers = useRef(null),
    pinM = useRef(null),
    zl = useRef(null);

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [ready, setReady] = useState(false);

  // create the map once, client-side only (Leaflet needs `window`)
  useEffect(() => {
    let m,
      ro,
      dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead) return;
      Lr.current = L;
      m = L.map(el.current, { preferCanvas: true }).setView(
        [33.684, 73.0479],
        11,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        updateWhenZooming: false,
        keepBuffer: 4,
      }).addTo(m);
      layers.current = L.featureGroup().addTo(m);
      m.on("click", (e) => {
        if (modeRef.current === "zone")
          setZpts((p) => [...p, [e.latlng.lat, e.latlng.lng]]);
        else setPin(e.latlng);
      });
      mapRef.current = m;
      m.locate({ setView: true, maxZoom: 14 });
      ro = new ResizeObserver(() => m.invalidateSize());
      ro.observe(el.current);
      setReady(true);
    })();
    return () => {
      dead = true;
      ro?.disconnect();
      m && m.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // verified reports, flood zones, relief centers
  useEffect(() => {
    if (!ready) return;
    const L = Lr.current,
      g = layers.current;
    g.clearLayers();
    MD.zones.forEach((z) =>
      L.geoJSON(z.g, {
        style: {
          color: SEV[z.severity] || "#e6b84a",
          fillOpacity: 0.25,
          weight: 2,
        },
      })
        .bindPopup(`<b>${esc(z.name)}</b><br>Flood zone · ${esc(z.severity)}`)
        .addTo(g),
    );
    MD.reports.forEach((r) =>
      L.marker([r.g.coordinates[1], r.g.coordinates[0]], {
        icon: floodPin(L, "#e5645a"),
      })
        .bindPopup(
          `<b>Verified flood report</b><br>${esc(r.description)}${r.photo ? `<br><img width=160 src="/uploads/${esc(r.photo)}">` : ""}<br>${fmt(r.created_at)}`,
        )
        .addTo(g),
    );
    MD.centers.forEach((c) =>
      L.circleMarker([c.g.coordinates[1], c.g.coordinates[0]], {
        radius: 10,
        color: "#fff",
        weight: 2,
        fillOpacity: 0.95,
        fillColor:
          c.status !== "OPEN"
            ? "#888"
            : c.available <= 0
              ? "#e6b84a"
              : "#4caf7d",
      })
        .bindPopup(
          `<b>${esc(c.name)}</b><br>${esc(c.status)} · ${c.available}/${c.capacity} spaces<br><small>Updated ${fmt(c.updated_at)}</small>`,
        )
        .addTo(g),
    );
  }, [ready, MD]);

  // dropped pin (explicit icon URLs: Leaflet's default icon paths break under bundlers)
  useEffect(() => {
    if (!ready) return;
    pinM.current?.remove();
    pinM.current = null;
    if (pin)
      pinM.current = Lr.current
        .marker(pin, { icon: floodPin(Lr.current, "#0b6e8f") })
        .addTo(mapRef.current);
  }, [ready, pin]);

  // flood zone being drawn
  useEffect(() => {
    if (!ready) return;
    zl.current?.remove();
    zl.current = zpts.length
      ? Lr.current
          .polygon(zpts, { color: "#e0875a", dashArray: "4" })
          .addTo(mapRef.current)
      : null;
  }, [ready, zpts]);

  return <div id="map" ref={el} />;
}
