import api from "@/lib/axios";
import { v4 as uuidv4 } from "uuid";
import {
  ApiResponse,
  CancelLogStatus,
  Order,
  ReturnTransaction,
} from "@/types";

/** Khớp với CreateOrderRequest.java — backend KHÔNG nhận shiftId và item.unitPrice */
export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  loyaltyMemberId?: string;
  couponDiscount?: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  tenderedAmount: number;
  branchId?: string; // ADMIN only
}

/** Spring Data Page response — BE trả về khi dùng Page<T> */
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-based page index
  first: boolean;
  last: boolean;
}

export interface CancelRequest {
  id: string;
  orderId: string;
  cashierId: string;
  orderTotal: number;
  reason: string;
  requestedAt: string;
  status: CancelLogStatus;
  hasPendingCancel?: boolean;
}

function normalizeOrderList(data: unknown): Order[] {
  if (Array.isArray(data)) return data as Order[];
  if (data && typeof data === "object" && "content" in data) {
    return ((data as SpringPage<Order>).content ?? []);
  }
  return [];
}

function normalizeOrderPage(data: unknown): SpringPage<Order> {
  if (data && typeof data === "object" && "content" in data) {
    return data as SpringPage<Order>;
  }
  const content = Array.isArray(data) ? (data as Order[]) : [];
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: content.length,
    number: 0,
    first: true,
    last: true,
  };
}

function toCancelRequests(orders: Order[], pendingOnly = false): CancelRequest[] {
  const source = pendingOnly
    ? orders.filter((order) => order.hasPendingCancel || Boolean(order.pendingCancelReason))
    : orders;

  return source.map((order) => ({
    id: order.id,
    orderId: order.id,
    cashierId: order.cashierId,
    orderTotal: order.total,
    reason: order.pendingCancelReason ?? "",
    requestedAt: order.createdAt,
    status: "PENDING" as CancelLogStatus,
    hasPendingCancel: true,
  }));
}

export const orderService = {
  create: (data: CreateOrderPayload) =>
    api.post<ApiResponse<Order>>("/order/orders", data, {
      headers: { "Idempotency-Key": uuidv4() },
    }),

  getById: (id: string) => api.get<ApiResponse<Order>>(`/order/orders/${id}`),

  /** Trả về Page với totalPages/totalElements cho pagination UI */
  getMy: async (params?: { page?: number; size?: number }): Promise<SpringPage<Order>> => {
    const res = await api.get<ApiResponse<unknown>>("/order/orders/my", { params });
    return normalizeOrderPage(res.data.data);
  },

  /** Trả về Page với totalPages/totalElements + hỗ trợ ?status= filter server-side */
  getByBranch: async (
    branchId: string,
    params?: { page?: number; size?: number; status?: string }
  ): Promise<SpringPage<Order>> => {
    const res = await api.get<ApiResponse<unknown>>(
      `/order/orders/branch/${branchId}`,
      { params }
    );
    return normalizeOrderPage(res.data.data);
  },

  /**
   * Đơn đang chờ phê duyệt hủy — COMPLETED + CancelLog PENDING.
   * Gọi endpoint BE mới: GET /orders/branch/{branchId}/pending-cancels
   * Đúng về semantic: không lẫn với đơn đã CANCELLED hoàn toàn.
   */
  getPendingCancels: async (
    branchId: string,
    params?: { page?: number; size?: number }
  ): Promise<CancelRequest[]> => {
    try {
      const res = await api.get<ApiResponse<unknown>>(
        `/order/orders/branch/${branchId}/pending-cancels`,
        { params }
      );
      return toCancelRequests(normalizeOrderList(res.data.data));
    } catch {
      const fallback = await api.get<ApiResponse<unknown>>(
        `/order/orders/branch/${branchId}`,
        { params }
      );
      return toCancelRequests(normalizeOrderList(fallback.data.data), true);
    }
  },

  getCancelRequests: (branchId: string, params?: { page?: number; size?: number }) =>
    orderService.getPendingCancels(branchId, params),

  cancel: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel`, data),

  approveCancel: (id: string) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel/approve`),

  rejectCancel: (id: string) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel/reject`),

  getReceipt: (id: string) =>
    api.get<ApiResponse<string>>(`/order/orders/receipts/${id}`),
};

export const returnService = {
  create: (data: {
    originalOrderId: string;
    items: { productId: string; quantity: number }[];
    reason: string;
  }) => api.post<ApiResponse<ReturnTransaction>>("/order/returns", data),

  getById: (returnId: string) =>
    api.get<ApiResponse<ReturnTransaction>>(`/order/returns/${returnId}`),
};
