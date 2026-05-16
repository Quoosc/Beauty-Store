import { create } from "zustand";
import { User, UserRole, LoginResponse } from "@/types";
import { authService } from "@/services/auth.service";

/**
 * LƯU Ý KIẾN TRÚC: Backend KHÔNG có GET /auth/me
 * User info chỉ nhận được từ LoginResponse body sau POST /auth/login.
 * Để persist qua page refresh, lưu user info vào sessionStorage (không phải token).
 * Session hết hạn (8h) → 401 → axios interceptor → redirect /login.
 */

const SESSION_KEY = "erp_user";

function loadUserFromSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

function saveUserToSession(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Đăng nhập — backend set httpOnly cookie 'jwt', trả User object trong body */
  login: (username: string, password: string) => Promise<User>;
  /** Đăng xuất — gọi backend revoke JWT + xóa cookie */
  logout: () => Promise<void>;
  /** Xóa state (dùng khi axios interceptor bắt 401) */
  clearAuth: () => void;
  setForceChangePasswordResolved: () => void;
}

/** Map role → route redirect sau login */
export const ROLE_REDIRECT: Record<UserRole, string> = {
  ADMIN: "/admin",
  BRANCH_MANAGER: "/branch-manager",
  CASHIER: "/pos/shift",
  WAREHOUSE_STAFF: "/warehouse",
};

const initialUser = loadUserFromSession();

export const useAuthStore = create<AuthStore>((set) => ({
  // Khôi phục user từ sessionStorage nếu còn (page refresh)
  user: initialUser,
  isLoading: false,
  isAuthenticated: !!initialUser,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login(username, password);
      // Backend trả flat fields (userId, username, ...) — không phải nested { user: ... }
      const loginData = data.data as LoginResponse;
      const user: User = {
        id: loginData.userId,
        username: loginData.username,
        fullName: loginData.fullName,
        role: loginData.role as UserRole,
        branchId: loginData.branchId,
        forceChangePassword: loginData.forceChangePassword,
        isLocked: false,
      };
      saveUserToSession(user);
      set({ user, isAuthenticated: true });
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout().catch(() => { /* ignore network error */ });
    } finally {
      saveUserToSession(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearAuth: () => {
    saveUserToSession(null);
    set({ user: null, isAuthenticated: false });
  },

  setForceChangePasswordResolved: () => {
    set((state) => {
      if (!state.user) return state;
      const nextUser = { ...state.user, forceChangePassword: false };
      saveUserToSession(nextUser);
      return { ...state, user: nextUser };
    });
  },
}));
