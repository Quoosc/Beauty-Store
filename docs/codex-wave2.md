# CODEX PROMPT — Wave 2: POS Core (Cashier)

## IMPORTANT: Read this entire document before writing a single line of code.

---

## 1. Project Context

**BeautyERP FE** — internal ERP for beauty retail employees. Wave 2 implements the core cashier (POS) workflow.

**Wave 1 must be complete before starting Wave 2.** ERPLayout, all sidebars, and Header must exist.

### Already implemented — DO NOT modify:
- Everything from Wave 1
- `src/services/auth.service.ts`, `product.service.ts`, `order.service.ts`, `shift.service.ts`
- `src/stores/pos.store.ts` — POS cart, draft autosave, coupon, member state
- `src/types/index.ts` — Order, OrderItem, Shift, CreateOrderRequest, ReturnTransaction, etc.

---

## 2. Files to Implement

### New service files (implement first):
```
src/services/loyalty.service.ts    (partial — POS operations only)
src/services/coupon.service.ts     (partial — validate only)
```

### New page files:
```
src/app/pos/order/page.tsx                ← MOST COMPLEX
src/app/cashier/orders/page.tsx
src/app/orders/[orderId]/page.tsx
src/app/returns/new/page.tsx
```

---

## 3. Design Source — MANDATORY

| File to implement | Source design file |
|------------------|--------------------|
| `pos/order/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\POSOrder.tsx` |
| `cashier/orders/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\CashierOrders.tsx` |
| `orders/[orderId]/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\OrderDetails.tsx` |
| `returns/new/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\ReturnOrder.tsx` |

**Read each source file completely before implementing its Next.js counterpart.**

---

## 4. New Services to Implement First

### 4.1 `src/services/loyalty.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, LoyaltyMember } from "@/types";

// Search member by phone — used at POS
export const loyaltyService = {
  // GET /loyalty-promotion/members/search?phone={phone}
  searchByPhone: async (phone: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      `/loyalty-promotion/members/search`,
      { params: { phone } }
    );
    return res.data.data;
  },

  // POST /loyalty-promotion/members
  // Register new member at POS
  register: async (data: { fullName: string; phone: string }): Promise<LoyaltyMember> => {
    const res = await api.post<ApiResponse<LoyaltyMember>>(
      `/loyalty-promotion/members`,
      data
    );
    return res.data.data;
  },

  // POST /loyalty-promotion/members/{id}/redeem
  // Validate redeem request — actual redeem happens atomically at order creation
  redeemPoints: async (memberId: string, data: { pointsToRedeem: number; orderTotal: number }) => {
    const res = await api.post<ApiResponse<{ discountAmount: number }>>(
      `/loyalty-promotion/members/${memberId}/redeem`,
      data
    );
    return res.data.data;
  },

  // GET /loyalty-promotion/members — full list (used in Wave 4)
  getAll: async (params?: { page?: number; size?: number }) => {
    const res = await api.get(`/loyalty-promotion/members`, { params });
    return res.data.data;
  },

  // GET /loyalty-promotion/members/{id}
  getById: async (id: string): Promise<LoyaltyMember> => {
    const res = await api.get<ApiResponse<LoyaltyMember>>(
      `/loyalty-promotion/members/${id}`
    );
    return res.data.data;
  },
};
```

### 4.2 `src/services/coupon.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, Coupon, CouponValidationResponse } from "@/types";

export const couponService = {
  // POST /loyalty-promotion/coupons/validate
  // Called at POS before adding coupon to order
  validate: async (data: { code: string; orderTotal: number }): Promise<CouponValidationResponse> => {
    const res = await api.post<ApiResponse<CouponValidationResponse>>(
      `/loyalty-promotion/coupons/validate`,
      data
    );
    return res.data.data;
  },

  // Full CRUD — used in Wave 4
  getAll: async (params?: { page?: number; size?: number; isActive?: boolean }) => {
    const res = await api.get(`/loyalty-promotion/coupons`, { params });
    return res.data.data;
  },

  create: async (data: Partial<Coupon>) => {
    const res = await api.post<ApiResponse<Coupon>>(`/loyalty-promotion/coupons`, data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Coupon>) => {
    const res = await api.put<ApiResponse<Coupon>>(`/loyalty-promotion/coupons/${id}`, data);
    return res.data.data;
  },
};
```

---

## 5. Page Specs

---

### 5.1 `src/app/pos/order/page.tsx` — POS Bán hàng

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\POSOrder.tsx` — **read and port the full 906-line file**

**"use client"** — required throughout.

**State management — use pos.store.ts (do not duplicate state):**
```typescript
import { usePOSStore } from "@/stores/pos.store";

const {
  currentShift,
  cartItems,
  appliedCoupon,
  member,
  appliedPoints,
  tenderedAmount,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  saveDraft,
  loadDraft,
  clearDraft,
  resetForNewOrder,
} = usePOSStore();
```

**Redirect guard:** If `currentShift === null` → show "Bạn chưa mở ca. Vui lòng mở ca trước." + button "Đi đến trang ca" linking to `/pos/shift`.

**Draft recovery banner (if draft exists on mount):**
```
♻️ "Có đơn hàng chưa hoàn tất từ trước"
[TIẾP TỤC ĐƠN CŨ] (amber) | [TẠO ĐƠN MỚI] (white/bordered)
```
On mount: call `loadDraft()` → if returns true, show banner.

**Layout — 55% / 45% split:**
```
<div className="flex h-full gap-4">
  <div className="w-[55%] flex flex-col gap-4">  {/* LEFT PANEL */}
  <div className="w-[45%] flex flex-col gap-4">  {/* RIGHT PANEL */}
```

**LEFT PANEL content:**

*Product search (debounce 300ms):*
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<Product[]>([]);
const [isSearching, setIsSearching] = useState(false);

// Use useEffect + setTimeout for debounce
useEffect(() => {
  if (!searchQuery.trim()) { setSearchResults([]); return; }
  const timer = setTimeout(async () => {
    setIsSearching(true);
    try {
      const result = await productService.search({ q: searchQuery, status: "ACTIVE", size: 20 });
      setSearchResults(result.content);
    } finally {
      setIsSearching(false);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

Search input UI:
```
Input: h-11, pl-10, Search icon (lucide) absolute left-3
Placeholder: "Tìm sản phẩm theo tên hoặc SKU..."
Spinner (AnimatePresence or simple) when isSearching
```

*Product results (dropdown when searching):*
```
Results list below search input (absolute positioned, z-50, white bg, shadow-xl, rounded-xl)
Each item: image + name + SKU + price + "Thêm" button
Click: addToCart(product, 1), clear search input
```

*POS Cart table (when cartItems.length > 0):*
```
Table: full width
Columns: Sản phẩm | SL | Đơn giá | Thành tiền | [X remove]
Each row:
  - Sản phẩm: product name (font-medium) + SKU (text-xs text-gray-500)
  - SL: quantity controls [-] [N] [+] (button w-7 h-7 border rounded)
  - Đơn giá: formatted VND (text-sm)
  - Thành tiền: formatted VND (text-sm font-medium text-pink-600)
  - [X]: TrashIcon w-4 h-4 text-red-400 hover:text-red-600
```

*Empty cart:*
```
ShoppingCart icon w-16 h-16 text-gray-300 mx-auto
"Chưa có sản phẩm nào" text-gray-500
"Tìm kiếm sản phẩm để thêm vào đơn" text-xs text-gray-400
```

**RIGHT PANEL content:**

*Pricing summary (gray-50 bg, rounded-xl, p-4):*
```
Tạm tính:          {formatVND(subtotal)}
Giảm (Coupon):     - {formatVND(couponDiscount)}   [green if > 0]
Giảm (Điểm TL):   - {formatVND(pointsDiscount)}   [green if > 0]
─────────────────────────────────────
TỔNG CỘNG:         {formatVND(total)}   [text-2xl font-bold text-pink-600]
```

*Coupon section (collapsible card):*
```
Header: "Mã giảm giá" + ChevronDown toggle
Body (when open):
  Input "Nhập mã coupon..." + "ÁP DỤNG" button
  Loading state while validating
  Success: green check + mã coupon + discount amount + [×] remove
  Error: red text with specific reason (expired / out of uses / min not met)
```

Coupon validation logic:
```typescript
async function handleApplyCoupon() {
  if (!couponCode.trim() || cartItems.length === 0) return;
  setIsValidating(true);
  try {
    const result = await couponService.validate({ code: couponCode, orderTotal: subtotal });
    if (result.isValid) {
      // update pos.store with applied coupon
      usePOSStore.getState().applyCoupon({ code: couponCode, discountAmount: result.discountAmount });
      toast.success("Áp dụng coupon thành công!");
    } else {
      toast.error(result.reason ?? "Mã coupon không hợp lệ");
    }
  } catch {
    toast.error("Không thể kiểm tra coupon, thử lại sau");
  } finally {
    setIsValidating(false);
  }
}
```

*Loyalty member section (collapsible card):*
```
Header: "Thành viên loyalty" + toggle
Body:
  [When no member selected]:
    Phone input + "TRA CỨU" button
    Loading spinner while searching
    Not found: red text "Không tìm thấy thành viên"
    "Đăng ký thành viên mới" link (opens register form)
    
  [When member found/selected]:
    Member card:
      - Tên: {member.fullName}
      - Mã: {member.memberCode}
      - Điểm hiện có: {member.pointBalance} điểm
    Points redemption:
      - Input "Số điểm muốn dùng" (max = min(member.pointBalance, maxRedeemablePoints))
      - Helper text: "100 điểm = 10.000đ | Tối đa {maxRedeemable} điểm ({formatVND(maxDiscount)})"
      - "ÁP DỤNG ĐIỂM" button
    [×] remove member button
```

Max redeemable points calculation (100 points = 10,000đ, max 50% of order):
```typescript
const maxRedeemableByPercent = Math.floor((total * 0.5) / 100) * 100; // 50% cap, multiples of 100
const maxRedeemable = Math.min(member.pointBalance, maxRedeemableByPercent);
```

*Payment section:*
```
"Tiền khách đưa" input (large: text-2xl font-bold, h-14, text-right)
  - Auto-format as VND while typing
  - Quick amount buttons: [exact] [+10k] [+50k] [+100k]

"Tiền thối":
  change = tenderedAmount - total
  [green if > 0]: "Tiền thối: {formatVND(change)}"
  [red if < 0]:   "Còn thiếu: {formatVND(Math.abs(change))}"
```

*Action buttons:*
```
"THANH TOÁN TIỀN MẶT"
  - w-full h-12 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-bold rounded-xl
  - Disabled: cartItems.length === 0 OR tenderedAmount < total
  - Loading: spinner + "Đang xử lý..."

"HỦY ĐƠN HÀNG"
  - w-full h-10 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl
  - Only visible when cartItems.length > 0
  - Opens cancel modal
```

**Payment flow (CRITICAL — follow exactly):**
```typescript
import { v4 as uuidv4 } from "uuid"; // already in package.json
import { orderService } from "@/services/order.service";

async function handlePayment() {
  if (cartItems.length === 0) return;
  setIsProcessing(true);
  try {
    const idempotencyKey = uuidv4(); // generate per-click
    const orderData: CreateOrderRequest = {
      items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
      couponCode: appliedCoupon?.code,
      memberId: member?.id,
      pointsToRedeem: appliedPoints > 0 ? appliedPoints : undefined,
      tenderedAmount: Number(tenderedAmount),
    };
    const order = await orderService.create(orderData, idempotencyKey);
    // Note: check order.service.ts — create() already handles Idempotency-Key header
    
    setLastOrder(order);
    setShowSuccess(true);
    resetForNewOrder(); // clears cart, draft, coupon, member
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? "Thanh toán thất bại";
    if (err?.response?.status === 422) {
      toast.error("Tồn kho không đủ: " + msg);
    } else {
      toast.error(msg);
    }
  } finally {
    setIsProcessing(false);
  }
}
```

**Success overlay (full-screen green):**
```
Fixed overlay: bg-green-600/95 backdrop-blur-sm z-50
Center content:
  - White circle w-20 h-20 with green CheckCircle icon w-12 h-12
  - "Thanh toán thành công!" text-3xl font-bold text-white
  - "Tiền thối: {formatVND(change)}" text-xl text-white/90
  Buttons:
    "In hóa đơn" → orderService.getReceipt(order.id) → open PDF in new tab
    "ĐƠN MỚI →" → setShowSuccess(false), clear state
```

**Cancel order modal:**
```
Dialog (shadcn/ui)
  - Icon: X in red circle
  - Title: "Hủy đơn hàng"
  - Select "Lý do hủy" (required):
    options: "Khách hàng đổi ý", "Sản phẩm hết hàng", "Lỗi nhập liệu", "Khác"
  - If orderTotal > 500000:
      ⚠️ yellow alert: "Đơn hàng > 500.000đ sẽ được gửi đến Branch Manager để phê duyệt"
  - Buttons: "Quay lại" | "Xác nhận hủy" (red)
```

Cancel logic:
```typescript
// orderService.cancel() is already implemented in order.service.ts
// If order is in cart (not yet submitted): just clearCart()
// If order was submitted (id exists): call orderService.cancel(orderId, reason)
```

**Draft autosave — already in pos.store.ts:**
```typescript
// On component mount: trigger saveDraft every 10s
useEffect(() => {
  const interval = setInterval(() => {
    if (cartItems.length > 0) saveDraft();
  }, 10000);
  return () => clearInterval(interval);
}, [cartItems, saveDraft]);
```

**Currency formatter:**
```typescript
const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
```

---

### 5.2 `src/app/cashier/orders/page.tsx` — Lịch sử đơn hàng

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\CashierOrders.tsx`

**"use client"** — required.
**Wrap in `<ERPLayout>`.**

**State:**
```typescript
const [orders, setOrders] = useState<Order[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
const [page, setPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);
```

**API call:**
```typescript
// GET /order/orders/my?page={page}&size=10
const loadOrders = async () => {
  const result = await orderService.getMy({ page, size: 10 });
  setOrders(result.content);
  setTotalPages(result.totalPages);
};
```

**Stats row (3 cards):**
```
Tổng đơn:     {orders.length} | icon: ShoppingBag (blue)
Hoàn thành:   {orders.filter(o => o.status === "COMPLETED").length} | icon: CheckCircle (green)
Tổng doanh thu: {formatVND(sum of total for COMPLETED)} | icon: TrendingUp (pink)
```

**Filter bar:**
```
Search: Input "Tìm mã đơn..." (icon Search)
Status: Select [Tất cả | Hoàn thành | Đã hủy]
```

**Orders table:**
```
Columns: Mã đơn | Thời gian | Số sản phẩm | Tổng tiền | Trạng thái | Thao tác

Status badges:
  COMPLETED: bg-green-100 text-green-700 "Hoàn thành"
  CANCELLED: bg-red-100 text-red-700 "Đã hủy"
  RETURNED:  bg-yellow-100 text-yellow-700 "Trả hàng"

Actions:
  "Chi tiết" button → router.push(`/orders/${order.id}`)
  "In HĐ" button → orderService.getReceipt(order.id) → open PDF
```

**Empty state:** ShoppingBag icon + "Chưa có đơn hàng nào trong ca này"

**Pagination:** Previous/Next buttons + "Trang {page+1}/{totalPages}"

---

### 5.3 `src/app/orders/[orderId]/page.tsx` — Chi tiết đơn hàng

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\OrderDetails.tsx`

**"use client"** — required.
**Wrap in `<ERPLayout>`.**

**Data fetch:**
```typescript
const params = useParams();
const orderId = params.orderId as string;

useEffect(() => {
  orderService.getById(orderId).then(setOrder).catch(() => toast.error("Không tìm thấy đơn hàng"));
}, [orderId]);
```

**Layout:**
```
Header row: "Chi tiết đơn #{order.id.slice(-8).toUpperCase()}" + status badge + "In hóa đơn" button

Info cards (grid 2 cols):
  - Thông tin đơn: mã đơn, thời gian, cashier, chi nhánh
  - Thanh toán: tạm tính, giảm coupon, giảm điểm, TỔNG CỘNG, tiền khách đưa

Items table:
  - Columns: Sản phẩm | SKU | SL | Đơn giá | Thành tiền
  - Snapshot data from order.items (immutable)

Cancel section (only if status = COMPLETED):
  - "Yêu cầu hủy đơn" button (red outlined)
  - Opens cancel dialog with reason input
  - Calls orderService.cancel(orderId, reason)
  - On success: reload order data
```

---

### 5.4 `src/app/returns/new/page.tsx` — Trả hàng

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\ReturnOrder.tsx`

**"use client"** — required.
**Wrap in `<ERPLayout>`.**

**Shift guard:** If no OPEN shift → alert + link to /pos/shift.

**Step 1 — Find original order:**
```
Input "Mã đơn hàng gốc" + "TÌM KIẾM" button
→ orderService.getById(orderId)
→ Display order info card: cashier, date, total
→ Display items table
```

**Step 2 — Select items to return:**
```
Each item from original order:
  - Checkbox to select for return
  - If selected: input "Số lượng trả" (max = item.quantity)
  - Show: Đơn giá snapshot (immutable from order)
```

**Return summary:**
```
Total refund = sum(selected items * unitPrice)
"Tổng hoàn trả: {formatVND(totalRefund)}"
```

**Submit:**
```typescript
const returnData = {
  originalOrderId: foundOrder.id,
  items: selectedItems.map(item => ({
    productId: item.productId,
    quantity: returnQty[item.productId],
  })),
};
// returnService is exported from order.service.ts
await returnService.create(returnData);
toast.success("Trả hàng thành công! Kho hàng đã được cập nhật.");
// Reset form
```

**Validation:**
- Must have OPEN shift
- At least 1 item selected
- Each selected item: qty > 0 AND qty ≤ original qty
- Cannot return already-cancelled orders

---

## 6. Coding Conventions

```typescript
// Currency format — use everywhere
const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

// Date format
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

// All pages: "use client" + <ERPLayout> wrapper (except pos/order which has custom header)
// pos/order/page.tsx: does NOT use ERPLayout — it has its own full-screen layout

// Error handling: always try/catch + toast.error(err?.response?.data?.message ?? "Lỗi hệ thống")

// Loading states: show spinner/skeleton while fetching, disable buttons while submitting
```

**pos/order page uses FULL SCREEN layout (no ERPLayout):**
```tsx
// pos/order/page.tsx top-level:
return (
  <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <POSTopBar />         {/* Pink header with cashier info + close shift button */}
    {draftBanner}
    <div className="flex flex-1 gap-4 p-4 overflow-hidden">
      <LeftPanel />
      <RightPanel />
    </div>
  </div>
);
```

POSTopBar:
```
bg-gradient-to-r from-[#FF69B4] to-[#D946A6] px-6 py-3 flex items-center justify-between
Left: Sparkles icon + "BeautyERP POS"
Center: Green pulse circle + "Ca đang mở" | Cashier name | Branch
Right: "Đóng ca" button (amber) → router.push("/pos/shift")
```

---

## 7. Order of Implementation

1. `src/services/loyalty.service.ts`
2. `src/services/coupon.service.ts`
3. `src/app/pos/order/page.tsx` (most complex — allocate most time)
4. `src/app/cashier/orders/page.tsx`
5. `src/app/orders/[orderId]/page.tsx`
6. `src/app/returns/new/page.tsx`
