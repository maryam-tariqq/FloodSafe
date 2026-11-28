"use client";
import { useApp } from "@/lib/AppContext";
import { useState, useEffect, useRef } from "react";

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
      {pin && (
        <small>
          {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
        </small>
      )}
    </div>
  );
}

// relief-center capacity as a tank that fills with the free spaces
export const Tank = ({ free, total }) => {
  const used = total > 0 ? Math.max(0, Math.min(1, (total - free) / total)) : 1;
  const cls = free <= 0 ? "full" : used >= 0.7 ? "high" : "";
  return (
    <div className={"tank " + cls} title={`${free} of ${total} spaces free`}>
      <u style={{ height: `${used * 100}%` }} />
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
        <div key={l} className={k <= i ? "ok" : ""}>
          {l}
        </div>
      ))}
    </div>
  );
};

// styled dropdown (native <option> lists can't be styled, so this draws its own menu)
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  style,
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const box = useRef(null);
  const cur = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return;
    const away = (e) => {
      if (!box.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const idx = () =>
    Math.max(
      0,
      options.findIndex((o) => String(o.value) === String(value)),
    );
  const pick = (v) => {
    onChange(v);
    setOpen(false);
  };
  const key = (e) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setHi(idx());
        return setOpen(true);
      }
      const d = e.key === "ArrowDown" ? 1 : -1;
      setHi((h) => (h + d + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setHi(idx());
        return setOpen(true);
      }
      if (hi >= 0) pick(options[hi].value);
    }
  };

  return (
    <div className={"dd" + (open ? " open" : "")} ref={box} style={style}>
      <button
        type="button"
        className="dd-btn"
        onClick={() => {
          setHi(-1);
          setOpen(!open);
        }}
        onKeyDown={key}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cur ? "" : "ph"}>{cur ? cur.label : placeholder}</span>
        <i className="dd-arrow" />
      </button>
      {open && (
        <ul className="dd-menu" role="listbox">
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={String(o.value) === String(value)}
              className={
                (String(o.value) === String(value) ? "sel " : "") +
                (i === hi ? "hi" : "")
              }
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(o.value)}
            >
              <span>{o.label}</span>
              {o.sub && <small>{o.sub}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
