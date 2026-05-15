import api from "@/lib/axios";
import type {
  AdjustmentRequest,
  ApiResponse,
  InventoryStock,
  PaginatedData,
  PaginatedResponse,
} from "@/types";

export const inventoryService = {
  getStock: async (params?: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<PaginatedData<InventoryStock>> => {
    const res = await api.get<ApiResponse<InventoryStock[] | PaginatedData<InventoryStock>>>(
      "/report/reports/inventory",
      {
        params: {
          tab: "current_stock",
          page: params?.page,
          size: params?.size,
          keyword: params?.search,
        },
      }
    );

    const data = res.data.data;
    if (Array.isArray(data)) {
      return {
        content: data,
        page: params?.page ?? 0,
        size: params?.size ?? data.length,
        totalElements: data.length,
        totalPages: 1,
      };
    }

    return data;
  },

  getStockByProduct: async (productId: string): Promise<InventoryStock> => {
    const res = await api.get<
      ApiResponse<InventoryStock[] | PaginatedData<InventoryStock>>
    >(
      "/report/reports/inventory",
      {
        params: {
          tab: "current_stock",
          size: 500,
        },
      }
    );

    const raw = res.data.data;
    const rows = Array.isArray(raw) ? raw : (raw?.content ?? []);
    const row = rows.find((item) => item.productId === productId);
    if (!row) {
      throw new Error("Khong tim thay ton kho cua san pham");
    }

    return row;
  },

  createAdjustment: async (data: AdjustmentRequest) => {
    const res = await api.post<ApiResponse<unknown>>(`/inventory/adjustments`, data);
    return res.data.data;
  },

  getPendingAdjustments: async (params?: { page?: number; size?: number }) => {
    const res = await api.get<PaginatedResponse<unknown>>(`/inventory/adjustments/pending`, {
      params,
    });
    return res.data.data;
  },

  approveAdjustment: async (id: string): Promise<void> => {
    await api.post(`/inventory/adjustments/${id}/approve`);
  },

  rejectAdjustment: async (id: string): Promise<void> => {
    await api.post(`/inventory/adjustments/${id}/reject`);
  },
};
