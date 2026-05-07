# CODEX PROMPT — Wave 3: Catalog + Inventory

## IMPORTANT: Read this entire document before writing a single line of code.

---

## 1. Project Context

**BeautyERP FE** — internal ERP. Wave 3 implements catalog management, inventory, dashboards, and manager approval flows.

**Wave 1 and Wave 2 must be complete.** ERPLayout, all sidebars, Header, and POS pages must exist.

### Already implemented — DO NOT modify:
- Everything from Wave 1 + Wave 2
- `src/services/loyalty.service.ts`, `coupon.service.ts` (from Wave 2)

---

## 2. Files to Implement

### New service files:
```
src/services/category.service.ts
src/services/inventory.service.ts
src/services/purchaseOrder.service.ts
src/services/supplier.service.ts
```

### New page files:
```
src/app/admin/page.tsx
src/app/branch-manager/page.tsx
src/app/warehouse/page.tsx
src/app/products/page.tsx
src/app/products/create/page.tsx
src/app/products/[id]/edit/page.tsx
src/app/categories/page.tsx
src/app/inventory/stock/page.tsx
src/app/inventory/purchase-orders/page.tsx
src/app/inventory/purchase-orders/create/page.tsx
src/app/inventory/receive/[poId]/page.tsx
src/app/inventory/adjustments/page.tsx
src/app/manager/orders/page.tsx
src/app/manager/inventory/page.tsx
src/app/manager/products/page.tsx
src/app/supplier-management/page.tsx
```

---

## 3. Design Source — MANDATORY

| File to implement | Source design file |
|------------------|--------------------|
| `admin/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\AdminDashboard.tsx` |
| `branch-manager/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\BranchManagerDashboard.tsx` |
| `warehouse/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\WarehouseStaffDashboard.tsx` |
| `products/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\ProductList.tsx` |
| `products/create/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\CreateEditProduct.tsx` |
| `products/[id]/edit/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\CreateEditProduct.tsx` |
| `categories/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\CategoryManagement.tsx` |
| `inventory/stock/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\InventoryStock.tsx` |
| `inventory/purchase-orders/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\PurchaseOrderList.tsx` |
| `inventory/purchase-orders/create/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\CreatePurchaseOrder.tsx` |
| `inventory/receive/[poId]/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\ReceiveGoods.tsx` |
| `inventory/adjustments/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\InventoryAdjustments.tsx` |
| `manager/orders/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\manager\ManagerOrders.tsx` |
| `manager/inventory/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\manager\ManagerInventory.tsx` |
| `manager/products/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\manager\ManagerProducts.tsx` |
| `supplier-management/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\SupplierManagement.tsx` |

**Read each source file completely before implementing.**

---

## 4. New Services to Implement

### 4.1 `src/services/category.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, Category } from "@/types";

export const categoryService = {
  // GET /catalog/categories — returns full tree (2 levels)
  getAll: async (): Promise<Category[]> => {
    const res = await api.get<ApiResponse<Category[]>>(`/catalog/categories`);
    return res.data.data;
  },

  create: async (data: { name: string; parentId?: string | null }): Promise<Category> => {
    const res = await api.post<ApiResponse<Category>>(`/catalog/categories`, data);
    return res.data.data;
  },

  update: async (id: string, data: { name: string }): Promise<Category> => {
    const res = await api.put<ApiResponse<Category>>(`/catalog/categories/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/catalog/categories/${id}`);
  },
};
```

### 4.2 `src/services/inventory.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, InventoryStock, PaginatedResponse } from "@/types";

export const inventoryService = {
  // GET /inventory/stock?page=&size=&branchId= (branchId injected by backend from JWT)
  getStock: async (params?: { page?: number; size?: number; search?: string }) => {
    const res = await api.get<PaginatedResponse<InventoryStock>>(`/inventory/stock`, { params });
    return res.data.data;
  },

  getStockByProduct: async (productId: string): Promise<InventoryStock> => {
    const res = await api.get<ApiResponse<InventoryStock>>(`/inventory/stock/${productId}`);
    return res.data.data;
  },

  // POST /inventory/adjustments — record damaged/lost/expired
  createAdjustment: async (data: {
    productId: string;
    quantity: number;
    type: "DAMAGED" | "LOST" | "EXPIRED";
    description: string;
  }) => {
    const res = await api.post<ApiResponse<any>>(`/inventory/adjustments`, data);
    return res.data.data;
  },

  // GET /inventory/adjustments — pending requests for BM
  getPendingAdjustments: async (params?: { page?: number; size?: number }) => {
    const res = await api.get(`/inventory/adjustments`, { params });
    return res.data.data;
  },

  approveAdjustment: async (id: string): Promise<void> => {
    await api.post(`/inventory/adjustments/${id}/approve`);
  },

  rejectAdjustment: async (id: string): Promise<void> => {
    await api.post(`/inventory/adjustments/${id}/reject`);
  },
};
```

### 4.3 `src/services/purchaseOrder.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, PurchaseOrder, PaginatedResponse, POItem } from "@/types";

export const purchaseOrderService = {
  getAll: async (params?: { page?: number; size?: number; status?: string }) => {
    const res = await api.get<PaginatedResponse<PurchaseOrder>>(`/inventory/purchase-orders`, { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.get<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders/${id}`);
    return res.data.data;
  },

  create: async (data: {
    supplierId: string;
    items: { productId: string; orderedQty: number; unitPrice: number }[];
  }): Promise<PurchaseOrder> => {
    const res = await api.post<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders`, data);
    return res.data.data;
  },

  confirm: async (id: string): Promise<void> => {
    await api.post(`/inventory/purchase-orders/${id}/confirm`);
  },

  // POST /inventory/purchase-orders/{id}/receive
  receive: async (
    id: string,
    items: { productId: string; receivedQty: number; lotNumber?: string; expiryDate?: string }[]
  ): Promise<void> => {
    await api.post(`/inventory/purchase-orders/${id}/receive`, { items });
  },

  cancel: async (id: string): Promise<void> => {
    await api.post(`/inventory/purchase-orders/${id}/cancel`);
  },
};
```

### 4.4 `src/services/supplier.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, Supplier } from "@/types";

export const supplierService = {
  getAll: async (params?: { page?: number; size?: number; search?: string }) => {
    const res = await api.get(`/inventory/suppliers`, { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Supplier> => {
    const res = await api.get<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`);
    return res.data.data;
  },

  create: async (data: Omit<Supplier, "id">): Promise<Supplier> => {
    const res = await api.post<ApiResponse<Supplier>>(`/inventory/suppliers`, data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.put<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`, data);
    return res.data.data;
  },
};
```

---

## 5. Page Specs

All pages: `"use client"` + `<ERPLayout>` wrapper.

---

### 5.1 Dashboard Pages

#### `src/app/admin/page.tsx` — Admin Dashboard
**Design source:** `src\app\pages\AdminDashboard.tsx`

**API:** `GET /report/dashboard` → returns DashboardData

```typescript
const [dashboard, setDashboard] = useState<DashboardData | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  reportService.getDashboard()
    .then(setDashboard)
    .catch(() => setDashboard(null)) // graceful degradation — show empty, not error
    .finally(() => setIsLoading(false));
}, []);
```

**Layout:**
```
Page title: "Tổng quan hệ thống" + today's date

KPI row (4 cards, grid-cols-4):
  1. Doanh thu hôm nay:     {formatVND(dashboard?.totalRevenue ?? 0)}   | accent: pink-600
  2. Số đơn hàng:            {dashboard?.totalOrders ?? 0}               | accent: blue-600
  3. Giá trị đơn trung bình: {formatVND(dashboard?.averageOrderValue ?? 0)} | accent: green-600
  4. Tăng trưởng:            {dashboard?.revenueGrowth ?? 0}%            | accent: amber-600
     (green if > 0, red if < 0, arrow icon)

Middle row (grid-cols-3):
  - Revenue chart (span 2): RevenueChart component — bar chart 7 ngày
  - Top products (span 1): table top 5 (rank, tên, qty bán)

Bottom: AlertsPanel — low stock warnings (placeholder: "Không có cảnh báo nào")
```

**KPI Card component pattern:**
```tsx
function KPICard({ label, value, accent, icon: Icon, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
             style={{ backgroundColor: accent + "20" }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <p className={`text-sm mt-2 flex items-center gap-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(trend)}% so với hôm qua
        </p>
      )}
    </div>
  );
}
```

---

#### `src/app/branch-manager/page.tsx` — Branch Manager Dashboard
**Design source:** `src\app\pages\BranchManagerDashboard.tsx`

Same KPI structure as admin dashboard but filtered to branch. Same graceful degradation pattern.

Add pending approvals summary:
```
PendingApprovalsPanel:
  - "Đơn hàng chờ duyệt hủy": N đơn → link /manager/orders
  - "Điều chỉnh kho chờ duyệt": N yêu cầu → link /manager/inventory
```

---

#### `src/app/warehouse/page.tsx` — Warehouse Dashboard
**Design source:** `src\app\pages\WarehouseStaffDashboard.tsx`

Key metrics:
```
KPI row (3 cards):
  - Số sản phẩm tồn kho thấp (qty ≤ threshold)
  - PO đang CONFIRMED (chờ nhận hàng)
  - Tổng sản phẩm đang quản lý

Quick links:
  - "Xem tồn kho" → /inventory/stock
  - "Tạo Purchase Order" → /inventory/purchase-orders/create
  - "Nhận hàng" → /inventory/purchase-orders (filter CONFIRMED)
  - "Ghi hàng hỏng" → /inventory/adjustments
```

---

### 5.2 Catalog Management

#### `src/app/products/page.tsx` — Danh sách sản phẩm
**Design source:** `src\app\pages\ProductList.tsx`

**State:**
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [search, setSearch] = useState("");
const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
const [statusFilter, setStatusFilter] = useState<ProductStatus | "ALL">("ALL");
const [page, setPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);
const [categories, setCategories] = useState<Category[]>([]);
```

**Load products with debounce 300ms on search:**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    productService.search({
      q: search || undefined,
      categoryId: categoryFilter !== "ALL" ? categoryFilter : undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      page,
      size: 20,
    }).then(result => {
      setProducts(result.content);
      setTotalPages(result.totalPages);
    });
  }, 300);
  return () => clearTimeout(timer);
}, [search, categoryFilter, statusFilter, page]);
```

**Filters bar:**
```
Search input (icon Search, debounce 300ms)
Category select: [Tất cả danh mục | ...categories]
Status select: [Tất cả | Đang bán | Ngừng bán]
"+ Thêm sản phẩm" button (pink gradient) → /products/create
```

**Products table:**
```
Columns: Ảnh | Tên / SKU | Danh mục | Giá bán | Giá vốn | Trạng thái | Thao tác

Image: w-12 h-12 rounded-lg object-cover (use productService.getImageUrl(filename))

Status badge:
  ACTIVE: bg-green-100 text-green-700 "Đang bán"
  DISCONTINUED: bg-gray-100 text-gray-500 "Ngừng bán"

Warning (if costPrice > sellingPrice):
  ⚠️ amber badge "Giá vốn > Giá bán"

Actions:
  "Sửa" → /products/{id}/edit
  "Ngừng KD" (red text button) → productService.discontinue(id) → confirm dialog first
```

---

#### `src/app/products/create/page.tsx` — Tạo sản phẩm
**Design source:** `src\app\pages\CreateEditProduct.tsx`

**Form fields:**
```
Tên sản phẩm:  Input (required)
SKU:           Input (required, unique)
Barcode:       Input (EAN-13 or Code-128 format)
Danh mục:      Select (from categoryService.getAll())
Giá bán:       Input type=number (required)
Giá vốn:       Input type=number
Ngày hết hạn:  Input type=date (must be future date)
Mô tả:         Textarea
Ảnh sản phẩm:  File upload (multiple, image/* only)

Warnings (inline, non-blocking):
  - If costPrice > sellingPrice: ⚠️ "Giá vốn lớn hơn giá bán"
  - If expiryDate < today + 30 days: ⚠️ "Sản phẩm sắp hết hạn"
```

**Submit with multipart/form-data:**
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const formData = new FormData();
  formData.append("name", name);
  formData.append("sku", sku);
  formData.append("barcode", barcode);
  formData.append("categoryId", categoryId);
  formData.append("sellingPrice", sellingPrice.toString());
  if (costPrice) formData.append("costPrice", costPrice.toString());
  if (expiryDate) formData.append("expiryDate", expiryDate);
  if (description) formData.append("description", description);
  images.forEach(img => formData.append("images", img));
  
  try {
    await productService.create(formData);
    toast.success("Tạo sản phẩm thành công!");
    router.push("/products");
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? "Tạo sản phẩm thất bại");
  }
}
```

---

#### `src/app/products/[id]/edit/page.tsx` — Sửa sản phẩm

Same form as create, but pre-populated. Load product on mount:
```typescript
const product = await productService.getById(id);
// pre-fill form fields from product data
```
Submit calls `productService.update(id, formData)`.

---

#### `src/app/categories/page.tsx` — Quản lý danh mục
**Design source:** `src\app\pages\CategoryManagement.tsx`

**UI — Tree view (2 levels):**
```
Parent category row (bg-gray-50):
  - Name (font-semibold) | "Thêm danh mục con" | "Sửa" | "Xóa"
  - Expand/collapse arrow

  Child category row (pl-8, indented):
    - Name | "Sửa" | "Xóa"

"+ Thêm danh mục cha" button at bottom
```

**Create/Edit via Dialog (shadcn/ui):**
```
Dialog fields:
  - "Tên danh mục" Input (required)
  - "Danh mục cha" Select (if creating child) — or empty if root
Submit: categoryService.create() or categoryService.update()
```

**Delete validation:**
- Backend returns 409 if category has products
- Show friendly error: "Không thể xóa danh mục đang có sản phẩm"
- Dialog confirm before delete

---

### 5.3 Inventory Management

#### `src/app/inventory/stock/page.tsx` — Tồn kho
**Design source:** `src\app\pages\InventoryStock.tsx`

```
Search input + filter

Stock table:
  Columns: Sản phẩm | SKU | Tồn kho | Ngưỡng tối thiểu | Trạng thái | Thao tác
  
  Status badge:
    qty > minThreshold:     bg-green-100 text-green-700 "Bình thường"
    qty ≤ minThreshold:     bg-red-100 text-red-700 "Tồn kho thấp" + ⚠️ icon
    qty === 0:              bg-gray-100 text-gray-500 "Hết hàng"
  
  Actions:
    "Điều chỉnh" button → opens inline form or navigates to /inventory/adjustments
```

---

#### `src/app/inventory/purchase-orders/page.tsx` — Danh sách PO
**Design source:** `src\app\pages\PurchaseOrderList.tsx`

```
Filter: Status select [Tất cả | PENDING | CONFIRMED | FULLY_RECEIVED | PARTIALLY_RECEIVED | CANCELLED]
"+ Tạo PO" button → /inventory/purchase-orders/create

PO table:
  Columns: Mã PO | Nhà cung cấp | Ngày tạo | Tổng tiền | Trạng thái | Thao tác

Status badges:
  PENDING:           bg-yellow-100 text-yellow-700
  CONFIRMED:         bg-blue-100 text-blue-700
  FULLY_RECEIVED:    bg-green-100 text-green-700
  PARTIALLY_RECEIVED: bg-orange-100 text-orange-700
  CANCELLED:         bg-gray-100 text-gray-500

Actions:
  [CONFIRMED] → "Nhận hàng" button → /inventory/receive/{poId}
  [PENDING] → "Xem chi tiết" | "Hủy PO" (BM/ADMIN only)
  All: "Chi tiết" link
```

---

#### `src/app/inventory/purchase-orders/create/page.tsx` — Tạo PO
**Design source:** `src\app\pages\CreatePurchaseOrder.tsx`

```
Step 1 — Select supplier:
  Supplier dropdown (from supplierService.getAll())
  Selected: show supplier info card

Step 2 — Add items:
  Product search (productService.search)
  Click product → add row to items table:
    [Product name + SKU] | Qty ordered (input) | Unit price (input) | Subtotal | [Remove]
  Running total at bottom

Submit: purchaseOrderService.create({ supplierId, items })
Success: toast + redirect to /inventory/purchase-orders
```

---

#### `src/app/inventory/receive/[poId]/page.tsx` — Nhận hàng
**Design source:** `src\app\pages\ReceiveGoods.tsx`

```
Load PO by poId. Only CONFIRMED POs can receive.

For each PO item in a table:
  [Product name + SKU] | Qty đặt | Qty nhận (input, ≤ orderedQty) | Số lô | HSD (date)

Validation:
  - HSD: must be future date; warn if < 30 days from now
  - receivedQty: 0 ≤ qty ≤ orderedQty

Submit button "Xác nhận nhận hàng":
  purchaseOrderService.receive(poId, items)
  Success: toast "Đã nhận hàng thành công!" + redirect to PO list
```

---

#### `src/app/inventory/adjustments/page.tsx` — Ghi hàng hỏng/thất thoát
**Design source:** `src\app\pages\InventoryAdjustments.tsx`

**Two sections:**

*Section A — Create new adjustment:*
```
Product search → select product → show current stock
Form fields:
  - Số lượng: Input number (required)
  - Loại: Select [DAMAGED: Hàng hỏng | LOST: Hàng thất thoát | EXPIRED: Hàng hết hạn]
  - Mô tả: Textarea (required — always)
  - Live preview: "Tỷ lệ: {qty}/{currentStock} = {percent}%"
  - Warning if > 10%: ⚠️ "Yêu cầu này sẽ cần Branch Manager phê duyệt"

Submit: inventoryService.createAdjustment(data)
  - Success message varies:
    - ≤ 10%: "Điều chỉnh kho thành công!"
    - > 10%: "Đã gửi yêu cầu điều chỉnh, đang chờ Branch Manager phê duyệt"
```

*Section B — Pending approvals (BRANCH_MANAGER only):*
```
Table of PENDING adjustment requests:
  Columns: Sản phẩm | Qty | % tồn kho | Loại | Mô tả | Người tạo | Thao tác

Actions:
  "Phê duyệt" (green) → inventoryService.approveAdjustment(id)
  "Từ chối" (red)     → inventoryService.rejectAdjustment(id)
```

Role check:
```typescript
const user = useAuthStore(s => s.user);
const showApprovalSection = user?.role === "BRANCH_MANAGER" || user?.role === "ADMIN";
```

---

### 5.4 Manager Approval Pages

#### `src/app/manager/orders/page.tsx` — Duyệt hủy đơn
**Design source:** `src\app\pages\manager\ManagerOrders.tsx`

```
Page title: "Phê duyệt hủy đơn hàng"

Table of cancel requests (PENDING):
  Columns: Mã đơn | Cashier | Thời gian | Tổng tiền | Lý do hủy | Thao tác

Order value > 500k highlighted in amber.

Actions per row:
  "Phê duyệt" → orderService.approveCancel(orderId) → confirm dialog
  "Từ chối"   → orderService.rejectCancel(orderId) → confirm dialog with reason input
  "Xem đơn"   → /orders/{orderId}

Empty state: "Không có yêu cầu hủy đơn nào đang chờ phê duyệt"
```

**Load pending cancellations:**
```typescript
// GET /order/orders/branch/{branchId}?status=PENDING_CANCEL (or similar endpoint)
// Backend filters by branch from JWT — branchId from user state
const user = useAuthStore(s => s.user);
// branchId null → ADMIN sees all; not null → BM sees own branch
const orders = await orderService.getByBranch(user?.branchId ?? "", { status: "PENDING_CANCEL" });
```

---

#### `src/app/manager/inventory/page.tsx` — Duyệt điều chỉnh kho
**Design source:** `src\app\pages\manager\ManagerInventory.tsx`

```
Similar to inventory/adjustments Section B — just the approval queue.
Table of PENDING adjustment requests with Approve/Reject actions.
```

---

#### `src/app/manager/products/page.tsx` — Quản lý sản phẩm (BM view)
**Design source:** `src\app\pages\manager\ManagerProducts.tsx`

Same as `/products/page.tsx` but accessible from BM sidebar.

---

### 5.5 `src/app/supplier-management/page.tsx` — Nhà cung cấp
**Design source:** `src\app\pages\SupplierManagement.tsx`

```
Search input + "Thêm nhà cung cấp" button

Supplier table:
  Columns: Tên | Mã số thuế | SĐT | Địa chỉ | Thao tác
  Actions: "Sửa" (opens edit Dialog) | "Xem PO" → /inventory/purchase-orders?supplierId=

Create/Edit Dialog:
  Fields: Tên (required) | Mã số thuế | SĐT | Địa chỉ
  Submit: supplierService.create() or supplierService.update()
```

---

## 6. Reusable Patterns

**Status badge component:**
```tsx
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    DISCONTINUED: "bg-gray-100 text-gray-500",
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    FULLY_RECEIVED: "bg-green-100 text-green-700",
    PARTIALLY_RECEIVED: "bg-orange-100 text-orange-700",
    CANCELLED: "bg-gray-100 text-gray-500",
    COMPLETED: "bg-green-100 text-green-700",
    // ...
  };
  const label: Record<string, string> = {
    ACTIVE: "Đang bán", DISCONTINUED: "Ngừng bán",
    PENDING: "Chờ xử lý", CONFIRMED: "Đã xác nhận",
    FULLY_RECEIVED: "Đã nhận đủ", PARTIALLY_RECEIVED: "Nhận thiếu",
    CANCELLED: "Đã hủy", COMPLETED: "Hoàn thành",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {label[status] ?? status}
    </span>
  );
}
```

**Confirm dialog:**
```tsx
// Use shadcn/ui AlertDialog for all destructive actions
<AlertDialog>
  <AlertDialogTrigger asChild><Button variant="destructive">Xóa</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
      <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Hủy</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Xác nhận</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Pagination:**
```tsx
<div className="flex items-center justify-between mt-4">
  <p className="text-sm text-gray-500">Trang {page + 1} / {totalPages}</p>
  <div className="flex gap-2">
    <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
      Trước
    </Button>
    <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
      Sau
    </Button>
  </div>
</div>
```

---

## 7. Important Business Rules

```
1. Category: max 2 levels — no grandchildren
2. Product.sellingPrice warning (not block) if < costPrice
3. Product.expiryDate: must be future; warn if < 30 days from today
4. Product create: atomic — if image upload fails, entire create fails (backend handles)
5. PO can only receive if status = CONFIRMED
6. Adjustment > 10% of current stock → request PENDING (not immediate)
7. Cancel approval page: only shows PENDING cancel requests (backend filters by role+branch)
8. BM cannot see other branches' data (backend enforces via JWT branchId)
9. ADMIN sees all branches (branchId = null → no filter)
```

---

## 8. Report Service (stub for dashboards)

Create a minimal `src/services/report.service.ts` for dashboard use:
```typescript
import api from "@/lib/axios";
import type { ApiResponse, DashboardData } from "@/types";

export const reportService = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await api.get<ApiResponse<DashboardData>>(`/report/dashboard`);
    return res.data.data;
  },
  // Full implementation in Wave 4
};
```

---

## 9. Implementation Order

1. Services (category, inventory, purchaseOrder, supplier, report stub)
2. `admin/page.tsx` + `branch-manager/page.tsx` + `warehouse/page.tsx` (dashboards)
3. `categories/page.tsx` (simple CRUD tree)
4. `products/page.tsx` → `products/create/page.tsx` → `products/[id]/edit/page.tsx`
5. `inventory/stock/page.tsx` → `inventory/adjustments/page.tsx`
6. `inventory/purchase-orders/page.tsx` → `inventory/purchase-orders/create/page.tsx` → `inventory/receive/[poId]/page.tsx`
7. `manager/orders/page.tsx` → `manager/inventory/page.tsx` → `manager/products/page.tsx`
8. `supplier-management/page.tsx`
