import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("auth-session");
  const { pathname } = request.nextUrl;

  // Define protected routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin/dashboard");

  // Define auth routes
  const isAuthRoute = pathname === "/login" || pathname === "/admin/login";

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = pathname.startsWith("/admin")
      ? "/admin/login"
      : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // If trying to access auth page with session, redirect to dashboard
  if (isAuthRoute && sessionCookie) {
    const dashboardUrl = pathname === "/admin/login"
      ? "/admin/dashboard"
      : "/dashboard";
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/dashboard/:path*", "/login", "/admin/login"],
};
