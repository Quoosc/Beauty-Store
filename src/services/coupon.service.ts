import api from "@/lib/axios";
import type { ApiResponse, Coupon, CouponValidationResponse } from "@/types";

export const couponService = {
  // POST /loyalty-promotion/coupons/validate
  validate: async (data: { code: string; orderTotal: number }): Promise<CouponValidationResponse> => {
    const res = await api.post<ApiResponse<CouponValidationResponse>>(
      `/loyalty-promotion/coupons/validate`,
      data
    );
    return res.data.data;
  },

  // GET /loyalty-promotion/coupons — danh sách (Wave 4)
  getAll: async (params?: { page?: number; size?: number; isActive?: boolean }) => {
    const res = await api.get(`/loyalty-promotion/coupons`, { params });
    return res.data.data;
  },

  // POST /loyalty-promotion/coupons (Wave 4)
  create: async (data: Partial<Coupon>) => {
    const res = await api.post<ApiResponse<Coupon>>(`/loyalty-promotion/coupons`, data);
    return res.data.data;
  },

  // PUT /loyalty-promotion/coupons/{id} (Wave 4)
  update: async (id: string, data: Partial<Coupon>) => {
    const res = await api.put<ApiResponse<Coupon>>(`/loyalty-promotion/coupons/${id}`, data);
    return res.data.data;
  },

  // DELETE /loyalty-promotion/coupons/{id} (Wave 4)
  deactivate: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/loyalty-promotion/coupons/${id}`);
    return res.data;
  },
};
