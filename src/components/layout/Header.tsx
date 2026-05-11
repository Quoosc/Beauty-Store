"use client";

import { Bell, LogOut, Sparkles, ChevronDown, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthStore();
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "??";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="bg-gradient-to-r from-[#FFDAE8] to-[#FFF0F8] border-b border-pink-200 shadow-sm px-6 py-4 flex items-center justify-between flex-shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-[#FF69B4] to-[#D946A6] rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">BeautyERP</span>
      </div>

      {/* Center controls - only for ADMIN */}
      {user?.role === "ADMIN" && (
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent cursor-pointer"
              defaultValue="all"
            >
              <option value="all">Tất cả chi nhánh</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative">
            <input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent cursor-pointer"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg hover:bg-pink-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#FF69B4] to-[#D946A6] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900">
              {user?.fullName}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role?.replace(/_/g, " ")}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-2 rounded-lg hover:bg-pink-100 transition-colors text-gray-600 hover:text-gray-900"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
