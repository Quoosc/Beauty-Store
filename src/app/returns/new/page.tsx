"use client";

import { useState } from "react";
import { Search, RotateCcw, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { orderService, returnService } from "@/services/order.service";
import { usePOSStore } from "@/stores/pos.store";
import type { Order, OrderItem } from "@/types";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function ReturnsNewPage() {
  const { currentShift } = usePOSStore();

  const [orderId, setOrderId] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [returnQty, setReturnQty] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shift guard
  if (!currentShift || currentShift.status !== "OPEN") {
    return (
      <ERPLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="w-14 h-14 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Bạn chưa mở ca</h2>
          <p className="text-gray-500 mb-6">Cần có ca đang mở để thực hiện trả hàng.</p>
          <Link
            href="/pos/shift"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-medium rounded-xl"
          >
            Đi đến trang ca
          </Link>
        </div>
      </ERPLayout>
    );
  }

  async function handleSearchOrder() {
    if (!orderId.trim()) return;
    setIsSearching(true);
    setFoundOrder(null);
    setSelectedItems(new Set());
    setReturnQty({});
    try {
      const res = await orderService.getById(orderId.trim());
      const order = res.data.data;
      if (order.status === "CANCELLED") {
        toast.error("Không thể trả hàng cho đơn đã hủy");
        return;
      }
      setFoundOrder(order);
    } catch {
      toast.error("Không tìm thấy đơn hàng với mã này");
    } finally {
      setIsSearching(false);
    }
  }

  function toggleItem(productId: string, maxQty: number) {
    const next = new Set(selectedItems);
    if (next.has(productId)) {
      next.delete(productId);
      setReturnQty((q) => { const copy = { ...q }; delete copy[productId]; return copy; });
    } else {
      next.add(productId);
      setReturnQty((q) => ({ ...q, [productId]: 1 }));
    }
    setSelectedItems(next);
  }

  function setQty(productId: string, qty: number, maxQty: number) {
    const clamped = Math.max(1, Math.min(qty, maxQty));
    setReturnQty((q) => ({ ...q, [productId]: clamped }));
  }

  const totalRefund = foundOrder?.items
    .filter((item) => selectedItems.has(item.productId))
    .reduce((sum, item) => sum + item.unitPrice * (returnQty[item.productId] ?? 1), 0) ?? 0;

  function validate(): boolean {
    if (selectedItems.size === 0) { toast.error("Chọn ít nhất 1 sản phẩm để trả"); return false; }
    for (const pid of selectedItems) {
      const original = foundOrder!.items.find((i) => i.productId === pid)!;
      const qty = returnQty[pid] ?? 1;
      if (qty < 1 || qty > original.quantity) {
        toast.error(`Số lượng trả của ${original.productName} không hợp lệ`);
        return false;
      }
    }
    return true;
  }

  async function handleSubmit() {
    if (!foundOrder || !validate()) return;
    setIsSubmitting(true);
    try {
      const items = Array.from(selectedItems).map((pid) => ({
        productId: pid,
        quantity: returnQty[pid] ?? 1,
      }));
      await returnService.create({ originalOrderId: foundOrder.id, items, reason: "Khách yêu cầu trả hàng" });
      toast.success("Trả hàng thành công! Kho hàng đã được cập nhật.");
      setFoundOrder(null);
      setOrderId("");
      setSelectedItems(new Set());
      setReturnQty({});
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Trả hàng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ERPLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">Trả hàng</h1>
        </div>

        {/* Step 1: Find order */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Bước 1: Tìm đơn hàng gốc</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchOrder()}
              placeholder="Nhập mã đơn hàng gốc..."
              className="flex-1 h-11 border border-gray-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
            <button
              onClick={handleSearchOrder}
              disabled={isSearching || !orderId.trim()}
              className="flex items-center gap-2 px-5 h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-medium rounded-lg disabled:opacity-50 transition-opacity"
            >
              <Search className="w-4 h-4" />
              {isSearching ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>
        </div>

        {/* Step 2: Select items */}
        {foundOrder && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Thông tin đơn hàng gốc</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Mã đơn</p>
                  <p className="font-medium">#{foundOrder.id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Thu ngân</p>
                  <p className="font-medium">{foundOrder.cashierName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày mua</p>
                  <p className="font-medium">{formatDate(foundOrder.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Bước 2: Chọn sản phẩm trả</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 w-8" />
                    <th className="text-left px-4 py-3">Sản phẩm</th>
                    <th className="text-center px-4 py-3">Đã mua</th>
                    <th className="text-center px-4 py-3">Số lượng trả</th>
                    <th className="text-right px-4 py-3">Đơn giá</th>
                    <th className="text-right px-4 py-3">Hoàn trả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {foundOrder.items.map((item: OrderItem) => {
                    const isSelected = selectedItems.has(item.productId);
                    const qty = returnQty[item.productId] ?? 1;
                    return (
                      <tr key={item.productId} className={isSelected ? "bg-pink-50" : ""}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.productId, item.quantity)}
                            className="w-4 h-4 accent-pink-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-center">
                          {isSelected ? (
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() => setQty(item.productId, qty - 1, item.quantity)}
                                className="w-7 h-7 border border-gray-300 rounded text-sm hover:bg-gray-100"
                              >−</button>
                              <span className="w-8 text-center text-sm font-medium">{qty}</span>
                              <button
                                onClick={() => setQty(item.productId, qty + 1, item.quantity)}
                                className="w-7 h-7 border border-gray-300 rounded text-sm hover:bg-gray-100"
                              >+</button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {formatVND(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                          {isSelected ? formatVND(item.unitPrice * qty) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Return summary + submit */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Tổng hoàn trả</p>
                  <p className="text-2xl font-bold text-green-600">{formatVND(totalRefund)}</p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedItems.size === 0}
                  className="px-6 py-3 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl
                    hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận trả hàng"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </ERPLayout>
  );
}
