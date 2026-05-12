"use client";

import { useState } from "react";
import {
  TrendingUp,
  BarChart2,
  Download,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ERPLayout } from "@/components/layout/ERPLayout";
import {
  reportService,
  type RevenueReportData,
} from "@/services/report.service";
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
export default function RevenueReportPage() {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];
  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [reportData, setReportData] = useState<RevenueReportData[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAsync, setIsAsync] = useState(false);
  const daysDiff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000,
  );
  async function handleGenerate() {
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn khoảng thời gian");
      return;
    }
    if (endDate < startDate) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    if (daysDiff > 31) {
      setIsAsync(true);
      setReportData(null);
      return;
    }
    setIsAsync(false);
    setIsLoading(true);
    try {
      const data = await reportService.getRevenue({
        startDate,
        endDate,
      });
      setReportData(data);
    } catch {
      toast.error("Không thể tải báo cáo, thử lại sau");
    } finally {
      setIsLoading(false);
    }
  }
  async function handleAsyncRequest() {
    try {
      await reportService.requestAsyncRevenue({
        startDate,
        endDate,
      });
      toast.success(
        "Đã gửi yêu cầu! Bạn sẽ nhận thông báo khi báo cáo sẵn sàng.",
      );
    } catch {
      toast.error("Gửi yêu cầu thất bại");
    }
  }
  function handleQuickPreset(preset: string) {
    const todayDate = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    if (preset === "today") {
      setStartDate(fmt(todayDate));
      setEndDate(fmt(todayDate));
    } else if (preset === "7days") {
      const from = new Date(todayDate);
      from.setDate(todayDate.getDate() - 6);
      setStartDate(fmt(from));
      setEndDate(fmt(todayDate));
    } else if (preset === "30days") {
      const from = new Date(todayDate);
      from.setDate(todayDate.getDate() - 29);
      setStartDate(fmt(from));
      setEndDate(fmt(todayDate));
    } else if (preset === "thisMonth") {
      setStartDate(
        fmt(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)),
      );
      setEndDate(fmt(todayDate));
    }
    setReportData(null);
    setIsAsync(false);
  }
  function handleExportCsv() {
    if (!reportData) return;
    const csv = [
      ["Ngày", "Doanh thu", "Số đơn", "TB đơn"].join(","),
      ...reportData.map((d) =>
        [d.date, d.totalRevenue, d.orderCount, d.averageOrderValue].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const totalRevenue = reportData?.reduce((s, d) => s + d.totalRevenue, 0) ?? 0;
  const totalOrders = reportData?.reduce((s, d) => s + d.orderCount, 0) ?? 0;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalDiscounts =
    reportData?.reduce(
      (s, d) =>
        s +
        ((
          d as {
            totalDiscount?: number;
          }
        ).totalDiscount ?? 0),
      0,
    ) ?? 0;
  const netRevenue = totalRevenue - totalDiscounts;
  const allTopProducts = reportData?.flatMap((d) => d.topProducts) ?? [];
  const topProductsMap = new Map<
    string,
    {
      productName: string;
      soldQty: number;
      revenue: number;
    }
  >();
  allTopProducts.forEach((p) => {
    const existing = topProductsMap.get(p.productId);
    if (existing) {
      existing.soldQty += p.soldQty;
      existing.revenue += p.revenue;
    } else {
      topProductsMap.set(p.productId, {
        productName: p.productName,
        soldQty: p.soldQty,
        revenue: p.revenue,
      });
    }
  });
  const topProducts = [...topProductsMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <TrendingUp className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
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
                doanh thu
              </span>
            </h1>
          </div>{" "}
        </div>{" "}
        {/* Date range */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl p-6">
          {" "}
          <div className="flex items-end gap-4 flex-wrap">
            {" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                {" "}
                Từ ngày{" "}
              </label>{" "}
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setIsAsync(false);
                  setReportData(null);
                }}
                max={endDate}
                className="h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">
                {" "}
                Đến ngày{" "}
              </label>{" "}
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setIsAsync(false);
                  setReportData(null);
                }}
                min={startDate}
                max={today}
                className="h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              />{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center justify-between mt-4">
            {" "}
            <div className="flex gap-2">
              {" "}
              {[
                {
                  label: "Hôm nay",
                  preset: "today",
                },
                {
                  label: "7 ngày",
                  preset: "7days",
                },
                {
                  label: "30 ngày",
                  preset: "30days",
                },
                {
                  label: "Tháng này",
                  preset: "thisMonth",
                },
              ].map(({ label, preset }) => (
                <button
                  key={preset}
                  onClick={() => handleQuickPreset(preset)}
                  className="px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--cela-fog)] transition-colors"
                  style={{
                    border: "1px solid var(--cela-mist)",
                  }}
                >
                  {" "}
                  {label}{" "}
                </button>
              ))}{" "}
            </div>{" "}
            <div className="flex gap-3">
              {" "}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-[var(--cela-rose-deep)] text-white rounded-lg hover:bg-[var(--cela-rose-deep)] disabled:opacity-50 font-medium text-sm flex items-center gap-2"
              >
                {" "}
                <FileText className="w-4 h-4" /> XEM BÁO CÁO{" "}
              </button>{" "}
              {reportData && (
                <button
                  onClick={handleExportCsv}
                  className="px-4 py-2 rounded-lg hover:bg-[var(--cela-fog)] font-medium text-sm flex items-center gap-2"
                  style={{
                    border: "1px solid var(--cela-mist)",
                  }}
                >
                  {" "}
                  <Download className="w-4 h-4" /> XUẤT CSV{" "}
                </button>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {isAsync && !isLoading && (
          <div className="bg-[var(--cela-paper)] rounded-xl p-12">
            {" "}
            <div className="max-w-2xl mx-auto text-center">
              {" "}
              <div className="w-20 h-20 mx-auto mb-6 bg-[var(--cela-espresso)] rounded-full flex items-center justify-center">
                {" "}
                <FileText className="w-10 h-10 text-white" />{" "}
              </div>{" "}
              <h3 className="text-[28px] font-bold text-[var(--cela-espresso)] mb-3">
                {" "}
                Báo cáo cần xử lý bất đồng bộ{" "}
              </h3>{" "}
              <p className="text-[var(--cela-stone)] mb-6">
                {" "}
                Khoảng thời gian bạn chọn là{""}{" "}
                <span className="font-bold">{daysDiff} ngày</span> (vượt quá 31
                ngày). Báo cáo sẽ được xử lý trong nền và bạn sẽ nhận được thông
                báo khi hoàn tất.{" "}
              </p>{" "}
              <button
                onClick={handleAsyncRequest}
                className="px-6 py-3 bg-[var(--cela-rose-deep)] text-white rounded-lg hover:bg-[var(--cela-rose-deep)] transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                {" "}
                <FileText className="w-5 h-5" /> YÊU CẦU BÁO CÁO NGAY{" "}
              </button>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* Loading skeleton */}{" "}
        {isLoading && (
          <div className="space-y-4">
            {" "}
            <div className="grid grid-cols-4 gap-4">
              {" "}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[var(--cela-paper)] rounded-xl p-5 h-24 animate-pulse bg-[var(--cela-fog)]"
                />
              ))}{" "}
            </div>{" "}
            <div className="bg-[var(--cela-paper)] rounded-xl h-72 animate-pulse bg-[var(--cela-fog)]" />{" "}
          </div>
        )}{" "}
        {/* Report data */}{" "}
        {reportData && !isLoading && (
          <>
            {" "}
            {/* KPI row */}{" "}
            <div className="grid grid-cols-4 gap-4">
              {" "}
              {[
                {
                  icon: DollarSign,
                  label: "Tổng doanh thu",
                  value: formatVND(totalRevenue),
                  color: "text-[var(--cela-success)]",
                  bg: "bg-[rgba(107,142,106,0.15)]",
                },
                {
                  icon: ShoppingCart,
                  label: "Số đơn hoàn thành",
                  value: totalOrders.toLocaleString("vi-VN"),
                  color: "text-[var(--cela-cocoa)]",
                  bg: "bg-[rgba(120,140,180,0.18)]",
                },
                {
                  icon: TrendingUp,
                  label: "Giá trị đơn TB",
                  value: formatVND(avgOrder),
                  color: "text-[#6080b0]",
                  bg: "bg-[rgba(120,140,180,0.18)]",
                },
                {
                  icon: TrendingDown,
                  label: "Doanh thu thuần",
                  value: formatVND(netRevenue),
                  color: "text-[var(--cela-champagne)]",
                  bg: "bg-[rgba(201,168,122,0.18)]",
                  subtitle: `Sau giảm giá ${formatVND(totalDiscounts)}`,
                },
              ].map(({ icon: Icon, label, value, color, bg, subtitle }) => (
                <div
                  key={label}
                  className="bg-[var(--cela-paper)] rounded-xl p-5 flex items-center gap-4"
                >
                  {" "}
                  <div
                    className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}
                  >
                    {" "}
                    <Icon className={`w-5 h-5 ${color}`} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <p className="text-xs text-[var(--cela-stone)]">
                      {label}
                    </p>{" "}
                    <p className={`text-lg font-bold ${color}`}>{value}</p>{" "}
                    {subtitle && (
                      <p className="text-xs text-[var(--cela-stone)] mt-0.5">
                        {subtitle}
                      </p>
                    )}{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
            <div className="grid grid-cols-5 gap-6 mb-6">
              {" "}
              <div className="col-span-3 bg-[var(--cela-paper)] rounded-xl p-6">
                {" "}
                <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">
                  {" "}
                  Doanh thu theo ngày{" "}
                </h3>{" "}
                <ResponsiveContainer width="100%" height={300}>
                  {" "}
                  <AreaChart
                    data={reportData}
                    margin={{
                      top: 4,
                      right: 16,
                      left: 16,
                      bottom: 4,
                    }}
                  >
                    {" "}
                    <defs>
                      {" "}
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        {" "}
                        <stop
                          offset="5%"
                          stopColor="var(--cela-rose-deep)"
                          stopOpacity={0.3}
                        />{" "}
                        <stop
                          offset="95%"
                          stopColor="var(--cela-rose-deep)"
                          stopOpacity={0}
                        />{" "}
                      </linearGradient>{" "}
                    </defs>{" "}
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />{" "}
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      }
                      tick={{
                        fontSize: 12,
                      }}
                    />{" "}
                    <YAxis
                      tickFormatter={(v: number) =>
                        (v / 1000000).toFixed(1) + "M"
                      }
                      tick={{
                        fontSize: 12,
                      }}
                    />{" "}
                    <Tooltip
                      formatter={(v) => [formatVND(Number(v)), "Doanh thu"]}
                      labelFormatter={(d) =>
                        new Date(d).toLocaleDateString("vi-VN")
                      }
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    />{" "}
                    <Area
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke="var(--cela-rose-deep)"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />{" "}
                  </AreaChart>{" "}
                </ResponsiveContainer>{" "}
              </div>{" "}
              <div className="col-span-2 bg-[var(--cela-paper)] rounded-xl p-6">
                {" "}
                <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">
                  {" "}
                  Phân tích theo danh mục{" "}
                </h3>{" "}
                <ResponsiveContainer width="100%" height={220}>
                  {" "}
                  <PieChart>
                    {" "}
                    <Pie
                      data={topProducts.slice(0, 4).map((p) => ({
                        name: p.productName,
                        value: p.revenue,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {" "}
                      {topProducts.slice(0, 4).map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            [
                              "var(--cela-rose)",
                              "#9D7FD8",
                              "#F59E0B",
                              "var(--cela-rose)",
                            ][index % 4]
                          }
                        />
                      ))}{" "}
                    </Pie>{" "}
                    <Tooltip formatter={(v) => formatVND(Number(v))} />{" "}
                  </PieChart>{" "}
                </ResponsiveContainer>{" "}
                <div className="mt-3 space-y-1.5">
                  {" "}
                  {topProducts.slice(0, 4).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      {" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: [
                              "var(--cela-rose)",
                              "#9D7FD8",
                              "#F59E0B",
                              "var(--cela-rose)",
                            ][i],
                          }}
                        />{" "}
                        <span className="text-[var(--cela-cocoa)] truncate max-w-[120px]">
                          {" "}
                          {p.productName}{" "}
                        </span>{" "}
                      </div>{" "}
                      <span className="font-medium text-[var(--cela-espresso)] text-xs">
                        {" "}
                        {formatVND(p.revenue)}{" "}
                      </span>{" "}
                    </div>
                  ))}{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Top products */}{" "}
            {topProducts.length > 0 && (
              <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
                {" "}
                <div
                  className="p-6"
                  style={{
                    borderBottom: "1px solid var(--cela-mist)",
                  }}
                >
                  {" "}
                  <h3 className="font-semibold text-[var(--cela-espresso)]">
                    {" "}
                    Top sản phẩm bán chạy{" "}
                  </h3>{" "}
                </div>{" "}
                <table className="w-full">
                  {" "}
                  <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                    {" "}
                    <tr>
                      {" "}
                      <th className="text-center px-4 py-3 w-12">#</th>{" "}
                      <th className="text-left px-4 py-3">Tên sản phẩm</th>{" "}
                      <th className="text-center px-4 py-3">Số lượng bán</th>{" "}
                      <th className="text-right px-4 py-3">Doanh thu</th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {topProducts.map((p, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[var(--cela-fog)]"
                        style={{
                          borderBottom: "1px solid var(--cela-fog)",
                        }}
                      >
                        {" "}
                        <td className="px-4 py-3 text-center text-sm font-bold text-[var(--cela-stone)]">
                          {" "}
                          {idx + 1}{" "}
                        </td>{" "}
                        <td className="px-4 py-3 text-sm font-medium text-[var(--cela-espresso)]">
                          {" "}
                          {p.productName}{" "}
                        </td>{" "}
                        <td className="px-4 py-3 text-center text-sm text-[var(--cela-cocoa)]">
                          {" "}
                          {p.soldQty.toLocaleString("vi-VN")}{" "}
                        </td>{" "}
                        <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--cela-rose)]">
                          {" "}
                          {formatVND(p.revenue)}{" "}
                        </td>{" "}
                      </tr>
                    ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
            <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
              {" "}
              <div
                className="p-6"
                style={{
                  borderBottom: "1px solid var(--cela-mist)",
                }}
              >
                {" "}
                <h3 className="font-semibold text-[var(--cela-espresso)]">
                  {" "}
                  Doanh thu theo ngày (chi tiết){" "}
                </h3>{" "}
              </div>{" "}
              <div className="overflow-x-auto">
                {" "}
                <table className="w-full">
                  {" "}
                  <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                    {" "}
                    <tr>
                      {" "}
                      <th className="text-left px-6 py-3">Ngày</th>{" "}
                      <th className="text-right px-4 py-3">Số đơn HT</th>{" "}
                      <th className="text-right px-4 py-3">Tổng doanh thu</th>{" "}
                      <th className="text-right px-4 py-3">
                        Giá trị TB đơn
                      </th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {reportData.map((d) => (
                      <tr
                        key={d.date}
                        className="hover:bg-[var(--cela-fog)]"
                        style={{
                          borderBottom: "1px solid var(--cela-fog)",
                        }}
                      >
                        {" "}
                        <td className="px-6 py-3 text-sm font-medium text-[var(--cela-espresso)]">
                          {" "}
                          {new Date(d.date).toLocaleDateString("vi-VN")}{" "}
                        </td>{" "}
                        <td className="px-4 py-3 text-right text-sm text-[var(--cela-cocoa)]">
                          {" "}
                          {d.orderCount}{" "}
                        </td>{" "}
                        <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--cela-espresso)]">
                          {" "}
                          {formatVND(d.totalRevenue)}{" "}
                        </td>{" "}
                        <td className="px-4 py-3 text-right text-sm text-[var(--cela-success)]">
                          {" "}
                          {formatVND(d.averageOrderValue)}{" "}
                        </td>{" "}
                      </tr>
                    ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>{" "}
            </div>{" "}
          </>
        )}{" "}
        {/* Empty state */}{" "}
        {!reportData && !isLoading && !isAsync && (
          <div className="bg-[var(--cela-paper)] rounded-xl flex flex-col items-center py-20">
            {" "}
            <BarChart2 className="w-16 h-16 text-[var(--cela-mist)] mb-4" />{" "}
            <p className="text-[var(--cela-stone)]">
              {" "}
              Chọn khoảng thời gian và nhấn &apos;Xem báo cáo&apos;{" "}
            </p>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </ERPLayout>
  );
}
