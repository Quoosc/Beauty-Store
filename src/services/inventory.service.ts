import api from "@/lib/axios";
import type { ApiResponse, InventoryStock, PaginatedResponse } from "@/types";

export const inventoryService = {
  getStock: async (params?: { page?: number; size?: number; search?: string }) => {
    const res = await api.get<PaginatedResponse<InventoryStock>>(`/inventory/stock`, { params });
    return res.data.data;
  },

  getStockByProduct: async (productId: string): Promise<InventoryStock> => {
    const res = await api.get<ApiResponse<InventoryStock>>(`/inventory/stock/${productId}`);
    return res.data.data;
  },

  createAdjustment: async (data: {
    productId: string;
    quantity: number;
    type: "DAMAGED" | "LOST" | "EXPIRED";
    description: string;
  }) => {
    const res = await api.post<ApiResponse<unknown>>(`/inventory/adjustments`, data);
    return res.data.data;
  },

  getPendingAdjustments: async (params?: { page?: number; size?: number }) => {
    const res = await api.get(`/inventory/adjustments`, { params });
    return res.data.data;
  },

  approveAdjustment: async (id: string): Promise<void> => {
    await api.post(`/inventory/adjustments/${id}/approve`);
  },

  rejectAdjustment: async (id: string): Promise<void> => {
    await api.post(`/inventory/adjustments/${id}/reject`);
  },
};
