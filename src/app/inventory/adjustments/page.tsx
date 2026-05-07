"use client";

import { useState, useEffect } from "react";
import { Search, ClipboardEdit, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { inventoryService } from "@/services/inventory.service";
import { productService } from "@/services/product.service";
import { useAuthStore } from "@/stores/auth.store";
import type { Product, InventoryStock } from "@/types";

const ADJUSTMENT_TYPES = [
  { value: "DAMAGED", label: "Hàng hỏng" },
  { value: "LOST", label: "Hàng thất thoát" },
  { value: "EXPIRED", label: "Hàng hết hạn" },
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
  const showApprovalSection = user?.role === "BRANCH_MANAGER" || user?.role === "ADMIN";

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
    if (!productSearch.trim()) { setSearchResults([]); setShowResults(false); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await productService.search({ q: productSearch, status: "ACTIVE", size: 10 });
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
      setPending(Array.isArray(data) ? data : data?.content ?? []);
    } catch { /* graceful */ }
    finally { setIsLoadingPending(false); }
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
    if (!selectedProduct) { toast.error("Vui lòng chọn sản phẩm"); return; }
    if (qtyNum <= 0) { toast.error("Số lượng phải lớn hơn 0"); return; }
    if (!description.trim()) { toast.error("Mô tả là bắt buộc"); return; }
    setIsSubmitting(true);
    try {
      await inventoryService.createAdjustment({
        productId: selectedProduct.id,
        quantity: qtyNum,
        type: adjType,
        description: description.trim(),
      });
      if (needsApproval) {
        toast.success("Đã gửi yêu cầu điều chỉnh, đang chờ Branch Manager phê duyệt");
      } else {
        toast.success("Điều chỉnh kho thành công!");
      }
      setSelectedProduct(null);
      setCurrentStock(null);
      setQuantity("");
      setDescription("");
      if (showApprovalSection) loadPending();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
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
    } catch { toast.error("Phê duyệt thất bại"); }
  }

  async function handleReject(id: string) {
    try {
      await inventoryService.rejectAdjustment(id);
      toast.success("Đã từ chối yêu cầu");
      loadPending();
    } catch { toast.error("Từ chối thất bại"); }
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardEdit className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">Điều chỉnh kho</h1>
        </div>

        {/* Create adjustment */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ghi nhận hàng hỏng / thất thoát</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">

            {/* Product search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sản phẩm</label>
              {selectedProduct ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-pink-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedProduct.sku}
                      {currentStock && ` | Tồn kho hiện tại: ${currentStock.quantity}`}
                    </p>
                  </div>
                  <button type="button" onClick={() => { setSelectedProduct(null); setCurrentStock(null); }} className="text-xs text-gray-500 hover:text-red-600">Đổi</button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="h-11 w-full pl-9 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  />
                  {isSearching && <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                      {searchResults.map((p) => (
                        <button key={p.id} type="button" onClick={() => selectProduct(p)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 text-left border-b border-gray-50 last:border-0">
                          <p className="text-sm text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500 ml-2">{p.sku}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                placeholder="0"
                className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
              />
              {currentStock && quantity && (
                <p className="text-xs text-gray-500 mt-1">
                  Tỷ lệ: {qtyNum}/{stockQty} = {adjustmentPercent.toFixed(1)}%
                </p>
              )}
            </div>

            {needsApproval && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">Yêu cầu này sẽ cần Branch Manager phê duyệt ({">"} 10% tồn kho)</p>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as AdjustmentType)}
                className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {ADJUSTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Mô tả chi tiết lý do..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedProduct || !quantity || !description.trim()}
              className="w-full h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : (needsApproval ? "Gửi yêu cầu phê duyệt" : "Xác nhận điều chỉnh")}
            </button>
          </form>
        </div>

        {/* Pending approvals (BM/ADMIN only) */}
        {showApprovalSection && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Yêu cầu đang chờ phê duyệt</h3>
            </div>
            {isLoadingPending ? (
              <div className="flex items-center justify-center py-10">
                <svg className="animate-spin w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : pending.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">Không có yêu cầu nào đang chờ phê duyệt</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-6 py-3">Sản phẩm</th>
                    <th className="text-center px-4 py-3">SL</th>
                    <th className="text-center px-4 py-3">% Tồn kho</th>
                    <th className="text-left px-4 py-3">Loại</th>
                    <th className="text-left px-4 py-3">Mô tả</th>
                    <th className="text-center px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pending.map((adj) => {
                    const pct = adj.currentStock > 0 ? ((adj.quantity / adj.currentStock) * 100).toFixed(1) : "—";
                    return (
                      <tr key={adj.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{adj.productName}</td>
                        <td className="px-4 py-4 text-center text-sm text-gray-700">{adj.quantity}</td>
                        <td className="px-4 py-4 text-center text-sm text-amber-600 font-medium">{pct}%</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{adj.type}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{adj.description}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleApprove(adj.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
                              <CheckCircle className="w-3.5 h-3.5" /> Phê duyệt
                            </button>
                            <button onClick={() => handleReject(adj.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
                              <XCircle className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
