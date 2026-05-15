import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "ADMIN" | "BRANCH_MANAGER" | "CASHIER" | "WAREHOUSE_STAFF";

const PUBLIC_ROUTES = ["/login", "/force-change-password"];

const ROLE_REDIRECT: Record<UserRole, string> = {
  ADMIN: "/admin",
  BRANCH_MANAGER: "/branch-manager",
  CASHIER: "/pos/shift",
  WAREHOUSE_STAFF: "/warehouse",
};

const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["ADMIN"],
  "/user-management": ["ADMIN"],
  "/system-configuration": ["ADMIN"],
  "/audit-logs": ["ADMIN"],
  "/branch-manager": ["BRANCH_MANAGER"],
  "/manager": ["BRANCH_MANAGER", "ADMIN"],
  "/pos": ["CASHIER", "BRANCH_MANAGER", "ADMIN"],
  "/cashier": ["CASHIER", "BRANCH_MANAGER", "ADMIN"],
  "/warehouse": ["WAREHOUSE_STAFF", "BRANCH_MANAGER", "ADMIN"],
  "/inventory": ["WAREHOUSE_STAFF", "BRANCH_MANAGER", "ADMIN"],
};

const PROTECTED_PREFIXES = [
  "/admin",
  "/branch-manager",
  "/pos",
  "/cashier",
  "/orders",
  "/returns",
  "/products",
  "/categories",
  "/inventory",
  "/warehouse",
  "/manager",
  "/loyalty",
  "/promotions",
  "/coupons",
  "/revenue-report",
  "/inventory-report",
  "/notifications",
  "/audit-logs",
  "/user-management",
  "/system-configuration",
  "/supplier-management",
  "/change-password",
];

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getRole(payload: Record<string, unknown> | null): UserRole | null {
  if (!payload) return null;

  const directRole = payload.role;
  if (
    directRole === "ADMIN" ||
    directRole === "BRANCH_MANAGER" ||
    directRole === "CASHIER" ||
    directRole === "WAREHOUSE_STAFF"
  ) {
    return directRole;
  }

  const roles = payload.roles;
  if (Array.isArray(roles)) {
    for (const role of roles) {
      if (
        role === "ADMIN" ||
        role === "BRANCH_MANAGER" ||
        role === "CASHIER" ||
        role === "WAREHOUSE_STAFF"
      ) {
        return role;
      }
    }
  }

  return null;
}

function getForceChangePassword(payload: Record<string, unknown> | null): boolean {
  if (!payload) return false;

  const direct = payload.forceChangePassword;
  if (typeof direct === "boolean") return direct;

  const snake = payload.force_change_password;
  if (typeof snake === "boolean") return snake;

  return false;
}

function getRoleHome(role: UserRole | null): string {
  if (!role) return "/";
  return ROLE_REDIRECT[role];
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getAllowedRoles(pathname: string): UserRole[] | null {
  const entry = Object.entries(ROLE_ROUTES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => pathname.startsWith(prefix));

  return entry ? entry[1] : null;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("jwt");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const jwtCookie = request.cookies.get("jwt");
  const hasSession = Boolean(jwtCookie?.value);
  const isProtected = isProtectedRoute(pathname);

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasSession) {
    return NextResponse.next();
  }

  const payload = parseJwtPayload(jwtCookie!.value);
  const role = getRole(payload);
  const forceChangePassword = getForceChangePassword(payload);

  // Invalid/expired JWT payload should never loop between "/" and "/login".
  if (!payload || !role) {
    const isPublic = PUBLIC_ROUTES.includes(pathname);
    return isPublic ? NextResponse.next() : redirectToLogin(request);
  }

  if (forceChangePassword && pathname !== "/force-change-password") {
    return NextResponse.redirect(new URL("/force-change-password", request.url));
  }

  if (!forceChangePassword && pathname === "/force-change-password") {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  const allowedRoles = getAllowedRoles(pathname);
  if (allowedRoles && !allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
