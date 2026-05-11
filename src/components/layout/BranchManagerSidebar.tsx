"use client";

import {
  LayoutDashboard,
  Clock,
  ShoppingCart,
  Receipt,
  CheckSquare,
  RotateCcw,
  Warehouse,
  ShoppingBag,
  ClipboardCheck,
  Package,
  Tag,
  Heart,
  Gift,
  Ticket,
  TrendingUp,
  BarChart2,
  Bell,
  KeyRound,
  LogOut,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium
        ${isActive ? "bg-white/15 text-white" : "text-pink-100 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-pink-200/70 text-xs font-semibold uppercase tracking-wider px-4 mb-2">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function BranchManagerSidebar() {
  const { logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside
      className="w-64 h-screen flex-shrink-0 flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #FF85C0, #EC4899)" }}
    >
      {/* Hexagon pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hex-bm"
              x="0"
              y="0"
              width="80"
              height="70"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 74.6 20 L 74.6 50 L 40 70 L 5.4 50 L 5.4 20 Z"
                fill="none"
                stroke="#FF69B4"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-bm)" />
        </svg>
      </div>
      <div className="absolute top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/3 -right-8 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -left-12 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-2/3 right-4 w-24 h-24 bg-pink-200/10 rounded-full blur-xl pointer-events-none" />

      {/* Logo */}
      <div className="p-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">BeautyERP</p>
            <p className="text-white/70 text-xs">Quản lý chi nhánh</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative z-10">
        <NavSection title="Tổng quan">
          <NavItem
            href="/branch-manager"
            icon={LayoutDashboard}
            label="Dashboard"
          />
        </NavSection>

        <NavSection title="Vận hành POS">
          <NavItem href="/pos/shift" icon={Clock} label="Mở/Đóng ca" />
          <NavItem href="/pos/order" icon={ShoppingCart} label="Bán hàng" />
          <NavItem
            href="/cashier/orders"
            icon={Receipt}
            label="Đơn hàng của tôi"
          />
          <NavItem
            href="/manager/orders"
            icon={CheckSquare}
            label="Duyệt hủy đơn"
          />
          <NavItem href="/returns/new" icon={RotateCcw} label="Trả hàng" />
        </NavSection>

        <NavSection title="Kho hàng">
          <NavItem href="/inventory/stock" icon={Warehouse} label="Tồn kho" />
          <NavItem
            href="/inventory/purchase-orders"
            icon={ShoppingBag}
            label="Purchase Orders"
          />
          <NavItem
            href="/manager/inventory"
            icon={ClipboardCheck}
            label="Duyệt điều chỉnh"
          />
        </NavSection>

        <NavSection title="Catalog">
          <NavItem href="/manager/products" icon={Package} label="Sản phẩm" />
          <NavItem href="/categories" icon={Tag} label="Danh mục" />
        </NavSection>

        <NavSection title="Chương trình">
          <NavItem
            href="/loyalty/members"
            icon={Heart}
            label="Loyalty Members"
          />
          <NavItem href="/promotions" icon={Gift} label="Khuyến mãi" />
          <NavItem href="/coupons" icon={Ticket} label="Coupon" />
        </NavSection>

        <NavSection title="Báo cáo">
          <NavItem href="/revenue-report" icon={TrendingUp} label="Doanh thu" />
          <NavItem href="/inventory-report" icon={BarChart2} label="Tồn kho" />
          <NavItem href="/notifications" icon={Bell} label="Thông báo" />
        </NavSection>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 relative z-10 space-y-1">
        <Link
          href="/change-password"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-pink-100 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
        >
          <KeyRound className="w-5 h-5 flex-shrink-0" />
          <span>Đổi mật khẩu</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
