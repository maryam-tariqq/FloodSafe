"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { Badge, Card, Empty, Track } from "@/components/ui";

export default function TasksPage() {
  const { safe, flyTo } = useApp();
  const [t, load] = useLoad("/tasks/mine", 5000);
  const [show, setShow] = useState("active");
  const set = safe(async (id, status) => {
    await api("/tasks/" + id, { m: "PATCH", b: { status } });
    load();
  });
  const decline = safe(async (id) => {
    if (!confirm("Decline this task? The authority will be able to reassign it.")) return;
    await api(`/tasks/${id}/decline`, { m: "POST" });
    load();
  });
  const list = t && t.filter((x) => (show === "active" ? x.status !== "COMPLETED" : x.status === "COMPLETED"));
  return (
    <>
      <h3>My tasks</h3>
      <div className="row">
        <button className={show === "active" ? "" : "g"} onClick={() => setShow("active")}>Active</button>
        <button className={show === "done" ? "" : "g"} onClick={() => setShow("done")}>Completed</button>
      </div>
      {list &&
        (list.length ? (
          list.map((x) => (
            <Card key={x.id}>
              <Badge s={x.status} /> <b>{x.priority}</b> priority
              <p>
                {x.resident} ({x.contact})<br />
                {x.people} people · {x.need}
                <br />
                <small className="m">{x.center || ""}</small>
              </p>
              <Track s={x.status} />
              <div className="row">
                <button className="g" onClick={() => flyTo(x.lat, x.lng)}>
                  Locate
                </button>
                <Link href={"/volunteer/tasks/" + x.id}>
                  <button className="g">Details</button>
                </Link>
                {x.status === "ASSIGNED" && (
                  <button onClick={() => set(x.id, "IN_PROGRESS")}>
                    Start
                  </button>
                )}
                {x.status !== "COMPLETED" && (
                  <button onClick={() => set(x.id, "COMPLETED")}>
                    Complete
                  </button>
                )}
                {x.status !== "COMPLETED" && (
                  <button className="r" onClick={() => decline(x.id)}>
                    Decline
                  </button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Empty />
        ))}
    </>
  );
}
