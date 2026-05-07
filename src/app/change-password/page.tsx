"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { ERPLayout } from "@/components/layout/ERPLayout";

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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="h-11 w-full pl-10 pr-10 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-[#FFDAE8] focus:border-[#D946A6]
            transition-colors"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function ChangePasswordPage() {
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
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Đổi mật khẩu</h1>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-lg
                hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                "Đổi mật khẩu"
              )}
            </button>
          </form>
        </div>
      </div>
    </ERPLayout>
  );
}
