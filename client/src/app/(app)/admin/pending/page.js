"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { fmt } from "@/lib/format";
import { Card, Empty } from "@/components/ui";

const TABS = [["PENDING", "Pending"], ["VERIFIED", "Verified"], ["REJECTED", "Rejected"], ["ARCHIVED", "Archived"]];

export default function PendingPage() {
  const { safe, flyTo, loadMap } = useApp();
  const [tab, setTab] = useState("PENDING");
  const [r, load] = useLoad("/reports?status=" + tab, 5000);
  const decide = safe(async (id, status) => {
    await api("/reports/" + id, { m: "PATCH", b: { status } });
    await loadMap();
    load();
  });
  return (
    <>
      <h3>{TABS.find((t) => t[0] === tab)[1]} reports ({r?.length ?? 0})</h3>
      <div className="row">
        {TABS.map(([k, l]) => (
          <button key={k} className={tab === k ? "" : "g"} onClick={() => { setTab(k); }}>{l}</button>
        ))}
      </div>
      {r && (r.length ? r.map((x) => (
        <Card key={x.id}>
          <b>{x.name}</b> <small className="m">{fmt(x.created_at)}</small>
          <p>{x.description}</p>
          {x.photo && <img src={"/uploads/" + x.photo} alt="" />}
          <div className="row">
            <button className="g" onClick={() => flyTo(x.lat, x.lng)}>Locate</button>
            {(tab === "PENDING" || tab === "REJECTED") && <button onClick={() => decide(x.id, "VERIFIED")}>Verify</button>}
            {(tab === "PENDING" || tab === "VERIFIED") && <button className="r" onClick={() => decide(x.id, "REJECTED")}>Reject</button>}
            {tab === "VERIFIED" && <button className="g" onClick={() => decide(x.id, "ARCHIVED")}>Archive</button>}
          </div>
        </Card>
      )) : <Empty text={tab === "PENDING" ? "All clear 🎉" : "Nothing here yet."} />)}
    </>
  );
}
