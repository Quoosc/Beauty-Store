"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, ShieldOff, X, Info } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { accountService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import type { User, UserRole } from "@/types";

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  ADMIN:           { label: "Admin",           className: "bg-red-100 text-red-700" },
  BRANCH_MANAGER:  { label: "Branch Manager",  className: "bg-amber-100 text-amber-700" },
  CASHIER:         { label: "Cashier",         className: "bg-green-100 text-green-700" },
  WAREHOUSE_STAFF: { label: "Warehouse Staff", className: "bg-blue-100 text-blue-700" },
};

interface AccountForm {
  fullName: string;
  username: string;
  role: UserRole;
  branchId: string;
}

const emptyForm: AccountForm = {
  fullName: "",
  username: "",
  role: "CASHIER",
  branchId: "",
};

export default function UserManagementPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang này");
      router.push("/");
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <ERPLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <ShieldOff className="w-16 h-16 text-gray-300" />
          <p className="text-gray-500 font-medium">Không có quyền truy cập</p>
        </div>
      </ERPLayout>
    );
  }

  async function loadUsers() {
    setIsLoading(true);
    try {
      const res = await accountService.getAll();
      const data = res.data.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách tài khoản");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function openCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setForm({
      fullName: u.fullName,
      username: u.username,
      role: u.role,
      branchId: u.branchId ?? "",
    });
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error("Họ tên là bắt buộc"); return; }
    if (!editingUser && !form.username.trim()) { toast.error("Tên đăng nhập là bắt buộc"); return; }

    setIsSaving(true);
    try {
      if (editingUser) {
        await accountService.update(editingUser.id, {
          fullName: form.fullName,
          role: form.role,
          branchId: form.role !== "ADMIN" ? form.branchId || undefined : undefined,
        });
        toast.success("Đã cập nhật tài khoản");
      } else {
        await accountService.create({
          fullName: form.fullName,
          username: form.username.toLowerCase(),
          role: form.role,
          branchId: form.role !== "ADMIN" ? form.branchId || undefined : undefined,
          forceChangePassword: true,
        });
        toast.success("Đã tạo tài khoản. Nhân viên cần đổi mật khẩu khi đăng nhập lần đầu.");
      }
      closeDialog();
      loadUsers();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        toast.error("Tên đăng nhập đã tồn tại");
      } else {
        toast.error(msg || "Lưu thất bại");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(u: User) {
    if (!confirm(`Vô hiệu hóa tài khoản "${u.fullName}"?`)) return;
    try {
      await accountService.deactivate(u.id);
      toast.success("Đã vô hiệu hóa tài khoản");
      loadUsers();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error("Không thể vô hiệu hóa Admin duy nhất còn lại trong hệ thống");
      } else {
        toast.error("Thao tác thất bại");
      }
    }
  }

  async function handleUnlock(u: User) {
    try {
      await accountService.unlock(u.id);
      toast.success("Đã mở khóa tài khoản");
      loadUsers();
    } catch {
      toast.error("Mở khóa thất bại");
    }
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90">
            <Plus className="w-4 h-4" /> Tạo tài khoản
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc username..."
            className="h-10 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
            className="h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="CASHIER">Cashier</option>
            <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Users className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">Không có tài khoản nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Họ tên</th>
                  <th className="text-left px-4 py-3">Username</th>
                  <th className="text-left px-4 py-3">Vai trò</th>
                  <th className="text-left px-4 py-3">Chi nhánh</th>
                  <th className="text-center px-4 py-3">Trạng thái</th>
                  <th className="text-center px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => {
                  const roleConf = ROLE_CONFIG[u.role];
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.fullName}</td>
                      <td className="px-4 py-4 text-sm font-mono text-gray-600">{u.username}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleConf.className}`}>
                          {roleConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {u.branchId ? u.branchId.slice(-8).toUpperCase() : "—"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {u.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            🔒 Bị khóa
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEdit(u)} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                            Sửa
                          </button>
                          {u.isLocked && (
                            <button onClick={() => handleUnlock(u)} className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                              Mở khóa
                            </button>
                          )}
                          {!u.isLocked && u.id !== currentUser.id && (
                            <button onClick={() => handleDeactivate(u)} className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg">
                              Vô hiệu
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
      </div>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
              </h2>
              <button onClick={closeDialog} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Họ tên đầy đủ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                    placeholder="nguyen.van.a"
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vai trò</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    role: e.target.value as UserRole,
                    branchId: e.target.value === "ADMIN" ? "" : f.branchId,
                  }))}
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none"
                >
                  <option value="CASHIER">Cashier</option>
                  <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {editingUser && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Thay đổi vai trò có hiệu lực từ phiên đăng nhập tiếp theo.
                  </p>
                )}
              </div>

              {form.role !== "ADMIN" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh (Branch ID)</label>
                  <input
                    type="text"
                    value={form.branchId}
                    onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                    placeholder="UUID chi nhánh"
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  />
                </div>
              )}

              {!editingUser && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Tài khoản mới sẽ yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeDialog} className="flex-1 h-10 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 h-10 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
                  {isSaving ? "Đang lưu..." : (editingUser ? "Cập nhật" : "Tạo tài khoản")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
