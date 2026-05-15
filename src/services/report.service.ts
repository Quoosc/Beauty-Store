import api from "@/lib/axios";
import type {
  ApiResponse,
  DashboardData,
  InventoryReportRow,
  ReportJob,
} from "@/types";

export interface RevenueReportData {
  date: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  topProducts: {
    productId: string;
    productName: string;
    soldQty: number;
    revenue: number;
  }[];
  totalDiscount?: number;
}

export interface NearExpiryItem {
  productId: string;
  productName: string;
  sku: string;
  expiryDate: string;
  quantity: number;
}

export interface SlowMovingItem {
  productId: string;
  productName: string;
  sku: string;
  lastSoldAt: string | null;
  quantity: number;
}

export type InventoryReportTab = "current_stock" | "near_expiry" | "slow_moving";

export interface InventoryReportParams {
  tab: InventoryReportTab;
  page?: number;
  size?: number;
  keyword?: string;
}

export type InventoryReportResult =
  | InventoryReportRow[]
  | NearExpiryItem[]
  | SlowMovingItem[];

export interface InventoryExportPayload {
  tab: InventoryReportTab;
}

export const reportService = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await api.get<ApiResponse<DashboardData>>("/report/dashboard");
    return res.data.data;
  },

  getRevenue: async (params: {
    startDate: string;
    endDate: string;
  }): Promise<RevenueReportData[]> => {
    const res = await api.get<ApiResponse<RevenueReportData[]>>(
      "/report/reports/revenue",
      { params }
    );
    return res.data.data;
  },

  requestAsyncRevenue: async (params: {
    startDate: string;
    endDate: string;
  }): Promise<ReportJob> => {
    const res = await api.post<ApiResponse<ReportJob>>(
      "/report/reports/revenue/async",
      params
    );
    return res.data.data;
  },

  getJobResult: async (jobId: string): Promise<ReportJob> => {
    const res = await api.get<ApiResponse<ReportJob>>(
      `/report/reports/jobs/${jobId}/result`
    );
    return res.data.data;
  },

  getInventoryReport: async (
    params: InventoryReportParams
  ): Promise<InventoryReportResult> => {
    const res = await api.get<ApiResponse<InventoryReportResult>>(
      "/report/reports/inventory",
      { params }
    );
    return res.data.data;
  },

  exportInventoryPdf: async (tab: InventoryReportTab): Promise<Blob> => {
    const res = await api.post("/report/reports/inventory/export", { tab }, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
