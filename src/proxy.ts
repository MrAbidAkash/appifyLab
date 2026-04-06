// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Allow public paths: login, register
  if (pathname === "/" || pathname === "/register") {
    return NextResponse.next();
  }

  // Protect /feed
  if (pathname.startsWith("/feed")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || "secret");
      return NextResponse.next();
    } catch (err) {
      // console.log("Invalid token:", err);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Default: allow other routes
  return NextResponse.next();
}

// Apply proxy only to /feed
export const config = {
  matcher: ["/feed/:path*"],
};
