"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  RefreshCw,
  AlertTriangle,
  Clock,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import {
  reportService,
  type InventoryReportData,
} from "@/services/report.service";
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
type TabKey = "low-stock" | "near-expiry" | "slow-moving";
export default function InventoryReportPage() {
  const [reportData, setReportData] = useState<InventoryReportData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<TabKey>("low-stock");
  const [isLoading, setIsLoading] = useState(true);
  async function load() {
    setIsLoading(true);
    try {
      const data = await reportService.getInventoryReport();
      setReportData(data);
    } catch {
      toast.error("Không thể tải báo cáo tồn kho");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  }
  const tabs: {
    key: TabKey;
    label: string;
    count: number;
    color: string;
  }[] = [
    {
      key: "low-stock",
      label: "Tồn kho thấp",
      count: reportData?.lowStockItems.length ?? 0,
      color: "text-[var(--cela-danger)]",
    },
    {
      key: "near-expiry",
      label: "Sắp hết hạn",
      count: reportData?.nearExpiryItems.length ?? 0,
      color: "text-[var(--cela-gold)]",
    },
    {
      key: "slow-moving",
      label: "Chậm luân chuyển",
      count: reportData?.slowMovingItems.length ?? 0,
      color: "text-[var(--cela-cocoa)]",
    },
  ];
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <BarChart2 className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
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
                B�o c�o{" "}
                <span
                  style={{
                    color: "var(--cela-rose)",
                  }}
                >
                  t?n kho
                </span>
              </h1>
            </div>{" "}
          </div>{" "}
          <button
            onClick={load}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)] disabled:opacity-50"
            style={{
              border: "1px solid var(--cela-mist)",
            }}
          >
            {" "}
            <RefreshCw
              className={`w-4 h-4${isLoading ? "animate-spin" : ""}`}
            />{" "}
            Cập nhật{" "}
          </button>{" "}
        </div>{" "}
        {/* Summary cards */}{" "}
        <div className="grid grid-cols-3 gap-4">
          {" "}
          {[
            {
              icon: AlertTriangle,
              label: "Tồn kho thấp",
              value: reportData?.lowStockItems.length ?? 0,
              color: "text-[var(--cela-danger)]",
              bg: "bg-[rgba(183,110,121,0.08)]",
            },
            {
              icon: Clock,
              label: "Sắp hết hạn",
              value: reportData?.nearExpiryItems.length ?? 0,
              color: "text-[var(--cela-gold)]",
              bg: "bg-[rgba(201,168,122,0.14)]",
            },
            {
              icon: TrendingDown,
              label: "Chậm luân chuyển",
              value: reportData?.slowMovingItems.length ?? 0,
              color: "text-[var(--cela-cocoa)]",
              bg: "bg-[rgba(120,140,180,0.12)]",
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className="bg-[var(--cela-paper)] rounded-xl p-5 flex items-center gap-4"
            >
              {" "}
              <div
                className={`w-11 h-11${bg}rounded-xl flex items-center justify-center`}
              >
                {" "}
                <Icon className={`w-5 h-5${color}`} />{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-xs text-[var(--cela-stone)]">{label}</p>{" "}
                <p className={`text-[28px] font-bold${color}`}>
                  {isLoading ? "—" : value}
                </p>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
        {/* Tabs */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {" "}
          <div
            className="flex"
            style={{
              borderBottom: "1px solid var(--cela-mist)",
            }}
          >
            {" "}
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors${activeTab === tab.key ? "border-[var(--cela-rose)] text-[var(--cela-rose)]" : "border-transparent text-[var(--cela-stone)] hover:text-[var(--cela-cocoa)]"}`}
              >
                {" "}
                {tab.label}{" "}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold${activeTab === tab.key ? "bg-[rgba(183,110,121,0.15)] text-[var(--cela-rose-deep)]" : "bg-[var(--cela-fog)] text-[var(--cela-stone)]"}`}
                >
                  {" "}
                  {tab.count}{" "}
                </span>{" "}
              </button>
            ))}{" "}
          </div>{" "}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
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
              {/* Tab 1: Low stock */}{" "}
              {activeTab === "low-stock" && (
                <table className="w-full">
                  {" "}
                  <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                    {" "}
                    <tr>
                      {" "}
                      <th className="text-left px-6 py-3">Sản phẩm</th>{" "}
                      <th className="text-left px-4 py-3">SKU</th>{" "}
                      <th className="text-center px-4 py-3">Tồn kho</th>{" "}
                      <th className="text-center px-4 py-3">
                        Ngưỡng tối thiểu
                      </th>{" "}
                      <th className="text-center px-4 py-3">% còn lại</th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {(reportData?.lowStockItems ?? []).length === 0 ? (
                      <tr
                        style={{
                          borderBottom: "1px solid var(--cela-fog)",
                        }}
                      >
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-[var(--cela-stone)] text-sm"
                        >
                          Không có sản phẩm nào
                        </td>
                      </tr>
                    ) : (
                      reportData?.lowStockItems.map((item) => {
                        const pct =
                          item.minThreshold > 0
                            ? Math.round(
                                (item.quantity / item.minThreshold) * 100,
                              )
                            : 0;
                        return (
                          <tr
                            key={item.productId}
                            className="hover:bg-[var(--cela-fog)]"
                            style={{
                              borderBottom: "1px solid var(--cela-fog)",
                            }}
                          >
                            {" "}
                            <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">
                              {item.productName}
                            </td>{" "}
                            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                              {item.sku}
                            </td>{" "}
                            <td className="px-4 py-4 text-center">
                              {" "}
                              <span className="text-sm font-bold text-[var(--cela-danger)]">
                                {item.quantity}
                              </span>{" "}
                            </td>{" "}
                            <td className="px-4 py-4 text-center text-sm text-[var(--cela-stone)]">
                              {item.minThreshold}
                            </td>{" "}
                            <td className="px-4 py-4">
                              {" "}
                              <div className="flex items-center gap-2 justify-center">
                                {" "}
                                <div className="w-24 bg-[var(--cela-mist)] rounded-full h-2">
                                  {" "}
                                  <div
                                    className="bg-[var(--cela-rose)] h-2 rounded-full"
                                    style={{
                                      width: `${Math.min(pct, 100)}%`,
                                    }}
                                  />{" "}
                                </div>{" "}
                                <span className="text-xs text-[var(--cela-danger)] font-medium">
                                  {pct}%
                                </span>{" "}
                              </div>{" "}
                            </td>{" "}
                          </tr>
                        );
                      })
                    )}{" "}
                  </tbody>{" "}
                </table>
              )}{" "}
              {/* Tab 2: Near expiry */}{" "}
              {activeTab === "near-expiry" && (
                <table className="w-full">
                  {" "}
                  <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                    {" "}
                    <tr>
                      {" "}
                      <th className="text-left px-6 py-3">Sản phẩm</th>{" "}
                      <th className="text-left px-4 py-3">SKU</th>{" "}
                      <th className="text-left px-4 py-3">Hạn sử dụng</th>{" "}
                      <th className="text-center px-4 py-3">Tồn kho</th>{" "}
                      <th className="text-center px-4 py-3">Còn lại</th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {(reportData?.nearExpiryItems ?? []).length === 0 ? (
                      <tr
                        style={{
                          borderBottom: "1px solid var(--cela-fog)",
                        }}
                      >
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-[var(--cela-stone)] text-sm"
                        >
                          Không có sản phẩm nào
                        </td>
                      </tr>
                    ) : (
                      reportData?.nearExpiryItems.map((item) => {
                        const days = daysUntil(item.expiryDate);
                        return (
                          <tr
                            key={item.productId}
                            className="hover:bg-[var(--cela-fog)]"
                            style={{
                              borderBottom: "1px solid var(--cela-fog)",
                            }}
                          >
                            {" "}
                            <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">
                              {item.productName}
                            </td>{" "}
                            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                              {item.sku}
                            </td>{" "}
                            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                              {formatDate(item.expiryDate)}
                            </td>{" "}
                            <td className="px-4 py-4 text-center text-sm text-[var(--cela-cocoa)]">
                              {item.quantity}
                            </td>{" "}
                            <td className="px-4 py-4 text-center">
                              {" "}
                              <span
                                className={`text-sm font-bold${days <= 7 ? "text-[var(--cela-danger)]" : "text-[var(--cela-gold)]"}`}
                              >
                                {" "}
                                {days} ngày{" "}
                              </span>{" "}
                            </td>{" "}
                          </tr>
                        );
                      })
                    )}{" "}
                  </tbody>{" "}
                </table>
              )}{" "}
              {/* Tab 3: Slow moving */}{" "}
              {activeTab === "slow-moving" && (
                <table className="w-full">
                  {" "}
                  <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                    {" "}
                    <tr>
                      {" "}
                      <th className="text-left px-6 py-3">Sản phẩm</th>{" "}
                      <th className="text-left px-4 py-3">SKU</th>{" "}
                      <th className="text-center px-4 py-3">Tồn kho</th>{" "}
                      <th className="text-left px-4 py-3">Lần bán cuối</th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {(reportData?.slowMovingItems ?? []).length === 0 ? (
                      <tr
                        style={{
                          borderBottom: "1px solid var(--cela-fog)",
                        }}
                      >
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-[var(--cela-stone)] text-sm"
                        >
                          Không có sản phẩm nào
                        </td>
                      </tr>
                    ) : (
                      reportData?.slowMovingItems.map((item) => {
                        const isOld = item.lastSoldAt
                          ? (Date.now() - new Date(item.lastSoldAt).getTime()) /
                              86400000 >
                            30
                          : true;
                        return (
                          <tr
                            key={item.productId}
                            className="hover:bg-[var(--cela-fog)]"
                            style={{
                              borderBottom: "1px solid var(--cela-fog)",
                            }}
                          >
                            {" "}
                            <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">
                              {item.productName}
                            </td>{" "}
                            <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">
                              {item.sku}
                            </td>{" "}
                            <td className="px-4 py-4 text-center text-sm text-[var(--cela-cocoa)]">
                              {item.quantity}
                            </td>{" "}
                            <td className="px-4 py-4">
                              {" "}
                              <span
                                className={`text-sm${isOld ? "text-[var(--cela-cocoa)] font-medium" : "text-[var(--cela-stone)]"}`}
                              >
                                {" "}
                                {item.lastSoldAt
                                  ? formatDate(item.lastSoldAt)
                                  : "Chưa bán"}{" "}
                              </span>{" "}
                            </td>{" "}
                          </tr>
                        );
                      })
                    )}{" "}
                  </tbody>{" "}
                </table>
              )}{" "}
            </>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </ERPLayout>
  );
}
