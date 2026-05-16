"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, ShieldOff, Info, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { systemConfigService } from "@/services/systemConfig.service";
import { useAuthStore } from "@/stores/auth.store";
import type { SystemConfig } from "@/types";
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
function formatConfigValue(key: string, value: string): string {
  const num = Number(value);
  if (key.includes("cancel_approval_threshold")) return formatVND(num);
  if (key.includes("percent")) return `${num}%`;
  if (key.includes("days")) return `${num} ngày`;
  if (key.includes("points_rate"))
    return `${num.toLocaleString("vi-VN")} VND/điểm`;
  if (key.includes("redeem_rate")) return `${num} điểm = 10.000₫`;
  return value;
}
const CONFIG_LABELS: Record<string, string> = {
  "loyalty.points_rate": "Tỷ lệ tích điểm (VND/điểm)",
  "loyalty.redeem_rate": "Tỷ lệ đổi điểm (điểm/10.000đ)",
  "loyalty.max_redeem_percent": "Tối đa % giá trị đơn được đổi điểm",
  "inventory.default_min_threshold": "Ngưỡng tồn kho tối thiểu (đơn vị)",
  "inventory.expiry_alert_days": "Cảnh báo hết hạn trước (ngày)",
  "inventory.slow_moving_days": "Hàng chậm luân chuyển sau (ngày)",
  "inventory.large_adjustment_percent": "Ngưỡng điều chỉnh cần duyệt (%)",
  "order.cancel_approval_threshold": "Ngưỡng đơn hủy cần duyệt (VND)",
};
const CONFIG_GROUPS: {
  title: string;
  prefix: string;
}[] = [
  {
    title: "Chương trình khách hàng thân thiết",
    prefix: "loyalty.",
  },
  {
    title: "Quản lý tồn kho",
    prefix: "inventory.",
  },
  {
    title: "Đơn hàng",
    prefix: "order.",
  },
];
export default function SystemConfigurationPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
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
  useEffect(() => {
    systemConfigService
      .getAll()
      .then(setConfigs)
      .catch(() => toast.error("Không thể tải cấu hình"))
      .finally(() => setIsLoading(false));
  }, []);
  function startEdit(config: SystemConfig) {
    setEditingKey(config.configKey);
    setEditValue(config.configValue);
  }
  function cancelEdit() {
    setEditingKey(null);
    setEditValue("");
  }
  async function handleSave(key: string) {
    if (!editValue.trim()) {
      toast.error("Giá trị không được để trống");
      return;
    }
    if (isNaN(Number(editValue)) || Number(editValue) <= 0) {
      toast.error("Giá trị phải là số dương");
      return;
    }
    setIsSaving(true);
    try {
      await systemConfigService.update(key, editValue);
      setConfigs((prev) =>
        prev.map((c) =>
          c.configKey === key
            ? {
                ...c,
                configValue: editValue,
              }
            : c,
        ),
      );
      setEditingKey(null);
      toast.success("Đã cập nhật cấu hình. Hiệu lực ngay lập tức.");
    } catch {
      toast.error("Cập nhật thất bại, thử lại sau");
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <ERPLayout>
      {" "}
      <div className="space-y-6">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <Settings className="w-6 h-6 text-[var(--cela-rose)]" />{" "}
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
              C?u h�nh{" "}
              <span
                style={{
                  color: "var(--cela-rose)",
                }}
              >
                h? th?ng
              </span>
            </h1>
          </div>{" "}
        </div>{" "}
        {/* Info banner */}{" "}
        <div className="flex items-start gap-3 bg-[rgba(120,140,180,0.12)] border border-blue-200 rounded-xl p-4">
          {" "}
          <Info className="w-5 h-5 text-[var(--cela-cocoa)] flex-shrink-0 mt-0.5" />{" "}
          <p className="text-sm text-[var(--cela-cocoa)]">
            {" "}
            Thay đổi cấu hình có hiệu lực ngay lập tức, không cần khởi động lại
            hệ thống. Mọi thay đổi đều được ghi vào audit log.{" "}
          </p>{" "}
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
          <div className="space-y-4">
            {" "}
            {CONFIG_GROUPS.map((group) => {
              const groupConfigs = configs.filter((c) =>
                c.configKey.startsWith(group.prefix),
              );
              if (groupConfigs.length === 0) return null;
              return (
                <div
                  key={group.prefix}
                  className="bg-[var(--cela-paper)] rounded-xl overflow-hidden"
                >
                  {" "}
                  <div
                    className="px-6 py-4"
                    style={{
                      borderBottom: "1px solid var(--cela-mist)",
                    }}
                  >
                    {" "}
                    <h3 className="font-semibold text-[var(--cela-espresso)]">
                      {group.title}
                    </h3>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    {groupConfigs.map((config) => {
                      const isEditing = editingKey === config.configKey;
                      const label = CONFIG_LABELS[config.configKey] ?? config.configKey;
                      return (
                        <div
                          key={config.configKey}
                          className="px-6 py-4 flex items-center justify-between gap-4"
                        >
                          {" "}
                          <div className="flex-1 min-w-0">
                            {" "}
                            <p className="text-sm font-medium text-[var(--cela-espresso)]">
                              {label}
                            </p>{" "}
                            <p className="text-xs text-[var(--cela-stone)] font-mono mt-0.5">
                              {config.configKey}
                            </p>{" "}
                          </div>{" "}
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              {" "}
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                                min="0"
                                className="w-32 h-9 border border-[rgba(183,110,121,0.35)] rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                              />{" "}
                              <button
                                onClick={() => handleSave(config.configKey)}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(107,142,106,0.10)] border border-green-200 text-[var(--cela-success)] rounded-lg text-xs font-medium hover:bg-[rgba(107,142,106,0.15)] disabled:opacity-50"
                              >
                                {" "}
                                <Check className="w-3.5 h-3.5" />{" "}
                                {isSaving ? "..." : "Lưu"}{" "}
                              </button>{" "}
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--cela-fog)] text-[var(--cela-stone)] rounded-lg text-xs font-medium hover:bg-[var(--cela-fog)]"
                                style={{
                                  border: "1px solid var(--cela-mist)",
                                }}
                              >
                                {" "}
                                <X className="w-3.5 h-3.5" /> Hủy{" "}
                              </button>{" "}
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              {" "}
                              <span className="text-lg font-bold text-[var(--cela-rose)]">
                                {" "}
                                {formatConfigValue(
                                  config.configKey,
                                  config.configValue,
                                )}{" "}
                              </span>{" "}
                              <button
                                onClick={() => startEdit(config)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                                style={{
                                  border: "1px solid var(--cela-mist)",
                                }}
                              >
                                {" "}
                                <Pencil className="w-3.5 h-3.5" /> Sửa{" "}
                              </button>{" "}
                            </div>
                          )}{" "}
                        </div>
                      );
                    })}{" "}
                  </div>{" "}
                </div>
              );
            })}{" "}
            {/* Any remaining configs not in groups */}{" "}
            {(() => {
              const grouped = CONFIG_GROUPS.flatMap((g) =>
                configs
                  .filter((c) => c.configKey.startsWith(g.prefix))
                  .map((c) => c.configKey),
              );
              const remaining = configs.filter((c) => !grouped.includes(c.configKey));
              if (remaining.length === 0) return null;
              return (
                <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
                  {" "}
                  <div
                    className="px-6 py-4"
                    style={{
                      borderBottom: "1px solid var(--cela-mist)",
                    }}
                  >
                    {" "}
                    <h3 className="font-semibold text-[var(--cela-espresso)]">
                      Cấu hình khác
                    </h3>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    {remaining.map((config) => {
                      const isEditing = editingKey === config.configKey;
                      return (
                        <div
                          key={config.configKey}
                          className="px-6 py-4 flex items-center justify-between gap-4"
                        >
                          {" "}
                          <div className="flex-1">
                            {" "}
                            <p className="text-sm font-medium text-[var(--cela-espresso)]">
                              {config.configKey}
                            </p>{" "}
                            <p className="text-xs text-[var(--cela-stone)]">
                              {config.description}
                            </p>{" "}
                          </div>{" "}
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              {" "}
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                                className="w-32 h-9 border border-[rgba(183,110,121,0.35)] rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                              />{" "}
                              <button
                                onClick={() => handleSave(config.configKey)}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(107,142,106,0.10)] border border-green-200 text-[var(--cela-success)] rounded-lg text-xs font-medium"
                              >
                                {" "}
                                <Check className="w-3.5 h-3.5" /> Lưu{" "}
                              </button>{" "}
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--cela-fog)] text-[var(--cela-stone)] rounded-lg text-xs font-medium"
                                style={{
                                  border: "1px solid var(--cela-mist)",
                                }}
                              >
                                {" "}
                                <X className="w-3.5 h-3.5" /> Hủy{" "}
                              </button>{" "}
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              {" "}
                              <span className="text-lg font-bold text-[var(--cela-rose)]">
                                {config.configValue}
                              </span>{" "}
                              <button
                                onClick={() => startEdit(config)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                                style={{
                                  border: "1px solid var(--cela-mist)",
                                }}
                              >
                                {" "}
                                <Pencil className="w-3.5 h-3.5" /> Sửa{" "}
                              </button>{" "}
                            </div>
                          )}{" "}
                        </div>
                      );
                    })}{" "}
                  </div>{" "}
                </div>
              );
            })()}{" "}
          </div>
        )}{" "}
      </div>{" "}
    </ERPLayout>
  );
}
