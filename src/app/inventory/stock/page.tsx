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
      const data = await inventoryService.getStock({
        page,
        size: 20,
        search: search || undefined,
      });
      setStock(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch {
      toast.error("Không thể tải tồn kho");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, page]);
  function getStockStatus(item: InventoryStock) {
    if (item.quantity === 0)
      return {
        label: "Hết hàng",
        bg: "rgba(183,110,121,0.15)",
        color: "var(--cela-danger)",
      };
    if (item.isLowStock)
      return {
        label: "Tồn kho thấp",
        bg: "rgba(183,110,121,0.15)",
        color: "var(--cela-danger)",
      };
    return {
      label: "Bình thường",
      bg: "rgba(107,142,106,0.15)",
      color: "var(--cela-success)",
    };
  }
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <Warehouse className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
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
              T?n{" "}
              <span
                style={{
                  color: "var(--cela-rose)",
                }}
              >
                kho
              </span>
            </h1>
          </div>{" "}
        </div>{" "}
        {/* Search */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl p-4">
          {" "}
          <div className="relative max-w-sm">
            {" "}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" />{" "}
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Tìm sản phẩm..."
              className="h-10 w-full pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
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
          ) : stock.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              {" "}
              <Warehouse className="w-12 h-12 text-[var(--cela-mist)] mb-3" />{" "}
              <p className="text-[var(--cela-stone)]">
                Không có dữ liệu tồn kho
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
                  <th className="text-left px-6 py-3">Sản phẩm</th>{" "}
                  <th className="text-left px-4 py-3">SKU</th>{" "}
                  <th className="text-center px-4 py-3">Tồn kho</th>{" "}
                  <th className="text-center px-4 py-3">Ngưỡng tối thiểu</th>{" "}
                  <th className="text-center px-4 py-3">Trạng thái</th>{" "}
                  <th className="text-center px-4 py-3">Thao tác</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {stock.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr
                      key={item.productId}
                      className={`hover:bg-[var(--cela-fog)] transition-colors${item.isLowStock ? "bg-[rgba(183,110,121,0.08)]/30" : ""}`}
                      style={{
                        borderBottom: "1px solid var(--cela-fog)",
                      }}
                    >
                      {" "}
                      <td className="px-6 py-4">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          {item.isLowStock && (
                            <AlertTriangle className="w-4 h-4 text-[var(--cela-danger)] flex-shrink-0" />
                          )}{" "}
                          <span className="text-sm font-medium text-[var(--cela-espresso)]">
                            {item.productName}
                          </span>{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                        {item.sku}
                      </td>{" "}
                      <td className="px-4 py-4 text-center">
                        {" "}
                        <span
                          className={`text-sm font-bold${item.quantity === 0 ? "text-[var(--cela-stone)]" : item.isLowStock ? "text-[var(--cela-danger)]" : "text-[var(--cela-espresso)]"}`}
                        >
                          {" "}
                          {item.quantity}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-center text-sm text-[var(--cela-stone)]">
                        {item.minThreshold}
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
                      <td className="px-4 py-4 text-center">
                        {" "}
                        <button
                          onClick={() =>
                            router.push(
                              `/inventory/adjustments?productId=${item.productId}`,
                            )
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                          style={{
                            border: "1px solid var(--cela-mist)",
                          }}
                        >
                          {" "}
                          Điều chỉnh{" "}
                        </button>{" "}
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
