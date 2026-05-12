"use client";

import {
  CreditCard,
  Receipt,
  Undo2,
  Star,
  Bell,
  KeyRound,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { CelaLogo } from "@/components/ui/cela-logo";

interface CashierSidebarProps {
  notificationCount?: number;
}

const MENU_ITEMS = [
  { id: "pos-shift", label: "POS / Ca làm việc", icon: CreditCard, href: "/pos/shift" },
  { id: "my-orders", label: "Đơn hàng của tôi", icon: Receipt, href: "/cashier/orders" },
  { id: "returns", label: "Trả hàng", icon: Undo2, href: "/returns/new" },
  { id: "loyalty-members", label: "Thành viên", icon: Star, href: "/loyalty/members" },
  { id: "notifications", label: "Thông báo", icon: Bell, href: "/notifications", badge: true },
];

export function CashierSidebar({ notificationCount = 0 }: CashierSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(-2)
      .toUpperCase() ?? "??";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-screen"
      style={{
        width: 248,
        background: "var(--cela-espresso)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        color: "#f3ece1",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "28px 24px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <CelaLogo color="#f3ece1" accent="var(--cela-rose)" />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              padding: "10px 14px 6px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(243,236,225,0.4)",
              margin: 0,
            }}
          >
            Hôm nay
          </p>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            const badgeCount = item.badge ? notificationCount : 0;

            return (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  margin: "2px 0",
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#ffffff" : "rgba(243,236,225,0.72)",
                  background: isActive ? "rgba(201,168,122,0.18)" : "transparent",
                  position: "relative",
                  textDecoration: "none",
                  transition: "background 120ms ease",
                }}
                className={!isActive ? "hover:bg-white/[0.06]" : ""}
              >
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: -12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 3,
                      height: 18,
                      background: "var(--cela-rose)",
                      borderRadius: "0 3px 3px 0",
                    }}
                  />
                )}
                <Icon
                  style={{
                    color: isActive ? "var(--cela-rose)" : "rgba(243,236,225,0.5)",
                    flexShrink: 0,
                    width: 17,
                    height: 17,
                  }}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {badgeCount > 0 && (
                  <span
                    style={{
                      background: "var(--cela-danger)",
                      color: "#fff",
                      fontSize: 11,
                      borderRadius: 999,
                      padding: "1px 7px",
                      fontWeight: 700,
                    }}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 10,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--cela-rose)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--cela-display)",
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#f3ece1",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.fullName ?? "Thu ngân"}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(243,236,225,0.55)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Thu ngân
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.08]"
            style={{ color: "rgba(243,236,225,0.55)", background: "transparent", border: 0, cursor: "pointer" }}
          >
            <LogOut style={{ width: 15, height: 15 }} />
          </button>
        </div>
        <Link
          href="/change-password"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            marginTop: 4,
            borderRadius: 8,
            fontSize: 12.5,
            color: "rgba(243,236,225,0.55)",
            textDecoration: "none",
          }}
          className="hover:bg-white/[0.06]"
        >
          <KeyRound style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>Đổi mật khẩu</span>
        </Link>
      </div>
    </aside>
  );
}
