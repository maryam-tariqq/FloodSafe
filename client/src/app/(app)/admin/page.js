"use client";
import { useLoad } from "@/lib/useLoad";
import StatCard from "@/components/StatCard";

export default function DashboardPage() {
  const [s] = useLoad("/stats");
  return (
    <>
      <h3>Authority dashboard</h3>
      {s && (
        <div className="grid">
          <StatCard n={s.pending} label="Pending reports" />
          <StatCard n={s.verified} label="Verified reports" />
          <StatCard n={s.in_zones} label="Reports inside zones" />
          <StatCard n={s.zones} label="Flood zones" />
          <StatCard n={s.open_centers} label="Open centers" />
          <StatCard n={s.spaces} label="Spaces free" />
          <StatCard n={s.active_requests} label="Active requests" />
        </div>
      )}
    </>
  );
}
