"use client";

import { useState, useEffect } from "react";
import { Search, Warehouse, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { inventoryService } from "@/services/inventory.service";
import type { InventoryStock } from "@/types";

export default function InventoryStockPage() {
  const router = useRouter();
  const [stock, setStock] = useState<InventoryStock[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      const data = await inventoryService.getStock({ page, size: 20, search: search || undefined });
      setStock(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch {
      toast.error("Không thể tải tồn kho");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search, page]);

  function getStockStatus(item: InventoryStock) {
    if (item.quantity === 0) return { label: "Hết hàng", className: "bg-gray-100 text-gray-500" };
    if (item.isLowStock) return { label: "Tồn kho thấp", className: "bg-red-100 text-red-700" };
    return { label: "Bình thường", className: "bg-green-100 text-green-700" };
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Warehouse className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">Tồn kho</h1>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Tìm sản phẩm..."
              className="h-10 w-full pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : stock.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Warehouse className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">Không có dữ liệu tồn kho</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Sản phẩm</th>
                  <th className="text-left px-4 py-3">SKU</th>
                  <th className="text-center px-4 py-3">Tồn kho</th>
                  <th className="text-center px-4 py-3">Ngưỡng tối thiểu</th>
                  <th className="text-center px-4 py-3">Trạng thái</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stock.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.productId} className={`hover:bg-gray-50 transition-colors ${item.isLowStock ? "bg-red-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.isLowStock && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                          <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{item.sku}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-bold ${item.quantity === 0 ? "text-gray-400" : item.isLowStock ? "text-red-600" : "text-gray-900"}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-600">{item.minThreshold}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => router.push(`/inventory/adjustments?productId=${item.productId}`)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Điều chỉnh
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Trang {page + 1} / {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Sau</button>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
