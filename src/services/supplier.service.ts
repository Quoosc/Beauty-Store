import api from "@/lib/axios";
import type { ApiResponse, Supplier } from "@/types";

export const supplierService = {
  getAll: async (params?: { page?: number; size?: number; search?: string }) => {
    const res = await api.get(`/inventory/suppliers`, { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Supplier> => {
    const res = await api.get<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`);
    return res.data.data;
  },

  create: async (data: Omit<Supplier, "id">): Promise<Supplier> => {
    const res = await api.post<ApiResponse<Supplier>>(`/inventory/suppliers`, data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Omit<Supplier, "id">>): Promise<Supplier> => {
    const res = await api.put<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`, data);
    return res.data.data;
  },

  deactivate: async (id: string): Promise<void> => {
    await api.post(`/inventory/suppliers/${id}/deactivate`);
  },
};
