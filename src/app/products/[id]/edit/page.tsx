"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types";
import {
  CelaButton,
  CelaCard,
  CelaInput,
  CelaPageHeader,
  CelaSelect,
  CelaSpinner,
  CelaTextArea,
} from "@/components/ui/cela-primitives";
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
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const nextThirty = new Date(now);
  nextThirty.setDate(now.getDate() + 30);
  const thirtyDaysLater = nextThirty.toISOString().split("T")[0];
  const costWarning =
    costPrice && sellingPrice && Number(costPrice) > Number(sellingPrice);
  const expiryWarning =
    expiryDate && expiryDate > today && expiryDate < thirtyDaysLater;
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
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;
      toast.error(msg || "Cập nhật thất bại");
    } finally {
      setIsLoading(false);
    }
  }
  const allCategories = categories.flatMap((c) => [c, ...(c.children ?? [])]);
  if (isFetching) {
    return (
      <ERPLayout>
        {" "}
        <CelaSpinner />{" "}
      </ERPLayout>
    );
  }
  return (
    <ERPLayout>
      {" "}
      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {" "}
        <CelaPageHeader
          eyebrow="Catalog"
          title="Chỉnh sửa sản phẩm"
          actions={
            <CelaButton variant="secondary" onClick={() => router.back()}>
              {" "}
              <ArrowLeft
                style={{
                  width: 14,
                  height: 14,
                }}
              />{" "}
              Quay lại{" "}
            </CelaButton>
          }
        />{" "}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 1fr",
            gap: 16,
          }}
        >
          {" "}
          <CelaCard
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            {" "}
            <div>
              {" "}
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--cela-cocoa)",
                  margin: "0 0 12px",
                }}
              >
                {" "}
                Thông tin cơ bản{" "}
              </p>{" "}
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {" "}
                <CelaInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên sản phẩm"
                />{" "}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {" "}
                  <CelaInput
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="SKU"
                  />{" "}
                  <CelaInput
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Barcode"
                  />{" "}
                </div>{" "}
                <CelaTextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả"
                />{" "}
              </div>{" "}
            </div>{" "}
            <div>
              {" "}
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--cela-cocoa)",
                  margin: "0 0 12px",
                }}
              >
                {" "}
                Giá & Danh mục{" "}
              </p>{" "}
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {" "}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {" "}
                  <CelaInput
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="Giá vốn"
                    min="0"
                  />{" "}
                  <CelaInput
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="Giá bán"
                    min="0"
                  />{" "}
                </div>{" "}
                {costWarning && (
                  <div
                    style={{
                      background: "rgba(201,168,122,0.14)",
                      border: "1px solid rgba(201,168,122,0.4)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {" "}
                    <AlertTriangle
                      style={{
                        width: 14,
                        height: 14,
                        color: "var(--cela-gold)",
                      }}
                    />{" "}
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "var(--cela-cocoa)",
                      }}
                    >
                      Giá vốn lớn hơn giá bán
                    </p>{" "}
                  </div>
                )}{" "}
                <CelaSelect
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {" "}
                  <option value="">-- Chọn danh mục --</option>{" "}
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {" "}
                      {c.parentId ? `└ ${c.name}` : c.name}{" "}
                    </option>
                  ))}{" "}
                </CelaSelect>{" "}
              </div>{" "}
            </div>{" "}
            <div>
              {" "}
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--cela-cocoa)",
                  margin: "0 0 12px",
                }}
              >
                {" "}
                Tồn kho{" "}
              </p>{" "}
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {" "}
                <CelaInput
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={today}
                />{" "}
                {expiryWarning && (
                  <div
                    style={{
                      background: "rgba(201,168,122,0.14)",
                      border: "1px solid rgba(201,168,122,0.4)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {" "}
                    <AlertTriangle
                      style={{
                        width: 14,
                        height: 14,
                        color: "var(--cela-gold)",
                      }}
                    />{" "}
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "var(--cela-cocoa)",
                      }}
                    >
                      Sắp đến hạn (dưới 30 ngày)
                    </p>{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </div>{" "}
          </CelaCard>{" "}
          <CelaCard
            style={{
              height: "fit-content",
              display: "grid",
              gap: 12,
            }}
          >
            {" "}
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                margin: 0,
              }}
            >
              {" "}
              Ảnh & Trạng thái{" "}
            </p>{" "}
            <label
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 140,
                borderRadius: 12,
                border: "1px dashed var(--cela-mist)",
                background: "var(--cela-fog)",
                cursor: "pointer",
                textAlign: "center",
                padding: 12,
              }}
            >
              {" "}
              <Upload
                style={{
                  width: 18,
                  height: 18,
                  color: "var(--cela-stone)",
                  marginBottom: 6,
                }}
              />{" "}
              <span
                style={{
                  fontSize: 12,
                  color: "var(--cela-stone)",
                }}
              >
                Kéo thả ảnh hoặc nhấn để chọn
              </span>{" "}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files ?? []))}
                style={{
                  display: "none",
                }}
              />{" "}
            </label>{" "}
            {images.length > 0 && (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--cela-stone)",
                }}
              >
                Đã chọn {images.length} ảnh mới
              </p>
            )}{" "}
          </CelaCard>{" "}
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            {" "}
            <CelaButton
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              {" "}
              Hủy{" "}
            </CelaButton>{" "}
            <CelaButton type="submit" variant="primary" disabled={isLoading}>
              {" "}
              {isLoading ? "Đang lưu..." : "Lưu"}{" "}
            </CelaButton>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </ERPLayout>
  );
}
