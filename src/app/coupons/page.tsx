"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Ticket } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [promotionFilter, setPromotionFilter] = useState<string>("ALL");

  async function loadCoupons(promotionId: string) {
    const data = await couponService.getAll(promotionId, { page: 0, size: 100 });
    return data?.content ?? (Array.isArray(data) ? data : []);
  }

  async function loadInitial() {
    setIsLoading(true);
    try {
      const promoRows = await promotionService.getAll({ isActive: true, page: 0, size: 100 });
      const promoList = promoRows?.content ?? (Array.isArray(promoRows) ? promoRows : []);
      setPromotions(promoList);
    } catch {
      toast.error("Khong the tai danh sach khuyen mai");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  async function applyFilter(nextFilter: string) {
    setPromotionFilter(nextFilter);
    if (nextFilter === "ALL") {
      setCoupons([]);
      return;
    }
    try {
      const data = await loadCoupons(nextFilter);
      setCoupons(data);
    } catch {
      toast.error("Khong the tai danh sach coupon");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Ma coupon la bat buoc");
      return;
    }
    if (!form.promotionId) {
      toast.error("Vui long chon khuyen mai");
      return;
    }
    if (form.maxUsagePerCustomer > form.maxUsageTotal) {
      toast.error("Luot dung moi khach khong duoc lon hon tong luot");
      return;
    }

    setIsSaving(true);
    try {
      await couponService.create(form);
      toast.success("Tao coupon thanh cong");
      setShowForm(false);
      setForm(emptyForm);
      await applyFilter(promotionFilter);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      if (status === 409) {
        toast.error("Ma coupon da ton tai");
      } else {
        toast.error(msg || "Luu that bai");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const promoMap = useMemo(
    () => new Map(promotions.map((p) => [p.id, p.name])),
    [promotions]
  );

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-[var(--cela-rose)]" />
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
                BEAUTY ERP
              </p>
              <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
                Quan ly ma <span style={{ color: "var(--cela-rose)" }}>coupon</span>
              </h1>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Tao coupon
          </button>
        </div>

        <div className="bg-[var(--cela-paper)] rounded-xl p-4">
          <label className="text-sm text-[var(--cela-cocoa)] mr-3">Loc theo khuyen mai:</label>
          <select
            value={promotionFilter}
            onChange={(e) => applyFilter(e.target.value)}
            className="h-10 rounded-lg px-3 text-sm focus:outline-none"
            style={{ border: "1px solid var(--cela-mist)" }}
          >
            <option value="ALL">Tat ca</option>
            {promotions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Ticket className="w-12 h-12 text-[var(--cela-mist)] mb-3" />
              <p className="text-[var(--cela-stone)]">
                {promotionFilter === "ALL"
                  ? "Chon khuyen mai de xem coupon"
                  : "Chua co coupon nao cho khuyen mai nay"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
                <tr>
                  <th className="text-left px-6 py-3">Ma coupon</th>
                  <th className="text-left px-4 py-3">Khuyen mai</th>
                  <th className="text-left px-4 py-3">Da dung / Tong</th>
                  <th className="text-center px-4 py-3">Moi KH</th>
                  <th className="text-center px-4 py-3">Trang thai</th>
                  <th className="text-center px-4 py-3">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const usagePct = c.maxUsageTotal > 0 ? (c.usedCount / c.maxUsageTotal) * 100 : 0;
                  return (
                    <tr key={c.id} className="hover:bg-[var(--cela-fog)] transition-colors" style={{ borderBottom: "1px solid var(--cela-fog)" }}>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-[var(--cela-espresso)] bg-[var(--cela-fog)] px-2 py-1 rounded">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--cela-cocoa)]">{promoMap.get(c.promotionId) ?? "-"}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[var(--cela-mist)] rounded-full h-2 min-w-16">
                            <div className="h-2 rounded-full bg-[var(--cela-rose)]" style={{ width: `${Math.min(usagePct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium text-[var(--cela-stone)]">{c.usedCount} / {c.maxUsageTotal}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-[var(--cela-stone)]">{c.maxUsagePerCustomer}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${c.isActive ? "bg-[rgba(107,142,106,0.15)] text-[var(--cela-success)]" : "bg-[var(--cela-fog)] text-[var(--cela-stone)]"}`}>
                          {c.isActive ? "Dang hoat dong" : "Da tat"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs text-[var(--cela-stone)]">Chi ho tro tao moi</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--cela-paper)] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
              <h2 className="text-lg font-semibold text-[var(--cela-espresso)]">Tao coupon</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-[var(--cela-fog)]">Dong</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Ma coupon <span className="text-[var(--cela-danger)]">*</span></label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                  placeholder="SUMMER2026"
                  className="w-full h-10 rounded-lg px-3 text-sm font-mono uppercase focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Khuyen mai ap dung <span className="text-[var(--cela-danger)]">*</span></label>
                <select
                  value={form.promotionId}
                  onChange={(e) => setForm((f) => ({ ...f, promotionId: e.target.value }))}
                  className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                >
                  <option value="">-- Chon khuyen mai --</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Tong luot dung</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUsageTotal}
                    onChange={(e) => setForm((f) => ({ ...f, maxUsageTotal: Number(e.target.value) }))}
                    className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--cela-mist)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Luot dung moi KH</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUsagePerCustomer}
                    onChange={(e) => setForm((f) => ({ ...f, maxUsagePerCustomer: Number(e.target.value) }))}
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
