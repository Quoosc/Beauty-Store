"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { orderService } from "@/services/order.service";
import type { Order, OrderStatus } from "@/types";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Hoàn thành", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
  RETURNED: { label: "Trả hàng", className: "bg-orange-100 text-orange-700" },
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

  useEffect(() => { loadOrder(); }, [orderId]);

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
      await orderService.cancel(orderId, { reason: cancelReason });
      toast.success("Yêu cầu hủy đơn đã được gửi");
      setShowCancelDialog(false);
      await loadOrder();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Hủy đơn thất bại");
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <ERPLayout>
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </ERPLayout>
    );
  }

  if (!order) return null;

  const statusInfo = STATUS_MAP[order.status];

  return (
    <ERPLayout>
      {/* Cancel dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Yêu cầu hủy đơn</h2>
            </div>

            {order.total > 500000 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Đơn &gt; 500.000đ cần Branch Manager phê duyệt.
                </p>
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lý do hủy <span className="text-red-500">*</span>
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="">-- Chọn lý do --</option>
              {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 h-10 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Quay lại
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelReason || isCancelling}
                className="flex-1 h-10 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết đơn #{order.id.slice(-8).toUpperCase()}
            </h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
          {order.status === "COMPLETED" && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              In hóa đơn
            </button>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Thông tin đơn</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Mã đơn</dt>
                <dd className="font-medium text-gray-900">{order.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Thời gian</dt>
                <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Thu ngân</dt>
                <dd className="text-gray-900">{order.cashierName}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Thanh toán</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Tạm tính</dt>
                <dd className="text-gray-900">{formatVND(order.subtotal)}</dd>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>Giảm coupon</dt>
                  <dd>- {formatVND(order.couponDiscount)}</dd>
                </div>
              )}
              {order.pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>Giảm điểm</dt>
                  <dd>- {formatVND(order.pointsDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold">
                <dt className="text-gray-900">Tổng cộng</dt>
                <dd className="text-pink-600 text-base">{formatVND(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Danh sách sản phẩm</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-6 py-3">Sản phẩm</th>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-center px-4 py-3">SL</th>
                <th className="text-right px-4 py-3">Đơn giá</th>
                <th className="text-right px-6 py-3">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.productName}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{item.sku}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-4 text-right text-sm text-gray-600">{formatVND(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">{formatVND(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cancel button (only for COMPLETED orders) */}
        {order.status === "COMPLETED" && (
          <div>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-6 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
            >
              Yêu cầu hủy đơn
            </button>
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
