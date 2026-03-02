import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeRole, RoleGroups } from "@/constants/roles";

function parseJwt(token: string) {
  try {
    const base64Payload = token.split(".")[1];
    const normalizedPayload = base64Payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");
    const payload = Buffer.from(normalizedPayload, "base64").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function resolveRoleClaim(payload: Record<string, unknown> | null) {
  if (!payload) return undefined;

  const directRole =
    typeof payload.role === "string"
      ? payload.role
      : typeof payload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] === "string"
      ? String(
          payload[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ]
        )
      : undefined;

  if (directRole) return directRole;

  const roles = Array.isArray(payload.roles) ? payload.roles : undefined;
  if (roles && roles.length > 0 && typeof roles[0] === "string") {
    return roles[0];
  }

  const namespacedRoles = payload[
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/roles"
  ];
  if (Array.isArray(namespacedRoles) && typeof namespacedRoles[0] === "string") {
    return namespacedRoles[0];
  }

  return undefined;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;
  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname);

  if (!token) {
    if (!isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const payload = parseJwt(token);
  const role = normalizeRole(resolveRoleClaim(payload));

  // Protect Admin routes
  if (pathname.startsWith("/admin")) {
    if (!role || !RoleGroups.adminOnly.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Protect Sales routes
  if (pathname.startsWith("/sales")) {
    if (!role || !RoleGroups.salesArea.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run proxy checks for app pages, not API route handlers.
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
