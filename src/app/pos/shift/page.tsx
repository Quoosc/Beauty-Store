"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CashierSidebar } from "@/components/layout/CashierSidebar";
import { Clock } from "lucide-react";
import { shiftService } from "@/services/shift.service";
import { usePOSStore } from "@/stores/pos.store";
import { useAuthStore } from "@/stores/auth.store";
import type { Shift } from "@/types";
import { CelaButton, CelaCard, CelaInput, CelaTextArea, CelaSpinner } from "@/components/ui/cela-primitives";

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
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--cela-ivory)" }}>
        <CelaSpinner padding="0" />
      </div>
    );
  }

  const variance = getVariance();
  const expected = (shift?.openingCash ?? 0) + (shift?.totalRevenue ?? 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cela-ivory)" }}>
      <CashierSidebar />
      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 4px" }}>
              Ca làm việc
            </p>
            <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 500, color: "var(--cela-espresso)", margin: 0, letterSpacing: "-0.01em" }}>
              Quản lý <span style={{ fontStyle: "italic", color: "var(--cela-rose)" }}>ca bán hàng</span>
            </h1>
          </div>
        </div>

        {shiftState === "no-shift" && (
          <div style={{ minHeight: "calc(100vh - 140px)", display: "grid", placeItems: "center" }}>
            <CelaCard style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "rgba(183,110,121,0.12)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 14px",
                }}
              >
                <Clock style={{ width: 28, height: 28, color: "var(--cela-rose)" }} />
              </div>

              <p style={{ margin: 0, color: "var(--cela-espresso)", fontWeight: 600, fontSize: 16 }}>
                Chưa có ca nào đang mở
              </p>
              <p style={{ margin: "6px 0 18px", color: "var(--cela-stone)", fontSize: 13 }}>
                Nhập số tiền đầu ca để bắt đầu làm việc
              </p>

              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 8px", textAlign: "left" }}>
                Tiền đầu ca (VNĐ)
              </p>
              <CelaInput
                type="number"
                min="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0"
                style={{ fontFamily: "var(--cela-mono)", marginBottom: 14 }}
              />

              <CelaButton variant="rose" onClick={handleOpenShift} disabled={isLoading || !openingCash} style={{ width: "100%", height: 42 }}>
                {isLoading ? "Đang mở ca..." : "Mở ca"}
              </CelaButton>
            </CelaCard>
          </div>
        )}

        {(shiftState === "active" || shiftState === "closing") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <CelaCard>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 12px" }}>
                Ca hiện tại
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--cela-stone)" }}>Thời gian mở</span>
                  <span style={{ fontSize: 13, color: "var(--cela-espresso)", fontFamily: "var(--cela-mono)" }}>
                    {shift?.openedAt ? new Date(shift.openedAt).toLocaleString("vi-VN") : "-"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--cela-stone)" }}>Tiền đầu ca</span>
                  <span style={{ fontSize: 13, color: "var(--cela-espresso)", fontFamily: "var(--cela-mono)" }}>
                    {formatCurrency(shift?.openingCash ?? 0)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--cela-stone)" }}>Số đơn hàng</span>
                  <span style={{ fontSize: 13, color: "var(--cela-espresso)", fontFamily: "var(--cela-mono)" }}>
                    {shift?.completedOrders ?? 0}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--cela-stone)" }}>Doanh thu</span>
                  <span style={{ fontSize: 13, color: "var(--cela-rose)", fontFamily: "var(--cela-mono)", fontWeight: 600 }}>
                    {formatCurrency(shift?.totalRevenue ?? 0)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--cela-stone)" }}>Thu ngân</span>
                  <span style={{ fontSize: 13, color: "var(--cela-espresso)" }}>{user?.fullName ?? "-"}</span>
                </div>
              </div>

              <CelaButton variant="primary" onClick={() => router.push("/pos/order")} style={{ marginTop: 18 }}>
                Đi đến bán hàng
              </CelaButton>
            </CelaCard>

            <CelaCard>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 12px" }}>
                Đóng ca
              </p>

              {shiftState === "active" ? (
                <CelaButton variant="primary" onClick={() => setShiftState("closing")}>Bắt đầu đóng ca</CelaButton>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "var(--cela-stone)", margin: "0 0 8px" }}>
                    Tổng kỳ vọng: <span style={{ fontFamily: "var(--cela-mono)", color: "var(--cela-espresso)", fontWeight: 600 }}>{formatCurrency(expected)}</span>
                  </p>

                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "8px 0" }}>
                    Tiền thực tế cuối ca
                  </p>
                  <CelaInput
                    type="number"
                    min="0"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="0"
                    style={{ fontFamily: "var(--cela-mono)" }}
                  />

                  {closingCash && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: variance === 0 ? "var(--cela-success)" : "var(--cela-danger)" }}>
                      {variance === 0 ? "Cân đối chính xác" : `Chênh lệch: ${formatCurrency(variance)}`}
                    </p>
                  )}

                  {variance !== 0 && closingCash && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 8px" }}>
                        Ghi chú chênh lệch
                      </p>
                      <CelaTextArea
                        value={closeNote}
                        onChange={(e) => setCloseNote(e.target.value)}
                        rows={3}
                        placeholder="Mô tả lý do chênh lệch"
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <CelaButton variant="secondary" onClick={() => setShiftState("active")} style={{ flex: 1 }}>
                      Quay lại
                    </CelaButton>
                    <CelaButton
                      variant="primary"
                      onClick={handleCloseShift}
                      disabled={isLoading || !closingCash || (variance !== 0 && !closeNote.trim())}
                      style={{ flex: 1 }}
                    >
                      {isLoading ? "Đang đóng..." : "Đóng ca"}
                    </CelaButton>
                  </div>
                </>
              )}
            </CelaCard>
          </div>
        )}
      </main>
    </div>
  );
}
