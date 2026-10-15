export const HOME = { resident: "/report", volunteer: "/volunteer/tasks", authority: "/admin" };
export const PUBLIC_PATHS = ["/login", "/register", "/map", "/tips"];
const RESIDENT = ["/report", "/my-reports", "/nearby", "/assist", "/my-requests"];

export function roleFor(path) {
  if (path.startsWith("/admin")) return "authority";
  if (path.startsWith("/volunteer")) return "volunteer";
  if (RESIDENT.includes(path)) return "resident";
  return null;
}

export const TABS = {
  guest: [["/map", "🗺 Map"], ["/login", "🔑 Login"], ["/tips", "🛟 Tips"]],
  resident: [["/report", "📝 Report"], ["/my-reports", "📄 My reports"], ["/nearby", "🏥 Nearby"],
    ["/assist", "🆘 Assist"], ["/my-requests", "📦 My requests"], ["/map", "🗺 Map"], ["/tips", "🛟 Tips"]],
  authority: [["/admin", "📊 Dashboard"], ["/admin/pending", "⏳ Pending"], ["/admin/zones", "🌊 Zones"],
    ["/admin/centers", "🏥 Centers"], ["/admin/requests", "🆘 Requests"], ["/tips", "🛟 Tips"]],
  volunteer: [["/volunteer/tasks", "✅ My tasks"], ["/map", "🗺 Map"], ["/tips", "🛟 Tips"]],
};
