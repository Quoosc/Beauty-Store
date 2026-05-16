import api from "@/lib/axios";
import type {
  ApiResponse,
  LoyaltyMember,
  RedeemResponse,
} from "@/types";

export const loyaltyService = {
  // Backend: GET /members?phone=  (NOT /members/search)
  searchByPhone: async (phone: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      "/loyalty-promotion/members",
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
  ): Promise<RedeemResponse> => {
    const res = await api.post<ApiResponse<RedeemResponse>>(
      `/loyalty-promotion/members/${memberId}/redeem-preview`,
      data
    );
    return res.data.data;
  },

  /** BE trả { discountAmount, actualPointsRedeemed, remainingBalance } */
  redeem: async (
    memberId: string,
    data: { pointsToRedeem: number; orderTotal: number }
  ): Promise<RedeemResponse> => {
    const res = await api.post<ApiResponse<RedeemResponse>>(
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
    const res = await api.get("/loyalty-promotion/members/all", { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      `/loyalty-promotion/members/${id}`
    );
    return res.data.data;
  },
};
