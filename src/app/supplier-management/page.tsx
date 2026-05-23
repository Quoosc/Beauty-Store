"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Truck } from "lucide-react";
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

const emptyForm: SupplierForm = {
  name: "",
  taxCode: "",
  phone: "",
  address: "",
};

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
      const data = await supplierService.getAll({
        search: search || undefined,
        page: 0,
        size: 100,
        includeInactive: true,
      });
      setSuppliers(Array.isArray(data) ? data : (data?.content ?? []));
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
    if (!form.name.trim()) {
      toast.error("Tên nhà cung cấp là bắt buộc");
      return;
    }

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
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Lưu thất bại";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(supplier: Supplier) {
    if (!confirm(`Bạn có chắc chắn muốn vô hiệu hóa nhà cung cấp "${supplier.name}"?`)) return;

    try {
      await supplierService.deactivate(supplier.id);
      toast.success("Đã vô hiệu hóa nhà cung cấp");
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Vô hiệu hóa thất bại";
      toast.error(msg);
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.taxCode?.includes(search)
  );

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-[var(--cela-rose)]" />
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
                BEAUTY ERP
              </p>
              <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
                Quản lý <span style={{ color: "var(--cela-rose)" }}>nhà cung cấp</span>
              </h1>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Thêm nhà cung cấp
          </button>
        </div>

        <div className="bg-[var(--cela-paper)] rounded-xl p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã số thuế..."
              className="h-10 w-full pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
              style={{ border: "1px solid var(--cela-mist)" }}
            />
          </div>
        </div>

        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Truck className="w-12 h-12 text-[var(--cela-mist)] mb-3" />
              <p className="text-[var(--cela-stone)]">Không có nhà cung cấp nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
                <tr>
                  <th className="text-left px-6 py-3">Tên nhà cung cấp</th>
                  <th className="text-left px-4 py-3">Mã số thuế</th>
                  <th className="text-left px-4 py-3">SĐT</th>
                  <th className="text-left px-4 py-3">Địa chỉ</th>
                  <th className="text-center px-4 py-3">Trạng thái</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-[var(--cela-fog)] transition-colors"
                    style={{ borderBottom: "1px solid var(--cela-fog)", opacity: supplier.isActive ? 1 : 0.55 }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">{supplier.name}</td>
                    <td className="px-4 py-4 text-sm text-[var(--cela-stone)] font-mono">{supplier.taxCode || "-"}</td>
                    <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{supplier.phone || "-"}</td>
                    <td className="px-4 py-4 text-sm text-[var(--cela-stone)] max-w-xs"><p className="truncate" title={supplier.address}>{supplier.address || "-"}</p></td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${supplier.isActive ? "bg-[rgba(107,142,106,0.15)] text-[var(--cela-success)]" : "bg-[var(--cela-fog)] text-[var(--cela-stone)]"}`}>
                        {supplier.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {supplier.isActive && (
                          <button
                            onClick={() => openEdit(supplier)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                            style={{ border: "1px solid var(--cela-mist)" }}
                          >
                            Sửa
                          </button>
                        )}
                        {supplier.isActive ? (
                          <button
                            onClick={() => handleDeactivate(supplier)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--cela-danger)] hover:bg-[rgba(183,110,121,0.08)]"
                          >
                            Vô hiệu hóa
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--cela-stone)]">Chỉ đọc</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--cela-paper)] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
              <h2 className="text-lg font-semibold text-[var(--cela-espresso)]">
                {editing ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
              </h2>
              <button onClick={closeDialog} className="p-1.5 rounded-lg hover:bg-[var(--cela-fog)]">Đóng</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Tên *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Mã số thuế</label>
                <input
                  type="text"
                  value={form.taxCode}
                  onChange={(e) => setForm((f) => ({ ...f, taxCode: e.target.value }))}
                  className="w-full h-10 rounded-lg px-3 text-sm font-mono focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Địa chỉ</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="flex-1 h-10 rounded-xl text-sm font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                  style={{ border: "1px solid var(--cela-mist)" }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !form.name.trim()}
                  className="flex-1 h-10 bg-[var(--cela-espresso)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm"
                >
                  {isSaving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
