"use client";

import { useEffect, useState } from "react";
import { Gift, Plus } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { promotionService } from "@/services/promotion.service";
import type { Promotion } from "@/types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<PromotionForm>(emptyForm);

  async function load() {
    setIsLoading(true);
    try {
      const data = await promotionService.getAll({ page: 0, size: 100 });
      const rows = data?.content ?? (Array.isArray(data) ? data : []);
      setPromotions(rows);
    } catch {
      toast.error("Khong the tai danh sach khuyen mai");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDeactivate(p: Promotion) {
    if (!confirm(`Tat khuyen mai \"${p.name}\"?`)) return;

    try {
      await promotionService.deactivate(p.id);
      toast.success("Da vo hieu hoa khuyen mai");
      await load();
    } catch {
      toast.error("Thao tac that bai");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Ten khuyen mai la bat buoc");
      return;
    }

    if (form.value <= 0) {
      toast.error("Gia tri giam phai lon hon 0");
      return;
    }

    if (form.type === "PERCENTAGE" && form.value > 100) {
      toast.error("Phan tram giam toi da 100%");
      return;
    }

    if (!form.startDate || !form.endDate || form.endDate <= form.startDate) {
      toast.error("Khoang thoi gian khong hop le");
      return;
    }

    setIsSaving(true);
    try {
      await promotionService.create({
        ...form,
        maxDiscountCap: form.type === "PERCENTAGE" ? form.maxDiscountCap : null,
      } as Omit<Promotion, "id">);

      toast.success("Tao khuyen mai thanh cong");
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        toast.error("Da co khuyen mai cung loai dang hoat dong");
      } else {
        toast.error(msg || "Luu that bai");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-[var(--cela-rose)]" />
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
                BEAUTY ERP
              </p>
              <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
                Quan ly <span style={{ color: "var(--cela-rose)" }}>khuyen mai</span>
              </h1>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Tao khuyen mai
          </button>
        </div>

        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : promotions.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Gift className="w-12 h-12 text-[var(--cela-mist)] mb-3" />
              <p className="text-[var(--cela-stone)]">Khong co khuyen mai nao</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
                <tr>
                  <th className="text-left px-6 py-3">Ten KM</th>
                  <th className="text-left px-4 py-3">Loai</th>
                  <th className="text-right px-4 py-3">Don toi thieu</th>
                  <th className="text-left px-4 py-3">Thoi han</th>
                  <th className="text-center px-4 py-3">Trang thai</th>
                  <th className="text-center px-4 py-3">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--cela-fog)] transition-colors" style={{ borderBottom: "1px solid var(--cela-fog)" }}>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">{p.name}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(120,140,180,0.18)] text-[var(--cela-cocoa)]">
                        {p.type === "PERCENTAGE" ? `Giam ${p.value}%` : `Giam ${formatVND(p.value)}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-[var(--cela-stone)]">{formatVND(p.minOrderValue)}</td>
                    <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{formatDate(p.startDate)} {"->"} {formatDate(p.endDate)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-[rgba(107,142,106,0.15)] text-[var(--cela-success)]" : "bg-[var(--cela-fog)] text-[var(--cela-stone)]"}`}>
                        {p.isActive ? "Dang hoat dong" : "Da tat"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {p.isActive ? (
                        <button
                          onClick={() => handleDeactivate(p)}
                          className="px-3 py-1.5 text-xs font-medium text-[var(--cela-danger)] hover:bg-[rgba(183,110,121,0.08)] rounded-lg"
                        >
                          Vo hieu hoa
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--cela-stone)]">Chi doc</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--cela-paper)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 sticky top-0 bg-[var(--cela-paper)]" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
              <h2 className="text-lg font-semibold text-[var(--cela-espresso)]">Tao khuyen mai</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-[var(--cela-fog)]">Dong</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Ten khuyen mai *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Loai giam gia</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENTAGE" | "FIXED_AMOUNT" }))}
                  className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                >
                  <option value="PERCENTAGE">Phan tram (%)</option>
                  <option value="FIXED_AMOUNT">So tien co dinh (VND)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Gia tri giam</label>
                <input
                  type="number"
                  min={0}
                  max={form.type === "PERCENTAGE" ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                  className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>

              {form.type === "PERCENTAGE" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Giam toi da (VND)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountCap ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxDiscountCap: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--cela-mist)" }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Don hang toi thieu (VND)</label>
                <input
                  type="number"
                  min={0}
                  value={form.minOrderValue}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderValue: Number(e.target.value) }))}
                  className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Ngay bat dau *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--cela-mist)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Ngay ket thuc *</label>
                  <input
                    type="date"
                    min={form.startDate}
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--cela-mist)" }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-10 rounded-xl text-sm font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                  style={{ border: "1px solid var(--cela-mist)" }}
                >
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 bg-[var(--cela-espresso)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm"
                >
                  {isSaving ? "Dang luu..." : "Tao moi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
