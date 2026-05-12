"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ClipboardEdit,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { inventoryService } from "@/services/inventory.service";
import { productService } from "@/services/product.service";
import { useAuthStore } from "@/stores/auth.store";
import type { Product, InventoryStock } from "@/types";
const ADJUSTMENT_TYPES = [
  {
    value: "DAMAGED",
    label: "Hàng hỏng",
  },
  {
    value: "LOST",
    label: "Hàng thất thoát",
  },
  {
    value: "EXPIRED",
    label: "Hàng hết hạn",
  },
] as const;
type AdjustmentType = "DAMAGED" | "LOST" | "EXPIRED";
interface PendingAdjustment {
  id: string;
  productName: string;
  quantity: number;
  currentStock: number;
  type: string;
  description: string;
  createdByName: string;
  createdAt: string;
}
export default function InventoryAdjustmentsPage() {
  const user = useAuthStore((s) => s.user);
  const showApprovalSection =
    user?.role === "BRANCH_MANAGER" || user?.role === "ADMIN";

  // Create adjustment state
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentStock, setCurrentStock] = useState<InventoryStock | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [adjType, setAdjType] = useState<AdjustmentType>("DAMAGED");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pending approvals state
  const [pending, setPending] = useState<PendingAdjustment[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const qtyNum = Number(quantity) || 0;
  const stockQty = currentStock?.quantity ?? 0;
  const adjustmentPercent = stockQty > 0 ? (qtyNum / stockQty) * 100 : 0;
  const needsApproval = adjustmentPercent > 10;
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
  useEffect(() => {
    if (showApprovalSection) loadPending();
  }, [showApprovalSection]);
  async function loadPending() {
    setIsLoadingPending(true);
    try {
      const data = await inventoryService.getPendingAdjustments();
      setPending(Array.isArray(data) ? data : (data?.content ?? []));
    } catch {
      /* graceful */
    } finally {
      setIsLoadingPending(false);
    }
  }
  async function selectProduct(product: Product) {
    setSelectedProduct(product);
    setProductSearch("");
    setShowResults(false);
    try {
      const stock = await inventoryService.getStockByProduct(product.id);
      setCurrentStock(stock);
    } catch {
      setCurrentStock(null);
    }
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }
    if (qtyNum <= 0) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }
    if (!description.trim()) {
      toast.error("Mô tả là bắt buộc");
      return;
    }
    setIsSubmitting(true);
    try {
      await inventoryService.createAdjustment({
        productId: selectedProduct.id,
        quantity: qtyNum,
        type: adjType,
        description: description.trim(),
      });
      if (needsApproval) {
        toast.success(
          "Đã gửi yêu cầu điều chỉnh, đang chờ Branch Manager phê duyệt",
        );
      } else {
        toast.success("Điều chỉnh kho thành công!");
      }
      setSelectedProduct(null);
      setCurrentStock(null);
      setQuantity("");
      setDescription("");
      if (showApprovalSection) loadPending();
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
      toast.error(msg || "Điều chỉnh thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }
  async function handleApprove(id: string) {
    try {
      await inventoryService.approveAdjustment(id);
      toast.success("Đã phê duyệt điều chỉnh");
      loadPending();
    } catch {
      toast.error("Phê duyệt thất bại");
    }
  }
  async function handleReject(id: string) {
    try {
      await inventoryService.rejectAdjustment(id);
      toast.success("Đã từ chối yêu cầu");
      loadPending();
    } catch {
      toast.error("Từ chối thất bại");
    }
  }
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <ClipboardEdit className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
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
              �i?u ch?nh{" "}
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
        {/* Create adjustment */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl p-6">
          {" "}
          <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">
            Ghi nhận hàng hỏng / thất thoát
          </h3>{" "}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {" "}
            {/* Product search */}{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                Sản phẩm
              </label>{" "}
              {selectedProduct ? (
                <div
                  className="flex items-center justify-between p-3 rounded-lg bg-[rgba(183,110,121,0.08)]"
                  style={{
                    border: "1px solid var(--cela-mist)",
                  }}
                >
                  {" "}
                  <div>
                    {" "}
                    <p className="text-sm font-medium text-[var(--cela-espresso)]">
                      {selectedProduct.name}
                    </p>{" "}
                    <p className="text-xs text-[var(--cela-stone)]">
                      {" "}
                      {selectedProduct.sku}{" "}
                      {currentStock &&
                        ` | Tồn kho hiện tại: ${currentStock.quantity}`}{" "}
                    </p>{" "}
                  </div>{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setCurrentStock(null);
                    }}
                    className="text-xs text-[var(--cela-stone)] hover:text-[var(--cela-danger)]"
                  >
                    Đổi
                  </button>{" "}
                </div>
              ) : (
                <div className="relative">
                  {" "}
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" />{" "}
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm sản phẩm..."
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
                          type="button"
                          onClick={() => selectProduct(p)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(183,110,121,0.08)] text-left last:border-0"
                          style={{
                            borderBottom: "1px solid var(--cela-mist)",
                          }}
                        >
                          {" "}
                          <p className="text-sm text-[var(--cela-espresso)]">
                            {p.name}
                          </p>{" "}
                          <p className="text-xs text-[var(--cela-stone)] ml-2">
                            {p.sku}
                          </p>{" "}
                        </button>
                      ))}{" "}
                    </div>
                  )}{" "}
                </div>
              )}{" "}
            </div>{" "}
            {/* Quantity */}{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                Số lượng
              </label>{" "}
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                placeholder="0"
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              />{" "}
              {currentStock && quantity && (
                <p className="text-xs text-[var(--cela-stone)] mt-1">
                  {" "}
                  Tỷ lệ: {qtyNum}/{stockQty} = {adjustmentPercent.toFixed(1)}
                  %{" "}
                </p>
              )}{" "}
            </div>{" "}
            {needsApproval && (
              <div className="flex items-start gap-2 bg-[rgba(201,168,122,0.14)] border border-amber-200 rounded-lg p-3">
                {" "}
                <AlertTriangle className="w-4 h-4 text-[var(--cela-gold)] flex-shrink-0 mt-0.5" />{" "}
                <p className="text-sm text-[var(--cela-gold)]">
                  Yêu cầu này sẽ cần Branch Manager phê duyệt ({">"} 10% tồn
                  kho)
                </p>{" "}
              </div>
            )}{" "}
            {/* Type */}{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                Loại
              </label>{" "}
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as AdjustmentType)}
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              >
                {" "}
                {ADJUSTMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}{" "}
              </select>{" "}
            </div>{" "}
            {/* Description */}{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                Mô tả <span className="text-[var(--cela-danger)]">*</span>
              </label>{" "}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Mô tả chi tiết lý do..."
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)] resize-none"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              />{" "}
            </div>{" "}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedProduct ||
                !quantity ||
                !description.trim()
              }
              className="w-full h-11 bg-[var(--cela-espresso)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {" "}
              {isSubmitting
                ? "Đang xử lý..."
                : needsApproval
                  ? "Gửi yêu cầu phê duyệt"
                  : "Xác nhận điều chỉnh"}{" "}
            </button>{" "}
          </form>{" "}
        </div>{" "}
        {/* Pending approvals (BM/ADMIN only) */}{" "}
        {showApprovalSection && (
          <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
            {" "}
            <div
              className="p-6"
              style={{
                borderBottom: "1px solid var(--cela-mist)",
              }}
            >
              {" "}
              <h3 className="font-semibold text-[var(--cela-espresso)]">
                Yêu cầu đang chờ phê duyệt
              </h3>{" "}
            </div>{" "}
            {isLoadingPending ? (
              <div className="flex items-center justify-center py-10">
                {" "}
                <svg
                  className="animate-spin w-5 h-5 text-[var(--cela-rose)]"
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
            ) : pending.length === 0 ? (
              <p className="p-6 text-sm text-[var(--cela-stone)]">
                Không có yêu cầu nào đang chờ phê duyệt
              </p>
            ) : (
              <table className="w-full">
                {" "}
                <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                  {" "}
                  <tr>
                    {" "}
                    <th className="text-left px-6 py-3">Sản phẩm</th>{" "}
                    <th className="text-center px-4 py-3">SL</th>{" "}
                    <th className="text-center px-4 py-3">% Tồn kho</th>{" "}
                    <th className="text-left px-4 py-3">Loại</th>{" "}
                    <th className="text-left px-4 py-3">Mô tả</th>{" "}
                    <th className="text-center px-4 py-3">Thao tác</th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody>
                  {" "}
                  {pending.map((adj) => {
                    const pct =
                      adj.currentStock > 0
                        ? ((adj.quantity / adj.currentStock) * 100).toFixed(1)
                        : "—";
                    return (
                      <tr
                        key={adj.id}
                        className="hover:bg-[var(--cela-fog)]"
                        style={{
                          borderBottom: "1px solid var(--cela-fog)",
                        }}
                      >
                        {" "}
                        <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">
                          {adj.productName}
                        </td>{" "}
                        <td className="px-4 py-4 text-center text-sm text-[var(--cela-cocoa)]">
                          {adj.quantity}
                        </td>{" "}
                        <td className="px-4 py-4 text-center text-sm text-[var(--cela-gold)] font-medium">
                          {pct}%
                        </td>{" "}
                        <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                          {adj.type}
                        </td>{" "}
                        <td className="px-4 py-4 text-sm text-[var(--cela-stone)] max-w-xs truncate">
                          {adj.description}
                        </td>{" "}
                        <td className="px-4 py-4">
                          {" "}
                          <div className="flex items-center justify-center gap-2">
                            {" "}
                            <button
                              onClick={() => handleApprove(adj.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(107,142,106,0.10)] border border-green-200 text-[var(--cela-success)] rounded-lg text-xs font-medium hover:bg-[rgba(107,142,106,0.15)]"
                            >
                              {" "}
                              <CheckCircle className="w-3.5 h-3.5" /> Phê
                              duyệt{" "}
                            </button>{" "}
                            <button
                              onClick={() => handleReject(adj.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(183,110,121,0.08)] border border-red-200 text-[var(--cela-danger)] rounded-lg text-xs font-medium hover:bg-[rgba(183,110,121,0.15)]"
                            >
                              {" "}
                              <XCircle className="w-3.5 h-3.5" /> Từ chối{" "}
                            </button>{" "}
                          </div>{" "}
                        </td>{" "}
                      </tr>
                    );
                  })}{" "}
                </tbody>{" "}
              </table>
            )}{" "}
          </div>
        )}{" "}
      </div>{" "}
    </ERPLayout>
  );
}
