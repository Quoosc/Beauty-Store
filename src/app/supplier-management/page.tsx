"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { supplierService } from "@/services/supplier.service";
import type { Supplier } from "@/types";

interface SupplierForm {
  name: string;
  taxCode: string;
  phone: string;
  address: string;
}

const emptyForm: SupplierForm = { name: "", taxCode: "", phone: "", address: "" };

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const data = await supplierService.getAll({ search: search || undefined });
      setSuppliers(Array.isArray(data) ? data : data?.content ?? []);
    } catch {
      toast.error("Không thể tải danh sách nhà cung cấp");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      taxCode: supplier.taxCode,
      phone: supplier.phone,
      address: supplier.address,
    });
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Tên nhà cung cấp là bắt buộc"); return; }
    setIsSaving(true);
    try {
      if (editing) {
        await supplierService.update(editing.id, form);
        toast.success("Đã cập nhật nhà cung cấp");
      } else {
        await supplierService.create(form as Omit<Supplier, "id">);
        toast.success("Đã thêm nhà cung cấp");
      }
      closeDialog();
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  }

  const filtered = suppliers.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.taxCode.includes(search)
  );

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Nhà cung cấp</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Thêm nhà cung cấp
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã số thuế..."
              className="h-10 w-full pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
          </div>
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Truck className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">Không có nhà cung cấp nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Tên nhà cung cấp</th>
                  <th className="text-left px-4 py-3">Mã số thuế</th>
                  <th className="text-left px-4 py-3">SĐT</th>
                  <th className="text-left px-4 py-3">Địa chỉ</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-mono">{supplier.taxCode || "—"}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{supplier.phone || "—"}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                      <p className="truncate" title={supplier.address}>{supplier.address || "—"}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => openEdit(supplier)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
              </h2>
              <button onClick={closeDialog} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Tên nhà cung cấp"
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã số thuế</label>
                <input
                  type="text"
                  value={form.taxCode}
                  onChange={(e) => setForm((f) => ({ ...f, taxCode: e.target.value }))}
                  placeholder="0123456789"
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0901234567"
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  rows={2}
                  placeholder="Địa chỉ nhà cung cấp"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="flex-1 h-10 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !form.name.trim()}
                  className="flex-1 h-10 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm"
                >
                  {isSaving ? "Đang lưu..." : (editing ? "Cập nhật" : "Thêm mới")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
