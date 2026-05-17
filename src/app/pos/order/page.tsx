"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Search,
  ShoppingCart,
  Trash2,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Heart,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { usePOSStore } from "@/stores/pos.store";
import { productService } from "@/services/product.service";
import { orderService, CreateOrderPayload } from "@/services/order.service";
import { couponService } from "@/services/coupon.service";
import { loyaltyService } from "@/services/loyalty.service";
import type { Product, Order } from "@/types";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

interface CancelModalProps {
  open: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

const CANCEL_REASONS = [
  "Khách hàng đổi ý",
  "Sản phẩm hết hàng",
  "Lỗi nhập liệu",
  "Khác",
];

function CancelModal({
  open,
  total,
  onClose,
  onConfirm,
  isLoading,
}: CancelModalProps) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(60,46,42,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--cela-paper)",
          borderRadius: 16,
          boxShadow: "var(--cela-shadow-md)",
          width: "100%",
          maxWidth: 440,
          padding: "24px 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(183,110,110,0.14)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 18, height: 18, color: "var(--cela-danger)" }} />
          </div>
          <h2
            style={{
              fontFamily: "var(--cela-display)",
              fontSize: 20,
              fontWeight: 500,
              color: "var(--cela-espresso)",
              margin: 0,
            }}
          >
            Hủy đơn hàng
          </h2>
        </div>

        {total > 500000 && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              background: "rgba(201,168,122,0.14)",
              border: "1px solid rgba(201,168,122,0.4)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16,
            }}
          >
            <AlertTriangle
              style={{
                width: 15,
                height: 15,
                color: "var(--cela-gold)",
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <p
              style={{ fontSize: 12, color: "var(--cela-espresso)", margin: 0 }}
            >
              Đơn hàng &gt; 500.000đ sẽ được gửi đến Branch Manager để phê
              duyệt.
            </p>
          </div>
        )}

        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--cela-cocoa)",
            margin: "0 0 8px",
          }}
        >
          Lý do hủy <span style={{ color: "var(--cela-danger)" }}>*</span>
        </p>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px",
            border: "1px solid var(--cela-mist)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--cela-espresso)",
            background: "var(--cela-ivory)",
            outline: "none",
            fontFamily: "var(--cela-sans)",
          }}
        >
          <option value="">-- Chọn lý do --</option>
          {CANCEL_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "1px solid var(--cela-mist)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--cela-espresso)",
              background: "var(--cela-ivory)",
              cursor: "pointer",
            }}
          >
            Quay lại
          </button>
          <button
            onClick={() => reason && onConfirm(reason)}
            disabled={!reason || isLoading}
            style={{
              flex: 1,
              padding: "10px 0",
              border: 0,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "var(--cela-danger)",
              cursor: !reason || isLoading ? "not-allowed" : "pointer",
              opacity: !reason || isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Success Overlay ──────────────────────────────────────────────────────────

interface SuccessOverlayProps {
  order: Order;
  change: number;
  onNewOrder: () => void;
}

function SuccessOverlay({ order, change, onNewOrder }: SuccessOverlayProps) {
  async function handlePrint() {
    try {
      const res = await orderService.getReceipt(order.id);
      const url = res.data.data;
      window.open(url, "_blank");
    } catch {
      toast.error("Không thể tải hóa đơn");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(107,142,106,0.96)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 80,
            height: 80,
            background: "var(--cela-paper)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <CheckCircle
            style={{ width: 48, height: 48, color: "var(--cela-success)" }}
          />
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--cela-paper)",
            marginBottom: 8,
            fontFamily: "var(--cela-display)",
          }}
        >
          Thanh toán thành công!
        </h2>
        {change > 0 && (
          <p
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 32,
            }}
          >
            Tiền thối: {formatVND(change)}
          </p>
        )}
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={handlePrint}
            style={{
              padding: "12px 24px",
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "var(--cela-paper)",
              fontWeight: 500,
              borderRadius: 12,
              cursor: "pointer",
              fontFamily: "var(--cela-body)",
            }}
          >
            In hóa đơn
          </button>
          <button
            onClick={onNewOrder}
            style={{
              padding: "12px 24px",
              background: "var(--cela-paper)",
              border: "none",
              color: "var(--cela-success)",
              fontWeight: 700,
              borderRadius: 12,
              cursor: "pointer",
              fontFamily: "var(--cela-body)",
            }}
          >
            ĐƠN MỚI →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function POSOrderPage() {
  const router = useRouter();
  const {
    currentShift,
    cartItems,
    appliedCoupon,
    member,
    appliedPoints,
    tenderedAmount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setAppliedCoupon,
    setMember,
    setAppliedPoints,
    setTenderedAmount,
    saveDraft,
    loadDraft,
    resetForNewOrder,
    syncShift,
  } = usePOSStore();

  const [isSyncingShift, setIsSyncingShift] = useState(false);

  // Product search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  // Member
  const [memberOpen, setMemberOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [isSearchingMember, setIsSearchingMember] = useState(false);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Cancel
  const [showCancel, setShowCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Draft
  const [hasDraft, setHasDraft] = useState(false);
  const [draftDismissed, setDraftDismissed] = useState(false);

  // Pricing
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const pointsDiscount = appliedPoints * 100; // 100 points = 10,000đ → 100 points * 100 = 10,000đ? No: 100 points = 10,000đ → 1 point = 100đ
  const total = Math.max(0, subtotal - couponDiscount - pointsDiscount);
  const tendered = Number(tenderedAmount) || 0;
  const change = tendered - total;

  const maxRedeemableByPercent = Math.floor((total * 0.5) / 100) * 100;
  const maxRedeemable = member
    ? Math.min(member.points, maxRedeemableByPercent)
    : 0;

  // Mount: try to restore shift from server if sessionStorage was cleared
  useEffect(() => {
    if (!currentShift) {
      setIsSyncingShift(true);
      syncShift().finally(() => setIsSyncingShift(false));
    }
  }, []);

  // Mount: check draft
  useEffect(() => {
    const hasSaved = loadDraft();
    if (hasSaved) setHasDraft(true);
  }, []);

  // Draft autosave every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      if (cartItems.length > 0) saveDraft();
    }, 10000);
    return () => clearInterval(interval);
  }, [cartItems, saveDraft]);

  // Product search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await productService.search({
          q: searchQuery,
          status: "ACTIVE",
          size: 20,
        });
        setSearchResults(res.data.data.products ?? []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleAddProduct(product: Product) {
    addToCart({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.sellingPrice,
      stock: 999,
    });
    setSearchQuery("");
    setShowResults(false);
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim() || cartItems.length === 0) return;
    setIsValidatingCoupon(true);
    try {
      const result = await couponService.validate({
        code: couponInput,
        orderTotal: subtotal,
      });
      // Backend trả 4xx nếu không hợp lệ (catch bên dưới). Nếu đến đây → hợp lệ.
      setAppliedCoupon({
        code: couponInput,
        discountAmount: result.discountAmount,
      });
      toast.success("Áp dụng coupon thành công!");
      setCouponInput("");
    } catch {
      toast.error("Không thể kiểm tra coupon, thử lại sau");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  async function handleSearchMember() {
    if (!phoneInput.trim()) return;
    setIsSearchingMember(true);
    setMemberNotFound(false);
    try {
      const found = await loyaltyService.searchByPhone(phoneInput);
      setMember({
        id: found.id,
        name: found.fullName,
        code: found.memberCode,
        phone: found.phone,
        points: found.pointBalance,
      });
      setMemberNotFound(false);
    } catch {
      setMemberNotFound(true);
    } finally {
      setIsSearchingMember(false);
    }
  }

  function handleApplyPoints() {
    const pts = Number(pointsInput);
    if (isNaN(pts) || pts <= 0 || pts > maxRedeemable) {
      toast.error(`Số điểm không hợp lệ. Tối đa ${maxRedeemable} điểm`);
      return;
    }
    setAppliedPoints(pts);
    toast.success(`Đã áp dụng ${pts} điểm (giảm ${formatVND(pts * 100)})`);
  }

  async function handleRegisterMember() {
    if (!registerName.trim() || !registerPhone.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setIsRegistering(true);
    try {
      const newMember = await loyaltyService.register({
        fullName: registerName,
        phone: registerPhone,
      });
      setMember({
        id: newMember.id,
        name: newMember.fullName,
        code: newMember.memberCode,
        phone: newMember.phone,
        points: newMember.pointBalance,
      });
      setShowRegisterForm(false);
      toast.success("Đăng ký thành viên thành công!");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Đăng ký thất bại");
    } finally {
      setIsRegistering(false);
    }
  }

  async function handlePayment() {
    if (cartItems.length === 0 || tendered < total) return;
    setIsProcessing(true);
    try {
      const orderData: CreateOrderPayload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        couponCode: appliedCoupon?.code,
        loyaltyMemberId: member?.id,
        pointsRedeemed: appliedPoints > 0 ? appliedPoints : undefined,
        tenderedAmount: tendered,
      };
      const res = await orderService.create(orderData);
      setLastOrder(res.data.data);
      setShowSuccess(true);
      resetForNewOrder();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const msg = axiosErr?.response?.data?.message ?? "Thanh toán thất bại";
      if (axiosErr?.response?.status === 422) {
        toast.error("Tồn kho không đủ: " + msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCancelConfirm(reason: string) {
    setIsCancelling(true);
    try {
      clearCart();
      setShowCancel(false);
      toast.success("Đã hủy đơn hàng");
    } catch {
      toast.error("Hủy đơn thất bại");
    } finally {
      setIsCancelling(false);
    }
  }

  // While syncing shift from server, show spinner instead of "no shift" screen
  if (isSyncingShift) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cela-ivory)" }}>
        <svg style={{ width: 32, height: 32, animation: "spin 1s linear infinite", color: "var(--cela-rose)" }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  // No shift guard
  if (!currentShift || currentShift.status !== "OPEN") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cela-ivory)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Clock
            style={{
              width: 64,
              height: 64,
              color: "var(--cela-mist)",
              margin: "0 auto 16px",
            }}
          />
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--cela-espresso)",
              margin: "0 0 8px",
              fontFamily: "var(--cela-display)",
            }}
          >
            Bạn chưa mở ca
          </h2>
          <p style={{ color: "var(--cela-stone)", margin: "0 0 24px" }}>
            Vui lòng mở ca trước khi bán hàng.
          </p>
          <Link
            href="/pos/shift"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              background: "var(--cela-espresso)",
              color: "var(--cela-champagne)",
              fontWeight: 600,
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Đi đến trang ca
          </Link>
        </div>
      </div>
    );
  }

  const posInputStyle: React.CSSProperties = {
    height: 40,
    border: "1.5px solid var(--cela-mist)",
    borderRadius: 10,
    padding: "0 12px",
    fontSize: 13,
    color: "var(--cela-espresso)",
    background: "var(--cela-paper)",
    outline: "none",
    fontFamily: "var(--cela-body)",
    width: "100%",
    boxSizing: "border-box",
  };

  const sectionCardStyle: React.CSSProperties = {
    background: "var(--cela-paper)",
    borderRadius: 14,
    boxShadow: "var(--cela-shadow-soft)",
    overflow: "hidden",
  };

  const actionBtnStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    border: "1.5px solid var(--cela-mist)",
    borderRadius: 6,
    background: "transparent",
    cursor: "pointer",
    fontSize: 16,
    color: "var(--cela-espresso)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--cela-ivory)",
        overflow: "hidden",
      }}
    >
      {/* Success overlay */}
      {showSuccess && lastOrder && (
        <SuccessOverlay
          order={lastOrder}
          change={change}
          onNewOrder={() => {
            setShowSuccess(false);
            setLastOrder(null);
          }}
        />
      )}

      {/* Cancel modal */}
      <CancelModal
        open={showCancel}
        total={total}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
      />

      {/* POS Top Bar */}
      <div
        style={{
          background: "var(--cela-espresso)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Star
              style={{ width: 18, height: 18, color: "var(--cela-champagne)" }}
            />
          </div>
          <span
            style={{
              fontWeight: 700,
              color: "var(--cela-champagne)",
              fontSize: 16,
              fontFamily: "var(--cela-display)",
            }}
          >
            BeautyERP POS
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                background: "var(--cela-success)",
                borderRadius: "50%",
              }}
              className="animate-pulse"
            />
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
              Ca đang mở
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
              |
            </span>
            <span
              style={{
                color: "var(--cela-champagne)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {currentShift.cashierId}
            </span>
          </div>
          <button
            onClick={() => router.push("/pos/shift")}
            style={{
              padding: "6px 14px",
              background: "rgba(201,168,122,0.25)",
              border: "1px solid rgba(201,168,122,0.4)",
              color: "var(--cela-champagne)",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "var(--cela-body)",
            }}
          >
            Đóng ca
          </button>
        </div>
      </div>

      {/* Draft recovery banner */}
      {hasDraft && !draftDismissed && (
        <div
          style={{
            background: "rgba(201,168,122,0.14)",
            borderBottom: "1px solid rgba(201,168,122,0.4)",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "var(--cela-cocoa)", fontSize: 13 }}>
            ♻️ Có đơn hàng chưa hoàn tất từ trước
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setDraftDismissed(true)}
              style={{
                padding: "5px 14px",
                background: "var(--cela-gold)",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Tiếp tục đơn cũ
            </button>
            <button
              onClick={() => {
                clearCart();
                setHasDraft(false);
                setDraftDismissed(true);
              }}
              style={{
                padding: "5px 14px",
                background: "transparent",
                border: "1px solid rgba(201,168,122,0.5)",
                color: "var(--cela-cocoa)",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Tạo đơn mới
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 16,
          padding: 16,
          overflow: "hidden",
        }}
      >
        {/* LEFT PANEL — 55% */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "55%",
          }}
        >
          {/* Product search */}
          <div style={sectionCardStyle}>
            <div style={{ padding: 16 }}>
              <div style={{ position: "relative" }} ref={searchRef}>
                <Search
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "var(--cela-stone)",
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                  style={{
                    ...posInputStyle,
                    paddingLeft: 38,
                    paddingRight: 38,
                    height: 44,
                  }}
                />
                {isSearching && (
                  <svg
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 16,
                      height: 16,
                      color: "var(--cela-stone)",
                      animation: "spin 1s linear infinite",
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                )}
                {showResults && searchResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      background: "var(--cela-paper)",
                      border: "1px solid var(--cela-mist)",
                      borderRadius: 12,
                      boxShadow: "var(--cela-shadow-md)",
                      zIndex: 50,
                      maxHeight: 320,
                      overflowY: "auto",
                    }}
                  >
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleAddProduct(product)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 16px",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid var(--cela-fog)",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        className="hover:bg-[var(--cela-fog)]"
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--cela-espresso)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {product.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "var(--cela-stone)",
                            }}
                          >
                            {product.sku}
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--cela-rose)",
                            flexShrink: 0,
                          }}
                        >
                          {formatVND(product.sellingPrice)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            background: "rgba(183,110,121,0.15)",
                            color: "var(--cela-rose)",
                            padding: "2px 8px",
                            borderRadius: 10,
                            flexShrink: 0,
                          }}
                        >
                          Thêm
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div
            style={{
              ...sectionCardStyle,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--cela-fog)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cela-espresso)",
                }}
              >
                Giỏ hàng ({cartItems.length} sản phẩm)
              </h2>
            </div>

            {cartItems.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 48,
                }}
              >
                <ShoppingCart
                  style={{
                    width: 56,
                    height: 56,
                    color: "var(--cela-mist)",
                    marginBottom: 12,
                  }}
                />
                <p style={{ color: "var(--cela-stone)", margin: "0 0 4px" }}>
                  Chưa có sản phẩm nào
                </p>
                <p
                  style={{ fontSize: 12, color: "var(--cela-mist)", margin: 0 }}
                >
                  Tìm kiếm sản phẩm để thêm vào đơn
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--cela-fog)" }}>
                      {["Sản phẩm", "SL", "Đơn giá", "Thành tiền", ""].map(
                        (h, i) => (
                          <th
                            key={i}
                            style={{
                              padding: "8px 12px",
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "var(--cela-cocoa)",
                              textAlign:
                                i === 1 || i === 4
                                  ? "center"
                                  : i >= 2
                                    ? "right"
                                    : "left",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr
                        key={item.productId}
                        style={{ borderBottom: "1px solid var(--cela-fog)" }}
                      >
                        <td style={{ padding: "10px 12px" }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--cela-espresso)",
                            }}
                          >
                            {item.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "var(--cela-stone)",
                              fontFamily: "var(--cela-mono)",
                            }}
                          >
                            {item.sku}
                          </p>
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              justifyContent: "center",
                            }}
                          >
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              style={actionBtnStyle}
                            >
                              −
                            </button>
                            <span
                              style={{
                                width: 28,
                                textAlign: "center",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--cela-espresso)",
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              style={actionBtnStyle}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            textAlign: "right",
                            fontSize: 13,
                            color: "var(--cela-stone)",
                            fontFamily: "var(--cela-mono)",
                          }}
                        >
                          {formatVND(item.price)}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            textAlign: "right",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--cela-rose)",
                            fontFamily: "var(--cela-mono)",
                          }}
                        >
                          {formatVND(item.price * item.quantity)}
                        </td>
                        <td
                          style={{ padding: "10px 8px", textAlign: "center" }}
                        >
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: 4,
                            }}
                          >
                            <Trash2
                              style={{
                                width: 15,
                                height: 15,
                                color: "var(--cela-danger)",
                              }}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — 45% */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "45%",
            overflowY: "auto",
          }}
        >
          {/* Pricing summary */}
          <div
            style={{
              background: "var(--cela-fog)",
              borderRadius: 14,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--cela-stone)",
              }}
            >
              <span>Tạm tính</span>
              <span style={{ fontFamily: "var(--cela-mono)" }}>
                {formatVND(subtotal)}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "var(--cela-success)",
                }}
              >
                <span>Giảm (Coupon)</span>
                <span style={{ fontFamily: "var(--cela-mono)" }}>
                  - {formatVND(couponDiscount)}
                </span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "var(--cela-success)",
                }}
              >
                <span>Giảm (Điểm TL)</span>
                <span style={{ fontFamily: "var(--cela-mono)" }}>
                  - {formatVND(pointsDiscount)}
                </span>
              </div>
            )}
            <div
              style={{
                borderTop: "1px solid var(--cela-mist)",
                paddingTop: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--cela-espresso)",
                  fontSize: 14,
                }}
              >
                Tổng cộng
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--cela-rose)",
                  fontFamily: "var(--cela-mono)",
                }}
              >
                {formatVND(total)}
              </span>
            </div>
          </div>

          {/* Coupon section */}
          <div style={sectionCardStyle}>
            <button
              onClick={() => setCouponOpen((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--cela-espresso)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                🏷️ Mã giảm giá
                {appliedCoupon && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "rgba(107,142,106,0.15)",
                      color: "var(--cela-success)",
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}
                  >
                    {appliedCoupon.code}
                  </span>
                )}
              </span>
              {couponOpen ? (
                <ChevronUp style={{ width: 16, height: 16 }} />
              ) : (
                <ChevronDown style={{ width: 16, height: 16 }} />
              )}
            </button>
            {couponOpen && (
              <div style={{ padding: "0 16px 16px" }}>
                {appliedCoupon ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(107,142,106,0.12)",
                      border: "1px solid rgba(107,142,106,0.3)",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--cela-success)",
                        }}
                      >
                        {appliedCoupon.code}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 12,
                          color: "var(--cela-success)",
                        }}
                      >
                        Giảm {formatVND(appliedCoupon.discountAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <X
                        style={{
                          width: 16,
                          height: 16,
                          color: "var(--cela-success)",
                        }}
                      />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã coupon..."
                      style={{ ...posInputStyle, flex: 1, width: "auto" }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      style={{
                        padding: "0 14px",
                        height: 40,
                        background: "var(--cela-espresso)",
                        border: "none",
                        color: "var(--cela-champagne)",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 10,
                        cursor: "pointer",
                        opacity:
                          isValidatingCoupon || !couponInput.trim() ? 0.5 : 1,
                      }}
                    >
                      {isValidatingCoupon ? "..." : "ÁP DỤNG"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loyalty member section */}
          <div style={sectionCardStyle}>
            <button
              onClick={() => setMemberOpen((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--cela-espresso)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Heart
                  style={{ width: 15, height: 15, color: "var(--cela-rose)" }}
                />
                Thành viên loyalty
                {member && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "rgba(183,110,121,0.15)",
                      color: "var(--cela-rose)",
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}
                  >
                    {member.name}
                  </span>
                )}
              </span>
              {memberOpen ? (
                <ChevronUp style={{ width: 16, height: 16 }} />
              ) : (
                <ChevronDown style={{ width: 16, height: 16 }} />
              )}
            </button>
            {memberOpen && (
              <div
                style={{
                  padding: "0 16px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {member ? (
                  <>
                    <div
                      style={{
                        background: "rgba(183,110,121,0.08)",
                        border: "1px solid rgba(183,110,121,0.22)",
                        borderRadius: 10,
                        padding: "10px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--cela-espresso)",
                            }}
                          >
                            {member.name}
                          </p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: 11,
                              color: "var(--cela-stone)",
                            }}
                          >
                            Mã: {member.code}
                          </p>
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: 12,
                              color: "var(--cela-rose)",
                              fontWeight: 500,
                            }}
                          >
                            {member.points.toLocaleString("vi-VN")} điểm
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setMember(null);
                            setAppliedPoints(0);
                            setPointsInput("");
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <X
                            style={{
                              width: 15,
                              height: 15,
                              color: "var(--cela-stone)",
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {appliedPoints > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "rgba(107,142,106,0.12)",
                          border: "1px solid rgba(107,142,106,0.3)",
                          borderRadius: 10,
                          padding: "10px 14px",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "var(--cela-success)",
                          }}
                        >
                          Đã dùng {appliedPoints} điểm (giảm{" "}
                          {formatVND(appliedPoints * 100)})
                        </p>
                        <button
                          onClick={() => {
                            setAppliedPoints(0);
                            setPointsInput("");
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <X
                            style={{
                              width: 15,
                              height: 15,
                              color: "var(--cela-success)",
                            }}
                          />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: 12,
                            color: "var(--cela-stone)",
                          }}
                        >
                          100 điểm = 10.000đ | Tối đa {maxRedeemable} điểm (
                          {formatVND(maxRedeemable * 100)})
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="number"
                            value={pointsInput}
                            onChange={(e) => setPointsInput(e.target.value)}
                            placeholder="Số điểm muốn dùng"
                            max={maxRedeemable}
                            min={0}
                            style={{ ...posInputStyle, flex: 1, width: "auto" }}
                          />
                          <button
                            onClick={handleApplyPoints}
                            style={{
                              padding: "0 14px",
                              height: 40,
                              background: "var(--cela-espresso)",
                              border: "none",
                              color: "var(--cela-champagne)",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 10,
                              cursor: "pointer",
                            }}
                          >
                            ÁP DỤNG
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : showRegisterForm ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Họ tên thành viên"
                      style={posInputStyle}
                    />
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      style={posInputStyle}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setShowRegisterForm(false)}
                        style={{
                          flex: 1,
                          height: 36,
                          border: "1.5px solid var(--cela-mist)",
                          borderRadius: 10,
                          fontSize: 13,
                          color: "var(--cela-espresso)",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleRegisterMember}
                        disabled={isRegistering}
                        style={{
                          flex: 1,
                          height: 36,
                          background: "var(--cela-espresso)",
                          border: "none",
                          color: "var(--cela-champagne)",
                          fontSize: 13,
                          fontWeight: 600,
                          borderRadius: 10,
                          cursor: "pointer",
                          opacity: isRegistering ? 0.5 : 1,
                        }}
                      >
                        {isRegistering ? "Đang đăng ký..." : "Đăng ký"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="Số điện thoại..."
                        style={{ ...posInputStyle, flex: 1, width: "auto" }}
                      />
                      <button
                        onClick={handleSearchMember}
                        disabled={isSearchingMember}
                        style={{
                          padding: "0 14px",
                          height: 40,
                          background: "var(--cela-espresso)",
                          border: "none",
                          color: "var(--cela-champagne)",
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 10,
                          cursor: "pointer",
                          opacity: isSearchingMember ? 0.5 : 1,
                        }}
                      >
                        {isSearchingMember ? "..." : "TRA CỨU"}
                      </button>
                    </div>
                    {memberNotFound && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--cela-danger)",
                          margin: 0,
                        }}
                      >
                        Không tìm thấy thành viên
                      </p>
                    )}
                    <button
                      onClick={() => setShowRegisterForm(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--cela-rose)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--cela-body)",
                      }}
                    >
                      <User style={{ width: 12, height: 12 }} /> Đăng ký thành
                      viên mới
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Payment section */}
          <div style={sectionCardStyle}>
            <div style={{ padding: 16 }}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--cela-cocoa)",
                }}
              >
                Tiền khách đưa
              </p>
              <input
                type="number"
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(e.target.value)}
                placeholder="0"
                style={{
                  ...posInputStyle,
                  height: 56,
                  textAlign: "right",
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: "var(--cela-mono)",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setTenderedAmount(String(total))}
                  style={{
                    flex: 1,
                    height: 32,
                    fontSize: 12,
                    border: "1.5px solid var(--cela-mist)",
                    borderRadius: 8,
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--cela-espresso)",
                  }}
                >
                  Đúng tiền
                </button>
                {[10000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() =>
                      setTenderedAmount(
                        String((Number(tenderedAmount) || 0) + amt),
                      )
                    }
                    style={{
                      flex: 1,
                      height: 32,
                      fontSize: 12,
                      border: "1.5px solid var(--cela-mist)",
                      borderRadius: 8,
                      background: "transparent",
                      cursor: "pointer",
                      color: "var(--cela-espresso)",
                    }}
                  >
                    +{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              {tenderedAmount && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    background:
                      change >= 0
                        ? "rgba(107,142,106,0.12)"
                        : "rgba(183,110,121,0.12)",
                    color:
                      change >= 0
                        ? "var(--cela-success)"
                        : "var(--cela-danger)",
                  }}
                >
                  {change >= 0
                    ? `Tiền thối: ${formatVND(change)}`
                    : `Còn thiếu: ${formatVND(Math.abs(change))}`}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={handlePayment}
              disabled={
                cartItems.length === 0 || tendered < total || isProcessing
              }
              style={{
                width: "100%",
                height: 48,
                background: "var(--cela-espresso)",
                border: "none",
                color: "var(--cela-champagne)",
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity:
                  cartItems.length === 0 || tendered < total || isProcessing
                    ? 0.5
                    : 1,
                letterSpacing: "0.05em",
              }}
            >
              {isProcessing ? (
                <>
                  <svg
                    style={{
                      width: 16,
                      height: 16,
                      animation: "spin 1s linear infinite",
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                "THANH TOÁN TIỀN MẶT"
              )}
            </button>

            {cartItems.length > 0 && (
              <button
                onClick={() => setShowCancel(true)}
                style={{
                  width: "100%",
                  height: 40,
                  border: "1.5px solid rgba(183,110,121,0.4)",
                  color: "var(--cela-danger)",
                  background: "transparent",
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                HỦY ĐƠN HÀNG
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
