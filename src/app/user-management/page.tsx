"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, ShieldOff, X, Info } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { accountService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import type { User, UserRole } from "@/types";
import { CelaButton, CelaCard, CelaInput, CelaSpinner, CelaEmptyState } from "@/components/ui/cela-primitives";

const ROLE_STYLE: Record<UserRole, { bg: string; color: string; label: string }> = {
  ADMIN:           { bg: "rgba(183,110,121,0.15)", color: "var(--cela-rose)",    label: "Admin" },
  BRANCH_MANAGER:  { bg: "rgba(201,168,122,0.20)", color: "var(--cela-gold)",    label: "Branch Manager" },
  CASHIER:         { bg: "rgba(107,142,106,0.15)", color: "var(--cela-success)", label: "Cashier" },
  WAREHOUSE_STAFF: { bg: "rgba(120,140,180,0.18)", color: "#6080b0",             label: "Warehouse Staff" },
};

interface AccountForm {
  fullName: string;
  username: string;
  role: UserRole;
  branchId: string;
}

const emptyForm: AccountForm = { fullName: "", username: "", role: "CASHIER", branchId: "" };

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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 256, gap: 16 }}>
          <ShieldOff style={{ width: 64, height: 64, color: "var(--cela-mist)" }} />
          <p style={{ color: "var(--cela-stone)", fontWeight: 500, margin: 0 }}>Không có quyền truy cập</p>
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
    setForm({ fullName: u.fullName, username: u.username, role: u.role, branchId: u.branchId ?? "" });
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    border: "1.5px solid var(--cela-mist)",
    borderRadius: 10,
    padding: "0 12px",
    fontSize: 13,
    color: "var(--cela-espresso)",
    background: "var(--cela-paper)",
    outline: "none",
    fontFamily: "var(--cela-body)",
    boxSizing: "border-box",
  };

  return (
    <ERPLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 4px" }}>
              Hệ thống
            </p>
            <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 500, color: "var(--cela-espresso)", margin: 0, letterSpacing: "-0.01em" }}>
              Quản lý <span style={{ fontStyle: "italic", color: "var(--cela-rose)" }}>tài khoản</span>
            </h1>
          </div>
          <CelaButton variant="primary" onClick={openCreate}>
            <Plus style={{ width: 16, height: 16 }} /> Tạo tài khoản
          </CelaButton>
        </div>

        {/* Filters */}
        <CelaCard style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <CelaInput
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc username..."
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
            style={{ height: 40, border: "1.5px solid var(--cela-mist)", borderRadius: 10, padding: "0 12px", fontSize: 13, color: "var(--cela-espresso)", background: "var(--cela-paper)", outline: "none", fontFamily: "var(--cela-body)" }}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="CASHIER">Cashier</option>
            <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
          </select>
        </CelaCard>

        {/* Table */}
        <CelaCard style={{ padding: 0, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
              <CelaSpinner padding="0" />
            </div>
          ) : filtered.length === 0 ? (
            <CelaEmptyState icon={<Users style={{ width: 40, height: 40 }} />} title="Không có tài khoản nào" />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--cela-fog)", borderBottom: "1px solid var(--cela-mist)" }}>
                  {["Họ tên", "Username", "Vai trò", "Chi nhánh", "Trạng thái", "Thao tác"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cela-cocoa)", textAlign: i >= 4 ? "center" : "left" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const rs = ROLE_STYLE[u.role];
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--cela-fog)" }}>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "var(--cela-espresso)" }}>{u.fullName}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontFamily: "var(--cela-mono)", color: "var(--cela-stone)" }}>{u.username}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: rs.bg, color: rs.color }}>
                          {rs.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--cela-stone)", fontFamily: "var(--cela-mono)" }}>
                        {u.branchId ? u.branchId.slice(-8).toUpperCase() : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {u.isLocked ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: "rgba(183,110,121,0.15)", color: "var(--cela-danger)" }}>
                            🔒 Bị khóa
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: "rgba(107,142,106,0.15)", color: "var(--cela-success)" }}>
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <CelaButton variant="secondary" onClick={() => openEdit(u)} style={{ padding: "4px 12px", fontSize: 12, height: 30 }}>
                            Sửa
                          </CelaButton>
                          {u.isLocked && (
                            <CelaButton variant="ghost" onClick={() => handleUnlock(u)} style={{ padding: "4px 12px", fontSize: 12, height: 30, color: "var(--cela-success)" }}>
                              Mở khóa
                            </CelaButton>
                          )}
                          {!u.isLocked && u.id !== currentUser.id && (
                            <CelaButton variant="danger" onClick={() => handleDeactivate(u)} style={{ padding: "4px 12px", fontSize: 12, height: 30 }}>
                              Vô hiệu
                            </CelaButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CelaCard>
      </div>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(60,46,42,0.45)" }}>
          <div style={{ background: "var(--cela-paper)", borderRadius: 16, boxShadow: "var(--cela-shadow-md)", width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--cela-mist)" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--cela-espresso)", fontFamily: "var(--cela-display)" }}>
                {editingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
              </h2>
              <button onClick={closeDialog} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
                <X style={{ width: 20, height: 20, color: "var(--cela-stone)" }} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cela-cocoa)" }}>
                  Họ tên đầy đủ <span style={{ color: "var(--cela-danger)" }}>*</span>
                </p>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {!editingUser && (
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cela-cocoa)" }}>
                    Tên đăng nhập <span style={{ color: "var(--cela-danger)" }}>*</span>
                  </p>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                    placeholder="nguyen.van.a"
                    style={{ ...inputStyle, fontFamily: "var(--cela-mono)" }}
                  />
                </div>
              )}

              <div>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cela-cocoa)" }}>
                  Vai trò
                </p>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole, branchId: e.target.value === "ADMIN" ? "" : f.branchId }))}
                  style={inputStyle}
                >
                  <option value="CASHIER">Cashier</option>
                  <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {editingUser && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--cela-gold)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Info style={{ width: 14, height: 14 }} />
                    Thay đổi vai trò có hiệu lực từ phiên đăng nhập tiếp theo.
                  </p>
                )}
              </div>

              {form.role !== "ADMIN" && (
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cela-cocoa)" }}>
                    Chi nhánh (Branch ID)
                  </p>
                  <input
                    type="text"
                    value={form.branchId}
                    onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                    placeholder="UUID chi nhánh"
                    style={{ ...inputStyle, fontFamily: "var(--cela-mono)" }}
                  />
                </div>
              )}

              {!editingUser && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(120,140,180,0.12)", border: "1px solid rgba(120,140,180,0.3)", borderRadius: 10, padding: "10px 14px" }}>
                  <Info style={{ width: 16, height: 16, color: "#6080b0", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: "#5070a0" }}>
                    Tài khoản mới sẽ yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <CelaButton type="button" variant="secondary" onClick={closeDialog} style={{ flex: 1, height: 42 }}>
                  Hủy
                </CelaButton>
                <CelaButton type="submit" variant="primary" disabled={isSaving} style={{ flex: 1, height: 42 }}>
                  {isSaving ? "Đang lưu..." : (editingUser ? "Cập nhật" : "Tạo tài khoản")}
                </CelaButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
