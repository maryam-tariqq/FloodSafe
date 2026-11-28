"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { PinInfo, Select } from "@/components/ui";

export default function AssistPage() {
  const { msg, pin, safe, MD } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ center: "", people: 1, need: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // only centers that are open and still have free space (refreshed every 5s)
  const free = MD.centers.filter(
    (c) => c.status === "OPEN" && Number(c.available) > 0,
  );
  const opts = [
    { value: "", label: "No relief center" },
    ...free.map((c) => ({
      value: c.id,
      label: c.name,
      sub: `${c.available} free`,
    })),
  ];
  // if the chosen center fills up or closes while the page is open, clear it
  useEffect(() => {
    if (f.center && !free.some((c) => String(c.id) === String(f.center))) {
      setF((p) => ({ ...p, center: "" }));
      msg("That relief center just became full or closed");
    }
  }, [MD.centers]);

  const send = safe(async () => {
    if (!pin) throw Error("Tap the map to drop a pin");
    await api("/requests", {
      m: "POST",
      b: {
        center_id: f.center || null,
        people: f.people,
        need: f.need,
        lat: pin.lat,
        lng: pin.lng,
      },
    });
    msg("Request sent");
    router.push("/my-requests");
  });
  return (
    <>
      <h3>Request assistance</h3>
      <PinInfo />
      <Select
        value={f.center}
        onChange={(v) => setF({ ...f, center: v })}
        options={opts}
        placeholder="No relief center"
      />
      {free.length === 0 && (
        <p className="m">All relief centers are currently full or closed.</p>
      )}
      <input
        type="number"
        min={1}
        value={f.people}
        onChange={set("people")}
        placeholder="People"
      />
      <input
        value={f.need}
        onChange={set("need")}
        placeholder="Need (food, water, medicine, rescue…)"
      />
      <button onClick={send}>Send request</button>
    </>
  );
}
