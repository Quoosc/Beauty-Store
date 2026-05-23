"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  DollarSign,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { reportService } from "@/services/report.service";
import { orderService } from "@/services/order.service";
import { inventoryService } from "@/services/inventory.service";
import { useAuthStore } from "@/stores/auth.store";
import type { DashboardData } from "@/types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);

export default function BranchManagerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const branchId = user?.branchId;

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pendingCancelCount, setPendingCancelCount] = useState(0);
  const [pendingAdjustmentCount, setPendingAdjustmentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const [dashboardData, cancelRequests, pendingAdjustments] = await Promise.all([
          reportService.getDashboard(),
          branchId
            ? orderService.getCancelRequests(branchId, {
                status: "PENDING",
                page: 0,
                size: 100,
              })
            : Promise.resolve([]),
          inventoryService.getPendingAdjustments({ page: 0, size: 100 }),
        ]);

        if (!mounted) return;

        setDashboard(dashboardData);
        setPendingCancelCount(cancelRequests.length);

        const pendingRows = Array.isArray(pendingAdjustments)
          ? pendingAdjustments
          : (pendingAdjustments?.content ?? []);
        setPendingAdjustmentCount(pendingRows.length);
      } catch {
        if (mounted) {
          setDashboard(null);
          setPendingCancelCount(0);
          setPendingAdjustmentCount(0);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [branchId]);

  const chartData = useMemo(
    () =>
      (dashboard?.chart7Days ?? []).map((item) => ({
        date: item.date,
        label: new Date(item.date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        revenue: item.revenue,
      })),
    [dashboard?.chart7Days]
  );

  const today = new Date().toLocaleDateString("vi-VN", { dateStyle: "full" });

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
              BEAUTY ERP
            </p>
            <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
              Dashboard <span style={{ color: "var(--cela-rose)" }}>Chi nhanh</span>
            </h1>
          </div>
          <p className="text-sm text-[var(--cela-stone)]">{today}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : !dashboard ? (
          <div className="bg-[var(--cela-paper)] rounded-xl p-10 text-center" style={{ border: "1px solid var(--cela-mist)" }}>
            <p className="text-[var(--cela-stone)]">Không tải được dữ Liệu dashboard.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <KpiCard icon={DollarSign} label="Doanh thu" value={formatVND(dashboard.revenue?.today ?? 0)} trend={dashboard.revenue?.vsPreviousDayPercent ?? 0} />
              <KpiCard icon={ShoppingBag} label="So don" value={(dashboard.revenue?.orderCount ?? 0).toLocaleString("vi-VN")} />
              <KpiCard icon={(dashboard.revenue?.vsPreviousDayPercent ?? 0) >= 0 ? TrendingUp : TrendingDown} label="Tang truong" value={`${dashboard.revenue?.vsPreviousDayPercent ?? 0}%`} trend={dashboard.revenue?.vsPreviousDayPercent ?? 0} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/manager/orders" className="bg-[var(--cela-paper)] rounded-xl p-6 border-l-4 border-amber-400 hover:opacity-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-[var(--cela-gold)]" />
                    <div>
                      <p className="font-semibold text-[var(--cela-espresso)]">Đơn Hủy chờ duyệt</p>
                      <p className="text-sm text-[var(--cela-stone)]">Đang chờ xử lý</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-[var(--cela-gold)]">{pendingCancelCount}</span>
                </div>
              </Link>

              <Link href="/manager/inventory" className="bg-[var(--cela-paper)] rounded-xl p-6 border-l-4 border-blue-400 hover:opacity-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5 text-[var(--cela-cocoa)]" />
                    <div>
                      <p className="font-semibold text-[var(--cela-espresso)]">Điều chỉnh kho chờ duyệt</p>
                      <p className="text-sm text-[var(--cela-stone)]">ần phê duyệt bởi manager</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-[var(--cela-cocoa)]">{pendingAdjustmentCount}</span>
                </div>
              </Link>
            </div>

            <div className="bg-[var(--cela-paper)] rounded-xl p-6" style={{ border: "1px solid var(--cela-mist)" }}>
              <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">Doanh thu theo ngày</h3>
              {chartData.length === 0 ? (
                <div className="h-[260px] rounded-lg bg-[var(--cela-ivory)] text-[var(--cela-stone)] flex items-center justify-center text-sm">
                  Chưa có dữ liệu doanh thu theo ngày
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="managerRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--cela-rose)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--cela-rose)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                    <Tooltip
                      formatter={(value) => [formatVND(Number(value)), "Doanh thu"]}
                      labelFormatter={(label, payload) => {
                        const row = payload?.[0]?.payload as { date?: string } | undefined;
                        if (!row?.date) return label;
                        return new Date(row.date).toLocaleDateString("vi-VN");
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--cela-rose)" strokeWidth={2.5} fill="url(#managerRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-[var(--cela-paper)] rounded-xl p-6">
              <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">Top 5 sản phẩm</h3>
              {dashboard.topProducts.length === 0 ? (
                <p className="text-sm text-[var(--cela-stone)]">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-3">
                  {dashboard.topProducts.slice(0, 5).map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[rgba(183,110,121,0.15)] text-[var(--cela-rose-deep)] text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="flex-1 text-sm text-[var(--cela-espresso)]">{p.productName}</p>
                      <p className="text-sm font-semibold text-[var(--cela-stone)]">{p.soldQty} đã bán</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ERPLayout>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: number;
}) {
  return (
    <div className="bg-[var(--cela-paper)] rounded-xl p-6" style={{ border: "1px solid var(--cela-mist)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[var(--cela-stone)] font-medium">{label}</p>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(183,110,121,0.12)]">
          <Icon className="w-5 h-5 text-[var(--cela-rose)]" />
        </div>
      </div>
      <p className="text-[28px] font-bold text-[var(--cela-espresso)]">{value}</p>
      {trend !== undefined && (
        <p className={`text-sm mt-2 ${trend >= 0 ? "text-[var(--cela-success)]" : "text-[var(--cela-danger)]"}`}>
          {trend >= 0 ? "Tăng" : "Giảm"} {Math.abs(trend)}% so với hôm qua
        </p>
      )}
    </div>
  );
}
