"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { orderService } from "@/services/order.service";
import type { Order, OrderStatus } from "@/types";
import {
  CelaButton,
  CelaCard,
  CelaEmptyState,
  CelaSelect,
  CelaSpinner,
} from "@/components/ui/cela-primitives";
const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const STATUS_MAP: Record<
  OrderStatus,
  {
    label: string;
    bg: string;
    color: string;
  }
> = {
  PENDING: {
    label: "Chờ xử lý",
    bg: "rgba(201,168,122,0.20)",
    color: "var(--cela-gold)",
  },
  COMPLETED: {
    label: "Hoàn thành",
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
  },
  CANCELLED: {
    label: "Đã hủy",
    bg: "rgba(183,110,121,0.15)",
    color: "var(--cela-danger)",
  },
  RETURNED: {
    label: "Trả hàng",
    bg: "rgba(140,100,80,0.15)",
    color: "var(--cela-cocoa)",
  },
};
const CANCEL_REASONS = [
  "Khách hàng đổi ý",
  "Sản phẩm hết hàng",
  "Lỗi nhập liệu",
  "Khác",
];
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  async function loadOrder() {
    setIsLoading(true);
    try {
      const res = await orderService.getById(orderId);
      setOrder(res.data.data);
    } catch {
      toast.error("Không tìm thấy đơn hàng");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    loadOrder();
  }, [orderId]);
  async function handlePrint() {
    try {
      const res = await orderService.getReceipt(orderId);
      window.open(res.data.data, "_blank");
    } catch {
      toast.error("Không thể tải hóa đơn");
    }
  }
  async function handleCancelConfirm() {
    if (!cancelReason || !order) return;
    setIsCancelling(true);
    try {
      await orderService.cancel(orderId, {
        reason: cancelReason,
      });
      toast.success("Yêu cầu hủy đơn đã được gửi");
      setShowCancelDialog(false);
      await loadOrder();
    } catch (err: unknown) {
      const message = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;
      toast.error(message || "Hủy đơn thất bại");
    } finally {
      setIsCancelling(false);
    }
  }
  if (isLoading) {
    return (
      <ERPLayout>
        {" "}
        <CelaSpinner />{" "}
      </ERPLayout>
    );
  }
  if (!order) {
    return (
      <ERPLayout>
        {" "}
        <CelaEmptyState title="Không tìm thấy đơn hàng" />{" "}
      </ERPLayout>
    );
  }
  const statusInfo = STATUS_MAP[order.status] ?? {
    label: order.status,
    bg: "var(--cela-fog)",
    color: "var(--cela-stone)",
  };
  return (
    <ERPLayout>
      {" "}
      {showCancelDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(60,46,42,0.45)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {" "}
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "var(--cela-paper)",
              borderRadius: 16,
              boxShadow: "var(--cela-shadow-md)",
              border: "1px solid var(--cela-mist)",
              padding: 24,
            }}
          >
            {" "}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {" "}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(183,110,121,0.15)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {" "}
                <X
                  style={{
                    width: 16,
                    height: 16,
                    color: "var(--cela-danger)",
                  }}
                />{" "}
              </div>{" "}
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--cela-display)",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "var(--cela-espresso)",
                }}
              >
                {" "}
                Xác nhận hủy đơn?{" "}
              </h2>{" "}
            </div>{" "}
            {order.total > 500000 && (
              <div
                style={{
                  background: "rgba(201,168,122,0.14)",
                  border: "1px solid rgba(201,168,122,0.4)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {" "}
                <AlertTriangle
                  style={{
                    width: 14,
                    height: 14,
                    color: "var(--cela-gold)",
                    marginTop: 2,
                  }}
                />{" "}
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "var(--cela-cocoa)",
                  }}
                >
                  {" "}
                  Đơn này cần Branch Manager duyệt trước khi hủy hoàn tất.{" "}
                </p>{" "}
              </div>
            )}{" "}
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                margin: "0 0 8px",
              }}
            >
              {" "}
              Lý do hủy{" "}
            </p>{" "}
            <CelaSelect
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{
                height: 40,
              }}
            >
              {" "}
              <option value="">-- Chọn lý do --</option>{" "}
              {CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>
                  {" "}
                  {r}{" "}
                </option>
              ))}{" "}
            </CelaSelect>{" "}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
              }}
            >
              {" "}
              <CelaButton
                variant="secondary"
                onClick={() => setShowCancelDialog(false)}
                style={{
                  flex: 1,
                }}
              >
                {" "}
                Quay lại{" "}
              </CelaButton>{" "}
              <CelaButton
                variant="danger"
                onClick={handleCancelConfirm}
                disabled={!cancelReason || isCancelling}
                style={{
                  flex: 1,
                }}
              >
                {" "}
                {isCancelling ? "Đang xử lý..." : "Hủy đơn"}{" "}
              </CelaButton>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {" "}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {" "}
          <div>
            {" "}
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                margin: "0 0 4px",
              }}
            >
              {" "}
              Đơn hàng{" "}
            </p>{" "}
            <h1
              style={{
                fontFamily: "var(--cela-display)",
                fontSize: 28,
                fontWeight: 500,
                color: "var(--cela-espresso)",
                margin: 0,
              }}
            >
              {" "}
              #{order.id.slice(-8).toUpperCase()}{" "}
            </h1>{" "}
          </div>{" "}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {" "}
            <span
              style={{
                background: statusInfo.bg,
                color: statusInfo.color,
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {" "}
              {statusInfo.label}{" "}
            </span>{" "}
            {order.status === "COMPLETED" && (
              <CelaButton variant="secondary" onClick={handlePrint}>
                {" "}
                <Printer
                  style={{
                    width: 14,
                    height: 14,
                  }}
                />{" "}
                In hóa đơn{" "}
              </CelaButton>
            )}{" "}
            <CelaButton variant="secondary" onClick={() => router.back()}>
              {" "}
              <ArrowLeft
                style={{
                  width: 14,
                  height: 14,
                }}
              />{" "}
              Quay lại{" "}
            </CelaButton>{" "}
          </div>{" "}
        </div>{" "}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 16,
          }}
        >
          {" "}
          <CelaCard
            style={{
              padding: 0,
              overflow: "hidden",
            }}
          >
            {" "}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--cela-mist)",
              }}
            >
              {" "}
              <h3
                style={{
                  margin: 0,
                  fontFamily: "var(--cela-display)",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--cela-espresso)",
                }}
              >
                {" "}
                Chi tiết đơn hàng{" "}
              </h3>{" "}
            </div>{" "}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              {" "}
              <thead>
                {" "}
                <tr
                  style={{
                    background: "var(--cela-fog)",
                    borderBottom: "1px solid var(--cela-mist)",
                  }}
                >
                  {" "}
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--cela-cocoa)",
                    }}
                  >
                    Sản phẩm
                  </th>{" "}
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--cela-cocoa)",
                    }}
                  >
                    SKU
                  </th>{" "}
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--cela-cocoa)",
                    }}
                  >
                    SL
                  </th>{" "}
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--cela-cocoa)",
                    }}
                  >
                    Đơn giá
                  </th>{" "}
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--cela-cocoa)",
                    }}
                  >
                    Thành tiền
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {order.items.map((item) => (
                  <tr
                    key={item.productId}
                    style={{
                      borderBottom: "1px solid var(--cela-fog)",
                    }}
                  >
                    {" "}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        color: "var(--cela-espresso)",
                        fontWeight: 600,
                      }}
                    >
                      {item.productName}
                    </td>{" "}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        color: "var(--cela-stone)",
                        fontFamily: "var(--cela-mono)",
                      }}
                    >
                      {item.sku}
                    </td>{" "}
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: 13,
                        color: "var(--cela-espresso)",
                      }}
                    >
                      {item.quantity}
                    </td>{" "}
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: 13,
                        color: "var(--cela-stone)",
                        fontFamily: "var(--cela-mono)",
                      }}
                    >
                      {formatVND(item.unitPrice)}
                    </td>{" "}
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: 13,
                        color: "var(--cela-espresso)",
                        fontWeight: 600,
                        fontFamily: "var(--cela-mono)",
                      }}
                    >
                      {formatVND(item.subtotal)}
                    </td>{" "}
                  </tr>
                ))}{" "}
              </tbody>{" "}
            </table>{" "}
          </CelaCard>{" "}
          <div
            style={{
              display: "grid",
              gap: 12,
              alignContent: "start",
            }}
          >
            {" "}
            <CelaCard>
              {" "}
              <h3
                style={{
                  margin: "0 0 10px",
                  fontFamily: "var(--cela-display)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--cela-espresso)",
                }}
              >
                {" "}
                Thanh toán{" "}
              </h3>{" "}
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  {" "}
                  <span
                    style={{
                      color: "var(--cela-stone)",
                    }}
                  >
                    Tạm tính
                  </span>{" "}
                  <span
                    style={{
                      color: "var(--cela-espresso)",
                      fontFamily: "var(--cela-mono)",
                    }}
                  >
                    {formatVND(order.subtotal)}
                  </span>{" "}
                </div>{" "}
                {order.couponDiscount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    {" "}
                    <span
                      style={{
                        color: "var(--cela-stone)",
                      }}
                    >
                      Giảm coupon
                    </span>{" "}
                    <span
                      style={{
                        color: "var(--cela-success)",
                        fontFamily: "var(--cela-mono)",
                      }}
                    >
                      - {formatVND(order.couponDiscount)}
                    </span>{" "}
                  </div>
                )}{" "}
                {order.pointsDiscount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    {" "}
                    <span
                      style={{
                        color: "var(--cela-stone)",
                      }}
                    >
                      Giảm điểm
                    </span>{" "}
                    <span
                      style={{
                        color: "var(--cela-success)",
                        fontFamily: "var(--cela-mono)",
                      }}
                    >
                      - {formatVND(order.pointsDiscount)}
                    </span>{" "}
                  </div>
                )}{" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--cela-fog)",
                    paddingTop: 8,
                  }}
                >
                  {" "}
                  <span
                    style={{
                      color: "var(--cela-espresso)",
                      fontWeight: 600,
                    }}
                  >
                    Tổng cộng
                  </span>{" "}
                  <span
                    style={{
                      color: "var(--cela-rose)",
                      fontWeight: 700,
                      fontFamily: "var(--cela-mono)",
                    }}
                  >
                    {formatVND(order.total)}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </CelaCard>{" "}
            <CelaCard>
              {" "}
              <h3
                style={{
                  margin: "0 0 10px",
                  fontFamily: "var(--cela-display)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--cela-espresso)",
                }}
              >
                {" "}
                Thông tin{" "}
              </h3>{" "}
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  {" "}
                  <span
                    style={{
                      color: "var(--cela-stone)",
                    }}
                  >
                    Mã đơn
                  </span>{" "}
                  <span
                    style={{
                      color: "var(--cela-espresso)",
                      fontFamily: "var(--cela-mono)",
                    }}
                  >
                    {order.id}
                  </span>{" "}
                </div>{" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  {" "}
                  <span
                    style={{
                      color: "var(--cela-stone)",
                    }}
                  >
                    Thời gian
                  </span>{" "}
                  <span
                    style={{
                      color: "var(--cela-espresso)",
                    }}
                  >
                    {formatDate(order.createdAt)}
                  </span>{" "}
                </div>{" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  {" "}
                  <span
                    style={{
                      color: "var(--cela-stone)",
                    }}
                  >
                    Thu ngân
                  </span>{" "}
                  <span
                    style={{
                      color: "var(--cela-espresso)",
                    }}
                  >
                    {order.cashierName}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </CelaCard>{" "}
          </div>{" "}
        </div>{" "}
        {order.status === "COMPLETED" && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {" "}
            <CelaButton
              variant="danger"
              onClick={() => setShowCancelDialog(true)}
            >
              {" "}
              Yêu cầu hủy đơn{" "}
            </CelaButton>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </ERPLayout>
  );
}
