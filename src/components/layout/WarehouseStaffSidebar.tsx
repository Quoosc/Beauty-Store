"use client";

import {
  LayoutDashboard,
  Warehouse,
  ShoppingBag,
  PackageCheck,
  ClipboardEdit,
  Truck,
  Bell,
  KeyRound,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { CelaLogo } from "@/components/ui/cela-logo";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

function NavItem({ href, icon: Icon, label, badge }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
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
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
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
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {title && (
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
          {title}
        </p>
      )}
      <div>{children}</div>
    </div>
  );
}

export function WarehouseStaffSidebar() {
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
        <NavSection title="Tổng quan">
          <NavItem href="/warehouse" icon={LayoutDashboard} label="Dashboard kho" />
        </NavSection>

        <NavSection title="Nghiệp vụ">
          <NavItem href="/inventory/stock" icon={Warehouse} label="Tồn kho" />
          <NavItem href="/inventory/purchase-orders" icon={ShoppingBag} label="Đặt hàng NCC" />
          <NavItem href="/inventory/purchase-orders" icon={PackageCheck} label="Nhận hàng" />
          <NavItem href="/inventory/adjustments" icon={ClipboardEdit} label="Điều chỉnh kho" />
          <NavItem href="/supplier-management" icon={Truck} label="Nhà cung cấp" />
        </NavSection>

        <NavSection title="Thông báo">
          <NavItem href="/notifications" icon={Bell} label="Thông báo" />
        </NavSection>
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
              background: "var(--cela-champagne)",
              color: "var(--cela-espresso)",
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
              {user?.fullName ?? "Nhân viên kho"}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(243,236,225,0.55)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Kho
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
