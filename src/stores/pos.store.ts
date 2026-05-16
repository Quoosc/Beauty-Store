import { create } from "zustand";
import { Shift, Order } from "@/types";

/**
 * POS Store — state cho màn hình bán hàng
 *
 * Draft autosave: cartItems được lưu vào localStorage("draft_order_{cashierId}") mỗi 10s
 * Key bao gồm cashierId để tránh cashier khác load nhầm draft.
 * Clear draft: sau khi payment thành công hoặc tạo đơn mới
 */

function getDraftKey(cashierId: string | undefined): string {
  return cashierId ? `draft_order_${cashierId}` : "draft_order_unknown";
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  quantity: number;
}

interface POSStore {
  // Ca làm việc hiện tại
  currentShift: Shift | null;
  setCurrentShift: (shift: Shift | null) => void;

  // Giỏ hàng
  cartItems: CartItem[];
  addToCart: (product: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Coupon
  appliedCoupon: { code: string; discountAmount: number } | null;
  setAppliedCoupon: (coupon: { code: string; discountAmount: number } | null) => void;

  // Thành viên
  member: { id: string; name: string; code: string; phone: string; points: number } | null;
  setMember: (member: POSStore["member"]) => void;
  appliedPoints: number;
  setAppliedPoints: (points: number) => void;

  // Tiền khách đưa
  tenderedAmount: string;
  setTenderedAmount: (amount: string) => void;

  // Draft management
  saveDraft: () => void;
  loadDraft: () => boolean; // trả true nếu có draft
  clearDraft: () => void;

  // Reset toàn bộ sau payment
  resetForNewOrder: () => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  currentShift: null,
  setCurrentShift: (shift) => set({ currentShift: shift }),

  cartItems: [],

  addToCart: (product) => {
    const { cartItems } = get();
    const existing = cartItems.find((i) => i.productId === product.productId);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      set({
        cartItems: cartItems.map((i) =>
          i.productId === product.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      if (product.stock === 0) return;
      set({ cartItems: [...cartItems, { ...product, quantity: 1 }] });
    }
  },

  updateQuantity: (productId, delta) => {
    const { cartItems } = get();
    set({
      cartItems: cartItems
        .map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0),
    });
  },

  removeFromCart: (productId) =>
    set({ cartItems: get().cartItems.filter((i) => i.productId !== productId) }),

  clearCart: () => set({ cartItems: [] }),

  appliedCoupon: null,
  setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),

  member: null,
  setMember: (member) => set({ member, appliedPoints: 0 }),
  appliedPoints: 0,
  setAppliedPoints: (points) => set({ appliedPoints: points }),

  tenderedAmount: "",
  setTenderedAmount: (amount) => set({ tenderedAmount: amount }),

  saveDraft: () => {
    const { cartItems, currentShift } = get();
    if (cartItems.length === 0) return;
    const key = getDraftKey(currentShift?.cashierId);
    localStorage.setItem(
      key,
      JSON.stringify({ items: cartItems, savedAt: new Date().toISOString() })
    );
  },

  loadDraft: () => {
    try {
      const { currentShift } = get();
      const key = getDraftKey(currentShift?.cashierId);
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (draft.items && draft.items.length > 0) {
        set({ cartItems: draft.items });
        return true;
      }
    } catch {
      // ignore parse error
    }
    return false;
  },

  clearDraft: () => {
    const key = getDraftKey(get().currentShift?.cashierId);
    localStorage.removeItem(key);
  },

  resetForNewOrder: () => {
    const key = getDraftKey(get().currentShift?.cashierId);
    localStorage.removeItem(key);
    set({
      cartItems: [],
      appliedCoupon: null,
      member: null,
      appliedPoints: 0,
      tenderedAmount: "",
    });
  },
}));
