"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  CheckSquare,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { reportService } from "@/services/report.service";
import type { DashboardData } from "@/types";
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
interface KPICardProps {
  label: string;
  value: string;
  accent: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  trend?: number;
}
function KPICard({ label, value, accent, icon: Icon, trend }: KPICardProps) {
  return (
    <div
      className="bg-[var(--cela-paper)] rounded-xl p-6"
      style={{
        border: "1px solid var(--cela-mist)",
      }}
    >
      {" "}
      <div className="flex items-center justify-between mb-4">
        {" "}
        <p className="text-sm text-[var(--cela-stone)] font-medium">
          {label}
        </p>{" "}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: accent + "20",
          }}
        >
          {" "}
          <Icon
            className="w-5 h-5"
            style={{
              color: accent,
            }}
          />{" "}
        </div>{" "}
      </div>{" "}
      <p className="text-[28px] font-bold text-[var(--cela-espresso)]">
        {value}
      </p>{" "}
      {trend !== undefined && (
        <p
          className={`text-sm mt-2 flex items-center gap-1${trend >= 0 ? "text-[var(--cela-success)]" : "text-[var(--cela-danger)]"}`}
        >
          {" "}
          {trend >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}{" "}
          {Math.abs(trend)}% so với hôm qua{" "}
        </p>
      )}{" "}
    </div>
  );
}
export default function BranchManagerDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    reportService
      .getDashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setIsLoading(false));
  }, []);
  const today = new Date().toLocaleDateString("vi-VN", {
    dateStyle: "full",
  });
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
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
                Chi nh�nh
              </span>
            </h1>
          </div>{" "}
          <p className="text-sm text-[var(--cela-stone)]">{today}</p>{" "}
        </div>{" "}
        {isLoading ? (
          <div className="flex justify-center py-16">
            {" "}
            <svg
              className="animate-spin w-6 h-6 text-[var(--cela-rose)]"
              viewBox="0 0 24 24"
              fill="none"
            >
              {" "}
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />{" "}
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />{" "}
            </svg>{" "}
          </div>
        ) : (
          <>
            {" "}
            <div className="grid grid-cols-3 gap-4">
              {" "}
              <KPICard
                label="Doanh thu hôm nay"
                value={formatVND(dashboard?.totalRevenue ?? 0)}
                accent="var(--cela-rose)"
                icon={DollarSign}
                trend={dashboard?.revenueGrowth}
              />{" "}
              <KPICard
                label="Số đơn hàng"
                value={String(dashboard?.totalOrders ?? 0)}
                accent="#2563EB"
                icon={ShoppingBag}
              />{" "}
              <KPICard
                label="Tăng trưởng"
                value={`${dashboard?.revenueGrowth ?? 0}%`}
                accent="#D97706"
                icon={TrendingUp}
                trend={dashboard?.revenueGrowth}
              />{" "}
            </div>{" "}
            {/* Pending approvals */}{" "}
            <div className="grid grid-cols-2 gap-4">
              {" "}
              <div className="bg-[var(--cela-paper)] rounded-xl p-6 border-l-4 border-amber-400">
                {" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <CheckSquare className="w-5 h-5 text-[var(--cela-gold)]" />{" "}
                    <div>
                      {" "}
                      <p className="font-semibold text-[var(--cela-espresso)]">
                        Đơn hàng chờ duyệt hủy
                      </p>{" "}
                      <p className="text-sm text-[var(--cela-stone)]">
                        Cần phê duyệt từ Branch Manager
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <Link
                    href="/manager/orders"
                    className="px-4 py-2 bg-[rgba(201,168,122,0.14)] text-[var(--cela-gold)] rounded-lg text-sm font-medium hover:bg-[rgba(201,168,122,0.20)] transition-colors"
                  >
                    {" "}
                    Xem →{" "}
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
              <div className="bg-[var(--cela-paper)] rounded-xl p-6 border-l-4 border-blue-400">
                {" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <ClipboardCheck className="w-5 h-5 text-[var(--cela-cocoa)]" />{" "}
                    <div>
                      {" "}
                      <p className="font-semibold text-[var(--cela-espresso)]">
                        Điều chỉnh kho chờ duyệt
                      </p>{" "}
                      <p className="text-sm text-[var(--cela-stone)]">
                        Yêu cầu {">"} 10% tồn kho
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <Link
                    href="/manager/inventory"
                    className="px-4 py-2 bg-[rgba(120,140,180,0.12)] text-[var(--cela-cocoa)] rounded-lg text-sm font-medium hover:bg-[rgba(120,140,180,0.18)] transition-colors"
                  >
                    {" "}
                    Xem →{" "}
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Top products */}{" "}
            <div className="bg-[var(--cela-paper)] rounded-xl p-6">
              {" "}
              <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">
                Sản phẩm bán chạy hôm nay
              </h3>{" "}
              {dashboard?.topProducts.length ? (
                <div className="space-y-3">
                  {" "}
                  {dashboard.topProducts.slice(0, 5).map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      {" "}
                      <span className="w-6 h-6 rounded-full bg-[rgba(183,110,121,0.15)] text-[var(--cela-rose-deep)] text-xs font-bold flex items-center justify-center">
                        {" "}
                        {i + 1}{" "}
                      </span>{" "}
                      <p className="flex-1 text-sm text-[var(--cela-espresso)]">
                        {p.productName}
                      </p>{" "}
                      <p className="text-sm font-semibold text-[var(--cela-stone)]">
                        {p.soldQty} đã bán
                      </p>{" "}
                    </div>
                  ))}{" "}
                </div>
              ) : (
                <p className="text-sm text-[var(--cela-stone)]">
                  Chưa có dữ liệu hôm nay
                </p>
              )}{" "}
            </div>{" "}
          </>
        )}{" "}
      </div>{" "}
    </ERPLayout>
  );
}
