"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart2,
  Download,
  FileText,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { reportService, type RevenueReportData } from "@/services/report.service";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function RevenueReportPage() {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [reportData, setReportData] = useState<RevenueReportData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [asyncMessage, setAsyncMessage] = useState<string>("");

  const daysDiff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  );

  async function pollAsyncJob(jobId: string) {
    setAsyncMessage("Dang xu ly bao cao bat dong bo...");

    for (let attempt = 0; attempt < 60; attempt += 1) {
      await sleep(5000);

      const job = await reportService.getJobResult(jobId);
      const status = job.status;

      if (status === "COMPLETED") {
        const payload = job.data as { reportData?: RevenueReportData[] } | undefined;
        if (payload?.reportData && Array.isArray(payload.reportData)) {
          setReportData(payload.reportData);
          setAsyncMessage("Bao cao da hoan tat");
          return;
        }

        setAsyncMessage(
          "Bao cao da hoan tat. Neu chua co du lieu trong man hinh, vui long mo notification de lay ket qua."
        );
        return;
      }

      if (status === "FAILED") {
        throw new Error("Job tao bao cao that bai");
      }

      setAsyncMessage(`Job dang ${status.toLowerCase()}...`);
    }

    setAsyncMessage("Het thoi gian cho polling. Vui long thu lai sau.");
  }

  async function handleGenerate() {
    if (!startDate || !endDate) {
      toast.error("Vui long chon khoang thoi gian");
      return;
    }

    if (endDate < startDate) {
      toast.error("Ngay ket thuc phai sau ngay bat dau");
      return;
    }

    setIsLoading(true);
    setReportData(null);
    setAsyncMessage("");

    try {
      if (daysDiff > 31) {
        const job = await reportService.requestAsyncRevenue({
          startDate,
          endDate,
        });

        toast.success("Da tao job bao cao bat dong bo");
        await pollAsyncJob(job.jobId);
      } else {
        const data = await reportService.getRevenue({
          startDate,
          endDate,
        });
        setReportData(data);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? (err as Error)?.message ?? "Khong the tai bao cao";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickPreset(preset: "today" | "7days" | "30days" | "thisMonth") {
    const todayDate = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "today") {
      setStartDate(fmt(todayDate));
      setEndDate(fmt(todayDate));
    }

    if (preset === "7days") {
      const from = new Date(todayDate);
      from.setDate(todayDate.getDate() - 6);
      setStartDate(fmt(from));
      setEndDate(fmt(todayDate));
    }

    if (preset === "30days") {
      const from = new Date(todayDate);
      from.setDate(todayDate.getDate() - 29);
      setStartDate(fmt(from));
      setEndDate(fmt(todayDate));
    }

    if (preset === "thisMonth") {
      setStartDate(fmt(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)));
      setEndDate(fmt(todayDate));
    }

    setReportData(null);
    setAsyncMessage("");
  }

  function handleExportCsv() {
    if (!reportData) return;

    const csv = [
      ["Ngay", "Doanh thu", "So don", "Gia tri TB"].join(","),
      ...reportData.map((d) =>
        [d.date, d.totalRevenue, d.orderCount, d.averageOrderValue].join(",")
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

  const totalRevenue = reportData?.reduce((sum, d) => sum + d.totalRevenue, 0) ?? 0;
  const totalOrders = reportData?.reduce((sum, d) => sum + d.orderCount, 0) ?? 0;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const chartRows = useMemo(
    () =>
      (reportData ?? []).map((d) => ({
        date: d.date,
        label: new Date(d.date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        revenue: d.totalRevenue,
      })),
    [reportData]
  );

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-[var(--cela-rose)]" />
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", fontWeight: 600, marginBottom: 6 }}>
              BEAUTY ERP
            </p>
            <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2 }}>
              Bao cao <span style={{ color: "var(--cela-rose)" }}>doanh thu</span>
            </h1>
          </div>
        </div>

        <div className="bg-[var(--cela-paper)] rounded-xl p-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Tu ngay</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setReportData(null);
                  setAsyncMessage("");
                }}
                className="h-10 rounded-lg px-3 text-sm focus:outline-none"
                style={{ border: "1px solid var(--cela-mist)" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Den ngay</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setReportData(null);
                  setAsyncMessage("");
                }}
                className="h-10 rounded-lg px-3 text-sm focus:outline-none"
                style={{ border: "1px solid var(--cela-mist)" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <button onClick={() => handleQuickPreset("today")} className="px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--cela-fog)]" style={{ border: "1px solid var(--cela-mist)" }}>Hom nay</button>
              <button onClick={() => handleQuickPreset("7days")} className="px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--cela-fog)]" style={{ border: "1px solid var(--cela-mist)" }}>7 ngay</button>
              <button onClick={() => handleQuickPreset("30days")} className="px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--cela-fog)]" style={{ border: "1px solid var(--cela-mist)" }}>30 ngay</button>
              <button onClick={() => handleQuickPreset("thisMonth")} className="px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--cela-fog)]" style={{ border: "1px solid var(--cela-mist)" }}>Thang nay</button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-[var(--cela-rose-deep)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {daysDiff > 31 ? "TAO JOB BAO CAO" : "XEM BAO CAO"}
              </button>

              {reportData && (
                <button
                  onClick={handleExportCsv}
                  className="px-4 py-2 rounded-lg hover:bg-[var(--cela-fog)] font-medium text-sm flex items-center gap-2"
                  style={{ border: "1px solid var(--cela-mist)" }}
                >
                  <Download className="w-4 h-4" /> XUAT CSV
                </button>
              )}
            </div>
          </div>

          {daysDiff > 31 && (
            <p className="text-xs text-[var(--cela-gold)] mt-3">
              Khoang {">"}31 ngay se duoc xu ly bat dong bo va polling moi 5 giay.
            </p>
          )}
        </div>

        {asyncMessage && (
          <div className="bg-[var(--cela-paper)] rounded-xl p-4 text-sm text-[var(--cela-cocoa)]" style={{ border: "1px solid var(--cela-mist)" }}>
            {asyncMessage}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {reportData && !isLoading && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <MetricCard icon={TrendingUp} label="Tong doanh thu" value={formatVND(totalRevenue)} />
              <MetricCard icon={ShoppingCart} label="So don hoan thanh" value={totalOrders.toLocaleString("vi-VN")} />
              <MetricCard icon={BarChart2} label="Gia tri don trung binh" value={formatVND(avgOrder)} />
            </div>

            <div className="bg-[var(--cela-paper)] rounded-xl p-6">
              <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">Doanh thu theo ngay</h3>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartRows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--cela-rose-deep)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--cela-rose-deep)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                  <Tooltip
                    formatter={(v) => [formatVND(Number(v)), "Doanh thu"]}
                    labelFormatter={(label, payload) => {
                      const row = payload?.[0]?.payload as { date?: string } | undefined;
                      if (!row?.date) return label;
                      return new Date(row.date).toLocaleDateString("vi-VN");
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--cela-rose-deep)" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
              <div className="p-6" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
                <h3 className="font-semibold text-[var(--cela-espresso)]">Chi tiet theo ngay</h3>
              </div>
              <table className="w-full">
                <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase">
                  <tr>
                    <th className="text-left px-6 py-3">Ngay</th>
                    <th className="text-right px-4 py-3">So don</th>
                    <th className="text-right px-4 py-3">Tong doanh thu</th>
                    <th className="text-right px-4 py-3">Gia tri TB</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((d) => (
                    <tr key={d.date} style={{ borderBottom: "1px solid var(--cela-fog)" }}>
                      <td className="px-6 py-3 text-sm text-[var(--cela-espresso)]">
                        {new Date(d.date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[var(--cela-cocoa)]">{d.orderCount}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--cela-espresso)]">{formatVND(d.totalRevenue)}</td>
                      <td className="px-4 py-3 text-right text-sm text-[var(--cela-success)]">{formatVND(d.averageOrderValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ERPLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[var(--cela-paper)] rounded-xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-[rgba(183,110,121,0.12)] flex items-center justify-center">
        <Icon className="w-5 h-5 text-[var(--cela-rose)]" />
      </div>
      <div>
        <p className="text-xs text-[var(--cela-stone)]">{label}</p>
        <p className="text-lg font-bold text-[var(--cela-espresso)]">{value}</p>
      </div>
    </div>
  );
}
