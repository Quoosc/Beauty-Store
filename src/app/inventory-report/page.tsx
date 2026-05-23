"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  Clock,
  Download,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import {
  reportService,
  type InventoryReportTab,
  type NearExpiryItem,
  type SlowMovingItem,
} from "@/services/report.service";
import type { InventoryReportRow } from "@/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export default function InventoryReportPage() {
  const [activeTab, setActiveTab] = useState<InventoryReportTab>("current_stock");
  const [isLoading, setIsLoading] = useState(true);
  const [currentStockRows, setCurrentStockRows] = useState<InventoryReportRow[]>([]);
  const [nearExpiryRows, setNearExpiryRows] = useState<NearExpiryItem[]>([]);
  const [slowMovingRows, setSlowMovingRows] = useState<SlowMovingItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const tabMap: {
    key: InventoryReportTab;
    label: string;
    color: string;
  }[] = [
    { key: "current_stock", label: "Tồn kho hiện tại", color: "text-[var(--cela-danger)]" },
    { key: "near_expiry", label: "Sắp hết hạn", color: "text-[var(--cela-gold)]" },
    { key: "slow_moving", label: "Chậm luân chuyển", color: "text-[var(--cela-cocoa)]" },
  ];

  async function load(tab = activeTab) {
    setIsLoading(true);
    try {
      const result = await reportService.getInventoryReport({ tab, size: 200 });
      if (tab === "current_stock") {
        setCurrentStockRows(Array.isArray(result) ? (result as InventoryReportRow[]) : []);
      }
      if (tab === "near_expiry") {
        setNearExpiryRows(Array.isArray(result) ? (result as NearExpiryItem[]) : []);
      }
      if (tab === "slow_moving") {
        setSlowMovingRows(Array.isArray(result) ? (result as SlowMovingItem[]) : []);
      }
    } catch {
      toast.error("Không thể tải báo cáo tồn kho");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const lowStockCount = useMemo(
    () => currentStockRows.filter((row) => row.isLowStock).length,
    [currentStockRows]
  );

  async function handleExportPdf() {
    try {
      setIsExporting(true);
      const blob = await reportService.exportInventoryPdf(activeTab);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-report-${activeTab}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất PDF");
    } catch {
      toast.error("Xuất PDF thất bại");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-[var(--cela-rose)]" />
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
                BEAUTY ERP
              </p>
              <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
                Báo cáo <span style={{ color: "var(--cela-rose)" }}>tồn kho</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => load(activeTab)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)] disabled:opacity-50"
              style={{ border: "1px solid var(--cela-mist)" }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Cập nhật
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[var(--cela-espresso)] hover:opacity-90 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Đang xuất..." : "Xuất PDF"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <SummaryCard icon={AlertTriangle} label="SKU low stock" value={lowStockCount} tone="danger" />
          <SummaryCard icon={Clock} label="SKU sắp hết hạn" value={nearExpiryRows.length} tone="warning" />
          <SummaryCard icon={TrendingDown} label="SKU chậm luân chuyển" value={slowMovingRows.length} tone="info" />
        </div>

        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          <div className="flex" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
            {tabMap.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-[var(--cela-rose)] text-[var(--cela-rose)]" : "border-transparent text-[var(--cela-stone)] hover:text-[var(--cela-cocoa)]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <>
              {activeTab === "current_stock" && (
                <StockTable rows={currentStockRows} />
              )}
              {activeTab === "near_expiry" && (
                <NearExpiryTable rows={nearExpiryRows} />
              )}
              {activeTab === "slow_moving" && (
                <SlowMovingTable rows={slowMovingRows} />
              )}
            </>
          )}
        </div>
      </div>
    </ERPLayout>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "danger" | "warning" | "info";
}) {
  const map = {
    danger: "text-[var(--cela-danger)] bg-[rgba(183,110,121,0.08)]",
    warning: "text-[var(--cela-gold)] bg-[rgba(201,168,122,0.14)]",
    info: "text-[var(--cela-cocoa)] bg-[rgba(120,140,180,0.12)]",
  };

  return (
    <div className="bg-[var(--cela-paper)] rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${map[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-[var(--cela-stone)]">{label}</p>
        <p className="text-[28px] font-bold text-[var(--cela-espresso)]">{value}</p>
      </div>
    </div>
  );
}

function StockTable({ rows }: { rows: InventoryReportRow[] }) {
  if (rows.length === 0) {
    return <p className="p-6 text-sm text-[var(--cela-stone)]">Không có dữ liệu tồn kho.</p>;
  }

  return (
    <table className="w-full">
      <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
        <tr>
          <th className="text-left px-6 py-3">Sản phẩm</th>
          <th className="text-left px-4 py-3">SKU</th>
          <th className="text-center px-4 py-3">Tồn kho</th>
          <th className="text-center px-4 py-3">Ngưỡng</th>
          <th className="text-center px-4 py-3">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.productId} style={{ borderBottom: "1px solid var(--cela-fog)" }}>
            <td className="px-6 py-4 text-sm text-[var(--cela-espresso)]">{row.productName}</td>
            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{row.sku}</td>
            <td className="px-4 py-4 text-center text-sm font-semibold text-[var(--cela-cocoa)]">{row.quantity}</td>
            <td className="px-4 py-4 text-center text-sm text-[var(--cela-stone)]">{row.minThreshold}</td>
            <td className="px-4 py-4 text-center">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${row.isLowStock ? "bg-[rgba(183,110,121,0.12)] text-[var(--cela-danger)]" : "bg-[rgba(107,142,106,0.15)] text-[var(--cela-success)]"}`}>
                {row.isLowStock ? "Tồn kho thấp" : "Bình thường"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NearExpiryTable({ rows }: { rows: NearExpiryItem[] }) {
  if (rows.length === 0) {
    return <p className="p-6 text-sm text-[var(--cela-stone)]">Không có dữ liệu sắp hết hạn.</p>;
  }

  return (
    <table className="w-full">
      <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
        <tr>
          <th className="text-left px-6 py-3">Sản phẩm</th>
          <th className="text-left px-4 py-3">SKU</th>
          <th className="text-left px-4 py-3">Hạn sử dụng</th>
          <th className="text-center px-4 py-3">Số lượng</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.productId} style={{ borderBottom: "1px solid var(--cela-fog)" }}>
            <td className="px-6 py-4 text-sm text-[var(--cela-espresso)]">{row.productName}</td>
            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{row.sku}</td>
            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{formatDate(row.expiryDate)}</td>
            <td className="px-4 py-4 text-center text-sm font-semibold text-[var(--cela-gold)]">{row.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SlowMovingTable({ rows }: { rows: SlowMovingItem[] }) {
  if (rows.length === 0) {
    return <p className="p-6 text-sm text-[var(--cela-stone)]">Không có dữ liệu chậm luân chuyển.</p>;
  }

  return (
    <table className="w-full">
      <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
        <tr>
          <th className="text-left px-6 py-3">Sản phẩm</th>
          <th className="text-left px-4 py-3">SKU</th>
          <th className="text-center px-4 py-3">Số lượng</th>
          <th className="text-left px-4 py-3">Lần bán cuối</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.productId} style={{ borderBottom: "1px solid var(--cela-fog)" }}>
            <td className="px-6 py-4 text-sm text-[var(--cela-espresso)]">{row.productName}</td>
            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{row.sku}</td>
            <td className="px-4 py-4 text-center text-sm font-semibold text-[var(--cela-cocoa)]">{row.quantity}</td>
            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{row.lastSoldAt ? formatDate(row.lastSoldAt) : "Chưa bán"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
