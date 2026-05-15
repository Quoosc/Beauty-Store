import api from "@/lib/axios";
import type {
  ApiResponse,
  DashboardData,
  InventoryReportRow,
  ReportJob,
} from "@/types";

// Matches backend RevenueReportResponse.DailyEntry
export interface DailyEntry {
  date: string;
  revenue: number;
  discount: number;
  orderCount: number;
}

// Matches backend RevenueReportResponse
export interface RevenueReportResponse {
  from: string;
  to: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  totalDiscount: number;
  netRevenue: number;
  dailyData: DailyEntry[];
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

export const reportService = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await api.get<ApiResponse<DashboardData>>("/report/dashboard");
    return res.data.data;
  },

  // Backend: GET /reports/revenue?from=&to=  (params: from, to — NOT startDate/endDate)
  getRevenue: async (params: {
    from: string;
    to: string;
  }): Promise<RevenueReportResponse> => {
    const res = await api.get<ApiResponse<RevenueReportResponse>>(
      "/report/reports/revenue",
      { params }
    );
    return res.data.data;
  },

  // Backend: POST /reports/revenue/async  body: { from, to }  (AsyncRevenueReportRequest)
  requestAsyncRevenue: async (params: {
    from: string;
    to: string;
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

  // Backend: POST /reports/inventory/export?tab=  (@RequestParam, NOT request body)
  exportInventoryPdf: async (tab: InventoryReportTab): Promise<Blob> => {
    const res = await api.post(
      "/report/reports/inventory/export",
      null,
      {
        params: { tab },
        responseType: "blob",
      }
    );
    return res.data as Blob;
  },
};
