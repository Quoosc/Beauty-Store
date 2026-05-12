"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { CelaButton, CelaCard, CelaInput, CelaPageHeader } from "@/components/ui/cela-primitives";

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(pwd)) return "Phải có ít nhất 1 chữ hoa";
  if (!/[a-z]/.test(pwd)) return "Phải có ít nhất 1 chữ thường";
  if (!/[0-9]/.test(pwd)) return "Phải có ít nhất 1 chữ số";
  return null;
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  placeholder?: string;
}

function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  show,
  onToggleShow,
  error,
  placeholder,
}: PasswordFieldProps) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--cela-cocoa)",
          margin: "0 0 8px",
        }}
      >
        {label}
      </p>
      <div style={{ position: "relative" }}>
        <CelaInput
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{ paddingRight: 38 }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            border: 0,
            background: "transparent",
            color: "var(--cela-stone)",
            cursor: "pointer",
          }}
        >
          {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: "var(--cela-danger)", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!currentPassword) errs.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) errs.newPassword = pwdErr;
    if (newPassword !== confirmPassword) errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      toast.success("Đã đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Đổi mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ERPLayout>
      <div>
        <CelaPageHeader eyebrow="Tài khoản" title="Đổi mật khẩu" />

        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <CelaCard>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <PasswordField
                label="Mật khẩu hiện tại"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrent}
                onToggleShow={() => setShowCurrent((v) => !v)}
                error={errors.currentPassword}
                placeholder="Nhập mật khẩu hiện tại"
              />

              <PasswordField
                label="Mật khẩu mới"
                value={newPassword}
                onChange={setNewPassword}
                onBlur={validate}
                show={showNew}
                onToggleShow={() => setShowNew((v) => !v)}
                error={errors.newPassword}
                placeholder="Nhập mật khẩu mới"
              />

              <PasswordField
                label="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={setConfirmPassword}
                onBlur={validate}
                show={showConfirm}
                onToggleShow={() => setShowConfirm((v) => !v)}
                error={errors.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />

              <CelaButton type="submit" variant="primary" disabled={isLoading} style={{ width: "100%", height: 42, marginTop: 4 }}>
                {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </CelaButton>
            </form>
          </CelaCard>

          <button
            type="button"
            onClick={() => router.back()}
            style={{
              marginTop: 14,
              border: 0,
              background: "transparent",
              fontSize: 13,
              color: "var(--cela-stone)",
              cursor: "pointer",
            }}
          >
            ← Quay lại trang trước
          </button>
        </div>
      </div>
    </ERPLayout>
  );
}
