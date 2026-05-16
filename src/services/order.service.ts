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
  loyaltyMemberId?: string;   // đúng tên BE nhận (không phải memberId)
  couponDiscount?: number;
  pointsRedeemed?: number;    // đúng tên BE nhận (không phải pointsToRedeem)
  pointsDiscount?: number;
  tenderedAmount: number;
  branchId?: string;          // ADMIN only
}

export interface CancelRequest {
  id: string;
  orderId: string;
  cashierId: string;
  orderTotal: number;
  reason: string;
  requestedAt: string;
  status: CancelLogStatus;
}

function normalizeOrderList(data: unknown): Order[] {
  if (Array.isArray(data)) {
    return data as Order[];
  }

  if (data && typeof data === "object" && "content" in data) {
    return ((data as { content?: Order[] }).content ?? []) as Order[];
  }

  return [];
}

export const orderService = {
  create: (data: CreateOrderPayload) =>
    api.post<ApiResponse<Order>>("/order/orders", data, {
      headers: { "Idempotency-Key": uuidv4() },
    }),

  getById: (id: string) => api.get<ApiResponse<Order>>(`/order/orders/${id}`),

  getMy: (params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<Order[]>>("/order/orders/my", { params }),

  getByBranch: (branchId: string, params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<Order[]>>(`/order/orders/branch/${branchId}`, { params }),

  cancel: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel`, data),

  approveCancel: (id: string) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel/approve`),

  rejectCancel: (id: string) =>
    api.post<ApiResponse<Order>>(`/order/orders/${id}/cancel/reject`),

  /**
   * BE không trả cancel log info trong OrderResponse.
   * Cần endpoint riêng /orders/cancel-requests khi BE bổ sung.
   * Hiện tại: lấy danh sách orders của branch, lọc status CANCELLED.
   */
  getCancelRequests: async (
    branchId: string,
    params?: { page?: number; size?: number; status?: CancelLogStatus }
  ): Promise<CancelRequest[]> => {
    const res = await api.get<ApiResponse<Order[] | { content: Order[] }>>(
      `/order/orders/branch/${branchId}`,
      {
        params: {
          page: params?.page,
          size: params?.size,
        },
      }
    );

    const orders = normalizeOrderList(res.data.data);

    return orders
      .filter((order) => order.status === "CANCELLED")
      .map((order) => ({
        id: order.id,
        orderId: order.id,
        cashierId: order.cashierId,
        orderTotal: order.total,
        reason: "",
        requestedAt: order.createdAt,
        status: "PENDING" as CancelLogStatus,
      }));
  },

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
