import api from "@/lib/axios";
import type { ApiResponse, PurchaseOrder, PaginatedResponse } from "@/types";

export const purchaseOrderService = {
  getAll: async (params?: { page?: number; size?: number; status?: string }) => {
    const res = await api.get<PaginatedResponse<PurchaseOrder>>(`/inventory/purchase-orders`, { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.get<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders/${id}`);
    return res.data.data;
  },

  create: async (data: {
    supplierId: string;
    items: { productId: string; orderedQty: number; unitPrice: number }[];
  }): Promise<PurchaseOrder> => {
    const res = await api.post<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders`, data);
    return res.data.data;
  },

  confirm: async (id: string): Promise<void> => {
    await api.post(`/inventory/purchase-orders/${id}/confirm`);
  },

  receive: async (
    id: string,
    items: { productId: string; receivedQty: number; lotNumber?: string; expiryDate?: string }[]
  ): Promise<void> => {
    await api.post(`/inventory/purchase-orders/${id}/receive`, { items });
  },

  cancel: async (id: string): Promise<void> => {
    await api.post(`/inventory/purchase-orders/${id}/cancel`);
  },
};
