import api from "@/lib/axios";
import type { AuditLog, PaginatedResponse } from "@/types";

const toStartOfDay = (date?: string) =>
  date && !date.includes("T") ? `${date}T00:00:00` : date;

const toEndOfDay = (date?: string) =>
  date && !date.includes("T") ? `${date}T23:59:59.999` : date;

export const auditLogService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    entityType?: string;
    userId?: string;
    from?: string;
    to?: string;
  }) => {
    const res = await api.get<PaginatedResponse<AuditLog>>(
      `/notification-audit/audit-logs`,
      {
        params: {
          ...params,
          from: toStartOfDay(params?.from),
          to: toEndOfDay(params?.to),
        },
      }
    );
    return res.data.data;
  },
};
