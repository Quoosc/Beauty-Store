"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types";

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0];

  const costWarning = costPrice && sellingPrice && Number(costPrice) > Number(sellingPrice);
  const expiryWarning = expiryDate && expiryDate > today && expiryDate < thirtyDaysLater;

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !categoryId || !sellingPrice) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    if (expiryDate && expiryDate <= today) {
      toast.error("Ngày hết hạn phải là ngày trong tương lai");
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("sku", sku.trim());
      if (barcode) formData.append("barcode", barcode.trim());
      formData.append("categoryId", categoryId);
      formData.append("sellingPrice", sellingPrice);
      if (costPrice) formData.append("costPrice", costPrice);
      if (expiryDate) formData.append("expiryDate", expiryDate);
      if (description) formData.append("description", description);
      images.forEach((img) => formData.append("images", img));

      await productService.create(formData);
      toast.success("Tạo sản phẩm thành công!");
      router.push("/products");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Tạo sản phẩm thất bại");
    } finally {
      setIsLoading(false);
    }
  }

  const allCategories = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  return (
    <ERPLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-5">
          {/* Tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên sản phẩm"
              className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="SP-001"
                className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="EAN-13 hoặc Code-128"
                className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="">-- Chọn danh mục --</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `  └ ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Giá bán (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá vốn (VND)</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
              />
            </div>
          </div>

          {costWarning && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">Giá vốn lớn hơn giá bán</p>
            </div>
          )}

          {/* Expiry date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày hết hạn</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={today}
              className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
            {expiryWarning && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Sản phẩm sắp hết hạn (dưới 30 ngày)
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả sản phẩm..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 resize-none"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh sản phẩm</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-colors">
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Chọn ảnh (nhiều file)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files ?? []))}
                className="hidden"
              />
            </label>
            {images.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">Đã chọn {images.length} ảnh</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 h-11 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Đang tạo..." : "Tạo sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </ERPLayout>
  );
}
