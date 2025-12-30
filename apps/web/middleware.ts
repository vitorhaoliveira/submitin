import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Early return for static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/f/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  try {
    // Check if AUTH_SECRET is available
    if (!process.env.AUTH_SECRET) {
      // If no AUTH_SECRET, allow all requests (development mode)
      return NextResponse.next();
    }

    // Try to get token - use dynamic import to avoid initialization issues
    let isLoggedIn = false;
    try {
      const { getToken } = await import("next-auth/jwt");
      const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
      });
      isLoggedIn = !!token;
    } catch (tokenError) {
      // If token check fails, assume not logged in
      console.warn("Token check failed:", tokenError);
      isLoggedIn = false;
    }

    const isOnDashboard = pathname.startsWith("/dashboard");
    const isOnLogin = pathname.startsWith("/login");

    // Redirect logged-in users away from login page
    if (isOnLogin && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect dashboard routes
    if (isOnDashboard && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Log error for debugging
    console.error("Middleware error:", error);
    // Always allow request to proceed - let pages handle auth
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
