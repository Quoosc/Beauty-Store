"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import type { PurchaseOrder, POItem } from "@/types";

export default function ReceiveGoodsPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.poId as string;

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [receivedQty, setReceivedQty] = useState<Record<string, number>>({});
  const [lotNumbers, setLotNumbers] = useState<Record<string, string>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0];

  useEffect(() => {
    purchaseOrderService.getById(poId)
      .then((data) => {
        if (data.status !== "CONFIRMED") { toast.error("Chỉ có thể nhận hàng cho PO đã xác nhận"); router.back(); return; }
        setPO(data);
        const initQty: Record<string, number> = {};
        data.items.forEach((item) => { initQty[item.productId] = item.orderedQty; });
        setReceivedQty(initQty);
      })
      .catch(() => { toast.error("Không tìm thấy Purchase Order"); router.back(); })
      .finally(() => setIsLoading(false));
  }, [poId]);

  async function handleSubmit() {
    if (!po) return;
    for (const item of po.items) {
      const qty = receivedQty[item.productId] ?? 0;
      if (qty < 0 || qty > item.orderedQty) { toast.error(`Số lượng nhận của ${item.productName} không hợp lệ`); return; }
      const exp = expiryDates[item.productId];
      if (exp && exp <= today) { toast.error(`Ngày hết hạn của ${item.productName} phải là ngày trong tương lai`); return; }
    }
    setIsSubmitting(true);
    try {
      const items = po.items.map((item) => ({
        productId: item.productId,
        receivedQty: receivedQty[item.productId] ?? 0,
        lotNumber: lotNumbers[item.productId] || undefined,
        expiryDate: expiryDates[item.productId] || undefined,
      }));
      await purchaseOrderService.receive(poId, items);
      toast.success("Đã nhận hàng thành công!");
      router.push("/inventory/purchase-orders");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Nhận hàng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <ERPLayout><div className="flex justify-center py-20"><svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg></div></ERPLayout>;

  if (!po) return null;

  return (
    <ERPLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <PackageCheck className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Nhận hàng — PO #{po.id.slice(-8).toUpperCase()}
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div>
              <p className="text-gray-500">Nhà cung cấp</p>
              <p className="font-semibold text-gray-900">{po.supplierName}</p>
            </div>
            <div>
              <p className="text-gray-500">Ngày tạo</p>
              <p className="font-semibold text-gray-900">{new Date(po.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-2">Sản phẩm / SKU</th>
                <th className="text-center px-4 py-2">Qty đặt</th>
                <th className="text-center px-4 py-2">Qty nhận</th>
                <th className="text-left px-4 py-2">Số lô</th>
                <th className="text-left px-4 py-2">Hạn sử dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {po.items.map((item: POItem) => {
                const qty = receivedQty[item.productId] ?? 0;
                const expDate = expiryDates[item.productId] ?? "";
                const expiryWarning = expDate && expDate > today && expDate < thirtyDaysLater;
                return (
                  <tr key={item.productId}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.lotNumber ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">{item.orderedQty}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setReceivedQty((prev) => ({ ...prev, [item.productId]: Number(e.target.value) }))}
                        min="0"
                        max={item.orderedQty}
                        className="w-20 h-9 border border-gray-300 rounded-lg px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-200 mx-auto block"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={lotNumbers[item.productId] ?? ""}
                        onChange={(e) => setLotNumbers((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                        placeholder="LOT-001"
                        className="w-28 h-9 border border-gray-300 rounded-lg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={expDate}
                        onChange={(e) => setExpiryDates((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                        min={today}
                        className="h-9 border border-gray-300 rounded-lg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                      />
                      {expiryWarning && (
                        <p className="text-amber-600 text-xs mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Gần hết hạn
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="flex-1 h-11 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
            {isSubmitting ? "Đang xử lý..." : "Xác nhận nhận hàng"}
          </button>
        </div>
      </div>
    </ERPLayout>
  );
}
