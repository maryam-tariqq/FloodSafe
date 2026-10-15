"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { PinInfo } from "@/components/ui";

export default function AssistPage() {
  const { msg, pin, safe, MD } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ center: "", people: 1, need: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const send = safe(async () => {
    if (!pin) throw Error("Tap the map to drop a pin");
    await api("/requests", { m: "POST", b: { center_id: f.center || null, people: f.people, need: f.need, lat: pin.lat, lng: pin.lng } });
    msg("Request sent");
    router.push("/my-requests");
  });
  return (
    <>
      <h3>Request assistance</h3>
      <PinInfo />
      <select value={f.center} onChange={set("center")}>
        <option value="">No relief center</option>
        {MD.centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input type="number" min={1} value={f.people} onChange={set("people")} placeholder="People" />
      <input value={f.need} onChange={set("need")} placeholder="Need (food, water, medicine, rescue…)" />
      <button onClick={send}>Send request</button>
    </>
  );
}
