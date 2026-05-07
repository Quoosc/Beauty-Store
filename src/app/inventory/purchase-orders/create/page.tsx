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

const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

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
    supplierService.getAll().then((data) => setSuppliers(Array.isArray(data) ? data : data?.content ?? [])).catch(() => {});
  }, []);

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

  function addItem(product: Product) {
    if (items.find((i) => i.productId === product.id)) { toast.error("Sản phẩm đã có trong danh sách"); return; }
    setItems((prev) => [...prev, { productId: product.id, productName: product.name, sku: product.sku, orderedQty: 1, unitPrice: product.costPrice || 0 }]);
    setProductSearch("");
    setShowResults(false);
  }

  function updateItem(productId: string, field: "orderedQty" | "unitPrice", value: number) {
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, [field]: value } : i));
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const total = items.reduce((sum, i) => sum + i.orderedQty * i.unitPrice, 0);

  async function handleSubmit() {
    if (!supplierId) { toast.error("Vui lòng chọn nhà cung cấp"); return; }
    if (items.length === 0) { toast.error("Vui lòng thêm ít nhất 1 sản phẩm"); return; }
    if (items.some((i) => i.orderedQty <= 0 || i.unitPrice <= 0)) { toast.error("Số lượng và đơn giá phải > 0"); return; }
    setIsSubmitting(true);
    try {
      await purchaseOrderService.create({ supplierId, items: items.map((i) => ({ productId: i.productId, orderedQty: i.orderedQty, unitPrice: i.unitPrice })) });
      toast.success("Tạo Purchase Order thành công!");
      router.push("/inventory/purchase-orders");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Tạo PO thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ERPLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Purchase Order</h1>
        </div>

        {/* Supplier */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Nhà cung cấp</h3>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full max-w-sm h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="">-- Chọn nhà cung cấp --</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Product search & items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Thêm sản phẩm</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Tìm sản phẩm theo tên, SKU..."
              className="h-11 w-full pl-9 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
            {isSearching && <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <button key={p.id} onClick={() => addItem(p)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 text-left border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.sku}</p>
                    </div>
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Thêm</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 ? (
            <>
              <table className="w-full mb-4">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-4 py-2">Sản phẩm</th>
                    <th className="text-center px-4 py-2">Số lượng</th>
                    <th className="text-right px-4 py-2">Đơn giá</th>
                    <th className="text-right px-4 py-2">Thành tiền</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={item.orderedQty} onChange={(e) => updateItem(item.productId, "orderedQty", Number(e.target.value))} min="1" className="w-20 h-9 border border-gray-300 rounded-lg px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-200 mx-auto block" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.productId, "unitPrice", Number(e.target.value))} min="0" className="w-32 h-9 border border-gray-300 rounded-lg px-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-pink-200 ml-auto block" />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatVND(item.orderedQty * item.unitPrice)}</td>
                      <td className="px-2 py-3">
                        <button onClick={() => removeItem(item.productId)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="font-semibold text-gray-900">Tổng cộng</span>
                <span className="text-xl font-bold text-pink-600">{formatVND(total)}</span>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có sản phẩm nào được thêm</p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="flex-1 h-11 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
          <button onClick={handleSubmit} disabled={isSubmitting || !supplierId || items.length === 0} className="flex-1 h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
            {isSubmitting ? "Đang tạo..." : "Tạo Purchase Order"}
          </button>
        </div>
      </div>
    </ERPLayout>
  );
}
