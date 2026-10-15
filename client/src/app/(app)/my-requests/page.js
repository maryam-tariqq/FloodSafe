"use client";
import { useLoad } from "@/lib/useLoad";
import { fmt } from "@/lib/format";
import { Badge, Card, Empty } from "@/components/ui";

export default function MyRequestsPage() {
  const [r] = useLoad("/requests/mine");
  return (
    <>
      <h3>My requests</h3>
      {r && (r.length ? r.map((x) => (
        <Card key={x.id}>
          <Badge s={x.status} /> <small className="m">{fmt(x.created_at)}</small>
          <p>{x.people} people · {x.need}<br /><small className="m">{x.center || ""}</small></p>
        </Card>
      )) : <Empty />)}
    </>
  );
}
