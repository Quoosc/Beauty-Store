"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Edit2, Package, Ban } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { productService } from "@/services/product.service";
import { useAuthStore } from "@/stores/auth.store";
import type { Product } from "@/types";

type ProductDetail = Product & {
  description?: string | null;
};

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const user = useAuthStore((s) => s.user);

  const id = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [todayMs] = useState(() => Date.now());

  const canManage = user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER";

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const res = await productService.getById(id);
        if (mounted) {
          setProduct(res.data.data);
          setActiveImage(0);
        }
      } catch {
        toast.error("Không tìm thấy sản phẩm");
        router.push("/products");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id, router]);

  const expiryDate = product?.expiryDate ?? null;

  const expiryInfo = useMemo(() => {
    if (!expiryDate) {
      return null;
    }

    const days = Math.ceil(
      (new Date(expiryDate).getTime() - todayMs) / 86400000
    );

    return {
      days,
      isNear: days < 30,
      text: new Date(expiryDate).toLocaleDateString("vi-VN"),
    };
  }, [expiryDate, todayMs]);

  async function handleDiscontinue() {
    if (!product) return;

    if (!confirm(`Ngừng bán sản phẩm "${product.name}"?`)) {
      return;
    }

    try {
      setIsUpdating(true);
      await productService.discontinue(product.id);
      toast.success("Đã ngừng bán sản phẩm");
      setProduct({ ...product, status: "DISCONTINUED" });
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <ERPLayout>
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </ERPLayout>
    );
  }

  if (!product) {
    return null;
  }

  const imageUrls = product.imageUrl ? [product.imageUrl] : [];
  const description = product.description?.trim();

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
              BEAUTY ERP
            </p>
            <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
              Chi tiết <span style={{ color: "var(--cela-rose)" }}>sản phẩm</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/products")}
              className="px-3 py-2 rounded-lg text-sm hover:bg-[var(--cela-fog)]"
              style={{ border: "1px solid var(--cela-mist)" }}
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Danh sách
            </button>

            {canManage && (
              <>
                <button
                  onClick={() => router.push(`/products/${product.id}/edit`)}
                  className="px-3 py-2 rounded-lg text-sm hover:bg-[var(--cela-fog)]"
                  style={{ border: "1px solid var(--cela-mist)" }}
                >
                  <Edit2 className="w-4 h-4 inline mr-1" /> Sửa
                </button>

                {product.status === "ACTIVE" && (
                  <button
                    onClick={handleDiscontinue}
                    disabled={isUpdating}
                    className="px-3 py-2 rounded-lg text-sm text-[var(--cela-danger)] hover:bg-[rgba(183,110,121,0.08)] disabled:opacity-50"
                    style={{ border: "1px solid var(--cela-mist)" }}
                  >
                    <Ban className="w-4 h-4 inline mr-1" /> Ngừng bán
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[var(--cela-paper)] rounded-xl p-4" style={{ border: "1px solid var(--cela-mist)" }}>
            {imageUrls.length > 0 ? (
              <>
                <img
                  src={productService.getImageUrl(imageUrls[activeImage])}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                {imageUrls.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {imageUrls.map((img, index) => (
                      <button
                        key={img + index}
                        onClick={() => setActiveImage(index)}
                        className={`rounded-md overflow-hidden ${activeImage === index ? "ring-2 ring-[var(--cela-rose)]" : "opacity-80"}`}
                      >
                        <img src={productService.getImageUrl(img)} alt={`${product.name}-${index + 1}`} className="w-full h-16 object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-square rounded-lg bg-[var(--cela-fog)] flex items-center justify-center">
                <Package className="w-10 h-10 text-[var(--cela-stone)]" />
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-[var(--cela-paper)] rounded-xl p-6" style={{ border: "1px solid var(--cela-mist)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoRow label="Tên sản phẩm" value={product.name} />
              <InfoRow label="SKU" value={product.sku} mono />
              <InfoRow label="Barcode" value={product.barcode || "-"} mono />
              <InfoRow label="Danh mục" value={product.categoryId || "-"} />
              <InfoRow label="Giá bán" value={formatVND(product.sellingPrice)} mono />
              <InfoRow label="Giá vốn" value={product.costPrice === null ? "-" : formatVND(product.costPrice)} mono />

              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--cela-stone)] mb-1">Trạng thái</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${product.status === "ACTIVE" ? "bg-[rgba(107,142,106,0.15)] text-[var(--cela-success)]" : "bg-[var(--cela-fog)] text-[var(--cela-stone)]"}`}>
                  {product.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--cela-stone)] mb-1">Hạn sử dụng</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--cela-espresso)]">{expiryInfo?.text || "Không có"}</span>
                  {expiryInfo?.isNear && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[rgba(183,110,121,0.12)] text-[var(--cela-danger)]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Còn {expiryInfo.days} ngày
                    </span>
                  )}
                </div>
              </div>
            </div>

            {description && (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-wider text-[var(--cela-stone)] mb-1">Mô tả</p>
                <p className="text-sm text-[var(--cela-cocoa)] leading-6">{description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--cela-stone)] mb-1">{label}</p>
      <p className={`text-sm text-[var(--cela-espresso)] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
