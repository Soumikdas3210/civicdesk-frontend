import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/", "/about", "/login", "/register", "kitchen-sink"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.includes(pathname) || pathname.startsWith("/api")) {
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