"use client";

import { useState } from "react";
import { TrendingUp, ShoppingBag, BarChart2, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { reportService, type RevenueReportData } from "@/services/report.service";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function RevenueReportPage() {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [reportData, setReportData] = useState<RevenueReportData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAsync, setIsAsync] = useState(false);

  const daysDiff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  );

  async function handleGenerate() {
    if (!startDate || !endDate) { toast.error("Vui lòng chọn khoảng thời gian"); return; }
    if (endDate < startDate) { toast.error("Ngày kết thúc phải sau ngày bắt đầu"); return; }

    if (daysDiff > 31) {
      setIsAsync(true);
      return;
    }
    setIsAsync(false);
    setIsLoading(true);
    try {
      const data = await reportService.getRevenue({ startDate, endDate });
      setReportData(data);
    } catch {
      toast.error("Không thể tải báo cáo, thử lại sau");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAsyncRequest() {
    try {
      await reportService.requestAsyncRevenue({ startDate, endDate });
      toast.success("Đã gửi yêu cầu! Bạn sẽ nhận thông báo khi báo cáo sẵn sàng.");
    } catch {
      toast.error("Gửi yêu cầu thất bại");
    }
  }

  function handleExportCsv() {
    if (!reportData) return;
    const csv = [
      ["Ngày", "Doanh thu", "Số đơn", "TB đơn"].join(","),
      ...reportData.map((d) =>
        [d.date, d.totalRevenue, d.orderCount, d.averageOrderValue].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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

  const allTopProducts = reportData?.flatMap((d) => d.topProducts) ?? [];
  const topProductsMap = new Map<string, { productName: string; soldQty: number; revenue: number }>();
  allTopProducts.forEach((p) => {
    const existing = topProductsMap.get(p.productId);
    if (existing) {
      existing.soldQty += p.soldQty;
      existing.revenue += p.revenue;
    } else {
      topProductsMap.set(p.productId, { productName: p.productName, soldQty: p.soldQty, revenue: p.revenue });
    }
  });
  const topProducts = [...topProductsMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo doanh thu</h1>
        </div>

        {/* Date range */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setIsAsync(false); setReportData(null); }}
                max={endDate}
                className="h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setIsAsync(false); setReportData(null); }}
                min={startDate}
                max={today}
                className="h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="h-10 px-6 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Đang tải..." : "Xem báo cáo"}
            </button>
            {reportData && (
              <button
                onClick={handleExportCsv}
                className="h-10 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Xuất CSV
              </button>
            )}
          </div>
        </div>

        {/* Async warning */}
        {isAsync && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Khoảng thời gian vượt 31 ngày</p>
                <p className="text-sm text-amber-700 mt-1">
                  Báo cáo sẽ được xử lý bất đồng bộ và bạn sẽ nhận thông báo khi hoàn tất.
                </p>
                <button
                  onClick={handleAsyncRequest}
                  className="mt-3 px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
                >
                  Yêu cầu báo cáo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-5 h-24 animate-pulse bg-gray-100" />
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm h-72 animate-pulse bg-gray-100" />
          </div>
        )}

        {/* Report data */}
        {reportData && !isLoading && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, label: "Tổng doanh thu", value: formatVND(totalRevenue), color: "text-pink-600", bg: "bg-pink-50" },
                { icon: ShoppingBag, label: "Tổng đơn hàng", value: totalOrders.toLocaleString("vi-VN"), color: "text-blue-600", bg: "bg-blue-50" },
                { icon: BarChart2, label: "TB đơn hàng", value: formatVND(avgOrder), color: "text-green-600", bg: "bg-green-50" },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Doanh thu theo ngày</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(v: number) => (v / 1000000).toFixed(1) + "M"}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(v) => [formatVND(Number(v)), "Doanh thu"]}
                    labelFormatter={(d) => new Date(d).toLocaleDateString("vi-VN")}
                  />
                  <Bar dataKey="totalRevenue" fill="#DB2777" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top products */}
            {topProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Top sản phẩm bán chạy</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-center px-4 py-3 w-12">#</th>
                      <th className="text-left px-4 py-3">Tên sản phẩm</th>
                      <th className="text-center px-4 py-3">Số lượng bán</th>
                      <th className="text-right px-4 py-3">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.productName}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">{p.soldQty.toLocaleString("vi-VN")}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-pink-600">{formatVND(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!reportData && !isLoading && !isAsync && (
          <div className="bg-white rounded-xl shadow-sm flex flex-col items-center py-20">
            <BarChart2 className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-500">Chọn khoảng thời gian và nhấn &apos;Xem báo cáo&apos;</p>
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
