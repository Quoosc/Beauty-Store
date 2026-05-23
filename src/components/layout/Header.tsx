"use client";

import { Bell, LogOut, ChevronDown, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  BRANCH_MANAGER: "Quản lý chi nhánh",
  CASHIER: "Thu ngân",
  WAREHOUSE_STAFF: "Nhân viên kho",
};

export function Header() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthStore();
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [todayISO, setTodayISO] = useState("");

  useEffect(() => {
    setTodayISO(new Date().toISOString().split("T")[0]);
  }, []);

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
    <header
      className="flex-shrink-0 flex items-center justify-between px-6 py-3"
      style={{
        background: "var(--cela-paper)",
        borderBottom: "1px solid var(--cela-mist)",
        boxShadow: "var(--cela-shadow-soft)",
        height: 56,
      }}
    >
      {/* Left: role context */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--cela-stone)",
            }}
          >
            {ROLE_LABEL[user?.role ?? ""] ?? "BeautyERP"}
          </span>
        </div>
      </div>

      {/* Center: admin branch + date controls */}
      {user?.role === "ADMIN" && (
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              style={{
                appearance: "none",
                background: "var(--cela-ivory)",
                border: "1px solid var(--cela-mist)",
                borderRadius: 8,
                padding: "6px 32px 6px 12px",
                fontSize: 13,
                fontFamily: "var(--cela-sans)",
                color: "var(--cela-espresso)",
                cursor: "pointer",
                outline: "none",
              }}
              defaultValue="all"
            >
              <option value="all">Tất cả chi nhánh</option>
            </select>
            <ChevronDown
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ width: 14, height: 14, color: "var(--cela-stone)" }}
            />
          </div>

          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ width: 14, height: 14, color: "var(--cela-stone)" }}
            />
            <input
              type="date"
              defaultValue={todayISO}
              style={{
                appearance: "none",
                background: "var(--cela-ivory)",
                border: "1px solid var(--cela-mist)",
                borderRadius: 8,
                padding: "6px 12px 6px 34px",
                fontSize: 13,
                fontFamily: "var(--cela-mono)",
                color: "var(--cela-espresso)",
                cursor: "pointer",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}

      {/* Right: notification bell + user */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg transition-colors hover:bg-cela-cream"
          style={{ color: "var(--cela-cocoa)" }}
        >
          <Bell style={{ width: 18, height: 18 }} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-white text-[10px] font-bold rounded-full"
              style={{
                background: "var(--cela-rose)",
                minWidth: 18,
                height: 18,
                padding: "0 4px",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "var(--cela-mist)" }} />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--cela-rose)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--cela-display)",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div className="hidden md:block">
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--cela-espresso)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {user?.fullName}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "var(--cela-stone)",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {ROLE_LABEL[user?.role ?? ""] ?? ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 p-1.5 rounded-lg transition-colors hover:bg-cela-cream"
            title="Đăng xuất"
            style={{
              color: "var(--cela-stone)",
              background: "transparent",
              border: 0,
              cursor: "pointer",
            }}
          >
            <LogOut style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>
    </header>
  );
}
