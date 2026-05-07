"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types";

interface CategoryDialogProps {
  open: boolean;
  mode: "create" | "edit";
  parentId?: string | null;
  initial?: { id: string; name: string };
  onClose: () => void;
  onSuccess: () => void;
}

function CategoryDialog({ open, mode, parentId, initial, onClose, onSuccess }: CategoryDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { setName(initial?.name ?? ""); }, [initial]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Vui lòng nhập tên danh mục"); return; }
    setIsLoading(true);
    try {
      if (mode === "create") {
        await categoryService.create({ name: name.trim(), parentId: parentId ?? null });
        toast.success("Tạo danh mục thành công!");
      } else if (initial) {
        await categoryService.update(initial.id, { name: name.trim() });
        toast.success("Cập nhật danh mục thành công!");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Thao tác thất bại");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {mode === "create" ? (parentId ? "Thêm danh mục con" : "Thêm danh mục cha") : "Sửa danh mục"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên danh mục</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên danh mục..."
              autoFocus
              className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-10 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-10 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {isLoading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
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
    initial?: { id: string; name: string };
  }>({ open: false, mode: "create" });

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

  useEffect(() => { loadCategories(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await categoryService.delete(id);
      toast.success("Đã xóa danh mục");
      loadCategories();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) toast.error("Không thể xóa danh mục đang có sản phẩm");
      else toast.error("Xóa thất bại");
    }
  }

  const parents = categories.filter((c) => !c.parentId);

  return (
    <ERPLayout>
      <CategoryDialog
        {...dialog}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSuccess={loadCategories}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          </div>
          <button
            onClick={() => setDialog({ open: true, mode: "create", parentId: null })}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Thêm danh mục cha
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : parents.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có danh mục nào</p>
            </div>
          ) : (
            <div>
              {parents.map((parent) => {
                const children = categories.filter((c) => c.parentId === parent.id);
                const isExpanded = expanded.has(parent.id);
                return (
                  <div key={parent.id} className="border-b border-gray-50 last:border-0">
                    {/* Parent row */}
                    <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <button
                        onClick={() => setExpanded((e) => {
                          const n = new Set(e);
                          if (n.has(parent.id)) n.delete(parent.id); else n.add(parent.id);
                          return n;
                        })}
                        className="p-1 text-gray-400"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <span className="flex-1 font-semibold text-gray-900">{parent.name}</span>
                      <span className="text-xs text-gray-400">{children.length} danh mục con</span>
                      <div className="flex gap-1 ml-4">
                        <button
                          onClick={() => setDialog({ open: true, mode: "create", parentId: parent.id })}
                          className="px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                          + Thêm con
                        </button>
                        <button
                          onClick={() => setDialog({ open: true, mode: "edit", initial: { id: parent.id, name: parent.name } })}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(parent.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Children rows */}
                    {isExpanded && children.map((child) => (
                      <div key={child.id} className="flex items-center gap-2 px-6 py-3 pl-16 border-t border-gray-50 hover:bg-pink-50 transition-colors">
                        <span className="flex-1 text-sm text-gray-900">{child.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setDialog({ open: true, mode: "edit", initial: { id: child.id, name: child.name } })}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ERPLayout>
  );
}
