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
      couponService.getAll({
        page: 0,
        size: 50,
      }),
      promotionService.getAll({
        isActive: true,
      }),
    ])
      .then(([couponsData, promotionsData]) => {
        const c =
          couponsData?.content ??
          (Array.isArray(couponsData) ? couponsData : []);
        const p =
          promotionsData?.content ??
          (Array.isArray(promotionsData) ? promotionsData : []);
        setCoupons(c);
        setPromotions(p);
      })
      .catch(() => toast.error("Không thể tải dữ liệu"))
      .finally(() => setIsLoading(false));
  }, []);
  async function reload() {
    try {
      const data = await couponService.getAll({
        page: 0,
        size: 50,
      });
      setCoupons(data?.content ?? (Array.isArray(data) ? data : []));
    } catch {
      /* keep current */
    }
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
    if (!form.code.trim()) {
      toast.error("Mã coupon là bắt buộc");
      return;
    }
    if (!form.promotionId) {
      toast.error("Vui lòng chọn khuyến mãi");
      return;
    }
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
      const status = (
        err as {
          response?: {
            status?: number;
          };
        }
      )?.response?.status;
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;
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
      await couponService.update(c.id, {
        isActive: !c.isActive,
      });
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
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <Ticket className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
            <div
              style={{
                marginBottom: 24,
              }}
            >
              {/* Page header */}
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--cela-cocoa)",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                BEAUTY ERP
              </p>
              <h1
                style={{
                  fontFamily: "var(--cela-display)",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--cela-espresso)",
                  fontStyle: "italic",
                  lineHeight: 1.2,
                }}
              >
                Qu?n l� m�{" "}
                <span
                  style={{
                    color: "var(--cela-rose)",
                  }}
                >
                  coupon
                </span>
              </h1>
            </div>{" "}
          </div>{" "}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            {" "}
            <Plus className="w-4 h-4" /> Tạo coupon{" "}
          </button>{" "}
        </div>{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {" "}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              {" "}
              <svg
                className="animate-spin w-6 h-6 text-[var(--cela-rose)]"
                viewBox="0 0 24 24"
                fill="none"
              >
                {" "}
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />{" "}
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />{" "}
              </svg>{" "}
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              {" "}
              <Ticket className="w-12 h-12 text-[var(--cela-mist)] mb-3" />{" "}
              <p className="text-[var(--cela-stone)]">
                Chưa có coupon nào
              </p>{" "}
            </div>
          ) : (
            <table className="w-full">
              {" "}
              <thead
                className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase"
                style={{
                  borderBottom: "1px solid var(--cela-mist)",
                }}
              >
                {" "}
                <tr>
                  {" "}
                  <th className="text-left px-6 py-3">Mã coupon</th>{" "}
                  <th className="text-left px-4 py-3">Khuyến mãi</th>{" "}
                  <th className="text-left px-4 py-3">Đã dùng / Tổng</th>{" "}
                  <th className="text-center px-4 py-3">Mỗi KH</th>{" "}
                  <th className="text-center px-4 py-3">Trạng thái</th>{" "}
                  <th className="text-center px-4 py-3">Thao tác</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {coupons.map((c) => {
                  const usagePct =
                    c.maxUsageTotal > 0
                      ? (c.usedCount / c.maxUsageTotal) * 100
                      : 0;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[var(--cela-fog)] transition-colors"
                      style={{
                        borderBottom: "1px solid var(--cela-fog)",
                      }}
                    >
                      {" "}
                      <td className="px-6 py-4">
                        {" "}
                        <span className="text-sm font-mono font-bold text-[var(--cela-espresso)] bg-[var(--cela-fog)] px-2 py-1 rounded">
                          {" "}
                          {c.code}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-sm text-[var(--cela-cocoa)]">
                        {getPromoName(c.promotionId)}
                      </td>{" "}
                      <td className="px-4 py-4">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <div className="flex-1 bg-[var(--cela-mist)] rounded-full h-2 min-w-16">
                            {" "}
                            <div
                              className={`h-2 rounded-full${usagePct > 90 ? "bg-[var(--cela-rose)]" : "bg-[var(--cela-rose)]"}`}
                              style={{
                                width: `${Math.min(usagePct, 100)}%`,
                              }}
                            />{" "}
                          </div>{" "}
                          <span
                            className={`text-xs font-medium${usagePct > 90 ? "text-[var(--cela-danger)]" : "text-[var(--cela-stone)]"}`}
                          >
                            {" "}
                            {c.usedCount} / {c.maxUsageTotal}{" "}
                          </span>{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-center text-sm text-[var(--cela-stone)]">
                        {c.maxUsagePerCustomer}
                      </td>{" "}
                      <td className="px-4 py-4 text-center">
                        {" "}
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium${c.isActive ? "bg-[rgba(107,142,106,0.15)] text-[var(--cela-success)]" : "bg-[var(--cela-fog)] text-[var(--cela-stone)]"}`}
                        >
                          {" "}
                          {c.isActive ? "Đang hoạt động" : "Đã tắt"}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-4 py-4">
                        {" "}
                        <div className="flex items-center justify-center gap-2">
                          {" "}
                          <button
                            onClick={() => openEdit(c)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                            style={{
                              border: "1px solid var(--cela-mist)",
                            }}
                          >
                            {" "}
                            Sửa{" "}
                          </button>{" "}
                          <button
                            onClick={() => handleToggle(c)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg${c.isActive ? "text-[var(--cela-danger)] hover:bg-[rgba(183,110,121,0.08)]" : "text-[var(--cela-success)] hover:bg-[rgba(107,142,106,0.10)]"}`}
                          >
                            {" "}
                            {c.isActive ? "Tắt" : "Bật"}{" "}
                          </button>{" "}
                        </div>{" "}
                      </td>{" "}
                    </tr>
                  );
                })}{" "}
              </tbody>{" "}
            </table>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Create/Edit Dialog */}{" "}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          {" "}
          <div className="bg-[var(--cela-paper)] rounded-2xl w-full max-w-md">
            {" "}
            <div
              className="flex items-center justify-between p-6"
              style={{
                borderBottom: "1px solid var(--cela-mist)",
              }}
            >
              {" "}
              <h2 className="text-lg font-semibold text-[var(--cela-espresso)]">
                {" "}
                {editingCoupon ? "Sửa coupon" : "Tạo coupon"}{" "}
              </h2>{" "}
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg hover:bg-[var(--cela-fog)]"
              >
                {" "}
                <X className="w-5 h-5 text-[var(--cela-stone)]" />{" "}
              </button>{" "}
            </div>{" "}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                  {" "}
                  Mã coupon{" "}
                  <span className="text-[var(--cela-danger)]">*</span>{" "}
                </label>{" "}
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      code: e.target.value.toUpperCase().replace(/\s/g, ""),
                    }))
                  }
                  placeholder="SUMMER2025"
                  disabled={!!editingCoupon}
                  className="w-full h-10 rounded-lg px-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)] disabled:bg-[var(--cela-fog)]"
                  style={{
                    border: "1px solid var(--cela-mist)",
                  }}
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                  {" "}
                  Khuyến mãi áp dụng{" "}
                  <span className="text-[var(--cela-danger)]">*</span>{" "}
                </label>{" "}
                <select
                  value={form.promotionId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      promotionId: e.target.value,
                    }))
                  }
                  className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                  style={{
                    border: "1px solid var(--cela-mist)",
                  }}
                >
                  {" "}
                  <option value="">-- Chọn khuyến mãi --</option>{" "}
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}{" "}
                </select>{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-3">
                {" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                    Tổng lượt dùng tối đa
                  </label>{" "}
                  <input
                    type="number"
                    value={form.maxUsageTotal}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxUsageTotal: Number(e.target.value),
                      }))
                    }
                    min="1"
                    className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
                    style={{
                      border: "1px solid var(--cela-mist)",
                    }}
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                    Lượt dùng/khách
                  </label>{" "}
                  <input
                    type="number"
                    value={form.maxUsagePerCustomer}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxUsagePerCustomer: Number(e.target.value),
                      }))
                    }
                    min="1"
                    max={form.maxUsageTotal}
                    className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
                    style={{
                      border: "1px solid var(--cela-mist)",
                    }}
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex items-center gap-3">
                {" "}
                <label className="text-sm font-medium text-[var(--cela-cocoa)]">
                  Trạng thái
                </label>{" "}
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      isActive: !f.isActive,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors${form.isActive ? "bg-[var(--cela-rose)]" : "bg-[var(--cela-mist)]"}`}
                >
                  {" "}
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[var(--cela-paper)] transition-transform${form.isActive ? "translate-x-6" : "translate-x-1"}`}
                  />{" "}
                </button>{" "}
                <span className="text-sm text-[var(--cela-stone)]">
                  {form.isActive ? "Đang hoạt động" : "Tắt"}
                </span>{" "}
              </div>{" "}
              <div className="flex gap-3 pt-2">
                {" "}
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 h-10 rounded-xl text-sm font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                  style={{
                    border: "1px solid var(--cela-mist)",
                  }}
                >
                  {" "}
                  Hủy{" "}
                </button>{" "}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 bg-[var(--cela-espresso)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm"
                >
                  {" "}
                  {isSaving
                    ? "Đang lưu..."
                    : editingCoupon
                      ? "Cập nhật"
                      : "Tạo mới"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </ERPLayout>
  );
}
