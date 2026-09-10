import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/grievances", "/notifications", "/analytics", "/admin"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!needsAuth) {
    return NextResponse.next();
  }

  if (!req.cookies.get("civicdesk_token")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};