"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  DollarSign,
  ShoppingBag,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
import type { DashboardData } from "@/types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportService
      .getDashboard()
      .then((data) => setDashboard(data))
      .catch(() => setDashboard(null))
      .finally(() => setIsLoading(false));
  }, []);

  const chartData = useMemo(() => {
    return (dashboard?.revenueByDay ?? []).map((item) => ({
      date: item.date,
      label: new Date(item.date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      revenue: item.revenue,
    }));
  }, [dashboard?.revenueByDay]);

  const today = new Date().toLocaleDateString("vi-VN", { dateStyle: "full" });

  return (
    <ERPLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 4px" }}>
              Tong quan
            </p>
            <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 500, color: "var(--cela-espresso)", margin: 0, letterSpacing: "-0.01em" }}>
              Dashboard <span style={{ fontStyle: "italic", color: "var(--cela-rose)" }}>he thong</span>
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--cela-stone)", fontFamily: "var(--cela-mono)" }}>{today}</p>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--cela-mist)", borderTopColor: "var(--cela-rose)", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !dashboard ? (
          <div className="bg-[var(--cela-paper)] rounded-xl p-10 text-center" style={{ border: "1px solid var(--cela-mist)" }}>
            <BarChart2 className="w-12 h-12 text-[var(--cela-mist)] mx-auto mb-3" />
            <p className="text-[var(--cela-stone)]">Khong tai duoc du lieu dashboard. Vui long thu lai.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              <KpiCard icon={DollarSign} label="Tong doanh thu" value={formatVND(dashboard.totalRevenue)} accent="rose" trend={dashboard.revenueGrowth} />
              <KpiCard icon={ShoppingBag} label="So don hang" value={dashboard.totalOrders.toLocaleString("vi-VN")} accent="espresso" />
              <KpiCard icon={BarChart2} label="AOV" value={formatVND(dashboard.averageOrderValue)} accent="champagne" />
              <KpiCard icon={dashboard.revenueGrowth >= 0 ? TrendingUp : TrendingDown} label="Tang truong" value={`${dashboard.revenueGrowth}%`} accent={dashboard.revenueGrowth >= 0 ? "success" : "rose"} trend={dashboard.revenueGrowth} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-[var(--cela-paper)] rounded-xl p-6" style={{ border: "1px solid var(--cela-mist)" }}>
                <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">Doanh thu theo ngay</h3>
                {chartData.length === 0 ? (
                  <div className="h-[260px] rounded-lg bg-[var(--cela-ivory)] text-[var(--cela-stone)] flex items-center justify-center text-sm">
                    Chua co du lieu doanh thu theo ngay
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
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
                      <Area type="monotone" dataKey="revenue" stroke="var(--cela-rose)" strokeWidth={2.5} fill="url(#adminRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-[var(--cela-paper)] rounded-xl p-6" style={{ border: "1px solid var(--cela-mist)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-[var(--cela-gold)]" />
                  <h3 className="font-semibold text-[var(--cela-espresso)]">Top 5 san pham</h3>
                </div>

                {dashboard.topProducts.length === 0 ? (
                  <p className="text-sm text-[var(--cela-stone)]">Chua co du lieu.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[var(--cela-stone)] uppercase">
                        <th className="text-left pb-2">#</th>
                        <th className="text-left pb-2">Ten</th>
                        <th className="text-right pb-2">SL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.topProducts.slice(0, 5).map((p, index) => (
                        <tr key={p.productId} className="border-t" style={{ borderColor: "var(--cela-fog)" }}>
                          <td className="py-2 text-[var(--cela-cocoa)] font-medium">{index + 1}</td>
                          <td className="py-2 text-[var(--cela-espresso)]">{p.productName}</td>
                          <td className="py-2 text-right font-medium text-[var(--cela-stone)]">{p.soldQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
  accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  trend?: number;
  accent: "rose" | "champagne" | "espresso" | "success";
}) {
  const accentColors: Record<typeof accent, string> = {
    rose: "var(--cela-rose)",
    champagne: "var(--cela-gold)",
    espresso: "var(--cela-espresso)",
    success: "var(--cela-success)",
  };

  return (
    <div className="bg-[var(--cela-paper)] rounded-xl p-5" style={{ border: "1px solid var(--cela-mist)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider text-[var(--cela-cocoa)]">{label}</p>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${accentColors[accent]}20` }}>
          <Icon className="w-5 h-5" style={{ color: accentColors[accent] }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--cela-espresso)]">{value}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-2 ${trend >= 0 ? "text-[var(--cela-success)]" : "text-[var(--cela-danger)]"}`}>
          {trend >= 0 ? "?" : "?"} {Math.abs(trend)}% so voi hom qua
        </p>
      )}
    </div>
  );
}
