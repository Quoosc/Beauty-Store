import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "ADMIN" | "BRANCH_MANAGER" | "CASHIER" | "WAREHOUSE_STAFF";

const PUBLIC_ROUTES = ["/login", "/force-change-password"];

const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/admin",
  BRANCH_MANAGER: "/branch-manager",
  CASHIER: "/pos/shift",
  WAREHOUSE_STAFF: "/warehouse",
};

// Prefix cụ thể hơn đứng trước để getAllowedRoles sort đúng
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/admin":                ["ADMIN"],
  "/user-management":      ["ADMIN"],
  "/system-configuration": ["ADMIN"],
  "/audit-logs":           ["ADMIN"],
  "/branch-manager":       ["BRANCH_MANAGER"],
  "/manager":              ["BRANCH_MANAGER", "ADMIN"],
  "/revenue-report":       ["BRANCH_MANAGER", "ADMIN"],
  "/inventory-report":     ["BRANCH_MANAGER", "ADMIN"],
  "/pos":                  ["CASHIER", "BRANCH_MANAGER", "ADMIN"],
  "/cashier":              ["CASHIER", "BRANCH_MANAGER", "ADMIN"],
  "/returns":              ["CASHIER", "BRANCH_MANAGER", "ADMIN"],
  "/warehouse":            ["WAREHOUSE_STAFF", "BRANCH_MANAGER", "ADMIN"],
  "/inventory":            ["WAREHOUSE_STAFF", "BRANCH_MANAGER", "ADMIN"],
  "/supplier-management":  ["WAREHOUSE_STAFF", "BRANCH_MANAGER", "ADMIN"],
};

const PROTECTED_PREFIXES = [
  "/admin", "/branch-manager", "/pos", "/cashier", "/orders", "/returns",
  "/products", "/categories", "/inventory", "/warehouse", "/manager",
  "/loyalty", "/promotions", "/coupons", "/revenue-report", "/inventory-report",
  "/notifications", "/audit-logs", "/user-management", "/system-configuration",
  "/supplier-management", "/change-password",
];

// decode base64url với padding fix
function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getRole(payload: Record<string, unknown> | null): UserRole | null {
  if (!payload) return null;

  // Thử field "role" trực tiếp
  const direct = payload.role;
  if (direct === "ADMIN" || direct === "BRANCH_MANAGER" ||
      direct === "CASHIER" || direct === "WAREHOUSE_STAFF") {
    return direct;
  }

  // Fallback: field "roles" dạng array
  const roles = payload.roles;
  if (Array.isArray(roles)) {
    for (const r of roles) {
      if (r === "ADMIN" || r === "BRANCH_MANAGER" ||
          r === "CASHIER" || r === "WAREHOUSE_STAFF") {
        return r as UserRole;
      }
    }
  }

  return null;
}

function isExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp;
  if (typeof exp !== "number") return false;
  return Date.now() / 1000 > exp;
}

function getForceChangePassword(payload: Record<string, unknown> | null): boolean {
  if (!payload) return false;
  if (typeof payload.forceChangePassword === "boolean") return payload.forceChangePassword;
  if (typeof payload.force_change_password === "boolean") return payload.force_change_password;
  return false;
}

function getAllowedRoles(pathname: string): UserRole[] | null {
  // Sort theo độ dài giảm dần để prefix cụ thể hơn được ưu tiên
  const entry = Object.entries(ROLE_ROUTES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => pathname.startsWith(prefix));
  return entry ? entry[1] : null;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("jwt"); // xóa cookie hỏng
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bỏ qua static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const jwtCookie = request.cookies.get("jwt");
  const hasSession = Boolean(jwtCookie?.value);
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // 2. Route protected, không có token → redirect login
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Không có token và route không cần auth → cho qua
  if (!hasSession) {
    return NextResponse.next();
  }

  // 4. Decode JWT
  const payload = parseJwtPayload(jwtCookie!.value);
  const role = getRole(payload);

  // Token hỏng hoặc role không hợp lệ
  if (!payload || !role) {
    const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
    return isPublic ? NextResponse.next() : redirectToLogin(request);
  }

  // Token hết hạn
  if (isExpired(payload)) {
    const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
    return isPublic ? NextResponse.next() : redirectToLogin(request);
  }

  const forceChangePwd = getForceChangePassword(payload);

  // 5. Force change password: chỉ cho vào /force-change-password
  if (forceChangePwd && pathname !== "/force-change-password") {
    return NextResponse.redirect(new URL("/force-change-password", request.url));
  }

  // 6. Đã đổi mật khẩu nhưng vẫn vào /force-change-password → về trang chủ
  if (!forceChangePwd && pathname === "/force-change-password") {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // 7. Đã login mà vào /login → redirect về trang chủ của role
  if (pathname === "/login") {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // 8. Root "/" → redirect về trang chủ của role
  if (pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // 9. Kiểm tra role-based access
  const allowedRoles = getAllowedRoles(pathname);
  if (allowedRoles && !allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
