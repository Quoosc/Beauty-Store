"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Package, AlertTriangle, Clock, MoreVertical, Edit2, Copy, Ban } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import type { Product, Category, ProductStatus } from "@/types";
import { CelaButton, CelaCard, CelaInput, CelaSpinner, CelaEmptyState } from "@/components/ui/cela-primitives";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const STATUS_TABS: { key: ProductStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ACTIVE", label: "Đang bán" },
  { key: "DISCONTINUED", label: "Ngừng bán" },
];

export default function ProductsPage() {
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
        // BE trả CatalogPagedData: { products, total } — không phải { content, totalElements }
        setProducts(res.data.data.products ?? []);
        setTotalPages(Math.ceil((res.data.data.total ?? 0) / 20) || 1);
      } catch {
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter, page]);

  async function handleDiscontinue(id: string) {
    const name = products.find((p) => p.id === id)?.name ?? "sản phẩm này";
    if (!confirm(`Ngừng kinh doanh ${name}?`)) return;
    try {
      await productService.discontinue(id);
      toast.success("Đã ngừng kinh doanh sản phẩm");
      setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, status: "DISCONTINUED" } : p)));
    } catch {
      toast.error("Thao tác thất bại");
    }
  }

  return (
    <ERPLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 4px" }}>
              Danh mục sản phẩm
            </p>
            <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 500, color: "var(--cela-espresso)", margin: 0, letterSpacing: "-0.01em" }}>
              Quản lý <span style={{ fontStyle: "italic", color: "var(--cela-rose)" }}>sản phẩm</span>
            </h1>
          </div>
          <CelaButton variant="primary" onClick={() => router.push("/products/create")}>
            <Plus style={{ width: 16, height: 16 }} /> Thêm sản phẩm
          </CelaButton>
        </div>

        {/* Filters */}
        <CelaCard style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--cela-stone)" }} />
            <CelaInput
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Tìm tên, SKU..."
              style={{ paddingLeft: 38 }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
            style={{ height: 40, border: "1.5px solid var(--cela-mist)", borderRadius: 10, padding: "0 12px", fontSize: 13, color: "var(--cela-espresso)", background: "var(--cela-paper)", outline: "none", fontFamily: "var(--cela-body)" }}
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setStatusFilter(t.key); setPage(0); }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--cela-body)",
                  background: statusFilter === t.key ? "var(--cela-espresso)" : "var(--cela-mist)",
                  color: statusFilter === t.key ? "var(--cela-champagne)" : "var(--cela-stone)",
                  transition: "background 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CelaCard>

        {/* Table */}
        <CelaCard style={{ padding: 0, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
              <CelaSpinner padding="0" />
            </div>
          ) : products.length === 0 ? (
            <CelaEmptyState icon={<Package style={{ width: 40, height: 40 }} />} title="Không có sản phẩm nào" />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--cela-fog)", borderBottom: "1px solid var(--cela-mist)" }}>
                  {["Ảnh", "Tên / SKU", "Danh mục", "Giá bán", "Giá vốn", "Hạn dùng", "Trạng thái", "Thao tác"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--cela-cocoa)",
                        textAlign: i === 0 || i === 7 ? "center" : i >= 3 && i <= 5 ? "right" : "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const costWarning = (product.costPrice ?? 0) > product.sellingPrice;
                  return (
                    <tr key={product.id} style={{ borderBottom: "1px solid var(--cela-fog)" }}>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {product.imageUrl !== null ? (
                          <img
                            src={productService.getImageUrl(product.imageUrl!)}
                            alt={product.name}
                            style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: 48, height: 48, background: "var(--cela-fog)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package style={{ width: 20, height: 20, color: "var(--cela-stone)" }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--cela-espresso)" }}>{product.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--cela-stone)", fontFamily: "var(--cela-mono)" }}>{product.sku}</p>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--cela-stone)" }}>
                        {"—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--cela-espresso)", fontFamily: "var(--cela-mono)" }}>
                        {formatVND(product.sellingPrice)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, color: "var(--cela-stone)", fontFamily: "var(--cela-mono)" }}>
                        <span>{formatVND(product.costPrice)}</span>
                        {costWarning && (
                          <span title="Giá vốn > Giá bán" style={{ marginLeft: 4 }}>
                            <AlertTriangle style={{ width: 14, height: 14, color: "var(--cela-gold)", display: "inline-block", verticalAlign: "middle" }} />
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {product.expiryDate ? (
                          (() => {
                            const days = Math.ceil((new Date(product.expiryDate).getTime() - Date.now()) / 86400000);
                            const color = days <= 7 ? "var(--cela-danger)" : days <= 30 ? "var(--cela-gold)" : "var(--cela-stone)";
                            return (
                              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, fontWeight: 500, color }}>
                                {days <= 30 && <Clock style={{ width: 12, height: 12 }} />}
                                {new Date(product.expiryDate).toLocaleDateString("vi-VN")}
                              </span>
                            );
                          })()
                        ) : (
                          <span style={{ color: "var(--cela-mist)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: product.status === "ACTIVE" ? "rgba(107,142,106,0.15)" : "var(--cela-fog)",
                          color: product.status === "ACTIVE" ? "var(--cela-success)" : "var(--cela-stone)",
                        }}>
                          {product.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ position: "relative", display: "flex", justifyContent: "center" }} className="group">
                          <button style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--cela-stone)" }} className="hover:bg-[var(--cela-fog)]">
                            <MoreVertical style={{ width: 16, height: 16 }} />
                          </button>
                          <div style={{ position: "absolute", right: 0, top: 32, width: 160, background: "var(--cela-paper)", borderRadius: 12, boxShadow: "var(--cela-shadow-md)", border: "1px solid var(--cela-mist)", zIndex: 50 }} className="hidden group-hover:block">
                            <button
                              onClick={() => router.push(`/products/${product.id}/edit`)}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 13, color: "var(--cela-espresso)", background: "transparent", border: "none", cursor: "pointer", borderRadius: "12px 12px 0 0", fontFamily: "var(--cela-body)" }}
                              className="hover:bg-[var(--cela-fog)]"
                            >
                              <Edit2 style={{ width: 14, height: 14 }} /> Chỉnh sửa
                            </button>
                            <button
                              onClick={() => router.push("/products/create")}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 13, color: "var(--cela-espresso)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--cela-body)" }}
                              className="hover:bg-[var(--cela-fog)]"
                            >
                              <Copy style={{ width: 14, height: 14 }} /> Nhân bản
                            </button>
                            <button
                              onClick={() => handleDiscontinue(product.id)}
                              disabled={product.status === "DISCONTINUED"}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 13, color: "var(--cela-danger)", background: "transparent", border: "none", cursor: "pointer", borderRadius: "0 0 12px 12px", fontFamily: "var(--cela-body)", opacity: product.status === "DISCONTINUED" ? 0.4 : 1 }}
                              className="hover:bg-[var(--cela-fog)]"
                            >
                              <Ban style={{ width: 14, height: 14 }} /> Ngừng kinh doanh
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CelaCard>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, color: "var(--cela-stone)", margin: 0 }}>
              Trang {page + 1} / {totalPages}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <CelaButton variant="secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Trước
              </CelaButton>
              <CelaButton variant="secondary" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                Sau
              </CelaButton>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
