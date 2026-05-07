"use client";

import { useState, useEffect } from "react";
import { Ticket, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { couponService } from "@/services/coupon.service";
import { promotionService } from "@/services/promotion.service";
import type { Coupon, Promotion } from "@/types";

interface CouponForm {
  code: string;
  promotionId: string;
  maxUsageTotal: number;
  maxUsagePerCustomer: number;
  isActive: boolean;
}

const emptyForm: CouponForm = {
  code: "",
  promotionId: "",
  maxUsageTotal: 100,
  maxUsagePerCustomer: 1,
  isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      couponService.getAll({ page: 0, size: 50 }),
      promotionService.getAll({ isActive: true }),
    ])
      .then(([couponsData, promotionsData]) => {
        const c = couponsData?.content ?? (Array.isArray(couponsData) ? couponsData : []);
        const p = promotionsData?.content ?? (Array.isArray(promotionsData) ? promotionsData : []);
        setCoupons(c);
        setPromotions(p);
      })
      .catch(() => toast.error("Không thể tải dữ liệu"))
      .finally(() => setIsLoading(false));
  }, []);

  async function reload() {
    try {
      const data = await couponService.getAll({ page: 0, size: 50 });
      setCoupons(data?.content ?? (Array.isArray(data) ? data : []));
    } catch { /* keep current */ }
  }

  function openCreate() {
    setEditingCoupon(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      promotionId: c.promotionId,
      maxUsageTotal: c.maxUsageTotal,
      maxUsagePerCustomer: c.maxUsagePerCustomer,
      isActive: c.isActive,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCoupon(null);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) { toast.error("Mã coupon là bắt buộc"); return; }
    if (!form.promotionId) { toast.error("Vui lòng chọn khuyến mãi"); return; }
    if (form.maxUsagePerCustomer > form.maxUsageTotal) {
      toast.error("Lượt dùng/khách không được vượt quá tổng lượt dùng");
      return;
    }
    setIsSaving(true);
    try {
      if (editingCoupon) {
        await couponService.update(editingCoupon.id, form);
        toast.success("Đã cập nhật coupon");
      } else {
        await couponService.create(form);
        toast.success("Đã tạo coupon");
      }
      closeForm();
      reload();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        toast.error("Mã coupon đã tồn tại");
      } else {
        toast.error(msg || "Lưu thất bại");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(c: Coupon) {
    try {
      await couponService.update(c.id, { isActive: !c.isActive });
      toast.success(c.isActive ? "Đã tắt coupon" : "Đã kích hoạt coupon");
      reload();
    } catch {
      toast.error("Thao tác thất bại");
    }
  }

  function getPromoName(promotionId: string) {
    return promotions.find((p) => p.id === promotionId)?.name ?? "—";
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Quản lý mã coupon</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Tạo coupon
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Ticket className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">Chưa có coupon nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Mã coupon</th>
                  <th className="text-left px-4 py-3">Khuyến mãi</th>
                  <th className="text-left px-4 py-3">Đã dùng / Tổng</th>
                  <th className="text-center px-4 py-3">Mỗi KH</th>
                  <th className="text-center px-4 py-3">Trạng thái</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => {
                  const usagePct = c.maxUsageTotal > 0 ? (c.usedCount / c.maxUsageTotal) * 100 : 0;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{getPromoName(c.promotionId)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
                            <div
                              className={`h-2 rounded-full ${usagePct > 90 ? "bg-red-500" : "bg-pink-500"}`}
                              style={{ width: `${Math.min(usagePct, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${usagePct > 90 ? "text-red-600" : "text-gray-600"}`}>
                            {c.usedCount} / {c.maxUsageTotal}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-600">{c.maxUsagePerCustomer}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {c.isActive ? "Đang hoạt động" : "Đã tắt"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(c)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                            Sửa
                          </button>
                          <button
                            onClick={() => handleToggle(c)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                              c.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {c.isActive ? "Tắt" : "Bật"}
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

      {/* Create/Edit Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCoupon ? "Sửa coupon" : "Tạo coupon"}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mã coupon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                  placeholder="SUMMER2025"
                  disabled={!!editingCoupon}
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Khuyến mãi áp dụng <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.promotionId}
                  onChange={(e) => setForm((f) => ({ ...f, promotionId: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none"
                >
                  <option value="">-- Chọn khuyến mãi --</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tổng lượt dùng tối đa</label>
                  <input
                    type="number"
                    value={form.maxUsageTotal}
                    onChange={(e) => setForm((f) => ({ ...f, maxUsageTotal: Number(e.target.value) }))}
                    min="1"
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lượt dùng/khách</label>
                  <input
                    type="number"
                    value={form.maxUsagePerCustomer}
                    onChange={(e) => setForm((f) => ({ ...f, maxUsagePerCustomer: Number(e.target.value) }))}
                    min="1"
                    max={form.maxUsageTotal}
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-pink-500" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className="text-sm text-gray-600">{form.isActive ? "Đang hoạt động" : "Tắt"}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 h-10 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 h-10 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
                  {isSaving ? "Đang lưu..." : (editingCoupon ? "Cập nhật" : "Tạo mới")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
