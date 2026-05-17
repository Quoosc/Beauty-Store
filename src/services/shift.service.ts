import api from "@/lib/axios";
import { ApiResponse, Shift } from "@/types";

/**
 * Shift Service — order-service :8083 (qua api-gateway :8080)
 *
 * Gateway routing:
 *   FE gọi:  /api/v1/order/**
 *   StripPrefix=2 → order-service nhận: /order/**
 *   order-service context-path: /order
 *   ShiftController @RequestMapping: /shifts
 *   → URL cuối: /order/shifts → match ✅
 *
 * Endpoints từ ShiftController.java:
 *   POST /api/v1/order/shifts             — mở ca (CASHIER, BRANCH_MANAGER, ADMIN)
 *   POST /api/v1/order/shifts/:id/close   — đóng ca
 *   GET  /api/v1/order/shifts/current     — lấy ca đang mở của cashier hiện tại
 *   GET  /api/v1/order/shifts/:id         — chi tiết ca theo ID
 */
export const shiftService = {
  /** Mở ca — nhập tiền mặt đầu ca */
  open: (openingCash: number) =>
    api.post<ApiResponse<Shift>>("/order/shifts", { openingCash }),

  /**
   * Đóng ca
   * - closingCash: tiền mặt thực đếm cuối ca
   * - note: bắt buộc nếu variance ≠ 0
   */
  close: (shiftId: string, data: { closingCash: number; note?: string }) =>
    api.post<ApiResponse<Shift>>(`/order/shifts/${shiftId}/close`, data),

  /** Lấy ca đang mở của cashier hiện tại (theo JWT trong cookie) */
  getCurrent: () =>
    api.get<ApiResponse<Shift>>("/order/shifts/current"),

  getById: (shiftId: string) =>
    api.get<ApiResponse<Shift>>(`/order/shifts/${shiftId}`),

  /**
   * Đóng ca hiện tại mà không cần truyền shiftId từ store.
   * Tự gọi getCurrent() để lấy ID — dùng khi store bị mất sau reload trang.
   */
  closeCurrent: async (data: { closingCash: number; note?: string }) => {
    const currentRes = await api.get<ApiResponse<Shift>>("/order/shifts/current");
    const shiftId = currentRes.data.data.id;
    return api.post<ApiResponse<Shift>>(`/order/shifts/${shiftId}/close`, data);
  },
};
