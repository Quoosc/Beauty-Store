# CODEX PROMPT — Wave 4: Loyalty + Reports

## IMPORTANT: Read this entire document before writing a single line of code.

---

## 1. Project Context

**BeautyERP FE** — internal ERP. Wave 4 implements loyalty member management, promotions, coupon management, and reporting.

**Waves 1–3 must be complete.** ERPLayout, all sidebars, catalog pages, inventory pages must exist.

### Already implemented — DO NOT modify:
- Everything from Waves 1–3
- `src/services/loyalty.service.ts` (partial — searchByPhone, register, redeemPoints from Wave 2)
- `src/services/coupon.service.ts` (partial — validate, getAll, create, update from Wave 2)
- `src/services/report.service.ts` (stub — getDashboard only from Wave 3)

---

## 2. Files to Implement

### Update existing services (add missing methods):
```
src/services/loyalty.service.ts    (add: getAllMembers, getPointHistory)
src/services/coupon.service.ts     (already complete from Wave 2)
src/services/report.service.ts     (add: getRevenue, getRevenueAsync, getInventoryReport)
```

### New service files:
```
src/services/promotion.service.ts
```

### New page files:
```
src/app/loyalty/members/page.tsx
src/app/promotions/page.tsx
src/app/coupons/page.tsx
src/app/revenue-report/page.tsx
src/app/inventory-report/page.tsx
```

---

## 3. Design Source — MANDATORY

| File to implement | Source design file |
|------------------|--------------------|
| `loyalty/members/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\LoyaltyMembers.tsx` |
| `promotions/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\PromotionsManagement.tsx` |
| `coupons/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\CouponsManagement.tsx` |
| `revenue-report/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\RevenueReport.tsx` |
| `inventory-report/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\InventoryReport.tsx` |

**Read each source file completely before implementing its Next.js counterpart.**

---

## 4. Service Updates

### 4.1 Update `src/services/loyalty.service.ts` — add these methods:

```typescript
// Add to existing loyaltyService object:

  // GET /loyalty-promotion/members?page=&size=&search=
  getAll: async (params?: { page?: number; size?: number; search?: string }) => {
    const res = await api.get<PaginatedResponse<LoyaltyMember>>(
      `/loyalty-promotion/members`,
      { params }
    );
    return res.data.data;
  },

  // GET /loyalty-promotion/members/{id} — includes point balance
  // (already exists, keep as-is)

  // GET /loyalty-promotion/members/{id}/points?page=&size=
  // Point transaction history for a member
  getPointHistory: async (
    memberId: string,
    params?: { page?: number; size?: number }
  ) => {
    const res = await api.get(
      `/loyalty-promotion/members/${memberId}/points`,
      { params }
    );
    return res.data.data;
  },
```

### 4.2 Update `src/services/report.service.ts` — add full report methods:

```typescript
import api from "@/lib/axios";
import type { ApiResponse, DashboardData } from "@/types";

// Add these types locally (not in types/index.ts — report-specific):
interface RevenueReportData {
  date: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  topProducts: { productId: string; productName: string; soldQty: number; revenue: number }[];
}

interface InventoryReportData {
  lowStockItems: { productId: string; productName: string; sku: string; quantity: number; minThreshold: number }[];
  nearExpiryItems: { productId: string; productName: string; sku: string; expiryDate: string; quantity: number }[];
  slowMovingItems: { productId: string; productName: string; sku: string; lastSoldAt: string | null; quantity: number }[];
}

export const reportService = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await api.get<ApiResponse<DashboardData>>(`/report/dashboard`);
    return res.data.data;
  },

  // GET /report/revenue?startDate=&endDate=&branchId=
  // Sync report for ≤ 31 days
  getRevenue: async (params: { startDate: string; endDate: string }): Promise<RevenueReportData[]> => {
    const res = await api.get<ApiResponse<RevenueReportData[]>>(`/report/revenue`, { params });
    return res.data.data;
  },

  // POST /report/revenue/async — for > 31 days; returns jobId
  requestAsyncRevenue: async (params: { startDate: string; endDate: string }): Promise<{ jobId: string }> => {
    const res = await api.post<ApiResponse<{ jobId: string }>>(`/report/revenue/async`, params);
    return res.data.data;
  },

  // GET /report/inventory
  getInventoryReport: async (): Promise<InventoryReportData> => {
    const res = await api.get<ApiResponse<InventoryReportData>>(`/report/inventory`);
    return res.data.data;
  },
};
```

### 4.3 New `src/services/promotion.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, Promotion, PaginatedResponse } from "@/types";

export const promotionService = {
  // GET /loyalty-promotion/promotions
  getAll: async (params?: { page?: number; size?: number; isActive?: boolean }) => {
    const res = await api.get<PaginatedResponse<Promotion>>(
      `/loyalty-promotion/promotions`,
      { params }
    );
    return res.data.data;
  },

  getById: async (id: string): Promise<Promotion> => {
    const res = await api.get<ApiResponse<Promotion>>(`/loyalty-promotion/promotions/${id}`);
    return res.data.data;
  },

  // POST /loyalty-promotion/promotions
  create: async (data: Omit<Promotion, "id">): Promise<Promotion> => {
    const res = await api.post<ApiResponse<Promotion>>(`/loyalty-promotion/promotions`, data);
    return res.data.data;
  },

  // PUT /loyalty-promotion/promotions/{id}
  update: async (id: string, data: Partial<Promotion>): Promise<Promotion> => {
    const res = await api.put<ApiResponse<Promotion>>(`/loyalty-promotion/promotions/${id}`, data);
    return res.data.data;
  },

  // DELETE or deactivate
  deactivate: async (id: string): Promise<void> => {
    await api.put(`/loyalty-promotion/promotions/${id}`, { isActive: false });
  },
};
```

---

## 5. Page Specs

All pages: `"use client"` + `<ERPLayout>` wrapper.

---

### 5.1 `src/app/loyalty/members/page.tsx` — Quản lý thành viên loyalty
**Design source:** `src\app\pages\LoyaltyMembers.tsx`

**State:**
```typescript
const [members, setMembers] = useState<LoyaltyMember[]>([]);
const [search, setSearch] = useState("");        // search by phone or name
const [page, setPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);
const [isLoading, setIsLoading] = useState(true);
const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);
const [showHistory, setShowHistory] = useState(false);
```

**Load members (debounce 300ms):**
```typescript
useEffect(() => {
  const timer = setTimeout(async () => {
    setIsLoading(true);
    try {
      const result = await loyaltyService.getAll({ page, size: 20, search: search || undefined });
      setMembers(result.content);
      setTotalPages(result.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [search, page]);
```

**Layout:**
```
Page title: "Thành viên Loyalty"

Stats row (3 cards):
  - Tổng thành viên: {totalElements}  (icon: Users, blue)
  - Tổng điểm phát hành: computed sum (icon: Star, amber)  
  - Thành viên mới tháng này: (icon: UserPlus, green)

Search bar: Input "Tìm theo tên hoặc SĐT..." (icon Search)
```

**Members table:**
```
Columns: Họ tên | Mã thành viên | SĐT | Điểm hiện có | Ngày đăng ký | Thao tác

Điểm hiện có: text-pink-600 font-bold "{member.pointBalance} điểm"

Actions:
  "Xem lịch sử" → opens Sheet/Dialog showing point history
```

**Point history Sheet (shadcn/ui Sheet, slide from right):**
```
Title: "Lịch sử điểm — {member.fullName}"

History table:
  Columns: Thời gian | Loại | Điểm | Ghi chú

  Type badges:
    EARN:   bg-green-100 text-green-700 "+ Tích điểm"
    REDEEM: bg-blue-100 text-blue-700 "- Đổi điểm"
    REFUND: bg-amber-100 text-amber-700 "+ Hoàn điểm"

Load: loyaltyService.getPointHistory(member.id, { page: 0, size: 20 })
```

**Pagination:** standard Previous/Next buttons.

---

### 5.2 `src/app/promotions/page.tsx` — Quản lý khuyến mãi
**Design source:** `src\app\pages\PromotionsManagement.tsx`

**State:**
```typescript
const [promotions, setPromotions] = useState<Promotion[]>([]);
const [showForm, setShowForm] = useState(false);
const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
const [filterActive, setFilterActive] = useState<boolean | null>(null); // null = all
```

**Layout:**
```
Page title: "Quản lý khuyến mãi"
Filter tabs: [Tất cả] [Đang hoạt động] [Đã tắt]
"+ Tạo khuyến mãi" button (pink gradient)
```

**Promotions table:**
```
Columns: Tên KM | Loại | Giá trị | Đơn tối thiểu | Thời hạn | Trạng thái | Thao tác

Type display:
  PERCENTAGE:  "Giảm {value}%"        badge: bg-blue-100 text-blue-700
  FIXED_AMOUNT: "Giảm {formatVND(value)}" badge: bg-purple-100 text-purple-700

isActive badge:
  true:  bg-green-100 text-green-700 "Đang hoạt động"
  false: bg-gray-100 text-gray-500 "Đã tắt"

Thời hạn: "{formatDate(startDate)} → {formatDate(endDate)}"

Actions:
  "Sửa" → opens edit Dialog
  "Tắt" (if active) → promotionService.deactivate(id) with confirm
```

**Create/Edit Dialog:**
```
Fields:
  - Tên khuyến mãi: Input (required)
  - Loại giảm giá: Select [Phần trăm (%) | Số tiền cố định (₫)]
  - Giá trị giảm: Input number
    - If PERCENTAGE: append "%" placeholder, max 100
    - If FIXED_AMOUNT: format as VND
  - Giảm tối đa (maxDiscountCap): Input number (for PERCENTAGE only)
  - Đơn hàng tối thiểu (minOrderValue): Input number
  - Ngày bắt đầu: Input date (required)
  - Ngày kết thúc: Input date (required, must be > startDate)
  - Trạng thái: Toggle switch (isActive)

Validation:
  - endDate > startDate
  - value > 0
  - If PERCENTAGE: value ≤ 100

Submit: promotionService.create(data) or promotionService.update(id, data)
Error 409: "Đã có khuyến mãi cùng loại đang hoạt động"
```

---

### 5.3 `src/app/coupons/page.tsx` — Quản lý coupon
**Design source:** `src\app\pages\CouponsManagement.tsx`

**State:**
```typescript
const [coupons, setCoupons] = useState<Coupon[]>([]);
const [promotions, setPromotions] = useState<Promotion[]>([]); // for dropdown
const [showForm, setShowForm] = useState(false);
const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
```

**Load both on mount:**
```typescript
useEffect(() => {
  Promise.all([
    couponService.getAll({ page: 0, size: 50 }),
    promotionService.getAll({ isActive: true }),
  ]).then(([couponsData, promotionsData]) => {
    setCoupons(couponsData.content);
    setPromotions(promotionsData.content);
  });
}, []);
```

**Layout:**
```
Page title: "Quản lý mã coupon"
"+ Tạo coupon" button (pink gradient)
```

**Coupons table:**
```
Columns: Mã coupon | Khuyến mãi | Đã dùng / Tổng | Mỗi KH tối đa | Trạng thái | Thao tác

Usage progress bar:
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div className="bg-pink-500 h-2 rounded-full"
         style={{ width: `${(coupon.usedCount / coupon.maxUsageTotal) * 100}%` }} />
  </div>
  "{coupon.usedCount} / {coupon.maxUsageTotal}"
  Red if > 90% used.

isActive badge: same pattern as promotions

Actions:
  "Sửa" → opens edit Dialog
  Toggle active/inactive
```

**Create/Edit Dialog:**
```
Fields:
  - Mã coupon: Input (required, uppercase auto-transform, no spaces)
  - Khuyến mãi áp dụng: Select from active promotions
  - Tổng lượt dùng tối đa (maxUsageTotal): Input number
  - Lượt dùng tối đa/khách (maxUsagePerCustomer): Input number
  - Trạng thái: Toggle switch (isActive)

Submit: couponService.create(data) or couponService.update(id, data)
```

---

### 5.4 `src/app/revenue-report/page.tsx` — Báo cáo doanh thu
**Design source:** `src\app\pages\RevenueReport.tsx`

**State:**
```typescript
const [startDate, setStartDate] = useState<string>(
  new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]  // 7 days ago
);
const [endDate, setEndDate] = useState<string>(
  new Date().toISOString().split("T")[0]  // today
);
const [reportData, setReportData] = useState<RevenueReportData[] | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [isAsync, setIsAsync] = useState(false);  // true if > 31 days
const [asyncJobId, setAsyncJobId] = useState<string | null>(null);
```

**Layout:**
```
Page title: "Báo cáo doanh thu"

Date range picker row:
  "Từ ngày:" [date input]  "Đến ngày:" [date input]
  "Xem báo cáo" button (pink)
  
  Validation:
    - endDate ≥ startDate
    - Max range display: if > 31 days, show async warning banner
```

**Async warning (if range > 31 days):**
```
⚠️ amber banner:
"Khoảng thời gian > 31 ngày. Báo cáo sẽ được xử lý bất đồng bộ 
và bạn sẽ nhận thông báo khi hoàn tất."
Button: "Yêu cầu báo cáo" → reportService.requestAsyncRevenue({ startDate, endDate })
→ toast.success("Đã gửi yêu cầu! Bạn sẽ nhận thông báo khi báo cáo sẵn sàng.")
```

**Generate report (≤ 31 days):**
```typescript
async function handleGenerateReport() {
  const daysDiff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000;
  if (daysDiff > 31) { setIsAsync(true); return; }
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
```

**Report display (when data loaded):**
```
Summary KPI row (3 cards):
  - Tổng doanh thu: sum(data.totalRevenue)      (icon TrendingUp, pink)
  - Tổng đơn hàng: sum(data.orderCount)          (icon ShoppingBag, blue)
  - TB đơn hàng: total / orders                  (icon BarChart, green)

Revenue chart (bar chart — Recharts):
  X-axis: date | Y-axis: totalRevenue (VND)
  Bar: fill="#DB2777" (pink-600)
  Tooltip: format VND

  import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={reportData}>
      <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString("vi-VN")} />
      <YAxis tickFormatter={v => (v / 1000000).toFixed(1) + "M"} />
      <Tooltip formatter={(v: number) => formatVND(v)} />
      <Bar dataKey="totalRevenue" fill="#DB2777" radius={[4,4,0,0]} />
    </BarChart>
  </ResponsiveContainer>

Top products table (from last day's data or aggregated):
  Columns: # | Tên sản phẩm | Số lượng bán | Doanh thu
  Top 10 by revenue

Export button: "Xuất CSV" (download logic):
  const csv = [
    ["Ngày", "Doanh thu", "Số đơn", "TB đơn"].join(","),
    ...reportData.map(d => [d.date, d.totalRevenue, d.orderCount, d.averageOrderValue].join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `bao-cao-${startDate}-${endDate}.csv`; a.click();
```

**Empty/loading states:**
```
Loading: skeleton cards (3) + skeleton chart (300px height)
No data: "Chọn khoảng thời gian và nhấn 'Xem báo cáo'"
  BarChart icon w-16 h-16 text-gray-300 + message
```

---

### 5.5 `src/app/inventory-report/page.tsx` — Báo cáo tồn kho
**Design source:** `src\app\pages\InventoryReport.tsx`

**State:**
```typescript
const [reportData, setReportData] = useState<InventoryReportData | null>(null);
const [activeTab, setActiveTab] = useState<"low-stock" | "near-expiry" | "slow-moving">("low-stock");
const [isLoading, setIsLoading] = useState(true);
```

**Load on mount:**
```typescript
useEffect(() => {
  reportService.getInventoryReport()
    .then(setReportData)
    .catch(() => toast.error("Không thể tải báo cáo tồn kho"))
    .finally(() => setIsLoading(false));
}, []);
```

**Layout:**
```
Page title: "Báo cáo tồn kho"
"Cập nhật" button → reload

Summary row (3 stat cards):
  - Sản phẩm tồn kho thấp:    {reportData?.lowStockItems.length ?? 0}   (red)
  - Sản phẩm sắp hết hạn:     {reportData?.nearExpiryItems.length ?? 0} (amber)
  - Sản phẩm chậm luân chuyển: {reportData?.slowMovingItems.length ?? 0} (blue)
```

**Tabs (shadcn/ui Tabs):**
```
Tab 1 — "Tồn kho thấp" (red badge with count):
  Table: Sản phẩm | SKU | Tồn kho | Ngưỡng | % còn lại
  % còn lại = (quantity / minThreshold * 100).toFixed(0) + "%"
  Red progress bar showing qty vs threshold

Tab 2 — "Sắp hết hạn" (amber badge):
  Table: Sản phẩm | SKU | HSD | Tồn kho | Còn lại
  Còn lại: số ngày đến HSD
  Color: red if ≤ 7 days, amber if ≤ 30 days

Tab 3 — "Chậm luân chuyển" (blue badge):
  Table: Sản phẩm | SKU | Tồn kho | Lần bán cuối
  Lần bán cuối: "Chưa bán" if null; else formatDate
  Blue text if > 30 days
```

---

## 6. Shared Helper Utilities

Add to `src/lib/utils.ts` (or create `src/lib/format.ts`):
```typescript
// These should be available across all Wave 4 pages

export const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

export const daysBetween = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};
```

---

## 7. Business Rules

```
PROMOTIONS:
  1. Không được có 2 KM cùng loại (PERCENTAGE hoặc FIXED_AMOUNT) cùng phạm vi active đồng thời
     Backend returns 409 — show friendly error: "Đã có khuyến mãi cùng loại đang hoạt động"
  2. endDate phải sau startDate — validate client-side
  3. PERCENTAGE value: 0 < value ≤ 100
  4. FIXED_AMOUNT value: > 0

COUPONS:
  1. maxUsagePerCustomer ≤ maxUsageTotal
  2. Coupon code: unique (backend enforce 409)
  3. Chỉ tạo coupon cho promotion đang active

REPORTS:
  1. ≤ 31 ngày: sync API (≤ 2s response)
  2. > 31 ngày: async → user gets notification when ready (REPORT_READY type)
  3. Dashboard DB fail → show empty ({}), NOT error toast
  4. Revenue data is pre-aggregated — no raw transaction queries

LOYALTY:
  1. Points are EARN, REDEEM, or REFUND — never negative balance
  2. Point history is append-only (no edit/delete)
```

---

## 8. Implementation Order

1. `src/services/promotion.service.ts` (new)
2. Update `src/services/loyalty.service.ts` (add getAll + getPointHistory)
3. Update `src/services/report.service.ts` (add full revenue + inventory methods)
4. `src/app/promotions/page.tsx`
5. `src/app/coupons/page.tsx` (depends on promotions list for dropdown)
6. `src/app/loyalty/members/page.tsx`
7. `src/app/revenue-report/page.tsx`
8. `src/app/inventory-report/page.tsx`
