import api from "@/lib/axios";
import { ApiResponse, PaginatedResponse, Product } from "@/types";

export const productService = {
  getAll: (params?: { page?: number; limit?: number; category?: string; search?: string }) =>
    api.get<PaginatedResponse<Product>>("/products", { params }),

  getById: (id: number) => api.get<ApiResponse<Product>>(`/products/${id}`),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<Product>>(`/products/slug/${slug}`),

  getFeatured: () => api.get<ApiResponse<Product[]>>("/products/featured"),
};
