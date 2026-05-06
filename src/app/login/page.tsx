"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, ROLE_REDIRECT } from "@/stores/auth.store";
import { toast } from "sonner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Store,
  CreditCard,
  Warehouse,
  Sparkles,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "ADMIN" as const,
    username: "admin",
    password: "Admin@123",
    description: "Toàn quyền hệ thống",
    color: "#E53E3E",
    Icon: Building2,
  },
  {
    role: "BRANCH_MANAGER" as const,
    username: "manager",
    password: "Manager@123",
    description: "Quản lý chi nhánh",
    color: "#D97706",
    Icon: Store,
  },
  {
    role: "CASHIER" as const,
    username: "cashier",
    password: "Cashier@123",
    description: "Thu ngân & POS",
    color: "#059669",
    Icon: CreditCard,
  },
  {
    role: "WAREHOUSE_STAFF" as const,
    username: "warehouse",
    password: "Warehouse@123",
    description: "Kho & nhập hàng",
    color: "#2563EB",
    Icon: Warehouse,
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(username, password);
      toast.success("Đăng nhập thành công!");
      // Redirect theo role
      router.push(ROLE_REDIRECT[user.role]);
    } catch {
      setError("Sai tên đăng nhập hoặc mật khẩu");
    }
  };

  const handleDemoClick = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setError("");
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#FFE4F0] via-[#FFDAE8] to-[#FFB8D6] p-12 flex-col justify-between relative overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 93.3 25 L 93.3 62 L 50 87 L 6.7 62 L 6.7 25 Z"
                  fill="none" stroke="#FF69B4" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/40">
                <Sparkles className="w-7 h-7 text-[#FF1493]" />
              </div>
              <h1 className="text-4xl font-bold text-[#D946A6]">BeautyERP</h1>
            </div>
            <p className="text-[#D946A6]/80 text-sm font-medium">
              Hệ thống quản lý bán lẻ mỹ phẩm đa chi nhánh
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 text-[#D946A6]">
            {[
              { emoji: "🏪", label: "Quản lý đa chi nhánh" },
              { emoji: "📦", label: "Kiểm soát kho thông minh" },
              { emoji: "💰", label: "POS tích hợp tích điểm" },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/40 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/50">
                  <span className="text-xl">{emoji}</span>
                </div>
                <span className="text-lg font-semibold">{label}</span>
              </div>
            ))}
          </div>

          {/* Demo accounts */}
          <div>
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-6 mb-4 shadow-lg">
              <h3 className="text-[#D946A6] font-bold text-lg mb-4">Tài khoản demo</h3>
              <div className="space-y-3">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleDemoClick(account)}
                    className="w-full bg-white/30 hover:bg-white/40 border border-white/40 rounded-lg p-3 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold px-2 py-1 rounded text-white"
                        style={{ backgroundColor: account.color }}
                      >
                        {account.role.replace("_", " ")}
                      </span>
                      <div className="flex-1">
                        <p className="text-[#D946A6] font-mono text-sm font-semibold">
                          {account.username} / {account.password}
                        </p>
                        <p className="text-[#D946A6]/70 text-xs">{account.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[#D946A6]/60 text-xs text-center">
              © 2025 BeautyERP — UIT Software Architecture
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <p className="text-gray-600 text-sm mb-2">Chào mừng trở lại 👋</p>
            <h2 className="text-3xl font-bold text-[#D946A6]">Đăng nhập vào hệ thống</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  required
                  className={`w-full h-11 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-[#FFDAE8] focus:border-[#D946A6]"
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className={`w-full h-11 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-[#FFDAE8] focus:border-[#D946A6]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Quick login buttons */}
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.Icon;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleDemoClick(account)}
                    className="bg-white border-l-4 border border-gray-200 hover:shadow-md rounded-lg p-2.5 transition-all text-left"
                    style={{ borderLeftColor: account.color }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${account.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: account.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">
                          {account.role.split("_")[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{account.username}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] hover:from-[#FF1493] hover:to-[#C026D3] disabled:opacity-60 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-300/50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                "ĐĂNG NHẬP"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Hệ thống sử dụng JWT (HttpOnly Cookie) — Phiên đăng nhập 8 giờ
          </p>
        </div>
      </div>
    </div>
  );
}
