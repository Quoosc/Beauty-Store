"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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
    async function load() {
      try {
        const [productRes, cats] = await Promise.all([
          productService.getById(id),
          categoryService.getAll(),
        ]);
        const p = productRes.data.data;
        setName(p.name);
        setSku(p.sku);
        setBarcode(p.barcode ?? "");
        setCategoryId(p.category?.id ?? "");
        setSellingPrice(String(p.sellingPrice));
        setCostPrice(String(p.costPrice ?? ""));
        setExpiryDate(p.expiryDate?.split("T")[0] ?? "");
        setDescription(p.description ?? "");
        setCategories(cats);
      } catch {
        toast.error("Không tìm thấy sản phẩm");
        router.push("/products");
      } finally {
        setIsFetching(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !categoryId || !sellingPrice) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
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

      await productService.update(id, formData);
      toast.success("Cập nhật sản phẩm thành công!");
      router.push("/products");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Cập nhật thất bại");
    } finally {
      setIsLoading(false);
    }
  }

  const allCategories = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  if (isFetching) {
    return (
      <ERPLayout>
        <div className="flex justify-center py-20">
          <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </ERPLayout>
    );
  }

  return (
    <ERPLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU <span className="text-red-500">*</span></label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Barcode</label>
              <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục <span className="text-red-500">*</span></label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200">
              <option value="">-- Chọn danh mục --</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.parentId ? `  └ ${c.name}` : c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá bán (VND) <span className="text-red-500">*</span></label>
              <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} min="0" className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá vốn (VND)</label>
              <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} min="0" className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400" />
            </div>
          </div>

          {costWarning && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">Giá vốn lớn hơn giá bán</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày hết hạn</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={today} className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400" />
            {expiryWarning && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Sản phẩm sắp hết hạn (dưới 30 ngày)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thêm ảnh mới</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-sm text-gray-500">Chọn ảnh</span>
              <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files ?? []))} className="hidden" />
            </label>
            {images.length > 0 && <p className="text-xs text-gray-500 mt-1">Đã chọn {images.length} ảnh mới</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 h-11 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={isLoading} className="flex-1 h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </ERPLayout>
  );
}
