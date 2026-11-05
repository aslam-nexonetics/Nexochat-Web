import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = request.cookies.get("is_authenticated")?.value;
  const hasAuth = !!accessToken || isAuthenticated === "true";

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isProtectedRoute =
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/call") ||
    pathname.startsWith("/meetings");

  // Redirect unauthenticated users trying to access protected workspace areas
  if (!hasAuth && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register back to workspace
  if (hasAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/call/:path*",
    "/meetings/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
