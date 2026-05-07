"use client";

import { useState, useEffect } from "react";
import { Warehouse, ShoppingBag, Package, AlertTriangle, Plus, PackageCheck, ClipboardEdit } from "lucide-react";
import Link from "next/link";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { inventoryService } from "@/services/inventory.service";
import { purchaseOrderService } from "@/services/purchaseOrder.service";

export default function WarehouseDashboardPage() {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [confirmedPOCount, setConfirmedPOCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [stockData, poData] = await Promise.all([
          inventoryService.getStock({ size: 200 }),
          purchaseOrderService.getAll({ status: "CONFIRMED", size: 200 }),
        ]);
        const items = stockData?.content ?? [];
        setTotalProducts(stockData?.totalElements ?? items.length);
        setLowStockCount(items.filter((s) => s.isLowStock).length);
        setConfirmedPOCount(poData?.totalElements ?? (poData?.content?.length ?? 0));
      } catch {
        // graceful degradation
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const QUICK_LINKS = [
    { label: "Xem tồn kho", href: "/inventory/stock", icon: Warehouse, color: "blue" },
    { label: "Tạo Purchase Order", href: "/inventory/purchase-orders/create", icon: Plus, color: "pink" },
    { label: "Nhận hàng", href: "/inventory/purchase-orders", icon: PackageCheck, color: "green" },
    { label: "Ghi hàng hỏng", href: "/inventory/adjustments", icon: ClipboardEdit, color: "orange" },
  ];

  return (
    <ERPLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Kho hàng</h1>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
                    <p className="text-sm text-gray-500">Sản phẩm tồn kho thấp</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{confirmedPOCount}</p>
                    <p className="text-sm text-gray-500">PO chờ nhận hàng</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                    <p className="text-sm text-gray-500">Tổng sản phẩm quản lý</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Truy cập nhanh</h3>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-all"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </ERPLayout>
  );
}
