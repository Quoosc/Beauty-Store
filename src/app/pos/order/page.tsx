"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Search, ShoppingCart, Trash2, CheckCircle, X,
  ChevronDown, ChevronUp, User, Heart, AlertTriangle, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { usePOSStore } from "@/stores/pos.store";
import { productService } from "@/services/product.service";
import { orderService, CreateOrderPayload } from "@/services/order.service";
import { couponService } from "@/services/coupon.service";
import { loyaltyService } from "@/services/loyalty.service";
import type { Product, Order } from "@/types";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

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

function CancelModal({ open, total, onClose, onConfirm, isLoading }: CancelModalProps) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Hủy đơn hàng</h2>
          </div>

          {total > 500000 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Đơn hàng &gt; 500.000đ sẽ được gửi đến Branch Manager để phê duyệt.
              </p>
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Lý do hủy <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
          >
            <option value="">-- Chọn lý do --</option>
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 h-10 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </button>
            <button
              onClick={() => reason && onConfirm(reason)}
              disabled={!reason || isLoading}
              className="flex-1 h-10 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận hủy"}
            </button>
          </div>
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
    <div className="fixed inset-0 bg-green-600/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Thanh toán thành công!</h2>
        {change > 0 && (
          <p className="text-xl text-white/90 mb-8">Tiền thối: {formatVND(change)}</p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-colors"
          >
            In hóa đơn
          </button>
          <button
            onClick={onNewOrder}
            className="px-6 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-white/90 transition-colors"
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
  } = usePOSStore();

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
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const pointsDiscount = appliedPoints * 100; // 100 points = 10,000đ → 100 points * 100 = 10,000đ? No: 100 points = 10,000đ → 1 point = 100đ
  const total = Math.max(0, subtotal - couponDiscount - pointsDiscount);
  const tendered = Number(tenderedAmount) || 0;
  const change = tendered - total;

  const maxRedeemableByPercent = Math.floor((total * 0.5) / 100) * 100;
  const maxRedeemable = member ? Math.min(member.points, maxRedeemableByPercent) : 0;

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
        const res = await productService.search({ q: searchQuery, status: "ACTIVE", size: 20 });
        setSearchResults(res.data.data.content);
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
      const result = await couponService.validate({ code: couponInput, orderTotal: subtotal });
      if (result.isValid) {
        setAppliedCoupon({ code: couponInput, discountAmount: result.discountAmount });
        toast.success("Áp dụng coupon thành công!");
        setCouponInput("");
      } else {
        toast.error(result.reason ?? "Mã coupon không hợp lệ");
      }
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
      setMember({ id: found.id, name: found.fullName, code: found.memberCode, phone: found.phone, points: found.pointBalance });
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
      const newMember = await loyaltyService.register({ fullName: registerName, phone: registerPhone });
      setMember({ id: newMember.id, name: newMember.fullName, code: newMember.memberCode, phone: newMember.phone, points: newMember.pointBalance });
      setShowRegisterForm(false);
      toast.success("Đăng ký thành viên thành công!");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
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
        shiftId: currentShift!.id,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        couponCode: appliedCoupon?.code,
        memberId: member?.id,
        pointsToRedeem: appliedPoints > 0 ? appliedPoints : undefined,
        tenderedAmount: tendered,
      };
      const res = await orderService.create(orderData);
      setLastOrder(res.data.data);
      setShowSuccess(true);
      resetForNewOrder();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
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

  // No shift guard
  if (!currentShift || currentShift.status !== "OPEN") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Bạn chưa mở ca</h2>
          <p className="text-gray-500 mb-6">Vui lòng mở ca trước khi bán hàng.</p>
          <Link
            href="/pos/shift"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-xl"
          >
            Đi đến trang ca
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Success overlay */}
      {showSuccess && lastOrder && (
        <SuccessOverlay
          order={lastOrder}
          change={change}
          onNewOrder={() => { setShowSuccess(false); setLastOrder(null); }}
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
      <div className="bg-gradient-to-r from-[#FF69B4] to-[#D946A6] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">BeautyERP POS</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm">Ca đang mở</span>
            <span className="text-white/70 text-sm">|</span>
            <span className="text-white text-sm font-medium">{currentShift.cashierName}</span>
          </div>
          <button
            onClick={() => router.push("/pos/shift")}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Đóng ca
          </button>
        </div>
      </div>

      {/* Draft recovery banner */}
      {hasDraft && !draftDismissed && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <span className="text-amber-700 text-sm">
            ♻️ Có đơn hàng chưa hoàn tất từ trước
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setDraftDismissed(true)}
              className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
            >
              Tiếp tục đơn cũ
            </button>
            <button
              onClick={() => { clearCart(); setHasDraft(false); setDraftDismissed(true); }}
              className="px-4 py-1.5 border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
            >
              Tạo đơn mới
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">

        {/* LEFT PANEL — 55% */}
        <div className="flex flex-col gap-4" style={{ width: "55%" }}>
          {/* Product search */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                className="h-11 w-full pl-10 pr-10 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
              />
              {isSearching && (
                <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}

              {/* Search results */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <span className="text-sm font-semibold text-pink-600 flex-shrink-0">
                        {formatVND(product.sellingPrice)}
                      </span>
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        Thêm
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Giỏ hàng ({cartItems.length} sản phẩm)
              </h2>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-200 mb-3" />
                <p className="text-gray-500">Chưa có sản phẩm nào</p>
                <p className="text-xs text-gray-400 mt-1">Tìm kiếm sản phẩm để thêm vào đơn</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-4 py-2">Sản phẩm</th>
                      <th className="text-center px-2 py-2">SL</th>
                      <th className="text-right px-3 py-2">Đơn giá</th>
                      <th className="text-right px-3 py-2">Thành tiền</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cartItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.sku}</p>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="w-7 h-7 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-sm flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="w-7 h-7 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-sm flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-gray-600">
                          {formatVND(item.price)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-pink-600">
                          {formatVND(item.price * item.quantity)}
                        </td>
                        <td className="px-2 py-3">
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="flex flex-col gap-3 overflow-y-auto" style={{ width: "45%" }}>

          {/* Pricing summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm (Coupon)</span>
                <span>- {formatVND(couponDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm (Điểm TL)</span>
                <span>- {formatVND(pointsDiscount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
              <span className="font-semibold text-gray-900">Tổng cộng</span>
              <span className="text-2xl font-bold text-pink-600">{formatVND(total)}</span>
            </div>
          </div>

          {/* Coupon section */}
          <div className="bg-white rounded-xl shadow-sm">
            <button
              onClick={() => setCouponOpen((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-gray-900"
            >
              <span className="flex items-center gap-2">
                🏷️ Mã giảm giá
                {appliedCoupon && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {appliedCoupon.code}
                  </span>
                )}
              </span>
              {couponOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {couponOpen && (
              <div className="px-4 pb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-green-700">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">Giảm {formatVND(appliedCoupon.discountAmount)}</p>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-green-600 hover:text-green-800">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã coupon..."
                      className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className="px-4 h-10 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                    >
                      {isValidatingCoupon ? "..." : "ÁP DỤNG"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loyalty member section */}
          <div className="bg-white rounded-xl shadow-sm">
            <button
              onClick={() => setMemberOpen((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-gray-900"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                Thành viên loyalty
                {member && (
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                    {member.name}
                  </span>
                )}
              </span>
              {memberOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {memberOpen && (
              <div className="px-4 pb-4 space-y-3">
                {member ? (
                  <>
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">Mã: {member.code}</p>
                          <p className="text-xs text-pink-600 font-medium mt-1">
                            {member.points.toLocaleString("vi-VN")} điểm
                          </p>
                        </div>
                        <button onClick={() => { setMember(null); setAppliedPoints(0); setPointsInput(""); }} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {appliedPoints > 0 ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700">
                          Đã dùng {appliedPoints} điểm (giảm {formatVND(appliedPoints * 100)})
                        </p>
                        <button onClick={() => { setAppliedPoints(0); setPointsInput(""); }} className="text-green-600 hover:text-green-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">
                          100 điểm = 10.000đ | Tối đa {maxRedeemable} điểm ({formatVND(maxRedeemable * 100)})
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={pointsInput}
                            onChange={(e) => setPointsInput(e.target.value)}
                            placeholder="Số điểm muốn dùng"
                            max={maxRedeemable}
                            min={0}
                            className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                          />
                          <button
                            onClick={handleApplyPoints}
                            className="px-4 h-10 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-xs font-semibold rounded-lg"
                          >
                            ÁP DỤNG
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : showRegisterForm ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Họ tên thành viên"
                      className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRegisterForm(false)}
                        className="flex-1 h-9 border border-gray-300 rounded-lg text-sm text-gray-600"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleRegisterMember}
                        disabled={isRegistering}
                        className="flex-1 h-9 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-medium rounded-lg disabled:opacity-50"
                      >
                        {isRegistering ? "Đang đăng ký..." : "Đăng ký"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="Số điện thoại..."
                        className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                      />
                      <button
                        onClick={handleSearchMember}
                        disabled={isSearchingMember}
                        className="px-4 h-10 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                      >
                        {isSearchingMember ? "..." : "TRA CỨU"}
                      </button>
                    </div>
                    {memberNotFound && (
                      <p className="text-red-500 text-xs">Không tìm thấy thành viên</p>
                    )}
                    <button
                      onClick={() => setShowRegisterForm(true)}
                      className="text-xs text-pink-600 hover:text-pink-800 flex items-center gap-1"
                    >
                      <User className="w-3 h-3" /> Đăng ký thành viên mới
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Payment section */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiền khách đưa</label>
            <input
              type="number"
              value={tenderedAmount}
              onChange={(e) => setTenderedAmount(e.target.value)}
              placeholder="0"
              className="w-full h-14 border border-gray-300 rounded-lg px-4 text-right text-2xl font-bold
                focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
            />
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setTenderedAmount(String(total))}
                className="flex-1 h-8 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đúng tiền
              </button>
              {[10000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTenderedAmount(String((Number(tenderedAmount) || 0) + amt))}
                  className="flex-1 h-8 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  +{(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            {tenderedAmount && (
              <div className={`mt-3 p-3 rounded-lg text-center font-semibold ${change >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {change >= 0
                  ? `Tiền thối: ${formatVND(change)}`
                  : `Còn thiếu: ${formatVND(Math.abs(change))}`}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handlePayment}
              disabled={cartItems.length === 0 || tendered < total || isProcessing}
              className="w-full h-12 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-bold rounded-xl
                hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
                className="w-full h-10 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
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
