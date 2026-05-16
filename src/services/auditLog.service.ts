import api from "@/lib/axios";
import type { AuditLog, PaginatedResponse } from "@/types";

export const auditLogService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    entityType?: string;
    userId?: string;
    from?: string;    // đúng tên BE nhận (không phải startDate)
    to?: string;      // đúng tên BE nhận (không phải endDate)
  }) => {
    const res = await api.get<PaginatedResponse<AuditLog>>(
      `/notification-audit/audit-logs`,
      { params }
    );
    return res.data.data;
  },
};
