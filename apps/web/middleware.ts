import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  const isLoggedIn = !!token;

  const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isOnLogin = request.nextUrl.pathname.startsWith("/login");
  const isOnPublicForm = request.nextUrl.pathname.startsWith("/f/");

  // Allow public form access
  if (isOnPublicForm) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login page
  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect dashboard routes
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
