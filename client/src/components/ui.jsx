"use client";
import { useApp } from "@/lib/AppContext";

export const Badge = ({ s }) => (
  <span className={"b " + s}>{s.replace("_", " ").toLowerCase()}</span>
);
export const Card = ({ children }) => <div className="card">{children}</div>;
export const Empty = ({ text = "Nothing here yet." }) => (
  <p className="m">{text}</p>
);
export function PinInfo() {
  const { pin } = useApp();
  return (
    <p className="m">
      {pin
        ? `📍 Pin set (${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)})`
        : "📍 Tap the map to drop a pin"}
    </p>
  );
}
