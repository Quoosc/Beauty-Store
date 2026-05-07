import api from "@/lib/axios";
import type { ApiResponse, Category } from "@/types";

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const res = await api.get<ApiResponse<Category[]>>(`/catalog/categories`);
    return res.data.data;
  },

  create: async (data: { name: string; parentId?: string | null }): Promise<Category> => {
    const res = await api.post<ApiResponse<Category>>(`/catalog/categories`, data);
    return res.data.data;
  },

  update: async (id: string, data: { name: string }): Promise<Category> => {
    const res = await api.put<ApiResponse<Category>>(`/catalog/categories/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/catalog/categories/${id}`);
  },
};
