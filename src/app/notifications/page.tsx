"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  Clock,
  AlertCircle,
  CheckSquare,
  Package,
  FileText,
  Lock,
  ChevronRight,
  X,
} from "lucide-react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { useNotificationStore } from "@/stores/notification.store";
import { useAuthStore } from "@/stores/auth.store";
import type { Notification, NotificationType } from "@/types";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });

const NOTIFICATION_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof AlertTriangle;
    color: string;
    bgColor: string;
  }
> = {
  LOW_STOCK: {
    label: "Tồn kho thấp",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  NEAR_EXPIRY: {
    label: "Sắp hết hạn",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  SHIFT_VARIANCE: {
    label: "Chênh lệch ca",
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  CANCEL_APPROVAL: {
    label: "Chờ duyệt hủy đơn",
    icon: CheckSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  PO_PARTIAL: {
    label: "Nhận hàng thiếu",
    icon: Package,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  REPORT_READY: {
    label: "Báo cáo sẵn sàng",
    icon: FileText,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  ACCOUNT_LOCKED: {
    label: "Tài khoản bị khóa",
    icon: Lock,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
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

function NotificationDetailPanel({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-900">Chi tiết thông báo</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {(() => {
          const config = NOTIFICATION_CONFIG[notification.type] ?? {
            label: notification.type,
            icon: Bell,
            color: "text-gray-600",
            bgColor: "bg-gray-100",
          };
          const Icon = config.icon;
          return (
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <div
                className={`w-12 h-12 ${config.bgColor} rounded-full flex items-center justify-center`}
              >
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>
            </div>
          );
        })()}

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">{notification.message}</p>
        </div>

        {notification.type === "LOW_STOCK" && (
          <button
            onClick={() => router.push("/inventory/purchase-orders/create")}
            className="w-full px-4 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] font-medium flex items-center justify-center gap-2"
          >
            TẠO PHIẾU NHẬP HÀNG <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {notification.type === "NEAR_EXPIRY" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Vui lòng xem xét giảm giá hoặc xử lý sản phẩm này trước khi hết
              hạn.
            </p>
          </div>
        )}

        {notification.type === "SHIFT_VARIANCE" && (
          <button
            onClick={() => router.push(notification.deepLinkPath)}
            className="w-full px-4 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] font-medium flex items-center justify-center gap-2"
          >
            XEM CA LÀM VIỆC <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {notification.type === "CANCEL_APPROVAL" && (
          <div className="flex gap-3">
            <button
              onClick={() => router.push(notification.deepLinkPath)}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              TỪ CHỐI
            </button>
            <button
              onClick={() => router.push(notification.deepLinkPath)}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              DUYỆT HỦY
            </button>
          </div>
        )}

        {notification.type === "PO_PARTIAL" && (
          <button
            onClick={() => router.push(notification.deepLinkPath)}
            className="w-full px-4 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] font-medium flex items-center justify-center gap-2"
          >
            XEM PHIẾU NHẬP <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {notification.type === "REPORT_READY" && (
          <button
            onClick={() => router.push(notification.deepLinkPath)}
            className="w-full px-4 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] font-medium flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" /> XEM BÁO CÁO
          </button>
        )}

        {![
          "LOW_STOCK",
          "NEAR_EXPIRY",
          "SHIFT_VARIANCE",
          "CANCEL_APPROVAL",
          "PO_PARTIAL",
          "REPORT_READY",
        ].includes(notification.type) && (
          <button
            onClick={() => router.push(notification.deepLinkPath)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
          >
            XEM CHI TIẾT <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const {
    notifications,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotificationStore();
  const [activeType, setActiveType] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const visibleTypes =
    user?.role === "ADMIN"
      ? ALL_TYPES
      : ALL_TYPES.filter((t) => t.key !== "ACCOUNT_LOCKED");

  useEffect(() => {
    setIsLoading(true);
    setSelectedNotification(null);
    loadNotifications({
      page: 0,
      type: activeType !== "ALL" ? (activeType as NotificationType) : undefined,
    }).finally(() => setIsLoading(false));
  }, [activeType]);

  return (
    <ERPLayout>
      <div className="flex h-full gap-0 -m-6">
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 min-w-0">
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-bold text-gray-900">Thông báo</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-sm text-[#D946A6] hover:text-[#C026D3] font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="px-6 py-3 bg-white border-b border-gray-200 overflow-x-auto flex-shrink-0">
            <div className="flex gap-2">
              {visibleTypes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveType(t.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeType === t.key
                      ? "bg-[#D946A6] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <svg
                  className="animate-spin w-6 h-6 text-pink-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-20">
                <Bell className="w-16 h-16 text-gray-200 mb-4" />
                <p className="text-gray-500">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = NOTIFICATION_CONFIG[n.type] ?? {
                  label: n.type,
                  icon: Bell,
                  color: "text-gray-600",
                  bgColor: "bg-gray-100",
                };
                const Icon = config.icon;
                const isSelected = selectedNotification?.id === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={async () => {
                      await markAsRead(n.id);
                      setSelectedNotification(n);
                    }}
                    className={`w-full px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                      !n.isRead ? "bg-white" : "bg-gray-50/50"
                    } ${isSelected ? "border-l-4 border-[#D946A6]" : "border-l-4 border-transparent"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {selectedNotification && (
          <div className="w-[480px] bg-white flex flex-col border-l border-gray-200 flex-shrink-0">
            <NotificationDetailPanel
              notification={selectedNotification}
              onClose={() => setSelectedNotification(null)}
            />
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
