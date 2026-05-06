import api from "@/lib/axios";
import { ApiResponse, LoginResponse, User } from "@/types";

/**
 * Auth Service — auth-service :8081 (qua api-gateway :8080)
 *
 * Gateway prefix: /api/v1/auth/**  → StripPrefix=2 → controller nhận /login, /logout, /change-password
 * AccountController prefix: /api/v1/auth/accounts/**  → /accounts/**
 *
 * Endpoints thực tế từ AuthController.java:
 *  POST /api/v1/auth/login           — whitelist (không qua AuthFilter)
 *  POST /api/v1/auth/logout          — blacklist JTI Redis + xóa cookie
 *  POST /api/v1/auth/change-password — đổi mật khẩu (force + voluntary)
 *
 * Endpoints từ AccountController.java (ADMIN only):
 *  GET    /api/v1/auth/accounts
 *  GET    /api/v1/auth/accounts/:id
 *  POST   /api/v1/auth/accounts
 *  PUT    /api/v1/auth/accounts/:id
 *  DELETE /api/v1/auth/accounts/:id   — deactivate
 *  PATCH  /api/v1/auth/accounts/:id/unlock
 *
 * LƯU Ý: Backend KHÔNG có GET /auth/me endpoint.
 * User info được trả ngay trong LoginResponse body sau POST /login.
 */
export const authService = {
  /** Đăng nhập — backend set httpOnly cookie 'jwt', trả LoginResponse */
  login: (username: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", { username, password }),

  /** Đăng xuất — revoke JWT (Redis blacklist) + clear cookie */
  logout: () => api.post<ApiResponse<null>>("/auth/logout"),

  /** Đổi mật khẩu (cả force-change lần đầu và self-service) */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<null>>("/auth/change-password", {
      currentPassword,
      newPassword,
    }),
};

/**
 * Account Service — AccountController.java (ADMIN only)
 * Quản lý tài khoản nhân viên
 */
export const accountService = {
  getAll: () => api.get<ApiResponse<User[]>>("/auth/accounts"),

  getById: (id: string) => api.get<ApiResponse<User>>(`/auth/accounts/${id}`),

  create: (data: {
    fullName: string;
    username: string;
    role: string;
    branchId?: string;
    forceChangePassword: boolean;
  }) => api.post<ApiResponse<User>>("/auth/accounts", data),

  update: (id: string, data: { fullName: string; role: string; branchId?: string }) =>
    api.put<ApiResponse<User>>(`/auth/accounts/${id}`, data),

  /** Deactivate (xóa mềm) — tương đương DISABLED */
  deactivate: (id: string) =>
    api.delete<ApiResponse<null>>(`/auth/accounts/${id}`),

  /** Mở khóa tài khoản bị lock */
  unlock: (id: string) =>
    api.patch<ApiResponse<null>>(`/auth/accounts/${id}/unlock`),
};
