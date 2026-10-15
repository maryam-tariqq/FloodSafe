import { NextResponse } from "next/server";
import { HOME, PUBLIC_PATHS, roleFor } from "@/lib/roles";

// Redirects only. Express verifies the token on every API call.
function roleOf(req) {
  const t = req.cookies.get("token")?.value;
  if (!t) return null;
  try {
    return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role;
  } catch {
    return null;
  }
}

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const role = roleOf(req);
  const go = (to) => NextResponse.redirect(new URL(to, req.url));

  if (pathname === "/") return go(role ? HOME[role] : "/login");
  if (pathname === "/login" || pathname === "/register")
    return role ? go(HOME[role]) : NextResponse.next();
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (!role) return go("/login");
  const need = roleFor(pathname);
  if (need && need !== role) return go(HOME[role]);
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|uploads|favicon.ico).*)"] };
