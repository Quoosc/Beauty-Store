"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  CheckCircle,
  TrendingUp,
  Search,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { orderService } from "@/services/order.service";
import type { Order, OrderStatus } from "@/types";
const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
const STATUS_LABELS: Record<
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
    bg: "rgba(201,168,122,0.20)",
    color: "var(--cela-gold)",
  },
};
export default function CashierOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  async function loadOrders() {
    setIsLoading(true);
    try {
      const page$ = await orderService.getMy({ page, size: 10 });
      setOrders(page$.content ?? []);
      setTotalPages(page$.totalPages ?? 1);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    loadOrders();
  }, [page]);
  async function handlePrintReceipt(orderId: string) {
    try {
      const res = await orderService.getReceipt(orderId);
      window.open(res.data.data, "_blank");
    } catch {
      toast.error("Không thể tải hóa đơn");
    }
  }
  const filtered = orders.filter((o) => {
    const matchSearch = search
      ? o.id.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchStatus =
      statusFilter === "ALL" ? true : o.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalRevenue = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.total, 0);
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
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
            Đon hàng{" "}
            <span
              style={{
                color: "var(--cela-rose)",
              }}
            >
              của tôi
            </span>
          </h1>
        </div>{" "}
        {/* Stats */}{" "}
        <div className="grid grid-cols-3 gap-4">
          {" "}
          <div className="bg-[var(--cela-paper)] rounded-xl p-5 flex items-center gap-4">
            {" "}
            <div className="w-10 h-10 bg-[rgba(120,140,180,0.18)] rounded-lg flex items-center justify-center">
              {" "}
              <ShoppingBag className="w-5 h-5 text-[var(--cela-cocoa)]" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-[28px] font-bold text-[var(--cela-espresso)]">
                {orders.length}
              </p>{" "}
              <p className="text-sm text-[var(--cela-stone)]">Tổng đơn</p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="bg-[var(--cela-paper)] rounded-xl p-5 flex items-center gap-4">
            {" "}
            <div className="w-10 h-10 bg-[rgba(107,142,106,0.15)] rounded-lg flex items-center justify-center">
              {" "}
              <CheckCircle className="w-5 h-5 text-[var(--cela-success)]" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-[28px] font-bold text-[var(--cela-espresso)]">
                {" "}
                {orders.filter((o) => o.status === "COMPLETED").length}{" "}
              </p>{" "}
              <p className="text-sm text-[var(--cela-stone)]">
                Hoàn thành
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="bg-[var(--cela-paper)] rounded-xl p-5 flex items-center gap-4">
            {" "}
            <div className="w-10 h-10 bg-[rgba(183,110,121,0.15)] rounded-lg flex items-center justify-center">
              {" "}
              <TrendingUp className="w-5 h-5 text-[var(--cela-rose)]" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-[28px] font-bold text-[var(--cela-espresso)]">
                {formatVND(totalRevenue)}
              </p>{" "}
              <p className="text-sm text-[var(--cela-stone)]">
                Tổng doanh thu
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Filter bar */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl p-4 flex gap-3">
          {" "}
          <div className="relative flex-1 max-w-xs">
            {" "}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" />{" "}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã đơn..."
              className="h-10 w-full pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OrderStatus | "ALL")
            }
            className="h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
            style={{
              border: "1px solid var(--cela-mist)",
            }}
          >
            {" "}
            <option value="ALL">Tất cả</option>{" "}
            <option value="COMPLETED">Hoàn thành</option>{" "}
            <option value="CANCELLED">Đã hủy</option>{" "}
            <option value="RETURNED">Trả hàng</option>{" "}
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {" "}
              <ShoppingBag className="w-12 h-12 text-[var(--cela-mist)] mb-3" />{" "}
              <p className="text-[var(--cela-stone)]">
                Chưa có đơn hàng nào trong ca này
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
                  <th className="text-left px-6 py-3">Mã đơn</th>{" "}
                  <th className="text-left px-4 py-3">Thời gian</th>{" "}
                  <th className="text-center px-4 py-3">Số SP</th>{" "}
                  <th className="text-right px-4 py-3">Tổng tiền</th>{" "}
                  <th className="text-center px-4 py-3">Trạng thái</th>{" "}
                  <th className="text-center px-4 py-3">Thao tác</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {filtered.map((order) => {
                  const statusInfo = STATUS_LABELS[order.status];
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[var(--cela-fog)] transition-colors"
                      style={{
                        borderBottom: "1px solid var(--cela-fog)",
                      }}
                    >
                      {" "}
                      <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">
                        {" "}
                        #{order.id.slice(-8).toUpperCase()}{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                        {" "}
                        {formatDate(order.createdAt)}{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-center text-sm text-[var(--cela-stone)]">
                        {" "}
                        {order.items.length}{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-right text-sm font-semibold text-[var(--cela-espresso)]">
                        {" "}
                        {formatVND(order.total)}{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-center">
                        {" "}
                        <span
                          style={{
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {" "}
                          {statusInfo.label}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-4 py-4">
                        {" "}
                        <div className="flex items-center justify-center gap-2">
                          {" "}
                          <button
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)] transition-colors"
                            style={{
                              border: "1px solid var(--cela-mist)",
                            }}
                          >
                            {" "}
                            Chi tiết{" "}
                          </button>{" "}
                          {order.status === "COMPLETED" && (
                            <button
                              onClick={() => handlePrintReceipt(order.id)}
                              className="p-1.5 rounded-lg text-[var(--cela-stone)] hover:bg-[var(--cela-fog)] transition-colors"
                              title="In hóa đơn"
                              style={{
                                border: "1px solid var(--cela-mist)",
                              }}
                            >
                              {" "}
                              <Printer className="w-3.5 h-3.5" />{" "}
                            </button>
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
        {/* Pagination */}{" "}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            {" "}
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--cela-fog)] transition-colors"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            >
              {" "}
              Trước{" "}
            </button>{" "}
            <span className="text-sm text-[var(--cela-stone)]">
              {" "}
              Trang {page + 1}/{totalPages}{" "}
            </span>{" "}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--cela-fog)] transition-colors"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            >
              {" "}
              Sau{" "}
            </button>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </ERPLayout>
  );
}
