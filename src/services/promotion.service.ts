import api from "@/lib/axios";
import type { ApiResponse, Promotion, PaginatedResponse } from "@/types";

export const promotionService = {
  getAll: async (params?: { page?: number; size?: number; active?: boolean }) => {
    const res = await api.get<PaginatedResponse<Promotion>>(
      "/loyalty-promotion/promotions",
      { params }
    );
    return res.data.data;
  },

  getById: async (id: string): Promise<Promotion> => {
    const res = await api.get<ApiResponse<Promotion>>(
      `/loyalty-promotion/promotions/${id}`
    );
    return res.data.data;
  },

  create: async (data: Omit<Promotion, "id">): Promise<Promotion> => {
    const res = await api.post<ApiResponse<Promotion>>(
      "/loyalty-promotion/promotions",
      data
    );
    return res.data.data;
  },

  deactivate: async (id: string): Promise<void> => {
    await api.delete(`/loyalty-promotion/promotions/${id}`);
  },

  activate: async (id: string): Promise<void> => {
    await api.post(`/loyalty-promotion/promotions/${id}/activate`);
  },
};
