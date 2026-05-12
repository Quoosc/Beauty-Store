"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { orderService, CancelRequest } from "@/services/order.service";
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
export default function ManagerOrdersPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CancelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  async function load() {
    setIsLoading(true);
    try {
      const data = await orderService.getCancelRequests({
        status: "PENDING",
      });
      setRequests(Array.isArray(data) ? data : (data?.content ?? []));
    } catch {
      toast.error("Không thể tải danh sách yêu cầu hủy");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function handleApprove(orderId: string) {
    try {
      await orderService.approveCancel(orderId);
      toast.success("Đã phê duyệt hủy đơn");
      load();
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;
      toast.error(msg || "Phê duyệt thất bại");
    }
  }
  async function handleReject(orderId: string) {
    try {
      await orderService.rejectCancel(orderId);
      toast.success("Đã từ chối yêu cầu hủy");
      load();
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;
      toast.error(msg || "Từ chối thất bại");
    }
  }
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <CheckSquare className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
          <div
            style={{
              marginBottom: 24,
            }}
          >
            {/* Page header */}
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              BEAUTY ERP
            </p>
            <h1
              style={{
                fontFamily: "var(--cela-display)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--cela-espresso)",
                fontStyle: "italic",
                lineHeight: 1.2,
              }}
            >
              Duy?t y�u c?u{" "}
              <span
                style={{
                  color: "var(--cela-rose)",
                }}
              >
                h?y don
              </span>
            </h1>
          </div>{" "}
        </div>{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {" "}
          <div
            className="p-6"
            style={{
              borderBottom: "1px solid var(--cela-mist)",
            }}
          >
            {" "}
            <p className="text-sm text-[var(--cela-stone)]">
              {" "}
              Các đơn hàng có giá trị cao cần Branch Manager phê duyệt trước khi
              hủy.{" "}
            </p>{" "}
          </div>{" "}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              {" "}
              <svg
                className="animate-spin w-6 h-6 text-[var(--cela-rose)]"
                viewBox="0 0 24 24"
                fill="none"
              >
                {" "}
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />{" "}
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />{" "}
              </svg>{" "}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              {" "}
              <CheckSquare className="w-12 h-12 text-[var(--cela-mist)] mb-3" />{" "}
              <p className="text-[var(--cela-stone)]">
                Không có yêu cầu hủy nào đang chờ phê duyệt
              </p>{" "}
            </div>
          ) : (
            <table className="w-full">
              {" "}
              <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                {" "}
                <tr>
                  {" "}
                  <th className="text-left px-6 py-3">Mã đơn</th>{" "}
                  <th className="text-left px-4 py-3">Cashier</th>{" "}
                  <th className="text-left px-4 py-3">Thời gian</th>{" "}
                  <th className="text-right px-4 py-3">Tổng tiền</th>{" "}
                  <th className="text-left px-4 py-3">Lý do hủy</th>{" "}
                  <th className="text-center px-4 py-3">Thao tác</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-[var(--cela-fog)] transition-colors"
                    style={{
                      borderBottom: "1px solid var(--cela-fog)",
                    }}
                  >
                    {" "}
                    <td className="px-6 py-4">
                      {" "}
                      <button
                        onClick={() => router.push(`/orders/${req.orderId}`)}
                        className="flex items-center gap-1.5 text-sm font-medium text-[var(--cela-rose)] hover:text-[var(--cela-rose-deep)]"
                      >
                        {" "}
                        #{req.orderId.slice(-8).toUpperCase()}{" "}
                        <ExternalLink className="w-3.5 h-3.5" />{" "}
                      </button>{" "}
                    </td>{" "}
                    <td className="px-4 py-4 text-sm text-[var(--cela-cocoa)]">
                      {req.cashierName}
                    </td>{" "}
                    <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                      {formatDate(req.requestedAt)}
                    </td>{" "}
                    <td className="px-4 py-4 text-right text-sm font-semibold text-[var(--cela-gold)]">
                      {" "}
                      {formatVND(req.orderTotal)}{" "}
                    </td>{" "}
                    <td className="px-4 py-4 text-sm text-[var(--cela-stone)] max-w-xs">
                      {" "}
                      <p className="truncate" title={req.reason}>
                        {req.reason}
                      </p>{" "}
                    </td>{" "}
                    <td className="px-4 py-4">
                      {" "}
                      <div className="flex items-center justify-center gap-2">
                        {" "}
                        <button
                          onClick={() => handleApprove(req.orderId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(107,142,106,0.10)] border border-green-200 text-[var(--cela-success)] rounded-lg text-xs font-medium hover:bg-[rgba(107,142,106,0.15)]"
                        >
                          {" "}
                          <CheckCircle className="w-3.5 h-3.5" /> Phê duyệt{" "}
                        </button>{" "}
                        <button
                          onClick={() => handleReject(req.orderId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(183,110,121,0.08)] border border-red-200 text-[var(--cela-danger)] rounded-lg text-xs font-medium hover:bg-[rgba(183,110,121,0.15)]"
                        >
                          {" "}
                          <XCircle className="w-3.5 h-3.5" /> Từ chối{" "}
                        </button>{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>
                ))}{" "}
              </tbody>{" "}
            </table>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </ERPLayout>
  );
}
