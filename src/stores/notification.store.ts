import { create } from "zustand";
import type { Notification, NotificationType } from "@/types";
import { notificationService } from "@/services/notification.service";

interface NotificationStore {
  unreadCount: number;
  notifications: Notification[];
  isPolling: boolean;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  fetchUnreadCount: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  loadNotifications: (params?: { page?: number; type?: NotificationType }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isPolling: false,
  pollingIntervalId: null,

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Silently fail — polling errors should not disturb UX
    }
  },

  startPolling: () => {
    const { isPolling, fetchUnreadCount } = get();
    if (isPolling) return;
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30000);
    set({ isPolling: true, pollingIntervalId: id });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) clearInterval(pollingIntervalId);
    set({ isPolling: false, pollingIntervalId: null });
  },

  loadNotifications: async (params) => {
    try {
      const result = await notificationService.getAll(params);
      set({ notifications: result.content ?? [] });
    } catch {
      // keep existing notifications
    }
  },

  markAsRead: async (id: string) => {
    await notificationService.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  setUnreadCount: (count: number) => set({ unreadCount: count }),
}));
