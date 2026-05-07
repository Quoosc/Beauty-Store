"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, Clock, AlertCircle, CheckSquare, Package, FileText, Lock } from "lucide-react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { useNotificationStore } from "@/stores/notification.store";
import { useAuthStore } from "@/stores/auth.store";
import type { NotificationType } from "@/types";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

const NOTIFICATION_CONFIG: Record<string, {
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  bgColor: string;
}> = {
  LOW_STOCK:       { label: "Tồn kho thấp",     icon: AlertTriangle, color: "text-red-600",    bgColor: "bg-red-100" },
  NEAR_EXPIRY:     { label: "Sắp hết hạn",       icon: Clock,         color: "text-amber-600",  bgColor: "bg-amber-100" },
  SHIFT_VARIANCE:  { label: "Chênh lệch ca",      icon: AlertCircle,   color: "text-orange-600", bgColor: "bg-orange-100" },
  CANCEL_APPROVAL: { label: "Chờ duyệt hủy đơn", icon: CheckSquare,   color: "text-blue-600",   bgColor: "bg-blue-100" },
  PO_PARTIAL:      { label: "Nhận hàng thiếu",    icon: Package,       color: "text-purple-600", bgColor: "bg-purple-100" },
  REPORT_READY:    { label: "Báo cáo sẵn sàng",  icon: FileText,      color: "text-green-600",  bgColor: "bg-green-100" },
  ACCOUNT_LOCKED:  { label: "Tài khoản bị khóa", icon: Lock,          color: "text-gray-600",   bgColor: "bg-gray-100" },
};

const ALL_TYPES: { key: string; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "LOW_STOCK", label: "Tồn kho thấp" },
  { key: "NEAR_EXPIRY", label: "Sắp hết hạn" },
  { key: "SHIFT_VARIANCE", label: "Chênh lệch ca" },
  { key: "CANCEL_APPROVAL", label: "Chờ duyệt hủy" },
  { key: "PO_PARTIAL", label: "Nhận hàng thiếu" },
  { key: "REPORT_READY", label: "Báo cáo sẵn sàng" },
  { key: "ACCOUNT_LOCKED", label: "Khóa tài khoản" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { notifications, loadNotifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const [activeType, setActiveType] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const visibleTypes = user?.role === "ADMIN"
    ? ALL_TYPES
    : ALL_TYPES.filter((t) => t.key !== "ACCOUNT_LOCKED");

  useEffect(() => {
    setIsLoading(true);
    loadNotifications({
      page: 0,
      type: activeType !== "ALL" ? (activeType as NotificationType) : undefined,
    }).finally(() => setIsLoading(false));
  }, [activeType]);

  async function handleClick(id: string, deepLink: string) {
    await markAsRead(id);
    router.push(deepLink);
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleTypes.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeType === t.key
                  ? "bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <Bell className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-500">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const config = NOTIFICATION_CONFIG[n.type] ?? {
                label: n.type,
                icon: Bell,
                color: "text-gray-600",
                bgColor: "bg-gray-100",
              };
              const Icon = config.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n.id, n.deepLinkPath)}
                  className={`w-full text-left rounded-xl border p-4 hover:shadow-md transition-all ${
                    n.isRead
                      ? "bg-white border-gray-100"
                      : "bg-pink-50 border-pink-200 border-l-4 border-l-pink-500"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.isRead ? "font-medium text-gray-900" : "font-bold text-gray-900"}`}>
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2.5 h-2.5 bg-pink-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
