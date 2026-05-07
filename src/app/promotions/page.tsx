"use client";

import { useState, useEffect } from "react";
import { Gift, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { promotionService } from "@/services/promotion.service";
import type { Promotion } from "@/types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

interface PromotionForm {
  name: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minOrderValue: number;
  maxDiscountCap: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const emptyForm: PromotionForm = {
  name: "",
  type: "PERCENTAGE",
  value: 0,
  minOrderValue: 0,
  maxDiscountCap: null,
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const data = await promotionService.getAll({
        isActive: filterActive ?? undefined,
      });
      setPromotions(data?.content ?? Array.isArray(data) ? (Array.isArray(data) ? data : []) : []);
    } catch {
      toast.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterActive]);

  function openCreate() {
    setEditingPromotion(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(p: Promotion) {
    setEditingPromotion(p);
    setForm({
      name: p.name,
      type: p.type,
      value: p.value,
      minOrderValue: p.minOrderValue,
      maxDiscountCap: p.maxDiscountCap,
      startDate: p.startDate.split("T")[0],
      endDate: p.endDate.split("T")[0],
      isActive: p.isActive,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPromotion(null);
    setForm(emptyForm);
  }

  async function handleDeactivate(p: Promotion) {
    if (!confirm(`Tắt khuyến mãi "${p.name}"?`)) return;
    try {
      await promotionService.deactivate(p.id);
      toast.success("Đã tắt khuyến mãi");
      load();
    } catch {
      toast.error("Thao tác thất bại");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Tên khuyến mãi là bắt buộc"); return; }
    if (form.value <= 0) { toast.error("Giá trị giảm phải lớn hơn 0"); return; }
    if (form.type === "PERCENTAGE" && form.value > 100) { toast.error("Phần trăm giảm tối đa 100%"); return; }
    if (!form.startDate || !form.endDate) { toast.error("Vui lòng chọn thời hạn"); return; }
    if (form.endDate <= form.startDate) { toast.error("Ngày kết thúc phải sau ngày bắt đầu"); return; }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        maxDiscountCap: form.type === "PERCENTAGE" ? form.maxDiscountCap : null,
      };
      if (editingPromotion) {
        await promotionService.update(editingPromotion.id, payload);
        toast.success("Đã cập nhật khuyến mãi");
      } else {
        await promotionService.create(payload as Omit<Promotion, "id">);
        toast.success("Đã tạo khuyến mãi");
      }
      closeForm();
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        toast.error("Đã có khuyến mãi cùng loại đang hoạt động");
      } else {
        toast.error(msg || "Lưu thất bại");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const tabs: { label: string; value: boolean | null }[] = [
    { label: "Tất cả", value: null },
    { label: "Đang hoạt động", value: true },
    { label: "Đã tắt", value: false },
  ];

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Quản lý khuyến mãi</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Tạo khuyến mãi
          </button>
        </div>

        {/* Filter tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={String(tab.value)}
              onClick={() => setFilterActive(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === tab.value
                  ? "bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : promotions.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Gift className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">Không có khuyến mãi nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Tên KM</th>
                  <th className="text-left px-4 py-3">Loại</th>
                  <th className="text-right px-4 py-3">Đơn tối thiểu</th>
                  <th className="text-left px-4 py-3">Thời hạn</th>
                  <th className="text-center px-4 py-3">Trạng thái</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.type === "PERCENTAGE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>
                        {p.type === "PERCENTAGE" ? `Giảm ${p.value}%` : `Giảm ${formatVND(p.value)}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">{formatVND(p.minOrderValue)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(p.startDate)} → {formatDate(p.endDate)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {p.isActive ? "Đang hoạt động" : "Đã tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(p)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                          Sửa
                        </button>
                        {p.isActive && (
                          <button onClick={() => handleDeactivate(p)} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg">
                            Tắt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPromotion ? "Sửa khuyến mãi" : "Tạo khuyến mãi"}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại giảm giá</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENTAGE" | "FIXED_AMOUNT" }))}
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none"
                >
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Giá trị giảm {form.type === "PERCENTAGE" ? "(%)" : "(₫)"}
                </label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                  min="0"
                  max={form.type === "PERCENTAGE" ? 100 : undefined}
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                />
              </div>

              {form.type === "PERCENTAGE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Giảm tối đa (₫)</label>
                  <input
                    type="number"
                    value={form.maxDiscountCap ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscountCap: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="Không giới hạn"
                    min="0"
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Đơn hàng tối thiểu (₫)</label>
                <input
                  type="number"
                  value={form.minOrderValue}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderValue: Number(e.target.value) }))}
                  min="0"
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày kết thúc <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    min={form.startDate}
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
                  {isSaving ? "Đang lưu..." : (editingPromotion ? "Cập nhật" : "Tạo mới")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
