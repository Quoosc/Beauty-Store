import api from "@/lib/axios";
import { v4 as uuidv4 } from "uuid";
import {
  ApiResponse,
  CancelLogStatus,
  Order,
  ReturnTransaction,
} from "@/types";

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

    const statusFilter = params?.status ?? "PENDING";
    const orders = normalizeOrderList(res.data.data);

    return orders
      .filter((order) => {
        const cancelStatus =
          order.cancelStatus ??
          order.cancelLog?.status ??
          ((order as unknown as { cancel_request_status?: CancelLogStatus }).cancel_request_status ?? null);

        return cancelStatus === statusFilter;
      })
      .map((order) => ({
        id:
          (order as unknown as { cancelLogId?: string }).cancelLogId ??
          order.id,
        orderId: order.id,
        cashierName: order.cashierName,
        orderTotal: order.total,
        reason:
          order.cancelReason ??
          order.cancelLog?.reason ??
          ((order as unknown as { cancel_reason?: string }).cancel_reason ?? "Khong co ly do"),
        requestedAt:
          order.cancelRequestedAt ??
          order.cancelLog?.requestedAt ??
          ((order as unknown as { cancel_requested_at?: string }).cancel_requested_at ?? order.createdAt),
        status: statusFilter,
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
