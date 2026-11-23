"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { fmt } from "@/lib/format";
import { Badge, Card, Track } from "@/components/ui";

export default function TaskDetailsPage({ params }) {
  const { id } = use(params);
  const { safe, flyTo } = useApp();
  const router = useRouter();
  const [x, load] = useLoad("/tasks/" + id, 5000);
  const set = safe(async (status) => {
    await api("/tasks/" + id, { m: "PATCH", b: { status } });
    load();
  });
  const decline = safe(async () => {
    if (!confirm("Decline this task? The authority will be able to reassign it.")) return;
    await api(`/tasks/${id}/decline`, { m: "POST" });
    router.push("/volunteer/tasks");
  });
  return (
    <>
      <h3>Task details</h3>
      <Link href="/volunteer/tasks"><button className="g">Back to tasks</button></Link>
      {x && (
        <Card>
          <Badge s={x.status} /> <b>{x.priority}</b> priority
          <p>
            <b>{x.resident}</b> ({x.contact})<br />
            {x.people} people · {x.need}
            <br />
            <small className="m">{x.center || "No relief center"}</small>
            <br />
            <small className="m">
              Requested {fmt(x.requested_at)} · Updated {fmt(x.updated_at)}
            </small>
            <br />
            <small className="m">Location: {x.lat.toFixed(5)}, {x.lng.toFixed(5)}</small>
          </p>
          <Track s={x.status} />
          <div className="row">
            <button className="g" onClick={() => flyTo(x.lat, x.lng)}>Locate</button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              <button className="g">Directions</button>
            </a>
            {x.status === "ASSIGNED" && <button onClick={() => set("IN_PROGRESS")}>Start</button>}
            {x.status !== "COMPLETED" && <button onClick={() => set("COMPLETED")}>Complete</button>}
            {x.status !== "COMPLETED" && <button className="r" onClick={decline}>Decline</button>}
          </div>
        </Card>
      )}
    </>
  );
}
