"use client";

import { CreditCard, Receipt, Undo2, Star, Bell, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CashierSidebarProps {
  notificationCount?: number;
}

const MENU_ITEMS = [
  { id: "pos-shift", label: "POS / Ca làm việc", icon: CreditCard, href: "/pos/shift" },
  { id: "my-orders", label: "Đơn hàng của tôi", icon: Receipt, href: "/cashier/orders" },
  { id: "returns", label: "Trả hàng", icon: Undo2, href: "/returns/new" },
  { id: "loyalty-members", label: "Thành viên", icon: Star, href: "/loyalty/members" },
  { id: "notifications", label: "Thông báo", icon: Bell, href: "/cashier/notifications", badge: true },
];

export function CashierSidebar({ notificationCount = 0 }: CashierSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-[#FF85C0] to-[#EC4899] text-white flex flex-col relative overflow-hidden">
      {/* Hexagon Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hex-cashier" x="0" y="0" width="80" height="70" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 74.6 20 L 74.6 50 L 40 70 L 5.4 50 L 5.4 20 Z"
                fill="none" stroke="#FF69B4" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-cashier)" />
        </svg>
      </div>
      <div className="absolute top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/3 -right-8 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -left-12 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none" />

      {/* Logo */}
      <div className="p-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">BeautyERP</h1>
        </div>
        <p className="text-sm text-pink-200 ml-13">Thu ngân</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto relative z-10">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          const badgeCount = item.badge ? notificationCount : 0;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-pink-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="text-base font-medium">{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}

        <div className="border-t border-white/10 my-2 mx-1" />

        <Link
          href="/change-password"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-pink-100 hover:bg-white/10 hover:text-white transition-all"
        >
          <KeyRound className="w-5 h-5" />
          <span className="text-base font-medium">Đổi mật khẩu</span>
        </Link>
      </nav>
    </aside>
  );
}
