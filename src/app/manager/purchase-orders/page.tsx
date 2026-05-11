"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, CheckCircle, XCircle, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import type { PurchaseOrder, POStatus } from "@/types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

const PO_STATUS: Record<POStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Chờ xác nhận",
    className: "bg-yellow-100 text-yellow-700",
  },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-blue-100 text-blue-700" },
  FULLY_RECEIVED: {
    label: "Đã nhận đủ",
    className: "bg-green-100 text-green-700",
  },
  PARTIALLY_RECEIVED: {
    label: "Nhận thiếu",
    className: "bg-orange-100 text-orange-700",
  },
  CANCELLED: { label: "Đã hủy", className: "bg-gray-100 text-gray-500" },
};

const STATUS_TABS: { key: POStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "PARTIALLY_RECEIVED", label: "Nhận thiếu" },
  { key: "FULLY_RECEIVED", label: "Đã nhận đủ" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export default function ManagerPurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<POStatus | "ALL">("PENDING");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  async function handleConfirm(id: string) {
    try {
      await purchaseOrderService.confirm(id);
      toast.success("Đã xác nhận Purchase Order");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Xác nhận thất bại");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Hủy Purchase Order này?")) return;
    try {
      await purchaseOrderService.cancel(id);
      toast.success("Đã hủy PO");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Hủy thất bại");
    }
  }

  const displayedOrders = orders.filter(
    (po) =>
      supplierSearch === "" ||
      po.supplierName.toLowerCase().includes(supplierSearch.toLowerCase()),
  );

  const pendingCount = displayedOrders.filter(
    (o) => o.status === "PENDING",
  ).length;

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Purchase Orders
          </h1>
          {statusFilter === "PENDING" && pendingCount > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-sm font-bold rounded-full px-2.5 py-0.5">
              {pendingCount} chờ duyệt
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2 overflow-x-auto flex-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setStatusFilter(t.key);
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === t.key
                      ? "bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Tìm nhà cung cấp..."
                className="h-9 pl-9 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF69B4]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
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
          ) : displayedOrders.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">Không có Purchase Order nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Mã PO</th>
                  <th className="text-left px-4 py-3">Nhà cung cấp</th>
                  <th className="text-left px-4 py-3">Ngày tạo</th>
                  <th className="text-center px-4 py-3">Số mặt hàng</th>
                  <th className="text-right px-4 py-3">Tổng tiền</th>
                  <th className="text-center px-4 py-3">Trạng thái</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedOrders.map((po) => {
                  const status = PO_STATUS[po.status];
                  return (
                    <Fragment key={po.id}>
                      <tr
                        onClick={() =>
                          setExpandedId(expandedId === po.id ? null : po.id)
                        }
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">
                          {po.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {po.supplierName}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatDate(po.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-700">
                          {po.items?.length ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                          {formatVND(po.totalAmount)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/inventory/purchase-orders?highlight=${po.id}`,
                                );
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100"
                            >
                              <Eye className="w-3.5 h-3.5" /> Chi tiết
                            </button>
                            {po.status === "PENDING" && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirm(po.id);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Xác
                                  nhận
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancel(po.id);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Hủy
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedId === po.id &&
                        po.items &&
                        po.items.length > 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-0 bg-gray-50">
                              <div className="py-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                  Chi tiết sản phẩm
                                </p>
                                <div className="space-y-1">
                                  {po.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-sm text-gray-700"
                                    >
                                      <span>
                                        {item.productName ?? item.productId}
                                      </span>
                                      <span className="text-gray-500">
                                        SL: {item.orderedQty} ×{" "}
                                        {item.unitPrice?.toLocaleString(
                                          "vi-VN",
                                        )}
                                        đ
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Trang {page + 1} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
