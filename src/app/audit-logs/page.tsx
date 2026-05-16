"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ShieldOff, X } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { auditLogService } from "@/services/auditLog.service";
import { useAuthStore } from "@/stores/auth.store";
import type { AuditLog } from "@/types";
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    color: string;
  }
> = {
  CREATE: {
    label: "Tạo mới",
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
  },
  UPDATE: {
    label: "Cập nhật",
    bg: "rgba(120,140,180,0.18)",
    color: "#6080b0",
  },
  DELETE: {
    label: "Xóa",
    bg: "rgba(183,110,121,0.15)",
    color: "var(--cela-danger)",
  },
};
export default function AuditLogsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];
  const [filters, setFilters] = useState({
    entityType: "",
    userId: "",
    startDate: sevenDaysAgo,
    endDate: today,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang này");
      router.push("/");
    }
  }, [user, router]);
  if (!user || user.role !== "ADMIN") {
    return (
      <ERPLayout>
        {" "}
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          {" "}
          <ShieldOff className="w-16 h-16 text-[var(--cela-mist)]" />{" "}
          <p className="text-[var(--cela-stone)] font-medium">
            Không có quyền truy cập
          </p>{" "}
        </div>{" "}
      </ERPLayout>
    );
  }
  async function load() {
    setIsLoading(true);
    try {
      const result = await auditLogService.getAll({
        page,
        size: 20,
        entityType: filters.entityType || undefined,
        userId: filters.userId || undefined,
        from: filters.startDate || undefined,
        to: filters.endDate || undefined,
      });
      setLogs(result?.content ?? []);
      setTotalPages(result?.totalPages ?? 0);
    } catch {
      toast.error("Không thể tải audit log");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [page]);
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    load();
  }
  function formatJson(raw: string | null) {
    if (!raw) return "—";
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <ClipboardList className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
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
              Audit{" "}
              <span
                style={{
                  color: "var(--cela-rose)",
                }}
              >
                Log
              </span>
            </h1>
          </div>{" "}
        </div>{" "}
        {/* Filters */}{" "}
        <form
          onSubmit={handleSearch}
          className="bg-[var(--cela-paper)] rounded-xl p-4 flex gap-3 flex-wrap items-end"
        >
          {" "}
          <div>
            {" "}
            <label className="block text-xs text-[var(--cela-stone)] mb-1">
              Loại đối tượng
            </label>{" "}
            <input
              type="text"
              value={filters.entityType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  entityType: e.target.value,
                }))
              }
              placeholder="User, Product, Order..."
              className="h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] w-40"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs text-[var(--cela-stone)] mb-1">
              User ID
            </label>{" "}
            <input
              type="text"
              value={filters.userId}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  userId: e.target.value,
                }))
              }
              placeholder="UUID người dùng"
              className="h-10 rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)] w-44"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs text-[var(--cela-stone)] mb-1">
              Từ ngày
            </label>{" "}
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  startDate: e.target.value,
                }))
              }
              className="h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs text-[var(--cela-stone)] mb-1">
              Đến ngày
            </label>{" "}
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  endDate: e.target.value,
                }))
              }
              className="h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
              style={{
                border: "1px solid var(--cela-mist)",
              }}
            />{" "}
          </div>{" "}
          <button
            type="submit"
            className="h-10 px-5 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            {" "}
            Tìm kiếm{" "}
          </button>{" "}
        </form>{" "}
        {/* Table */}{" "}
        <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
          {" "}
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
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              {" "}
              <ClipboardList className="w-12 h-12 text-[var(--cela-mist)] mb-3" />{" "}
              <p className="text-[var(--cela-stone)]">
                Chưa có log nào trong khoảng thời gian này
              </p>{" "}
            </div>
          ) : (
            <table className="w-full">
              {" "}
              <thead
                className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase"
                style={{
                  borderBottom: "1px solid var(--cela-mist)",
                }}
              >
                {" "}
                <tr>
                  {" "}
                  <th className="text-left px-6 py-3">Thời gian</th>{" "}
                  <th className="text-left px-4 py-3">Hành động</th>{" "}
                  <th className="text-left px-4 py-3">Đối tượng</th>{" "}
                  <th className="text-left px-4 py-3">IP</th>{" "}
                  <th className="text-center px-4 py-3">Chi tiết</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {logs.map((log) => {
                  const actionConf = ACTION_CONFIG[log.action] ?? {
                    label: log.action,
                    bg: "var(--cela-fog)",
                    color: "var(--cela-stone)",
                  };
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[var(--cela-fog)] transition-colors"
                      style={{
                        borderBottom: "1px solid var(--cela-fog)",
                      }}
                    >
                      {" "}
                      <td className="px-6 py-4 text-sm text-[var(--cela-stone)]">
                        {formatDateTime(log.createdAt)}
                      </td>{" "}
                      <td className="px-4 py-4">
                        {" "}
                        <span
                          style={{
                            background: actionConf.bg,
                            color: actionConf.color,
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {" "}
                          {actionConf.label}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-sm text-[var(--cela-cocoa)]">
                        {" "}
                        {log.entityType} #
                        {log.entityId.slice(-8).toUpperCase()}{" "}
                      </td>{" "}
                      <td className="px-4 py-4 text-sm font-mono text-[var(--cela-stone)]">
                        {log.ipAddress}
                      </td>{" "}
                      <td className="px-4 py-4 text-center">
                        {" "}
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                          style={{
                            border: "1px solid var(--cela-mist)",
                          }}
                        >
                          {" "}
                          Chi tiết{" "}
                        </button>{" "}
                      </td>{" "}
                    </tr>
                  );
                })}{" "}
              </tbody>{" "}
            </table>
          )}{" "}
        </div>{" "}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            {" "}
            <p className="text-sm text-[var(--cela-stone)]">
              Trang {page + 1} / {totalPages}
            </p>{" "}
            <div className="flex gap-2">
              {" "}
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--cela-fog)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              >
                Trước
              </button>{" "}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--cela-fog)]"
                style={{
                  border: "1px solid var(--cela-mist)",
                }}
              >
                Sau
              </button>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
      {/* Detail Dialog */}{" "}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          {" "}
          <div className="bg-[var(--cela-paper)] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {" "}
            <div
              className="flex items-center justify-between p-6"
              style={{
                borderBottom: "1px solid var(--cela-mist)",
              }}
            >
              {" "}
              <h2 className="text-lg font-semibold text-[var(--cela-espresso)]">
                {" "}
                Chi tiết — {selectedLog.entityType} #
                {selectedLog.entityId.slice(-8).toUpperCase()}{" "}
              </h2>{" "}
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--cela-fog)]"
              >
                {" "}
                <X className="w-5 h-5 text-[var(--cela-stone)]" />{" "}
              </button>{" "}
            </div>{" "}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 gap-4">
              {" "}
              <div>
                {" "}
                <p className="text-sm font-semibold text-[var(--cela-cocoa)] mb-2">
                  Trước
                </p>{" "}
                <pre className="text-xs bg-[var(--cela-fog)] p-3 rounded-lg overflow-auto max-h-60 text-[var(--cela-stone)]">
                  {" "}
                  {formatJson(selectedLog.oldValue)}{" "}
                </pre>{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-sm font-semibold text-[var(--cela-cocoa)] mb-2">
                  Sau
                </p>{" "}
                <pre className="text-xs bg-[var(--cela-fog)] p-3 rounded-lg overflow-auto max-h-60 text-[var(--cela-stone)]">
                  {" "}
                  {formatJson(selectedLog.newValue)}{" "}
                </pre>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </ERPLayout>
  );
}
