"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CashierSidebar } from "@/components/layout/CashierSidebar";
import { Clock, CheckCircle2, XCircle, Undo2, ArrowRight, AlertTriangle } from "lucide-react";
import { shiftService } from "@/services/shift.service";
import { usePOSStore } from "@/stores/pos.store";
import { useAuthStore } from "@/stores/auth.store";
import type { Shift } from "@/types";

type ShiftState = "loading" | "no-shift" | "active" | "closing";

export default function POSShiftPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setCurrentShift } = usePOSStore();

  const [shiftState, setShiftState] = useState<ShiftState>("loading");
  const [shift, setShift] = useState<Shift | null>(null);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra ca đang mở khi mount
  useEffect(() => {
    shiftService.getCurrent()
      .then(({ data }) => {
        if (data.data) {
          setShift(data.data);
          setCurrentShift(data.data);
          setShiftState("active");
        } else {
          setShiftState("no-shift");
        }
      })
      .catch(() => setShiftState("no-shift"));
  }, [setCurrentShift]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  const getCurrentTime = () =>
    new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const getVariance = () => {
    if (!shift) return 0;
    const closing = parseFloat(closingCash) || 0;
    const expected = (shift.openingCash ?? 0) + (shift.totalRevenue ?? 0);
    return closing - expected;
  };

  const handleOpenShift = async () => {
    const cash = parseFloat(openingCash);
    if (isNaN(cash) || cash < 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ (≥ 0)");
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await shiftService.open(cash);
      setShift(data.data);
      setCurrentShift(data.data);
      setShiftState("active");
      toast.success("Đã mở ca làm việc!");
      router.push("/pos/order");
    } catch {
      toast.error("Không thể mở ca. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!shift) return;
    const variance = getVariance();
    if (variance !== 0 && !closeNote.trim()) {
      toast.error("Vui lòng nhập ghi chú giải thích chênh lệch");
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await shiftService.close(shift.id, {
        closingCash: parseFloat(closingCash),
        note: closeNote.trim() || undefined,
      });
      setShift(data.data);
      setCurrentShift(null);
      setShiftState("no-shift");
      setOpeningCash("");
      setClosingCash("");
      setCloseNote("");
      toast.success("Ca làm việc đã được đóng thành công!");
    } catch {
      toast.error("Không thể đóng ca. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (shiftState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F6FA]">
        <div className="w-8 h-8 border-4 border-[#D946A6]/30 border-t-[#D946A6] rounded-full animate-spin" />
      </div>
    );
  }

  const renderNoShift = () => (
    <div className="flex items-center justify-center flex-1 p-6">
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#D946A6] mb-2">Chưa có ca làm việc</h1>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Thu ngân:</span>
            <span className="font-semibold">{user?.fullName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Thời gian:</span>
            <span className="font-semibold">{getCurrentTime()}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tiền mặt đầu ca (VND) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="0"
            className="w-full h-14 px-4 text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 Đếm số tiền thực tế trong két trước khi bắt đầu
          </p>
        </div>

        <button
          onClick={handleOpenShift}
          disabled={isLoading || !openingCash}
          className="w-full h-12 bg-[#D946A6] hover:bg-[#C026D3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang mở ca...</span>
            </>
          ) : (
            "MỞ CA LÀM VIỆC"
          )}
        </button>
      </div>
    </div>
  );

  const renderActiveShift = () => (
    <div className="flex flex-col flex-1">
      <div className="bg-[#D946A6] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="font-semibold">Ca đang mở</span>
          </div>
          <span className="text-sm">Mở lúc {shift?.openedAt ? new Date(shift.openedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
          <span className="text-sm">Thu ngân: {user?.fullName ?? "—"}</span>
        </div>
        <button
          onClick={() => setShiftState("closing")}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          ĐÓNG CA
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, label: "Đơn hoàn thành", value: shift?.completedOrders ?? 0, color: "text-gray-900" },
            { icon: <span className="text-2xl">💰</span>, label: "Tổng doanh thu", value: formatCurrency(shift?.totalRevenue ?? 0), color: "text-[#D946A6]" },
            { icon: <XCircle className="w-5 h-5 text-red-600" />, label: "Đơn hủy", value: shift?.cancelledOrders ?? 0, color: "text-gray-900" },
            { icon: <Undo2 className="w-5 h-5 text-orange-600" />, label: "Đơn trả hàng", value: shift?.returnedOrders ?? 0, color: "text-gray-900" },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                {icon}
                <h3 className="text-sm font-medium text-gray-600">{label}</h3>
              </div>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => router.push("/pos/order")}
            className="bg-[#D946A6] hover:bg-[#C026D3] text-white font-bold px-12 py-4 rounded-lg text-lg transition-all flex items-center gap-3"
          >
            ĐI ĐẾN MÀN HÌNH BÁN HÀNG
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderClosingShift = () => {
    const variance = getVariance();
    const expected = (shift?.openingCash ?? 0) + (shift?.totalRevenue ?? 0);

    return (
      <div className="flex items-center justify-center flex-1 p-6">
        <div className="w-full max-w-[600px] bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#D946A6] mb-1">Đóng ca — Tóm tắt</h1>
            <p className="text-sm text-gray-600">Vui lòng kiểm tra kỹ trước khi đóng ca</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3 text-sm">
            {[
              { label: "Đơn hoàn thành:", value: shift?.completedOrders ?? 0 },
              { label: "Tổng doanh thu:", value: formatCurrency(shift?.totalRevenue ?? 0), color: "text-green-600" },
              { label: "Đơn hủy:", value: shift?.cancelledOrders ?? 0 },
              { label: "Đơn trả hàng:", value: shift?.returnedOrders ?? 0 },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-600">{label}</span>
                <span className={`font-semibold ${color ?? "text-gray-900"}`}>{value}</span>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-3 mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Tiền mặt đầu ca:</span>
                <span className="font-bold">{formatCurrency(shift?.openingCash ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Tổng kỳ vọng:</span>
                <span className="font-bold text-[#D946A6]">{formatCurrency(expected)}</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tiền mặt cuối ca (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              placeholder="0"
              className="w-full h-14 px-4 text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
            />
          </div>

          {closingCash && (
            <div className={`rounded-lg p-4 mb-4 ${
              variance === 0 ? "bg-green-50 border-2 border-green-500"
              : variance < 0 ? "bg-red-50 border-2 border-red-500"
              : "bg-amber-50 border-2 border-amber-500"
            }`}>
              <div className="flex items-center gap-3">
                {variance === 0
                  ? <CheckCircle2 className="w-8 h-8 text-green-600" />
                  : <AlertTriangle className="w-8 h-8 text-amber-600" />}
                <p className={`text-2xl font-bold ${
                  variance === 0 ? "text-green-700"
                  : variance < 0 ? "text-red-700"
                  : "text-amber-700"
                }`}>
                  {variance === 0 && "Cân đối hoàn toàn ✓"}
                  {variance < 0 && `Thiếu ${formatCurrency(Math.abs(variance))}`}
                  {variance > 0 && `Thừa ${formatCurrency(variance)}`}
                </p>
              </div>
            </div>
          )}

          {variance !== 0 && closingCash && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ghi chú giải thích <span className="text-red-500">*</span>
              </label>
              <textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Nhập lý do chênh lệch..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent resize-none"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShiftState("active")}
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-colors"
            >
              ← Quay lại bán hàng
            </button>
            <button
              onClick={handleCloseShift}
              disabled={isLoading || !closingCash || (variance !== 0 && !closeNote.trim())}
              className="flex-1 h-12 bg-[#D946A6] hover:bg-[#C026D3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang đóng...</span>
                </div>
              ) : "ĐÓNG CA"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA]">
      <CashierSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {shiftState === "no-shift" && renderNoShift()}
        {shiftState === "active" && renderActiveShift()}
        {shiftState === "closing" && renderClosingShift()}
      </div>
    </div>
  );
}
