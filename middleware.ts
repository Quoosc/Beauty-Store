import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware — Auth Guard + Role-based redirect
 *
 * Cơ chế:
 *  - Backend set httpOnly cookie tên "jwt" sau login
 *  - Middleware đọc cookie "jwt" để kiểm tra session
 *  - Nếu không có cookie → redirect /login
 *  - Cookie còn thì cho qua (validation thật do backend làm qua axios interceptor)
 *
 * LƯU Ý: Middleware KHÔNG decode JWT — chỉ check sự tồn tại của cookie.
 * Nếu JWT hết hạn, request backend sẽ trả 401 → axios interceptor xử lý redirect.
 */

/** Routes không cần auth */
const PUBLIC_ROUTES = ["/login", "/force-change-password"];

/** Routes yêu cầu đăng nhập */
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cho qua static files và Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Kiểm tra cookie jwt
  const jwtCookie = request.cookies.get("jwt");
  const hasSession = !!jwtCookie?.value;

  // Chưa login mà vào protected route → redirect /login
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Đã login mà vào /login → redirect trang chủ (store sẽ xử lý role redirect)
  if (isPublicRoute && hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
