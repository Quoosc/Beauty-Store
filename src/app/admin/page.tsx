"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, BarChart2, Star } from "lucide-react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { reportService } from "@/services/report.service";
import type { DashboardData } from "@/types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

interface KPICardProps {
  label: string;
  value: string;
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  trend?: number;
}

function KPICard({ label, value, accent, icon: Icon, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + "20" }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <p className={`text-sm mt-2 flex items-center gap-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(trend)}% so với hôm qua
        </p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportService.getDashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setIsLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("vi-VN", { dateStyle: "full" });

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>

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
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                label="Doanh thu hôm nay"
                value={formatVND(dashboard?.totalRevenue ?? 0)}
                accent="#EC4899"
                icon={DollarSign}
                trend={dashboard?.revenueGrowth}
              />
              <KPICard
                label="Số đơn hàng"
                value={String(dashboard?.totalOrders ?? 0)}
                accent="#2563EB"
                icon={ShoppingBag}
              />
              <KPICard
                label="Giá trị đơn TB"
                value={formatVND(dashboard?.averageOrderValue ?? 0)}
                accent="#059669"
                icon={BarChart2}
              />
              <KPICard
                label="Tăng trưởng"
                value={`${dashboard?.revenueGrowth ?? 0}%`}
                accent="#D97706"
                icon={TrendingUp}
                trend={dashboard?.revenueGrowth}
              />
            </div>

            {/* Middle row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Top products */}
              <div className="col-span-1 bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Sản phẩm bán chạy
                </h3>
                {dashboard?.topProducts.length ? (
                  <ol className="space-y-3">
                    {dashboard.topProducts.slice(0, 5).map((p, i) => (
                      <li key={p.productId} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                          ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-500"}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.productName}</p>
                          <p className="text-xs text-gray-500">{p.soldQty} đã bán</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
                )}
              </div>

              {/* Quick stats placeholder */}
              <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Doanh thu 7 ngày qua</h3>
                <div className="flex items-center justify-center h-40 text-gray-400">
                  <p className="text-sm">Biểu đồ doanh thu (cần Recharts)</p>
                </div>
              </div>
            </div>

            {/* Alerts panel */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Cảnh báo hệ thống</h3>
              <p className="text-sm text-gray-400">Không có cảnh báo nào.</p>
            </div>
          </>
        )}
      </div>
    </ERPLayout>
  );
}
