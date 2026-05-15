"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardEdit,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { inventoryService } from "@/services/inventory.service";
import { productService } from "@/services/product.service";
import { systemConfigService } from "@/services/systemConfig.service";
import { useAuthStore } from "@/stores/auth.store";
import type { AdjustmentType, InventoryStock, Product } from "@/types";

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string }[] = [
  { value: "DAMAGED", label: "Hang hong" },
  { value: "LOST", label: "Hang that thoat" },
  { value: "EXPIRED", label: "Hang het han" },
];

interface PendingAdjustment {
  id: string;
  productName: string;
  quantity: number;
  currentStock: number;
  type: string;
  description: string;
  createdByName: string;
}

export default function InventoryAdjustmentsPage() {
  const user = useAuthStore((s) => s.user);
  const showApprovalSection =
    user?.role === "BRANCH_MANAGER" || user?.role === "ADMIN";

  const [approvalThreshold, setApprovalThreshold] = useState(10);

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

  const [pending, setPending] = useState<PendingAdjustment[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  const qtyNum = Number(quantity) || 0;
  const stockQty = currentStock?.quantity ?? 0;
  const adjustmentPercent = stockQty > 0 ? (qtyNum / stockQty) * 100 : 0;
  const needsApproval = adjustmentPercent > approvalThreshold;

  useEffect(() => {
    systemConfigService
      .getByKey("inventory.large_adjustment_percent")
      .then((config) => {
        const parsed = Number(config.value);
        if (!Number.isNaN(parsed) && parsed > 0) {
          setApprovalThreshold(parsed);
        }
      })
      .catch(() => {
        setApprovalThreshold(10);
      });
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

  useEffect(() => {
    if (showApprovalSection) loadPending();
  }, [showApprovalSection]);

  async function loadPending() {
    setIsLoadingPending(true);
    try {
      const data = await inventoryService.getPendingAdjustments();
      setPending(
        Array.isArray(data)
          ? (data as PendingAdjustment[])
          : ((data?.content ?? []) as PendingAdjustment[])
      );
    } catch {
      // keep current list
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
      toast.error("Vui long chon san pham");
      return;
    }
    if (qtyNum <= 0) {
      toast.error("So luong phai lon hon 0");
      return;
    }
    if (!description.trim()) {
      toast.error("Mo ta la bat buoc");
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
          `Da gui yeu cau dieu chinh, dang cho phe duyet (>${approvalThreshold}%)`
        );
      } else {
        toast.success("Dieu chinh kho thanh cong");
      }

      setSelectedProduct(null);
      setCurrentStock(null);
      setQuantity("");
      setDescription("");

      if (showApprovalSection) loadPending();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Dieu chinh that bai";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await inventoryService.approveAdjustment(id);
      toast.success("Da phe duyet dieu chinh");
      await loadPending();
    } catch {
      toast.error("Phe duyet that bai");
    }
  }

  async function handleReject(id: string) {
    try {
      await inventoryService.rejectAdjustment(id);
      toast.success("Da tu choi yeu cau");
      await loadPending();
    } catch {
      toast.error("Tu choi that bai");
    }
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardEdit className="w-6 h-6 text-[var(--cela-rose)]" />
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
              BEAUTY ERP
            </p>
            <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
              Dieu chinh <span style={{ color: "var(--cela-rose)" }}>kho</span>
            </h1>
          </div>
        </div>

        <div className="bg-[var(--cela-paper)] rounded-xl p-6">
          <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">Ghi nhan dieu chinh ton kho</h3>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">San pham</label>

              {selectedProduct ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(183,110,121,0.08)]" style={{ border: "1px solid var(--cela-mist)" }}>
                  <div>
                    <p className="text-sm font-medium text-[var(--cela-espresso)]">{selectedProduct.name}</p>
                    <p className="text-xs text-[var(--cela-stone)]">
                      {selectedProduct.sku}
                      {currentStock && ` | Ton hien tai: ${currentStock.quantity}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setCurrentStock(null);
                    }}
                    className="text-xs text-[var(--cela-stone)] hover:text-[var(--cela-danger)]"
                  >
                    Doi
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tim san pham..."
                    className="h-11 w-full pl-9 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                    style={{ border: "1px solid var(--cela-mist)" }}
                  />

                  {isSearching && (
                    <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}

                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--cela-paper)] rounded-xl z-50 max-h-48 overflow-y-auto" style={{ border: "1px solid var(--cela-mist)" }}>
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectProduct(p)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(183,110,121,0.08)] text-left last:border-0"
                          style={{ borderBottom: "1px solid var(--cela-mist)" }}
                        >
                          <p className="text-sm text-[var(--cela-espresso)]">{p.name}</p>
                          <p className="text-xs text-[var(--cela-stone)] ml-2">{p.sku}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">So luong</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                style={{ border: "1px solid var(--cela-mist)" }}
              />
              {currentStock && quantity && (
                <p className="text-xs text-[var(--cela-stone)] mt-1">
                  Ty le: {qtyNum}/{stockQty} = {adjustmentPercent.toFixed(1)}%
                </p>
              )}
            </div>

            {needsApproval && (
              <div className="flex items-start gap-2 bg-[rgba(201,168,122,0.14)] border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-[var(--cela-gold)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--cela-gold)]">
                  Yeu cau nay can Branch Manager phe duyet ({">"}
                  {approvalThreshold}% ton kho)
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Loai dieu chinh</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as AdjustmentType)}
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                style={{ border: "1px solid var(--cela-mist)" }}
              >
                {ADJUSTMENT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Mo ta *</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mo ta chi tiet ly do..."
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] resize-none"
                style={{ border: "1px solid var(--cela-mist)" }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedProduct || !quantity || !description.trim()}
              className="w-full h-11 bg-[var(--cela-espresso)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting
                ? "Dang xu ly..."
                : needsApproval
                ? "Gui yeu cau phe duyet"
                : "Xac nhan dieu chinh"}
            </button>
          </form>
        </div>

        {showApprovalSection && (
          <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
            <div className="p-6" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
              <h3 className="font-semibold text-[var(--cela-espresso)]">Yeu cau dang cho phe duyet</h3>
            </div>

            {isLoadingPending ? (
              <div className="flex items-center justify-center py-10">
                <svg className="animate-spin w-5 h-5 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : pending.length === 0 ? (
              <p className="p-6 text-sm text-[var(--cela-stone)]">Khong co yeu cau nao dang cho phe duyet</p>
            ) : (
              <table className="w-full">
                <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                  <tr>
                    <th className="text-left px-6 py-3">San pham</th>
                    <th className="text-center px-4 py-3">SL</th>
                    <th className="text-center px-4 py-3">% Ton kho</th>
                    <th className="text-left px-4 py-3">Loai</th>
                    <th className="text-left px-4 py-3">Mo ta</th>
                    <th className="text-left px-4 py-3">Nguoi tao</th>
                    <th className="text-center px-4 py-3">Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((adj) => {
                    const pct =
                      adj.currentStock > 0 ? ((adj.quantity / adj.currentStock) * 100).toFixed(1) : "-";

                    return (
                      <tr key={adj.id} className="hover:bg-[var(--cela-fog)]" style={{ borderBottom: "1px solid var(--cela-fog)" }}>
                        <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">{adj.productName}</td>
                        <td className="px-4 py-4 text-center text-sm text-[var(--cela-cocoa)]">{adj.quantity}</td>
                        <td className="px-4 py-4 text-center text-sm text-[var(--cela-gold)] font-medium">{pct}%</td>
                        <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{adj.type}</td>
                        <td className="px-4 py-4 text-sm text-[var(--cela-stone)] max-w-xs truncate">{adj.description}</td>
                        <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{adj.createdByName}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(adj.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(107,142,106,0.10)] border border-green-200 text-[var(--cela-success)] rounded-lg text-xs font-medium hover:bg-[rgba(107,142,106,0.15)]"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Phe duyet
                            </button>
                            <button
                              onClick={() => handleReject(adj.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(183,110,121,0.08)] border border-red-200 text-[var(--cela-danger)] rounded-lg text-xs font-medium hover:bg-[rgba(183,110,121,0.15)]"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Tu choi
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
