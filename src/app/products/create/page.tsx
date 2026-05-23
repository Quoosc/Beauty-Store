"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { accountService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import type { Category } from "@/types";
export default function CreateProductPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableBranchIds, setAvailableBranchIds] = useState<string[]>([]);
  const [adminBranchId, setAdminBranchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];
  const costWarning =
    costPrice && sellingPrice && Number(costPrice) > Number(sellingPrice);
  const expiryWarning =
    expiryDate && expiryDate > today && expiryDate < thirtyDaysLater;
  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
    if (isAdmin) {
      accountService.getAll()
        .then((res) => {
          const ids = [...new Set(
            (res.data.data as { branchId?: string | null }[])
              .map((a) => a.branchId)
              .filter((b): b is string => !!b)
          )];
          setAvailableBranchIds(ids);
          if (ids.length > 0) setAdminBranchId(ids[0]);
        })
        .catch(() => {});
    }
  }, [isAdmin]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !categoryId || !sellingPrice || !unit.trim()) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    if (isAdmin && !adminBranchId) {
      toast.error("Vui lòng chọn chi nhánh");
      return;
    }
    if (expiryDate && expiryDate <= today) {
      toast.error("Ngày hết hạn phải là ngày trong tương lai");
      return;
    }
    setIsLoading(true);
    try {
      const branchId = isAdmin ? adminBranchId : user?.branchId;
      const payload: Record<string, unknown> = {
        name: name.trim(),
        sku: sku.trim(),
        categoryId,
        unit: unit.trim(),
        sellingPrice: Number(sellingPrice),
        ...(branchId ? { branchId } : {}),
      };
      if (barcode.trim()) payload.barcode = barcode.trim();
      if (costPrice) payload.costPrice = Number(costPrice);
      if (expiryDate) payload.expiryDate = expiryDate;
      if (description.trim()) payload.description = description.trim();

      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
      if (images[0]) formData.append("image", images[0]);

      await productService.create(formData);
      toast.success("Tạo sản phẩm thành công!");
      router.push("/products");
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;
      toast.error(msg || "Tạo sản phẩm thất bại");
    } finally {
      setIsLoading(false);
    }
  }
  const allCategories = categories.flatMap((c) => [c, ...(c.children ?? [])]);
  return (
    <ERPLayout>
      {" "}
      <div className="max-w-2xl">
        {" "}
        <div className="flex items-center gap-3 mb-6">
          {" "}
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-[var(--cela-fog)]"
          >
            {" "}
            <ArrowLeft className="w-5 h-5 text-[var(--cela-stone)]" />{" "}
          </button>{" "}
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
              Thêm sản phẩm{" "}
              <span
                style={{
                  color: "var(--cela-rose)",
                }}
              >
                mới
              </span>
            </h1>
          </div>{" "}
        </div>{" "}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--cela-paper)] rounded-xl p-8 space-y-5"
        >
          {" "}
          {/* Tên */}{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
              {" "}
              Tên sản phẩm{" "}
              <span className="text-[var(--cela-danger)]">*</span>{" "}
            </label>{" "}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên sản phẩm"
              className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          {/* SKU & Barcode */}{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                {" "}
                SKU <span className="text-[var(--cela-danger)]">*</span>{" "}
              </label>{" "}
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="SP-001"
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                Barcode
              </label>{" "}
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="EAN-13 hoặc Code-128"
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              />{" "}
            </div>{" "}
          </div>{" "}
          {/* Unit */}{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
              {" "}
              Đơn vị tính <span className="text-[var(--cela-danger)]">*</span>{" "}
            </label>{" "}
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Cái, Hộp, Chai, Tuýp..."
              className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          {/* Branch selector — chỉ hiện cho ADMIN */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                Chi nhánh <span className="text-[var(--cela-danger)]">*</span>
              </label>
              <select
                value={adminBranchId}
                onChange={(e) => setAdminBranchId(e.target.value)}
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                style={{ border: "1px solid var(--cela-mist)" }}
              >
                <option value="">-- Chọn chi nhánh --</option>
                {availableBranchIds.map((id) => (
                  <option key={id} value={id}>
                    Chi nhánh {id.slice(0, 8)}…
                  </option>
                ))}
              </select>
            </div>
          )}{" "}
          {/* Category */}{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
              {" "}
              Danh mục <span className="text-[var(--cela-danger)]">*</span>{" "}
            </label>{" "}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            >
              {" "}
              <option value="">-- Chọn danh mục --</option>{" "}
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {" "}
                  {c.parentId ? ` └ ${c.name}` : c.name}{" "}
                </option>
              ))}{" "}
            </select>{" "}
          </div>{" "}
          {/* Prices */}{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                {" "}
                Giá bán (VND){" "}
                <span className="text-[var(--cela-danger)]">*</span>{" "}
              </label>{" "}
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                Giá vốn (VND)
              </label>{" "}
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              />{" "}
            </div>{" "}
          </div>{" "}
          {costWarning && (
            <div className="flex items-center gap-2 p-3 bg-[rgba(201,168,122,0.14)] border border-amber-200 rounded-lg">
              {" "}
              <AlertTriangle className="w-4 h-4 text-[var(--cela-gold)] flex-shrink-0" />{" "}
              <p className="text-sm text-[var(--cela-gold)]">
                Giá vốn lớn hơn giá bán
              </p>{" "}
            </div>
          )}{" "}
          {/* Expiry date */}{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
              Ngày hết hạn
            </label>{" "}
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={today}
              className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
            {expiryWarning && (
              <p className="text-[var(--cela-gold)] text-xs mt-1 flex items-center gap-1">
                {" "}
                <AlertTriangle className="w-3 h-3" /> Sản phẩm sắp hết hạn (dưới
                30 ngày){" "}
              </p>
            )}{" "}
          </div>{" "}
          {/* Description */}{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
              Mô tả
            </label>{" "}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả sản phẩm..."
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)] resize-none"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          {/* Images */}{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
              Ảnh sản phẩm
            </label>{" "}
            <label
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-[rgba(183,110,121,0.35)] hover:bg-[rgba(183,110,121,0.08)] transition-colors"
              style={{
                borderColor: "var(--cela-mist)",
              }}
            >
              {" "}
              <Upload className="w-6 h-6 text-[var(--cela-stone)] mb-2" />{" "}
              <span className="text-sm text-[var(--cela-stone)]">
                Chọn ảnh sản phẩm
              </span>{" "}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files ?? []))}
                className="hidden"
              />{" "}
            </label>{" "}
            {images.length > 0 && (
              <p className="text-xs text-[var(--cela-stone)] mt-1">
                Đã chọn {images.length} ảnh
              </p>
            )}{" "}
          </div>{" "}
          <div className="flex gap-3 pt-2">
            {" "}
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-11 rounded-xl text-sm font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            >
              {" "}
              Hủy{" "}
            </button>{" "}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 bg-[var(--cela-espresso)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {" "}
              {isLoading ? "Đang tạo..." : "Tạo sản phẩm"}{" "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </ERPLayout>
  );
}
