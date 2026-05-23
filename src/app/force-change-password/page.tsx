"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import {
  useAuthStore,
  ROLE_REDIRECT,
} from "@/stores/auth.store";
import { CelaLogo } from "@/components/ui/cela-logo";
import { CelaButton, CelaInput } from "@/components/ui/cela-primitives";

type FormErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(pwd)) return "Mật khẩu phải có ít nhất 1 chữ hoa";
  if (!/[a-z]/.test(pwd)) return "Mật khẩu phải có ít nhất 1 chữ thường";
  if (!/[0-9]/.test(pwd)) return "Mật khẩu phải có ít nhất 1 chữ số";
  return null;
}

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setForceChangePasswordResolved = useAuthStore(
    (s) => s.setForceChangePasswordResolved
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = "Vui lòng nhập mật khẩu tạm thời";
    }

    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      nextErrors.newPassword = pwdErr;
    }

    if (newPassword && currentPassword && newPassword === currentPassword) {
      nextErrors.newPassword = "Mật khẩu mới không được trùng mật khẩu tạm thời";
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      await authService.changePassword(currentPassword, newPassword);

      setForceChangePasswordResolved();
      toast.success("Đổi mật khẩu thành công");

      const redirectPath = user ? ROLE_REDIRECT[user.role] : "/login";
      router.push(redirectPath);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;

      toast.error(message || "Đổi mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cela-ivory)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--cela-paper)",
          borderRadius: 20,
          padding: 40,
          border: "1px solid var(--cela-mist)",
          boxShadow: "var(--cela-shadow-md)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <CelaLogo size={36} showWord={false} />
        </div>

        <h1
          style={{
            fontFamily: "var(--cela-display)",
            fontSize: 26,
            fontWeight: 500,
            color: "var(--cela-espresso)",
            margin: 0,
          }}
        >
          Đổi mật khẩu mới
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "var(--cela-stone)",
            margin: "6px 0 0",
            lineHeight: 1.5,
          }}
        >
          Đăng nhập lần đầu. Vui lòng nhập mật khẩu tạm thời và đặt mật khẩu mới.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ marginTop: 22, display: "grid", gap: 16 }}
        >
          <PasswordField
            label="Mật khẩu tạm thời"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            placeholder="Nhập mật khẩu tạm thời"
            error={errors.currentPassword}
          />

          <PasswordField
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            placeholder="Nhập mật khẩu mới"
            error={errors.newPassword}
          />

          <PasswordField
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            placeholder="Nhập lại mật khẩu mới"
            error={errors.confirmPassword}
          />

          <CelaButton
            type="submit"
            variant="primary"
            disabled={isLoading}
            style={{ width: "100%", height: 44, marginTop: 4 }}
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Đang xử lý...
              </>
            ) : (
              "Cập nhật mật khẩu"
            )}
          </CelaButton>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
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
          placeholder={placeholder}
          style={{ paddingRight: 38 }}
        />

        <button
          type="button"
          onClick={onToggle}
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
          {show ? (
            <EyeOff style={{ width: 15, height: 15 }} />
          ) : (
            <Eye style={{ width: 15, height: 15 }} />
          )}
        </button>
      </div>

      {error && (
        <p
          style={{
            fontSize: 11,
            color: "var(--cela-danger)",
            margin: "4px 0 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
