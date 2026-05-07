"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import type { Product, Category, ProductStatus } from "@/types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function ManagerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await productService.search({
          q: search || undefined,
          categoryId: categoryFilter !== "ALL" ? categoryFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          page,
          size: 20,
        });
        setProducts(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
      } catch {
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter, page]);

  async function handleDiscontinue(id: string, name: string) {
    if (!confirm(`Ngừng kinh doanh sản phẩm "${name}"?`)) return;
    try {
      await productService.discontinue(id);
      toast.success("Đã ngừng kinh doanh sản phẩm");
      setProducts((ps) => ps.map((p) => p.id === id ? { ...p, status: "DISCONTINUED" } : p));
    } catch {
      toast.error("Thao tác thất bại");
    }
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
          </div>
          <button
            onClick={() => router.push("/products/create")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Thêm sản phẩm
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Tìm tên, SKU..."
              className="h-10 w-full pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
            className="h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none"
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ProductStatus | "ALL"); setPage(0); }}
            className="h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="DISCONTINUED">Ngừng bán</option>
          </select>
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
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Package className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">Không có sản phẩm nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-3 w-16">Ảnh</th>
                  <th className="text-left px-4 py-3">Tên / SKU</th>
                  <th className="text-left px-4 py-3">Danh mục</th>
                  <th className="text-right px-4 py-3">Giá bán</th>
                  <th className="text-right px-4 py-3">Giá vốn</th>
                  <th className="text-center px-4 py-3">Trạng thái</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => {
                  const costWarning = product.costPrice > product.sellingPrice;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {product.imageUrls.length > 0 ? (
                          <img
                            src={productService.getImageUrl(product.imageUrls[0])}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatVND(product.sellingPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        <span>{formatVND(product.costPrice)}</span>
                        {costWarning && (
                          <span className="ml-1 inline-flex items-center" title="Giá vốn > Giá bán">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                          ${product.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {product.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/products/${product.id}/edit`)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Sửa
                          </button>
                          {product.status === "ACTIVE" && (
                            <button
                              onClick={() => handleDiscontinue(product.id, product.name)}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Ngừng KD
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Trang {page + 1} / {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >Trước</button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >Sau</button>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
