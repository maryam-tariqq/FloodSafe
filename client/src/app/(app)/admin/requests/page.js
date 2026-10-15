"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { Badge, Card, Empty } from "@/components/ui";

function ReqCard({ x, vols, reload }) {
  const { safe, flyTo } = useApp();
  const [vol, setVol] = useState(vols[0]?.id ?? "");
  const [pri, setPri] = useState("Medium");
  const accept = safe(async () => { await api(`/requests/${x.id}/accept`, { m: "POST" }); reload(); });
  const assign = safe(async () => {
    await api(`/requests/${x.id}/assign`, { m: "POST", b: { volunteer_id: vol, priority: pri } });
    reload();
  });
  return (
    <Card>
      #{x.id} <Badge s={x.status} />
      <p><b>{x.name}</b> ({x.contact})<br />{x.people} people · {x.need}<br /><small className="m">{x.center || "No center"}</small></p>
      <button className="g" onClick={() => flyTo(x.lat, x.lng)}>Locate</button>
      {x.status === "PENDING" && <button onClick={accept}>Accept</button>}
      {x.status === "ACCEPTED" && (
        <>
          <div className="row">
            <select value={vol} onChange={(e) => setVol(e.target.value)} style={{ width: "46%" }}>
              {vols.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={pri} onChange={(e) => setPri(e.target.value)} style={{ width: "46%" }}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
          <button onClick={assign}>Assign volunteer</button>
        </>
      )}
      {x.status !== "PENDING" && x.status !== "ACCEPTED" && x.volunteer && (
        <p className="m">Volunteer: {x.volunteer} · {x.priority} · task {x.task_status}</p>
      )}
    </Card>
  );
}

export default function RequestsPage() {
  const [r, reload] = useLoad("/requests");
  const [v] = useLoad("/volunteers");
  return (
    <>
      <h3>Assistance requests</h3>
      {r && v && (r.length ? r.map((x) => <ReqCard key={x.id + x.status} x={x} vols={v} reload={reload} />) : <Empty />)}
    </>
  );
}
