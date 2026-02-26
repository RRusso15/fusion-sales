import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseJwt(token: string) {
  try {
    const base64Payload = token.split(".")[1];
    const payload = Buffer.from(base64Payload, "base64").toString();
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  if (!token) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/sales")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const payload = parseJwt(token);
  const role = payload?.role;

  // Protect Admin routes
  if (pathname.startsWith("/admin")) {
    if (role !== "Admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Protect Sales routes
  if (pathname.startsWith("/sales")) {
    if (
      ![
        "Admin",
        "SalesManager",
        "BusinessDevelopmentManager",
        "SalesRep",
      ].includes(role)
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}