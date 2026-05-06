import axios from "axios";

/**
 * Axios instance cho BeautyERP Backend
 *
 * Auth cơ chế: httpOnly cookie (JWT)
 * - Backend set cookie sau login: Set-Cookie: jwt=...; HttpOnly; Secure; SameSite=Strict
 * - withCredentials: true → trình duyệt tự gửi cookie trong mọi request
 * - KHÔNG dùng Authorization: Bearer header
 * - KHÔNG có refresh token — TTL JWT là 8 giờ, hết thì login lại
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,   // gửi httpOnly cookie tự động
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

/**
 * Response interceptor — handle 401 (session hết hạn)
 * Redirect về /login, không có refresh token flow
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session hết hạn hoặc token bị revoke (Redis blacklist)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
