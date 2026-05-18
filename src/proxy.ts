import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME, ROLE_DASHBOARDS } from "@/lib/auth";
import type { AuthRole } from "@/lib/auth";

const ALWAYS_ALLOW = ["/api/auth", "/api/sms", "/auth", "/onboarding", "/join", "/_next", "/favicon"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static files and always-public paths
  if (
    ALWAYS_ALLOW.some(p => pathname.startsWith(p)) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token   = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // /login — redirect to dashboard if already logged in
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[session.role], req.url));
    }
    return NextResponse.next();
  }

  // Root — always redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? ROLE_DASHBOARDS[session.role] : "/login", req.url)
    );
  }

  // Role-protected routes
  const roleFromPath = pathname.split("/")[1] as AuthRole;
  const ROLE_ROUTES: AuthRole[] = ["dispatcher", "technician", "billing", "client", "admin"];

  if (ROLE_ROUTES.includes(roleFromPath)) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Admin can access any route
    if (session.role === "admin") return NextResponse.next();
    // Wrong role → own dashboard
    if (session.role !== roleFromPath) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[session.role], req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
