"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types";
interface CategoryDialogProps {
  open: boolean;
  mode: "create" | "edit";
  parentId?: string | null;
  initial?: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}
function CategoryDialog({
  open,
  mode,
  parentId,
  initial,
  onClose,
  onSuccess,
}: CategoryDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setName(initial?.name ?? "");
  }, [initial]);
  if (!open) return null;
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    setIsLoading(true);
    try {
      if (mode === "create") {
        await categoryService.create({
          name: name.trim(),
          parentId: parentId ?? null,
        });
        toast.success("Tạo danh mục thành công!");
      } else if (initial) {
        await categoryService.update(initial.id, {
          name: name.trim(),
        });
        toast.success("Cập nhật danh mục thành công!");
      }
      onSuccess();
      onClose();
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
      toast.error(msg || "Thao tác thất bại");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(60,46,42,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {" "}
      <div
        style={{
          background: "var(--cela-paper)",
          borderRadius: 16,
          boxShadow: "var(--cela-shadow-md)",
          width: "100%",
          maxWidth: 380,
          padding: 24,
          border: "1px solid var(--cela-mist)",
        }}
      >
        {" "}
        <h2 className="text-lg font-bold text-[var(--cela-espresso)] mb-4">
          {" "}
          {mode === "create"
            ? parentId
              ? "Thêm danh mục con"
              : "Thêm danh mục cha"
            : "Sửa danh mục"}{" "}
        </h2>{" "}
        <form onSubmit={handleSubmit} className="space-y-4">
          {" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
              Tên danh mục
            </label>{" "}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên danh mục..."
              autoFocus
              className="w-full h-11 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] focus:border-[var(--cela-rose)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          <div className="flex gap-3">
            {" "}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg text-sm text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
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
              className="flex-1 h-10 bg-[var(--cela-espresso)] text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {" "}
              {isLoading ? "Đang lưu..." : "Lưu"}{" "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </div>
  );
}
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    parentId?: string | null;
    initial?: {
      id: string;
      name: string;
    };
  }>({
    open: false,
    mode: "create",
  });
  async function loadCategories() {
    setIsLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {
      toast.error("Không thể tải danh mục");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    loadCategories();
  }, []);
  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await categoryService.delete(id);
      toast.success("Đã xóa danh mục");
      loadCategories();
    } catch (err: unknown) {
      const status = (
        err as {
          response?: {
            status?: number;
          };
        }
      )?.response?.status;
      if (status === 409)
        toast.error("Không thể xóa danh mục đang có sản phẩm");
      else toast.error("Xóa thất bại");
    }
  }
  const parents = categories.filter((c) => !c.parentId);
  return (
    <ERPLayout>
      {" "}
      <CategoryDialog
        {...dialog}
        onClose={() =>
          setDialog((d) => ({
            ...d,
            open: false,
          }))
        }
        onSuccess={loadCategories}
      />{" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <Tag className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
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
                Quản lý{" "}
                <span
                  style={{
                    color: "var(--cela-rose)",
                  }}
                >
                  danh mục
                </span>
              </h1>
            </div>{" "}
          </div>{" "}
          <button
            onClick={() =>
              setDialog({
                open: true,
                mode: "create",
                parentId: null,
              })
            }
            className="flex items-center gap-2 px-4 py-2 bg-[var(--cela-espresso)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            {" "}
            <Plus className="w-4 h-4" /> Thêm danh mục cha{" "}
          </button>{" "}
        </div>{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {" "}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
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
          ) : parents.length === 0 ? (
            <div className="py-12 text-center">
              {" "}
              <Tag className="w-12 h-12 text-[var(--cela-mist)] mx-auto mb-3" />{" "}
              <p className="text-[var(--cela-stone)]">
                Chưa có danh mục nào
              </p>{" "}
            </div>
          ) : (
            <div>
              {" "}
              {parents.map((parent) => {
                const children = categories.filter(
                  (c) => c.parentId === parent.id,
                );
                const isExpanded = expanded.has(parent.id);
                return (
                  <div
                    key={parent.id}
                    className="last:border-0"
                    style={{
                      borderBottom: "1px solid var(--cela-mist)",
                    }}
                  >
                    {" "}
                    {/* Parent row */}{" "}
                    <div className="flex items-center gap-2 px-6 py-4 bg-[var(--cela-fog)] hover:bg-[var(--cela-fog)] transition-colors">
                      {" "}
                      <button
                        onClick={() =>
                          setExpanded((e) => {
                            const n = new Set(e);
                            if (n.has(parent.id)) n.delete(parent.id);
                            else n.add(parent.id);
                            return n;
                          })
                        }
                        className="p-1 text-[var(--cela-stone)]"
                      >
                        {" "}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}{" "}
                      </button>{" "}
                      <span className="flex-1 font-semibold text-[var(--cela-espresso)]">
                        {parent.name}
                      </span>{" "}
                      <span className="text-xs text-[var(--cela-stone)]">
                        {children.length} danh mục con
                      </span>{" "}
                      <div className="flex gap-1 ml-4">
                        {" "}
                        <button
                          onClick={() =>
                            setDialog({
                              open: true,
                              mode: "create",
                              parentId: parent.id,
                            })
                          }
                          className="px-3 py-1 text-xs text-[var(--cela-cocoa)] border border-blue-200 rounded-lg hover:bg-[rgba(120,140,180,0.12)]"
                        >
                          {" "}
                          + Thêm con{" "}
                        </button>{" "}
                        <button
                          onClick={() =>
                            setDialog({
                              open: true,
                              mode: "edit",
                              initial: {
                                id: parent.id,
                                name: parent.name,
                              },
                            })
                          }
                          className="p-1.5 text-[var(--cela-stone)] hover:text-[var(--cela-cocoa)] rounded-lg hover:bg-[var(--cela-mist)]"
                        >
                          {" "}
                          <Pencil className="w-3.5 h-3.5" />{" "}
                        </button>{" "}
                        <button
                          onClick={() => handleDelete(parent.id)}
                          className="p-1.5 text-[var(--cela-stone)] hover:text-[var(--cela-danger)] rounded-lg hover:bg-[rgba(183,110,121,0.08)]"
                        >
                          {" "}
                          <Trash2 className="w-3.5 h-3.5" />{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Children rows */}{" "}
                    {isExpanded &&
                      children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 px-6 py-3 pl-16 hover:bg-[rgba(183,110,121,0.08)] transition-colors"
                          style={{
                            borderTop: "1px solid var(--cela-mist)",
                          }}
                        >
                          {" "}
                          <span className="flex-1 text-sm text-[var(--cela-espresso)]">
                            {child.name}
                          </span>{" "}
                          <div className="flex gap-1">
                            {" "}
                            <button
                              onClick={() =>
                                setDialog({
                                  open: true,
                                  mode: "edit",
                                  initial: {
                                    id: child.id,
                                    name: child.name,
                                  },
                                })
                              }
                              className="p-1.5 text-[var(--cela-stone)] hover:text-[var(--cela-cocoa)] rounded-lg hover:bg-[var(--cela-mist)]"
                            >
                              {" "}
                              <Pencil className="w-3.5 h-3.5" />{" "}
                            </button>{" "}
                            <button
                              onClick={() => handleDelete(child.id)}
                              className="p-1.5 text-[var(--cela-stone)] hover:text-[var(--cela-danger)] rounded-lg hover:bg-[rgba(183,110,121,0.08)]"
                            >
                              {" "}
                              <Trash2 className="w-3.5 h-3.5" />{" "}
                            </button>{" "}
                          </div>{" "}
                        </div>
                      ))}{" "}
                  </div>
                );
              })}{" "}
            </div>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </ERPLayout>
  );
}
