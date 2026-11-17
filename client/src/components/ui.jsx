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
    <div className={"pininfo" + (pin ? " set" : "")}>
      <b>{pin ? "Pin placed" : "Tap the map to drop a pin"}</b>
      {pin && <small>{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</small>}
    </div>
  );
}

// relief-center capacity as a tank that fills with the free spaces
export const Tank = ({ free, total }) => {
  const f = total > 0 ? Math.max(0, Math.min(1, free / total)) : 0;
  return (
    <div className="tank" title={`${free}/${total} spaces free`}>
      <u style={{ height: `${f * 100}%` }} />
    </div>
  );
};
// task progress as a tide tracker
export const Track = ({ s }) => {
  const steps = ["ASSIGNED", "IN_PROGRESS", "COMPLETED"];
  const i = Math.max(0, steps.indexOf(s));
  return (
    <div className="track">
      {["Assigned", "In progress", "Done"].map((l, k) => (
        <div key={l} className={k <= i ? "ok" : ""}>{l}</div>
      ))}
    </div>
  );
};
