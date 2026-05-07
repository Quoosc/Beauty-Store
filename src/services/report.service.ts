import api from "@/lib/axios";
import type { ApiResponse, DashboardData } from "@/types";

export interface RevenueReportData {
  date: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  topProducts: { productId: string; productName: string; soldQty: number; revenue: number }[];
}

export interface InventoryReportData {
  lowStockItems: { productId: string; productName: string; sku: string; quantity: number; minThreshold: number }[];
  nearExpiryItems: { productId: string; productName: string; sku: string; expiryDate: string; quantity: number }[];
  slowMovingItems: { productId: string; productName: string; sku: string; lastSoldAt: string | null; quantity: number }[];
}

export const reportService = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await api.get<ApiResponse<DashboardData>>(`/report/dashboard`);
    return res.data.data;
  },

  getRevenue: async (params: { startDate: string; endDate: string }): Promise<RevenueReportData[]> => {
    const res = await api.get<ApiResponse<RevenueReportData[]>>(`/report/revenue`, { params });
    return res.data.data;
  },

  requestAsyncRevenue: async (params: { startDate: string; endDate: string }): Promise<{ jobId: string }> => {
    const res = await api.post<ApiResponse<{ jobId: string }>>(`/report/revenue/async`, params);
    return res.data.data;
  },

  getInventoryReport: async (): Promise<InventoryReportData> => {
    const res = await api.get<ApiResponse<InventoryReportData>>(`/report/inventory`);
    return res.data.data;
  },
};
