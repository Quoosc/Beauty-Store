"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardEdit, PackageCheck, Plus, Warehouse } from "lucide-react";
import Link from "next/link";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { reportService } from "@/services/report.service";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import type { InventoryReportRow } from "@/types";

export default function WarehouseDashboardPage() {
  const [stockRows, setStockRows] = useState<InventoryReportRow[]>([]);
  const [confirmedPOCount, setConfirmedPOCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const [stockData, poData] = await Promise.all([
          reportService.getInventoryReport({ tab: "current_stock", size: 200 }),
          purchaseOrderService.getAll({ status: "CONFIRMED", size: 200 }),
        ]);

        if (!mounted) return;

        const rows = Array.isArray(stockData) ? (stockData as InventoryReportRow[]) : [];
        setStockRows(rows);
        setConfirmedPOCount(poData?.totalElements ?? poData?.content?.length ?? 0);
      } catch {
        if (!mounted) return;
        setStockRows([]);
        setConfirmedPOCount(0);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const lowStockRows = useMemo(
    () => stockRows.filter((row) => row.isLowStock),
    [stockRows]
  );

  const quickLinks = [
    {
      label: "Xem ton kho",
      href: "/inventory/stock",
      icon: Warehouse,
    },
    {
      label: "Tao phieu nhap",
      href: "/inventory/purchase-orders/create",
      icon: Plus,
    },
    {
      label: "Dieu chinh kho",
      href: "/inventory/adjustments",
      icon: ClipboardEdit,
    },
  ];

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
            BEAUTY ERP
          </p>
          <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
            Dashboard <span style={{ color: "var(--cela-rose)" }}>Kho hang</span>
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={AlertTriangle}
                label="Hang sap het"
                value={lowStockRows.length}
                tone="danger"
              />
              <StatCard
                icon={PackageCheck}
                label="PO cho nhan hang"
                value={confirmedPOCount}
                tone="info"
              />
              <StatCard
                icon={Warehouse}
                label="Tong SKU"
                value={stockRows.length}
                tone="success"
              />
            </div>

            <div className="bg-[var(--cela-paper)] rounded-xl p-6" style={{ border: "1px solid var(--cela-mist)" }}>
              <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">Truy cap nhanh</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 p-4 rounded-xl hover:border-[rgba(183,110,121,0.35)] hover:bg-[rgba(183,110,121,0.08)] transition-all"
                      style={{ border: "1px solid var(--cela-mist)" }}
                    >
                      <div className="w-10 h-10 bg-[var(--cela-fog)] rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[var(--cela-stone)]" />
                      </div>
                      <span className="font-medium text-[var(--cela-espresso)]">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--cela-mist)" }}>
              <div className="p-6" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
                <h3 className="font-semibold text-[var(--cela-espresso)]">Canh bao ton kho thap</h3>
              </div>

              {lowStockRows.length === 0 ? (
                <p className="p-6 text-sm text-[var(--cela-stone)]">Khong co SKU nao dang low stock.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                    <tr>
                      <th className="text-left px-6 py-3">SKU</th>
                      <th className="text-left px-4 py-3">Ten san pham</th>
                      <th className="text-center px-4 py-3">Ton hien tai</th>
                      <th className="text-center px-4 py-3">Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockRows.slice(0, 10).map((row) => (
                      <tr key={row.productId} style={{ borderBottom: "1px solid var(--cela-fog)" }}>
                        <td className="px-6 py-3 text-sm font-mono text-[var(--cela-cocoa)]">{row.sku}</td>
                        <td className="px-4 py-3 text-sm text-[var(--cela-espresso)]">{row.productName}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-[var(--cela-danger)]">{row.quantity}</td>
                        <td className="px-4 py-3 text-center text-sm text-[var(--cela-stone)]">{row.minThreshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </ERPLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "danger" | "info" | "success";
}) {
  const colorMap = {
    danger: "text-[var(--cela-danger)] bg-[rgba(183,110,121,0.12)]",
    info: "text-[var(--cela-cocoa)] bg-[rgba(120,140,180,0.18)]",
    success: "text-[var(--cela-success)] bg-[rgba(107,142,106,0.15)]",
  };

  return (
    <div className="bg-[var(--cela-paper)] rounded-xl p-6" style={{ border: "1px solid var(--cela-mist)" }}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[tone]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[28px] font-bold text-[var(--cela-espresso)]">{value}</p>
          <p className="text-sm text-[var(--cela-stone)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
