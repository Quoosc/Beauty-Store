import api from "@/lib/axios";
import type { ApiResponse, Notification, PaginatedResponse, NotificationType } from "@/types";

export const notificationService = {
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<number>>(
      `/notification-audit/notifications/unread-count`
    );
    return res.data.data;
  },

  getAll: async (params?: { page?: number; size?: number; type?: NotificationType }) => {
    const res = await api.get<PaginatedResponse<Notification>>(
      `/notification-audit/notifications`,
      { params }
    );
    return res.data.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notification-audit/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch(`/notification-audit/notifications/read-all`);
  },
};
