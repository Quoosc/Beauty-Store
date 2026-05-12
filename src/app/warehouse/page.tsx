"use client";

import { useState, useEffect } from "react";
import {
  Warehouse,
  ShoppingBag,
  Package,
  AlertTriangle,
  Plus,
  PackageCheck,
  ClipboardEdit,
} from "lucide-react";
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
          inventoryService.getStock({
            size: 200,
          }),
          purchaseOrderService.getAll({
            status: "CONFIRMED",
            size: 200,
          }),
        ]);
        const items = stockData?.content ?? [];
        setTotalProducts(stockData?.totalElements ?? items.length);
        setLowStockCount(items.filter((s) => s.isLowStock).length);
        setConfirmedPOCount(
          poData?.totalElements ?? poData?.content?.length ?? 0,
        );
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);
  const QUICK_LINKS = [
    {
      label: "Xem tồn kho",
      href: "/inventory/stock",
      icon: Warehouse,
      color: "blue",
    },
    {
      label: "Tạo Purchase Order",
      href: "/inventory/purchase-orders/create",
      icon: Plus,
      color: "rose",
    },
    {
      label: "Nhận hàng",
      href: "/inventory/purchase-orders",
      icon: PackageCheck,
      color: "green",
    },
    {
      label: "Ghi hàng hỏng",
      href: "/inventory/adjustments",
      icon: ClipboardEdit,
      color: "orange",
    },
  ];
  return (
    <ERPLayout>
      <div className="space-y-6">
        <div
          style={{
            marginBottom: 24,
          }}
        >
          {/* Page header */}
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--cela-cocoa)",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            BEAUTY ERP
          </p>
          <h1
            style={{
              fontFamily: "var(--cela-display)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--cela-espresso)",
              fontStyle: "italic",
              lineHeight: 1.2,
            }}
          >
            Dashboard{" "}
            <span
              style={{
                color: "var(--cela-rose)",
              }}
            >
              Kho h�ng
            </span>
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <svg
              className="animate-spin w-6 h-6 text-[var(--cela-rose)]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div
                className="bg-[var(--cela-paper)] rounded-xl p-6"
                style={{
                  boxShadow: "var(--cela-shadow-md)",
                  border: "1px solid var(--cela-mist)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[rgba(183,110,121,0.15)] rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-[var(--cela-danger)]" />
                  </div>
                  <div>
                    <p className="text-[28px] font-bold text-[var(--cela-espresso)]">
                      {lowStockCount}
                    </p>
                    <p className="text-sm text-[var(--cela-stone)]">
                      Sản phẩm tồn kho thấp
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="bg-[var(--cela-paper)] rounded-xl p-6"
                style={{
                  boxShadow: "var(--cela-shadow-md)",
                  border: "1px solid var(--cela-mist)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[rgba(120,140,180,0.18)] rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-[var(--cela-cocoa)]" />
                  </div>
                  <div>
                    <p className="text-[28px] font-bold text-[var(--cela-espresso)]">
                      {confirmedPOCount}
                    </p>
                    <p className="text-sm text-[var(--cela-stone)]">
                      PO chờ nhận hàng
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="bg-[var(--cela-paper)] rounded-xl p-6"
                style={{
                  boxShadow: "var(--cela-shadow-md)",
                  border: "1px solid var(--cela-mist)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[rgba(107,142,106,0.15)] rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-[var(--cela-success)]" />
                  </div>
                  <div>
                    <p className="text-[28px] font-bold text-[var(--cela-espresso)]">
                      {totalProducts}
                    </p>
                    <p className="text-sm text-[var(--cela-stone)]">
                      Tổng sản phẩm quản lý
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="bg-[var(--cela-paper)] rounded-xl p-6"
              style={{
                boxShadow: "var(--cela-shadow-md)",
              }}
            >
              <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">
                Truy cập nhanh
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 p-4 rounded-xl hover:border-[rgba(183,110,121,0.35)] hover:bg-[rgba(183,110,121,0.08)] transition-all"
                      style={{
                        border: "1px solid var(--cela-mist)",
                      }}
                    >
                      <div className="w-10 h-10 bg-[var(--cela-fog)] rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[var(--cela-stone)]" />
                      </div>
                      <span className="font-medium text-[var(--cela-espresso)]">
                        {link.label}
                      </span>
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
