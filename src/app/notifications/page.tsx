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
import { CelaButton, CelaSpinner } from "@/components/ui/cela-primitives";

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
    iconColor: string;
    iconBg: string;
  }
> = {
  LOW_STOCK: {
    label: "Tồn kho thấp",
    icon: AlertTriangle,
    iconColor: "var(--cela-danger)",
    iconBg: "rgba(183,110,121,0.15)",
  },
  NEAR_EXPIRY: {
    label: "Sắp hết hạn",
    icon: Clock,
    iconColor: "var(--cela-gold)",
    iconBg: "rgba(201,168,122,0.18)",
  },
  SHIFT_VARIANCE: {
    label: "Chênh lệch ca",
    icon: AlertCircle,
    iconColor: "var(--cela-gold)",
    iconBg: "rgba(201,168,122,0.18)",
  },
  CANCEL_APPROVAL: {
    label: "Chờ duyệt hủy đơn",
    icon: CheckSquare,
    iconColor: "#6080b0",
    iconBg: "rgba(120,140,180,0.18)",
  },
  PO_PARTIAL: {
    label: "Nhận hàng thiếu",
    icon: Package,
    iconColor: "var(--cela-cocoa)",
    iconBg: "rgba(140,100,80,0.15)",
  },
  REPORT_READY: {
    label: "Báo cáo sẵn sàng",
    icon: FileText,
    iconColor: "var(--cela-success)",
    iconBg: "rgba(107,142,106,0.15)",
  },
  ACCOUNT_LOCKED: {
    label: "Tài khoản bị khóa",
    icon: Lock,
    iconColor: "var(--cela-stone)",
    iconBg: "var(--cela-fog)",
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
  const config = NOTIFICATION_CONFIG[notification.type] ?? {
    label: notification.type,
    icon: Bell,
    iconColor: "var(--cela-stone)",
    iconBg: "var(--cela-fog)",
  };
  const Icon = config.icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--cela-mist)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "var(--cela-espresso)",
            fontFamily: "var(--cela-display)",
            letterSpacing: "0.18em",
          }}
        >
          Chi tiết thông báo
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <X style={{ width: 20, height: 20, color: "var(--cela-stone)" }} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            paddingBottom: 20,
            borderBottom: "1px solid var(--cela-mist)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: config.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: 24, height: 24, color: config.iconColor }} />
          </div>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--cela-espresso)",
              }}
            >
              {notification.title}
            </h4>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--cela-stone)",
              }}
            >
              {formatDateTime(notification.createdAt)}
            </p>
          </div>
        </div>

        <div
          style={{
            background: "var(--cela-fog)",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--cela-espresso)",
              lineHeight: 1.6,
            }}
          >
            {notification.message}
          </p>
        </div>

        {notification.type === "LOW_STOCK" && (
          <CelaButton
            variant="primary"
            onClick={() => router.push("/inventory/purchase-orders/create")}
            style={{ width: "100%", justifyContent: "center" }}
          >
            TẠO PHIẾU NHẬP HÀNG{" "}
            <ChevronRight style={{ width: 18, height: 18 }} />
          </CelaButton>
        )}

        {notification.type === "NEAR_EXPIRY" && (
          <div
            style={{
              background: "rgba(201,168,122,0.14)",
              border: "1px solid rgba(201,168,122,0.4)",
              borderRadius: 10,
              padding: "12px 16px",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--cela-cocoa)" }}>
              Vui lòng xem xét giảm giá hoặc xử lý sản phẩm này trước khi hết
              hạn.
            </p>
          </div>
        )}

        {notification.type === "SHIFT_VARIANCE" && (
          <CelaButton
            variant="primary"
            onClick={() => router.push(notification.deepLinkPath)}
            style={{ width: "100%", justifyContent: "center" }}
          >
            XEM CA LÀM VIỆC <ChevronRight style={{ width: 18, height: 18 }} />
          </CelaButton>
        )}

        {notification.type === "CANCEL_APPROVAL" && (
          <div style={{ display: "flex", gap: 10 }}>
            <CelaButton
              variant="danger"
              onClick={() => router.push(notification.deepLinkPath)}
              style={{ flex: 1, justifyContent: "center" }}
            >
              TỪ CHỐI
            </CelaButton>
            <CelaButton
              variant="success"
              onClick={() => router.push(notification.deepLinkPath)}
              style={{ flex: 1, justifyContent: "center" }}
            >
              DUYỆT HỦY
            </CelaButton>
          </div>
        )}

        {(notification.type === "PO_PARTIAL" ||
          notification.type === "REPORT_READY") && (
          <CelaButton
            variant="primary"
            onClick={() => router.push(notification.deepLinkPath)}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {notification.type === "REPORT_READY" && (
              <FileText style={{ width: 18, height: 18 }} />
            )}
            {notification.type === "PO_PARTIAL"
              ? "XEM PHIẾU NHẬP"
              : "XEM BÁO CÁO"}
            <ChevronRight style={{ width: 18, height: 18 }} />
          </CelaButton>
        )}

        {![
          "LOW_STOCK",
          "NEAR_EXPIRY",
          "SHIFT_VARIANCE",
          "CANCEL_APPROVAL",
          "PO_PARTIAL",
          "REPORT_READY",
        ].includes(notification.type) && (
          <CelaButton
            variant="secondary"
            onClick={() => router.push(notification.deepLinkPath)}
            style={{ width: "100%", justifyContent: "center" }}
          >
            XEM CHI TIẾT <ChevronRight style={{ width: 18, height: 18 }} />
          </CelaButton>
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
      <div style={{ display: "flex", height: "100%", gap: 0, margin: "-24px" }}>
        {/* Left panel — list */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid var(--cela-mist)",
            minWidth: 0,
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "16px 24px",
              background: "var(--cela-paper)",
              borderBottom: "1px solid var(--cela-mist)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bell
                style={{ width: 20, height: 20, color: "var(--cela-rose)" }}
              />
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--cela-espresso)",
                  fontFamily: "var(--cela-display)",
                  letterSpacing: "0.18em",
                }}
              >
                Thông báo
              </h2>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: "2px 8px",
                    background: "rgba(183,110,121,0.15)",
                    color: "var(--cela-danger)",
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 12,
                  }}
                >
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  fontSize: 13,
                  color: "var(--cela-rose)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontFamily: "var(--cela-body)",
                }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Type filter tabs */}
          <div
            style={{
              padding: "10px 24px",
              background: "var(--cela-paper)",
              borderBottom: "1px solid var(--cela-mist)",
              overflowX: "auto",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              {visibleTypes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveType(t.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--cela-body)",
                    background:
                      activeType === t.key
                        ? "var(--cela-espresso)"
                        : "var(--cela-fog)",
                    color:
                      activeType === t.key
                        ? "var(--cela-champagne)"
                        : "var(--cela-stone)",
                    transition: "background 0.15s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "64px 0",
                }}
              >
                <CelaSpinner padding="0" />
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "80px 0",
                }}
              >
                <Bell
                  style={{
                    width: 56,
                    height: 56,
                    color: "var(--cela-mist)",
                    marginBottom: 16,
                  }}
                />
                <p style={{ color: "var(--cela-stone)", margin: 0 }}>
                  Không có thông báo nào
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = NOTIFICATION_CONFIG[n.type] ?? {
                  label: n.type,
                  icon: Bell,
                  iconColor: "var(--cela-stone)",
                  iconBg: "var(--cela-fog)",
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
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      padding: "16px 24px",
                      background: isSelected
                        ? "var(--cela-fog)"
                        : n.isRead
                          ? "transparent"
                          : "var(--cela-paper)",
                      borderBottom: "1px solid var(--cela-fog)",
                      borderLeft: `4px solid ${isSelected ? "var(--cela-rose)" : "transparent"}`,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: config.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        style={{
                          width: 20,
                          height: 20,
                          color: config.iconColor,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--cela-espresso)",
                          }}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              background: "var(--cela-rose)",
                              borderRadius: "50%",
                              marginTop: 4,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: 13,
                          color: "var(--cela-stone)",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                        }}
                      >
                        {n.message}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "var(--cela-stone)",
                        }}
                      >
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                    <ChevronRight
                      style={{
                        width: 18,
                        height: 18,
                        color: "var(--cela-mist)",
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — detail */}
        {selectedNotification && (
          <div
            style={{
              width: 480,
              background: "var(--cela-paper)",
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--cela-mist)",
              flexShrink: 0,
            }}
          >
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
