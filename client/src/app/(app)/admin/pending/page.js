"use client";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { fmt } from "@/lib/format";
import { Card, Empty } from "@/components/ui";

export default function PendingPage() {
  const { safe, flyTo, loadMap } = useApp();
  const [r, load] = useLoad("/reports?status=PENDING");
  const decide = safe(async (id, status) => {
    await api("/reports/" + id, { m: "PATCH", b: { status } });
    await loadMap();
    load();
  });
  return (
    <>
      <h3>Pending reports ({r?.length ?? 0})</h3>
      {r && (r.length ? r.map((x) => (
        <Card key={x.id}>
          <b>{x.name}</b> <small className="m">{fmt(x.created_at)}</small>
          <p>{x.description}</p>
          {x.photo && <img src={"/uploads/" + x.photo} alt="" />}
          <div className="row">
            <button className="g" onClick={() => flyTo(x.lat, x.lng)}>Locate</button>
            <button onClick={() => decide(x.id, "VERIFIED")}>Verify</button>
            <button className="r" onClick={() => decide(x.id, "REJECTED")}>Reject</button>
          </div>
        </Card>
      )) : <Empty text="All clear 🎉" />)}
    </>
  );
}
