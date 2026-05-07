import api from "@/lib/axios";
import type { ApiResponse, LoyaltyMember } from "@/types";

export const loyaltyService = {
  // GET /loyalty-promotion/members/search?phone={phone}
  searchByPhone: async (phone: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      `/loyalty-promotion/members/search`,
      { params: { phone } }
    );
    return res.data.data;
  },

  // POST /loyalty-promotion/members — đăng ký thành viên mới tại POS
  register: async (data: { fullName: string; phone: string }): Promise<LoyaltyMember> => {
    const res = await api.post<ApiResponse<LoyaltyMember>>(
      `/loyalty-promotion/members`,
      data
    );
    return res.data.data;
  },

  // POST /loyalty-promotion/members/{id}/redeem
  redeemPoints: async (
    memberId: string,
    data: { pointsToRedeem: number; orderTotal: number }
  ) => {
    const res = await api.post<ApiResponse<{ discountAmount: number }>>(
      `/loyalty-promotion/members/${memberId}/redeem`,
      data
    );
    return res.data.data;
  },

  // GET /loyalty-promotion/members — danh sách (Wave 4)
  getAll: async (params?: { page?: number; size?: number; search?: string }) => {
    const res = await api.get(`/loyalty-promotion/members`, { params });
    return res.data.data;
  },

  // GET /loyalty-promotion/members/{id}
  getById: async (id: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      `/loyalty-promotion/members/${id}`
    );
    return res.data.data;
  },

  // GET /loyalty-promotion/members/{id}/points-history
  getPointHistory: async (id: string, params?: { page?: number; size?: number }) => {
    const res = await api.get(`/loyalty-promotion/members/${id}/points-history`, { params });
    return res.data.data;
  },
};
