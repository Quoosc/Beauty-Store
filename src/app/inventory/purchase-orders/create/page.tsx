"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { supplierService } from "@/services/supplier.service";
import { productService } from "@/services/product.service";
import type { Supplier, Product } from "@/types";
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
interface POItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  unitPrice: number;
}
export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<POItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    supplierService
      .getAll()
      .then((data) =>
        setSuppliers(Array.isArray(data) ? data : (data?.content ?? [])),
      )
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await productService.search({
          q: productSearch,
          status: "ACTIVE",
          size: 10,
        });
        setSearchResults(res.data.data.content);
        setShowResults(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);
  function addItem(product: Product) {
    if (items.find((i) => i.productId === product.id)) {
      toast.error("Sản phẩm đã có trong danh sách");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        orderedQty: 1,
        unitPrice: product.costPrice || 0,
      },
    ]);
    setProductSearch("");
    setShowResults(false);
  }
  function updateItem(
    productId: string,
    field: "orderedQty" | "unitPrice",
    value: number,
  ) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              [field]: value,
            }
          : i,
      ),
    );
  }
  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }
  const total = items.reduce((sum, i) => sum + i.orderedQty * i.unitPrice, 0);
  async function handleSubmit() {
    if (!supplierId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
      return;
    }
    if (items.some((i) => i.orderedQty <= 0 || i.unitPrice <= 0)) {
      toast.error("Số lượng và đơn giá phải > 0");
      return;
    }
    setIsSubmitting(true);
    try {
      const po = await purchaseOrderService.create({
        supplierId,
        items: items.map((i) => ({
          productId: i.productId,
          orderedQty: i.orderedQty,
          unitPrice: i.unitPrice,
        })),
      });

      try {
        await purchaseOrderService.submit(po.id);
        toast.success("Tạo và gửi Purchase Order thành công!");
      } catch {
        toast.warning("Tạo PO thành công nhưng gửi duyệt thất bại. Vui lòng gửi duyệt thủ công từ danh sách.");
      }

      router.push("/inventory/purchase-orders");
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
      toast.error(msg || "Tạo PO thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <ERPLayout>
      {" "}
      <div className="max-w-4xl space-y-6">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-[var(--cela-fog)]"
          >
            {" "}
            <ArrowLeft className="w-5 h-5 text-[var(--cela-stone)]" />{" "}
          </button>{" "}
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
              T?o don{" "}
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
        {/* Supplier */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl p-6">
          {" "}
          <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">
            Nhà cung cấp
          </h3>{" "}
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full max-w-sm h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
            style={{
              border: "1px solid var(--cela-mist)",
            }}
          >
            {" "}
            <option value="">-- Chọn nhà cung cấp --</option>{" "}
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}{" "}
          </select>{" "}
        </div>{" "}
        {/* Product search & items */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl p-6">
          {" "}
          <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">
            Thêm sản phẩm
          </h3>{" "}
          <div className="relative mb-4">
            {" "}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" />{" "}
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Tìm sản phẩm theo tên, SKU..."
              className="h-11 w-full pl-9 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
            {isSearching && (
              <svg
                className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]"
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
            )}{" "}
            {showResults && searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-[var(--cela-paper)] rounded-xl z-50 max-h-48 overflow-y-auto"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              >
                {" "}
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(183,110,121,0.08)] text-left last:border-0"
                    style={{
                      borderBottom: "1px solid var(--cela-mist)",
                    }}
                  >
                    {" "}
                    <div className="flex-1">
                      {" "}
                      <p className="text-sm font-medium text-[var(--cela-espresso)]">
                        {p.name}
                      </p>{" "}
                      <p className="text-xs text-[var(--cela-stone)]">
                        {p.sku}
                      </p>{" "}
                    </div>{" "}
                    <span className="text-xs bg-[rgba(183,110,121,0.15)] text-[var(--cela-rose-deep)] px-2 py-0.5 rounded-full">
                      Thêm
                    </span>{" "}
                  </button>
                ))}{" "}
              </div>
            )}{" "}
          </div>{" "}
          {items.length > 0 ? (
            <>
              {" "}
              <table className="w-full mb-4">
                {" "}
                <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                  {" "}
                  <tr>
                    {" "}
                    <th className="text-left px-4 py-2">Sản phẩm</th>{" "}
                    <th className="text-center px-4 py-2">Số lượng</th>{" "}
                    <th className="text-right px-4 py-2">Đơn giá</th>{" "}
                    <th className="text-right px-4 py-2">Thành tiền</th>{" "}
                    <th className="px-2 py-2" />{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody>
                  {" "}
                  {items.map((item) => (
                    <tr
                      key={item.productId}
                      style={{
                        borderBottom: "1px solid var(--cela-fog)",
                      }}
                    >
                      {" "}
                      <td className="px-4 py-3">
                        {" "}
                        <p className="text-sm font-medium text-[var(--cela-espresso)]">
                          {item.productName}
                        </p>{" "}
                        <p className="text-xs text-[var(--cela-stone)]">
                          {item.sku}
                        </p>{" "}
                      </td>{" "}
                      <td className="px-4 py-3">
                        {" "}
                        <input
                          type="number"
                          value={item.orderedQty}
                          onChange={(e) =>
                            updateItem(
                              item.productId,
                              "orderedQty",
                              Number(e.target.value),
                            )
                          }
                          min="1"
                          className="w-20 h-9 rounded-lg px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] mx-auto block"
                          style={{
                            border: "1px solid var(--cela-mist)",
                          }}
                        />{" "}
                      </td>{" "}
                      <td className="px-4 py-3">
                        {" "}
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              item.productId,
                              "unitPrice",
                              Number(e.target.value),
                            )
                          }
                          min="0"
                          className="w-32 h-9 rounded-lg px-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] ml-auto block"
                          style={{
                            border: "1px solid var(--cela-mist)",
                          }}
                        />{" "}
                      </td>{" "}
                      <td className="px-4 py-3 text-right text-sm font-medium text-[var(--cela-espresso)]">
                        {formatVND(item.orderedQty * item.unitPrice)}
                      </td>{" "}
                      <td className="px-2 py-3">
                        {" "}
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-1 text-[var(--cela-danger)] hover:text-[var(--cela-danger)]"
                        >
                          {" "}
                          <Trash2 className="w-4 h-4" />{" "}
                        </button>{" "}
                      </td>{" "}
                    </tr>
                  ))}{" "}
                </tbody>{" "}
              </table>{" "}
              <div
                className="flex items-center justify-between pt-4"
                style={{
                  borderTop: "1px solid var(--cela-mist)",
                }}
              >
                {" "}
                <span className="font-semibold text-[var(--cela-espresso)]">
                  Tổng cộng
                </span>{" "}
                <span className="text-xl font-bold text-[var(--cela-rose)]">
                  {formatVND(total)}
                </span>{" "}
              </div>{" "}
            </>
          ) : (
            <p className="text-[var(--cela-stone)] text-sm text-center py-8">
              Chưa có sản phẩm nào được thêm
            </p>
          )}{" "}
        </div>{" "}
        <div className="flex gap-3">
          {" "}
          <button
            onClick={() => router.back()}
            className="flex-1 h-11 rounded-xl text-sm font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
            style={{
              border: "1px solid var(--cela-mist)",
            }}
          >
            Hủy
          </button>{" "}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !supplierId || items.length === 0}
            className="flex-1 h-11 bg-[var(--cela-espresso)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {" "}
            {isSubmitting ? "Đang tạo..." : "Tạo Purchase Order"}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </ERPLayout>
  );
}
