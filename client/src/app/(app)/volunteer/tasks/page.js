"use client";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { Badge, Card, Empty } from "@/components/ui";

export default function TasksPage() {
  const { safe, flyTo } = useApp();
  const [t, load] = useLoad("/tasks/mine");
  const set = safe(async (id, status) => {
    await api("/tasks/" + id, { m: "PATCH", b: { status } });
    load();
  });
  return (
    <>
      <h3>My tasks</h3>
      {t &&
        (t.length ? (
          t.map((x) => (
            <Card key={x.id}>
              <Badge s={x.status} /> <b>{x.priority}</b> priority
              <p>
                {x.resident} ({x.contact})<br />
                {x.people} people · {x.need}
                <br />
                <small className="m">{x.center || ""}</small>
              </p>
              <div className="row">
                <button className="g" onClick={() => flyTo(x.lat, x.lng)}>
                  Locate
                </button>
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
              </div>
            </Card>
          ))
        ) : (
          <Empty />
        ))}
    </>
  );
}
