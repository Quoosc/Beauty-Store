"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Plus } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import type { PurchaseOrder, POStatus } from "@/types";
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");
const PO_STATUS: Record<
  POStatus,
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
  CONFIRMED: {
    label: "Đã xác nhận",
    bg: "rgba(60,46,42,0.12)",
    color: "var(--cela-espresso)",
  },
  FULLY_RECEIVED: {
    label: "Đã nhận đủ",
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
  },
  PARTIALLY_RECEIVED: {
    label: "Nhận thiếu",
    bg: "rgba(201,168,122,0.20)",
    color: "var(--cela-gold)",
  },
  CANCELLED: {
    label: "Đã hủy",
    bg: "rgba(183,110,121,0.15)",
    color: "var(--cela-danger)",
  },
};
export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<POStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  async function load() {
    setIsLoading(true);
    try {
      const data = await purchaseOrderService.getAll({
        page,
        size: 20,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setOrders(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch {
      toast.error("Không thể tải danh sách PO");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [statusFilter, page]);
  async function handleSubmit(id: string) {
    try {
      await purchaseOrderService.submit(id);
      toast.success("Đã gửi duyệt PO");
      load();
    } catch {
      toast.error("Gửi duyệt thất bại");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Hủy Purchase Order này?")) return;
    try {
      await purchaseOrderService.cancel(id);
      toast.success("Đã hủy PO");
      load();
    } catch {
      toast.error("Hủy thất bại");
    }
  }
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <ShoppingBag className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
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
                �on{" "}
                <span
                  style={{
                    color: "var(--cela-rose)",
                  }}
                >
                  d?t h�ng
                </span>
              </h1>
            </div>{" "}
          </div>{" "}
          <button
            onClick={() => router.push("/inventory/purchase-orders/create")}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            {" "}
            <Plus className="w-4 h-4" /> Tạo PO{" "}
          </button>{" "}
        </div>{" "}
        {/* Filter */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl p-4">
          {" "}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as POStatus | "ALL");
              setPage(0);
            }}
            className="h-10 rounded-lg px-3 text-sm focus:outline-none"
            style={{
              border: "1px solid var(--cela-mist)",
            }}
          >
            {" "}
            <option value="ALL">Tất cả trạng thái</option>{" "}
            {Object.entries(PO_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}{" "}
          </select>{" "}
        </div>{" "}
        {/* Table */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {" "}
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
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              {" "}
              <ShoppingBag className="w-12 h-12 text-[var(--cela-mist)] mb-3" />{" "}
              <p className="text-[var(--cela-stone)]">
                Không có Purchase Order nào
              </p>{" "}
            </div>
          ) : (
            <table className="w-full">
              {" "}
              <thead
                className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase"
                style={{
                  borderBottom: "1px solid var(--cela-mist)",
                }}
              >
                {" "}
                <tr>
                  {" "}
                  <th className="text-left px-6 py-3">Mã PO</th>{" "}
                  <th className="text-left px-4 py-3">Nhà cung cấp</th>{" "}
                  <th className="text-left px-4 py-3">Ngày tạo</th>{" "}
                  <th className="text-right px-4 py-3">Tổng tiền</th>{" "}
                  <th className="text-center px-4 py-3">Trạng thái</th>{" "}
                  <th className="text-center px-4 py-3">Thao tác</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {orders.map((po) => {
                  const status = PO_STATUS[po.status];
                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-[var(--cela-fog)] transition-colors"
                      style={{
                        borderBottom: "1px solid var(--cela-fog)",
                      }}
                    >
                      {" "}
                      <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">
                        {po.id.slice(-8).toUpperCase()}
                      </td>{" "}
                      <td className="px-4 py-4 text-sm text-[var(--cela-cocoa)]">
                        {po.supplierName}
                      </td>{" "}
                      <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                        {formatDate(po.createdAt)}
                      </td>{" "}
                      <td className="px-4 py-4 text-right text-sm font-semibold text-[var(--cela-espresso)]">
                        {formatVND(po.totalAmount)}
                      </td>{" "}
                      <td className="px-4 py-4 text-center">
                        {" "}
                        <span
                          style={{
                            background: status.bg,
                            color: status.color,
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {" "}
                          {status.label}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-4 py-4">
                        {" "}
                        <div className="flex items-center justify-center gap-2">
                          {" "}
                          {po.status === "CONFIRMED" && (
                            <button
                              onClick={() =>
                                router.push(`/inventory/receive/${po.id}`)
                              }
                              className="px-3 py-1.5 bg-[rgba(120,140,180,0.12)] border border-blue-200 text-[var(--cela-cocoa)] rounded-lg text-xs font-medium hover:bg-[rgba(120,140,180,0.18)]"
                            >
                              {" "}
                              Nhận hàng{" "}
                            </button>
                          )}{" "}
                          {po.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleSubmit(po.id)}
                                className="px-3 py-1.5 bg-[rgba(107,142,106,0.12)] border border-[rgba(107,142,106,0.3)] text-(--cela-success) rounded-lg text-xs font-medium hover:bg-[rgba(107,142,106,0.2)]"
                              >
                                Gửi duyệt
                              </button>
                              <button
                                onClick={() => handleCancel(po.id)}
                                className="px-3 py-1.5 text-xs font-medium text-(--cela-danger) hover:bg-[rgba(183,110,121,0.08)] rounded-lg"
                              >
                                Hủy PO
                              </button>
                            </>
                          )}{" "}
                        </div>{" "}
                      </td>{" "}
                    </tr>
                  );
                })}{" "}
              </tbody>{" "}
            </table>
          )}{" "}
        </div>{" "}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            {" "}
            <p className="text-sm text-[var(--cela-stone)]">
              Trang {page + 1} / {totalPages}
            </p>{" "}
            <div className="flex gap-2">
              {" "}
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--cela-fog)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              >
                Trước
              </button>{" "}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--cela-fog)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              >
                Sau
              </button>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </ERPLayout>
  );
}
