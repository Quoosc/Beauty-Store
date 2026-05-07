"use client";

import { useAuthStore } from "@/stores/auth.store";
import { AdminSidebar } from "./AdminSidebar";
import { BranchManagerSidebar } from "./BranchManagerSidebar";
import { CashierSidebar } from "./CashierSidebar";
import { WarehouseStaffSidebar } from "./WarehouseStaffSidebar";
import { Header } from "./Header";
import { useNotificationPolling } from "@/hooks/useNotificationPolling";
import type { UserRole } from "@/types";

const SIDEBAR_MAP: Record<UserRole, React.ComponentType> = {
  ADMIN: AdminSidebar,
  BRANCH_MANAGER: BranchManagerSidebar,
  CASHIER: CashierSidebar,
  WAREHOUSE_STAFF: WarehouseStaffSidebar,
};

export function ERPLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const role: UserRole = user?.role ?? "CASHIER";
  const SidebarComponent = SIDEBAR_MAP[role];
  useNotificationPolling();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SidebarComponent />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
