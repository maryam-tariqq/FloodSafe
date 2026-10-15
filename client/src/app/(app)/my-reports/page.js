"use client";
import { useLoad } from "@/lib/useLoad";
import { fmt } from "@/lib/format";
import { Badge, Card, Empty } from "@/components/ui";

export default function MyReportsPage() {
  const [r] = useLoad("/reports/mine");
  return (
    <>
      <h3>My reports</h3>
      {r && (r.length ? r.map((x) => (
        <Card key={x.id}>
          <Badge s={x.status} /> <small className="m">{fmt(x.created_at)}</small>
          <p>{x.description}</p>
        </Card>
      )) : <Empty />)}
    </>
  );
}
