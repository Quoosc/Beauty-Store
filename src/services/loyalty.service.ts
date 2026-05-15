import api from "@/lib/axios";
import type {
  ApiResponse,
  LoyaltyMember,
  RedeemPreviewResponse,
} from "@/types";

export const loyaltyService = {
  searchByPhone: async (phone: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      "/loyalty-promotion/members/search",
      { params: { phone } }
    );
    return res.data.data;
  },

  checkByPhone: async (phone: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      "/loyalty-promotion/members/check",
      { params: { phone } }
    );
    return res.data.data;
  },

  register: async (data: {
    fullName: string;
    phone: string;
  }): Promise<LoyaltyMember> => {
    const res = await api.post<ApiResponse<LoyaltyMember>>(
      "/loyalty-promotion/members",
      data
    );
    return res.data.data;
  },

  redeemPreview: async (
    memberId: string,
    data: { orderTotal: number; pointsToRedeem?: number }
  ): Promise<RedeemPreviewResponse> => {
    const res = await api.post<ApiResponse<RedeemPreviewResponse>>(
      `/loyalty-promotion/members/${memberId}/redeem-preview`,
      data
    );
    return res.data.data;
  },

  redeem: async (
    memberId: string,
    data: { pointsToRedeem: number; orderTotal: number }
  ): Promise<{ discountAmount: number }> => {
    const res = await api.post<ApiResponse<{ discountAmount: number }>>(
      `/loyalty-promotion/members/${memberId}/redeem`,
      data
    );
    return res.data.data;
  },

  getAll: async (params?: {
    page?: number;
    size?: number;
    search?: string;
  }) => {
    const res = await api.get("/loyalty-promotion/members", { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      `/loyalty-promotion/members/${id}`
    );
    return res.data.data;
  },
};
