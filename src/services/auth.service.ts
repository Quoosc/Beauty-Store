import api from "@/lib/axios";
import { ApiResponse, AuthTokens, User } from "@/types";

export const authService = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthTokens & { user: User }>>("/auth/login", {
      email,
      password,
    }),

  register: (name: string, email: string, password: string) =>
    api.post<ApiResponse<User>>("/auth/register", { name, email, password }),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),
};
