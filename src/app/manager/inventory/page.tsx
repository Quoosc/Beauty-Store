"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { inventoryService } from "@/services/inventory.service";

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

const TYPE_LABELS: Record<string, string> = {
  DAMAGED: "Hàng hỏng",
  LOST: "Thất thoát",
  EXPIRED: "Hết hạn",
};

export default function ManagerInventoryPage() {
  const [pending, setPending] = useState<PendingAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      const data = await inventoryService.getPendingAdjustments();
      setPending(Array.isArray(data) ? data : data?.content ?? []);
    } catch {
      toast.error("Không thể tải danh sách yêu cầu điều chỉnh");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id: string) {
    try {
      await inventoryService.approveAdjustment(id);
      toast.success("Đã phê duyệt điều chỉnh kho");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Phê duyệt thất bại");
    }
  }

  async function handleReject(id: string) {
    try {
      await inventoryService.rejectAdjustment(id);
      toast.success("Đã từ chối yêu cầu điều chỉnh");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Từ chối thất bại");
    }
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">Duyệt điều chỉnh kho</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <p className="text-sm text-gray-500">
              Các yêu cầu điều chỉnh kho vượt 10% tồn kho hiện tại cần Branch Manager phê duyệt.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <ClipboardCheck className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">Không có yêu cầu nào đang chờ phê duyệt</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Sản phẩm</th>
                  <th className="text-center px-4 py-3">SL điều chỉnh</th>
                  <th className="text-center px-4 py-3">% Tồn kho</th>
                  <th className="text-left px-4 py-3">Loại</th>
                  <th className="text-left px-4 py-3">Mô tả</th>
                  <th className="text-left px-4 py-3">Người tạo</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map((adj) => {
                  const pct = adj.currentStock > 0
                    ? ((adj.quantity / adj.currentStock) * 100).toFixed(1)
                    : "—";
                  return (
                    <tr key={adj.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{adj.productName}</td>
                      <td className="px-4 py-4 text-center text-sm text-gray-700">{adj.quantity}</td>
                      <td className="px-4 py-4 text-center text-sm font-semibold text-amber-600">
                        {pct}%
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {TYPE_LABELS[adj.type] ?? adj.type}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                        <p className="truncate" title={adj.description}>{adj.description}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{adj.createdByName}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(adj.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Phê duyệt
                          </button>
                          <button
                            onClick={() => handleReject(adj.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
                          >
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
      </div>
    </ERPLayout>
  );
}
