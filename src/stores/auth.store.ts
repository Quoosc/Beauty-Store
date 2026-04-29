import { create } from "zustand";
import { User } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login(email, password);
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      set({ user: data.data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authService.logout().catch(() => {});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authService.getMe();
      set({ user: data.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
