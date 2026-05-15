import api from "@/lib/axios";
import type { ApiResponse, Coupon, CouponValidationResponse } from "@/types";

export const couponService = {
  validate: async (data: {
    code: string;
    orderTotal: number;
  }): Promise<CouponValidationResponse> => {
    const res = await api.post<ApiResponse<CouponValidationResponse>>(
      "/loyalty-promotion/coupons/validate",
      data
    );
    return res.data.data;
  },

  getAll: async (params?: {
    page?: number;
    size?: number;
    isActive?: boolean;
    promotionId?: string;
  }) => {
    const res = await api.get("/loyalty-promotion/coupons", { params });
    return res.data.data;
  },

  create: async (data: Partial<Coupon>) => {
    const res = await api.post<ApiResponse<Coupon>>(
      "/loyalty-promotion/coupons",
      data
    );
    return res.data.data;
  },
};
