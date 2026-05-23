"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, CheckSquare, ExternalLink, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { CancelRequest, orderService } from "@/services/order.service";
import { useAuthStore } from "@/stores/auth.store";

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
  const user = useAuthStore((s) => s.user);
  const branchId = user?.branchId;

  const [requests, setRequests] = useState<CancelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canLoad = useMemo(() => Boolean(branchId), [branchId]);

  async function load() {
    if (!branchId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await orderService.getPendingCancels(branchId, {
        page: 1,
        size: 100,
      });
      setRequests(data);
    } catch {
      toast.error("Không thể tải danh sách yêu cầu hủy đơn");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [branchId]);

  async function handleApprove(orderId: string) {
    try {
      await orderService.approveCancel(orderId);
      toast.success("Đã phê duyệt yêu cầu hủy đơn");
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Phê duyệt thất bại";
      toast.error(msg);
    }
  }

  async function handleReject(orderId: string) {
    try {
      await orderService.rejectCancel(orderId);
      toast.success("Đã từ chối yêu cầu hủy đơn");
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Từ chối thất bại";
      toast.error(msg);
    }
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-6 h-6 text-[var(--cela-rose)]" />
          <div style={{ marginBottom: 24 }}>
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
              Duyệt yêu cầu <span style={{ color: "var(--cela-rose)" }}>hủy đơn</span>
            </h1>
          </div>
        </div>

        {!canLoad ? (
          <div className="bg-[var(--cela-paper)] rounded-xl p-6 text-sm text-[var(--cela-stone)]">
            Không xác định được branchId của tài khoản.
          </div>
        ) : (
          <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
            <div className="p-6" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
              <p className="text-sm text-[var(--cela-stone)]">
                Các đơn có giá trị cao cần Branch Manager phê duyệt trước khi hủy.
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <CheckSquare className="w-12 h-12 text-[var(--cela-mist)] mb-3" />
                <p className="text-[var(--cela-stone)]">Không có yêu cầu hủy nào đang chờ phê duyệt</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                  <tr>
                    <th className="text-left px-6 py-3">Mã đơn</th>
                    <th className="text-left px-4 py-3">Cashier</th>
                    <th className="text-left px-4 py-3">Thời gian</th>
                    <th className="text-right px-4 py-3">Tổng tiền</th>
                    <th className="text-left px-4 py-3">Lý do</th>
                    <th className="text-center px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[var(--cela-fog)] transition-colors"
                      style={{ borderBottom: "1px solid var(--cela-fog)" }}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/orders/${req.orderId}`)}
                          className="flex items-center gap-1.5 text-sm font-medium text-[var(--cela-rose)] hover:text-[var(--cela-rose-deep)]"
                        >
                          #{req.orderId.slice(-8).toUpperCase()}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--cela-cocoa)]">{req.cashierId}</td>
                      <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{formatDate(req.requestedAt)}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-[var(--cela-gold)]">
                        {formatVND(req.orderTotal)}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--cela-stone)] max-w-xs">
                        <p className="truncate" title={req.reason}>{req.reason}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(req.orderId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(107,142,106,0.10)] border border-green-200 text-[var(--cela-success)] rounded-lg text-xs font-medium hover:bg-[rgba(107,142,106,0.15)]"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(req.orderId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(183,110,121,0.08)] border border-red-200 text-[var(--cela-danger)] rounded-lg text-xs font-medium hover:bg-[rgba(183,110,121,0.15)]"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
