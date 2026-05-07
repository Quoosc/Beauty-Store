"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore, ROLE_REDIRECT } from "@/stores/auth.store";

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(pwd)) return "Phải có ít nhất 1 chữ hoa";
  if (!/[a-z]/.test(pwd)) return "Phải có ít nhất 1 chữ thường";
  if (!/[0-9]/.test(pwd)) return "Phải có ít nhất 1 chữ số";
  return null;
}

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const errs: typeof errors = {};
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
      await authService.changePassword("", newPassword);
      toast.success("Đã đặt mật khẩu thành công!");
      const redirectPath = user ? ROLE_REDIRECT[user.role] : "/login";
      router.push(redirectPath);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Đặt mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFE4F0] via-[#FFDAE8] to-[#FFB8D6] flex items-start justify-center pt-20 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF69B4] to-[#D946A6] rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Đặt mật khẩu mới</h1>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Đây là lần đăng nhập đầu tiên. Hãy đặt mật khẩu mới để bảo mật tài khoản.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={validate}
                placeholder="Nhập mật khẩu mới"
                className="h-11 w-full pl-10 pr-10 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#FFDAE8] focus:border-[#D946A6]
                  transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-600 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={validate}
                placeholder="Nhập lại mật khẩu mới"
                className="h-11 w-full pl-10 pr-10 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#FFDAE8] focus:border-[#D946A6]
                  transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-lg
              hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
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
              "Đặt mật khẩu"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
