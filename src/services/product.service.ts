import api from "@/lib/axios";
import { ApiResponse, Product } from "@/types";

/**
 * Product Service — catalog-service :8082 (qua api-gateway :8080)
 *
 * Gateway routing:
 *   FE gọi:  /api/v1/catalog/**
 *   StripPrefix=2 → catalog-service nhận: /catalog/**
 *   catalog-service context-path: /catalog
 *   ProductController @RequestMapping: /products
 *   → URL cuối: /catalog/products → match ✅
 *
 * Endpoints thực tế từ ProductController.java:
 *   GET    /api/v1/catalog/products/search   — tìm kiếm + phân trang (q, categoryId, status, page, size)
 *   GET    /api/v1/catalog/products/:id      — chi tiết
 *   POST   /api/v1/catalog/products          — tạo (multipart/form-data: data + image)
 *   PUT    /api/v1/catalog/products/:id      — cập nhật (multipart/form-data)
 *   DELETE /api/v1/catalog/products/:id      — discontinue (ADMIN, BRANCH_MANAGER)
 *   GET    /api/v1/catalog/products/images/:filename — serve ảnh
 */

export interface ProductSearchParams {
  q?: string;
  categoryId?: string;
  status?: "ACTIVE" | "DISCONTINUED";
  page?: number;
  size?: number;
}

export const productService = {
  search: (params?: ProductSearchParams) =>
    api.get<ApiResponse<{ content: Product[]; page: number; size: number; totalElements: number; totalPages: number }>>(
      "/catalog/products/search",
      { params }
    ),

  getById: (id: string) =>
    api.get<ApiResponse<Product>>(`/catalog/products/${id}`),

  /**
   * Tạo sản phẩm — multipart/form-data
   * Part "data": JSON CreateProductRequest
   * Part "image" (optional): file ảnh
   */
  create: (data: FormData) =>
    api.post<ApiResponse<Product>>("/catalog/products", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * Cập nhật sản phẩm — multipart/form-data
   * Part "data": JSON UpdateProductRequest
   * Part "image" (optional): file ảnh mới
   */
  update: (id: string, data: FormData) =>
    api.put<ApiResponse<Product>>(`/catalog/products/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** Soft-delete (set status = DISCONTINUED) */
  discontinue: (id: string) =>
    api.delete<ApiResponse<null>>(`/catalog/products/${id}`),

  /** URL ảnh sản phẩm — serve trực tiếp từ catalog-service */
  getImageUrl: (filename: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/catalog/products/images/${filename}`,
};
