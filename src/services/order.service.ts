import api from "@/lib/axios";
import { ApiResponse, CancelLogStatus, Order, ReturnTransaction } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Order Service — order-service :8083 (qua api-gateway :8080)
 *
 * Gateway routing:
 *   FE gọi:  /api/v1/order/**
 *   order-service context-path: /order
 *   OrderController @RequestMapping: /orders
 *   → /api/v1/order/orders → match ✅
 *
 * Endpoints từ OrderController.java:
 *   POST /api/v1/order/orders                    — tạo đơn (BẮT BUỘC header Idempotency-Key)
 *   GET  /api/v1/order/orders/:id                — chi tiết đơn
 *   GET  /api/v1/order/orders/my                 — đơn của cashier hiện tại (phân trang)
 *   GET  /api/v1/order/orders/branch/:branchId   — đơn theo chi nhánh (BRANCH_MANAGER, ADMIN)
 *   POST /api/v1/order/orders/:id/cancel         — hủy đơn (kèm lý do)
 *   POST /api/v1/order/orders/:id/cancel/approve — duyệt hủy (BRANCH_MANAGER, ADMIN)
 *   POST /api/v1/order/orders/:id/cancel/reject  — từ chối hủy (BRANCH_MANAGER, ADMIN)
 *   GET  /api/v1/order/orders/receipts/:id       — lấy receipt PDF URL
 *
 * Returns từ ReturnController.java (nếu có):
 *   POST /api/v1/order/returns
 */

export interface CreateOrderPayload {
  shiftId: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  couponCode?: string;
  memberId?: string;
  pointsToRedeem?: number;
  tenderedAmount: number;
}

export interface CancelRequest {
  id: string;
  orderId: string;
  cashierName: string;
  orderTotal: number;
  reason: string;
  requestedAt: string;
  status: CancelLogStatus;
}

export const orderService = {
  /**
   * Tạo đơn hàng — BẮT BUỘC gửi Idempotency-Key header (UUID ngẫu nhiên)
   * Nếu request bị duplicate, backend sẽ trả lại response của request đầu tiên
   */
  create: (data: CreateOrderPayload) =>
    api.post<ApiResponse<Order>>("/order/orders", data, {
      headers: { "Idempotency-Key": uuidv4() },
    }),

  getById: (id: string) =>
    api.get<ApiResponse<Order>>(`/order/orders/${id}`),

  /** Đơn của cashier đang đăng nhập (dùng trong màn hình CashierOrders) */
  getMy: (params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<Order[]>>("/order/orders/my", { params }),

  /** Đơn theo chi nhánh — BRANCH_MANAGER, ADMIN */
  getByBranch: (branchId: string, params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<Order[]>>(`/order/orders/branch/${branchId}`, { params }),

  /** Hủy đơn — nếu tổng > threshold sẽ cần BRANCH_MANAGER duyệt */
  cancel: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel`, data),

  /** BRANCH_MANAGER duyệt yêu cầu hủy */
  approveCancel: (id: string) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel/approve`),

  /** BRANCH_MANAGER từ chối yêu cầu hủy */
  rejectCancel: (id: string) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel/reject`),

  /** Danh sách yêu cầu hủy đơn chờ duyệt — BRANCH_MANAGER, ADMIN */
  getCancelRequests: async (params?: { page?: number; size?: number; status?: string }) => {
    const res = await api.get(`/order/cancel-requests`, { params });
    return res.data.data;
  },

  getReceipt: (id: string) =>
    api.get<ApiResponse<string>>(`/order/orders/receipts/${id}`),
};

/**
 * Return Service — order-service :8083
 * ReturnController endpoint (nếu có)
 */
export const returnService = {
  create: (data: {
    originalOrderId: string;
    items: { productId: string; quantity: number }[];
    reason: string;
  }) => api.post<ApiResponse<ReturnTransaction>>("/order/returns", data),

  getByOrder: (orderId: string) =>
    api.get<ApiResponse<ReturnTransaction[]>>(`/order/returns/order/${orderId}`),
};
