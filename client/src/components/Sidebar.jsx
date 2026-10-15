"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { TABS } from "@/lib/roles";

export default function Sidebar() {
  const { user, ready } = useApp();
  const path = usePathname();
  if (!ready) return <div id="nav" />;
  return (
    <div id="nav">
      {TABS[user?.role || "guest"].map(([href, label]) => (
        <Link key={href} href={href}>
          <button className={path === href ? "on" : ""}>{label}</button>
        </Link>
      ))}
    </div>
  );
}
