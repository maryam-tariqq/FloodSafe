"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { PinInfo } from "@/components/ui";

export default function ReportPage() {
  const { msg, pin, safe } = useApp();
  const router = useRouter();
  const [d, setD] = useState("");
  const [file, setFile] = useState(null);
  const send = safe(async () => {
    if (!pin) throw Error("Tap the map to drop a pin");
    const fd = new FormData();
    fd.append("lat", pin.lat);
    fd.append("lng", pin.lng);
    fd.append("description", d);
    if (file) fd.append("photo", file);
    await api("/reports", { m: "POST", fd });
    msg("Report sent – awaiting verification");
    router.push("/my-reports");
  });
  return (
    <>
      <h3>Report flooding</h3>
      <PinInfo />
      <textarea rows={4} maxLength={500} value={d} onChange={(e) => setD(e.target.value)}
        placeholder="What is happening? Water depth, who is affected…" />
      <input type="file" accept="image/jpeg,image/png" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={send}>Submit report</button>
    </>
  );
}
