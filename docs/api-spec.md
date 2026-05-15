# API Integration Spec — BeautyERP Frontend

> **Base URL:** `http://localhost:8080/api/v1`  
> **Auth:** JWT trong httpOnly cookie `jwt` (set bởi backend, không đọc được từ JS)  
> **Axios instance:** `@/lib/axios` — `withCredentials: true`, 401 → redirect `/login`  
> **Response format:** `{ success: boolean, data: T, message?: string }`  
> **Cập nhật:** 2026-05-16 — sửa gateway prefix loyalty-promotion và notification-audit  
> **Context path từng service được gateway route:**

| Service | Gateway prefix |
|---------|----------------|
| auth-service | `/auth` |
| catalog-service | `/catalog` |
| order-service | `/order` |
| inventory-service | `/inventory` |
| loyalty-promotion-service | `/loyalty-promotion` ⚠️ *(trước đây ghi sai là `/loyalty`)* |
| report-service | `/report` |
| notification-audit-service | `/notification-audit` ⚠️ *(trước đây ghi sai là `/notification`)* |

---

## 1. Auth Service — `/auth`

### 1.1 Authentication

```
POST /auth/login
  Body: { username: string, password: string }
  Returns: { userId, fullName, role, branchId, forceChangePassword }
  Cookie: jwt được set bởi backend
  Dùng: auth.store.ts → login()

POST /auth/logout
  Returns: void
  Action: backend xóa cookie, blacklist JWT
  Dùng: auth.store.ts → logout()

POST /auth/change-password
  Auth: AUTHENTICATED
  Body: { currentPassword: string, newPassword: string }
  Returns: void
  Pages: /change-password, /force-change-password
```

### 1.2 Account Management (ADMIN only)

```
POST /auth/accounts
  Auth: ADMIN
  Body: { username, password, fullName, role, branchId? }
  Returns: AccountResponse
  Page: /user-management (modal tạo)

GET /auth/accounts
  Auth: ADMIN
  Returns: AccountResponse[]
  Page: /user-management (table)

GET /auth/accounts/{id}
  Auth: ADMIN
  Returns: AccountResponse
  
PUT /auth/accounts/{id}
  Auth: ADMIN
  Body: { fullName?, role?, branchId? }
  Returns: AccountResponse
  Note: Role change có hiệu lực từ phiên đăng nhập tiếp theo

DELETE /auth/accounts/{id}
  Auth: ADMIN
  Action: soft-delete (giữ lịch sử giao dịch)
  Returns: void

PATCH /auth/accounts/{id}/unlock
  Auth: ADMIN
  Action: is_locked = false, reset failed_attempt_count
  Returns: void
  Page: /user-management (nút Unlock)
```

### 1.3 System Configuration (ADMIN only)

```
GET /auth/system-configs
  Auth: ADMIN
  Returns: SystemConfigResponse[]  [{ key, value, description }]
  Page: /system-configuration

GET /auth/system-configs/{key}
  Auth: ADMIN
  Returns: SystemConfigResponse

PUT /auth/system-configs/{key}
  Auth: ADMIN
  Body: { value: string }
  Action: update DB + delete Redis cache → hiệu lực ngay
  Returns: SystemConfigResponse
  Page: /system-configuration (inline edit)

Config keys:
  loyalty.points_rate          → mặc định "10000"
  loyalty.redeem_rate          → mặc định "100"
  loyalty.max_redeem_percent   → mặc định "50"
  inventory.default_min_threshold  → mặc định "10"
  inventory.expiry_alert_days  → mặc định "7"
  inventory.slow_moving_days   → mặc định "30"
  order.cancel_approval_threshold  → mặc định "500000"
  inventory.large_adjustment_percent → mặc định "10"
```

---

## 2. Catalog Service — `/catalog`

### 2.1 Product

```
GET /catalog/products/search
  Auth: ALL (public cho FE)
  Params: q?, categoryId?, status?, page=0, size=20
  Returns: PagedProductResponse { content: Product[], totalPages, totalElements }
  Page: /products, /pos/order (search realtime)
  Note: debounce 300ms ở FE; cache Redis 5 phút phía backend

GET /catalog/products/{id}
  Auth: ALL
  Returns: ProductResponse
  Page: /products/[id]/edit

POST /catalog/products
  Auth: ADMIN, BRANCH_MANAGER
  Content-Type: multipart/form-data
  Body: productRequest (JSON blob) + image file (optional)
  Returns: ProductResponse
  Note: upload ảnh thất bại → backend rollback bản ghi
  Page: /products/create

PUT /catalog/products/{id}
  Auth: ADMIN, BRANCH_MANAGER
  Content-Type: multipart/form-data
  Body: productRequest (JSON blob) + image (optional)
  Returns: ProductResponse
  Page: /products/[id]/edit

DELETE /catalog/products/{id}
  Auth: ADMIN, BRANCH_MANAGER
  Action: soft-delete (ẩn ở mọi query)
  Returns: void

GET /catalog/products/images/{filename}
  Auth: ALL
  Returns: image file (Resource)
  Dùng: img src="/api/v1/catalog/products/images/{filename}"
```

**ProductResponse fields:**
```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  categoryName: string;
  costPrice: number;
  sellingPrice: number;
  description?: string;
  imageUrl?: string;
  minThreshold: number;
  expiryDate?: string;  // ISO date
  status: "ACTIVE" | "DISCONTINUED";
  quantity?: number;    // từ inventory (nếu joined)
  createdAt: string;
}
```

### 2.2 Category

```
GET /catalog/categories
  Auth: ALL
  Returns: CategoryResponse[]  (nested tree, max 2 cấp)
  { id, name, parentId?, children: CategoryResponse[] }
  Page: /categories, dropdown trong /products/create

GET /catalog/categories/{id}
  Returns: CategoryResponse

POST /catalog/categories
  Auth: ADMIN
  Body: { name: string, parentId?: string }
  Note: tên unique trong cùng cấp; tối đa 2 cấp
  Returns: CategoryResponse

PUT /catalog/categories/{id}
  Auth: ADMIN
  Body: { name?, parentId? }
  Returns: CategoryResponse

DELETE /catalog/categories/{id}
  Auth: ADMIN
  Note: lỗi 409 nếu có sản phẩm; xóa cha tự xóa con (nếu con không có SP)
  Returns: void
```

---

## 3. Order Service — `/order`

### 3.1 Orders

```
POST /order/orders
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Header: Idempotency-Key: {UUID v4}   ← BẮT BUỘC
  Body: {
    shiftId: string,
    items: [{ productId, quantity, unitPrice }],
    paymentMethod: "CASH" | "CARD" | "TRANSFER",
    memberId?: string,       // loyalty member
    pointsToRedeem?: number, // đổi điểm
    couponCode?: string,
  }
  Returns: OrderResponse { orderId, status, totalAmount, receiptUrl }
  Note: nếu tồn kho không đủ → 422 INSUFFICIENT_STOCK

GET /order/orders/{id}
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: OrderResponse (full detail với items)
  Page: /orders/[orderId]

GET /order/orders/my
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Params: date?, status?
  Returns: OrderResponse[]  (chỉ trong ca hiện tại của user)
  Page: /cashier/orders

GET /order/orders/branch/{branchId}
  Auth: BRANCH_MANAGER, ADMIN
  Params: startDate, endDate, status?
  Returns: OrderResponse[]
  Page: /manager/orders (list đơn toàn chi nhánh)

POST /order/orders/{id}/cancel
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { reason: string }
  Logic backend:
    total ≤ cancel_approval_threshold → cancel ngay, hoàn kho
    total > threshold → tạo cancel_log PENDING, notify manager
  Returns: OrderResponse

POST /order/orders/{id}/cancel/approve
  Auth: BRANCH_MANAGER, ADMIN
  Returns: OrderResponse (CANCELLED)
  Page: /manager/orders (nút Duyệt)

POST /order/orders/{id}/cancel/reject
  Auth: BRANCH_MANAGER, ADMIN
  Body: { reason: string }
  Returns: OrderResponse

GET /order/orders/receipts/{id}
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: string (PDF URL hoặc base64)
  Page: /pos/order (In hóa đơn), /cashier/orders (In lại)
```

**OrderResponse fields:**
```typescript
interface Order {
  id: string;
  shiftId: string;
  cashierName: string;
  branchId: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  pointsUsed: number;
  totalAmount: number;
  paymentMethod: string;
  status: "COMPLETED" | "CANCELLED" | "PENDING_CANCEL";
  receiptUrl: string;
  createdAt: string;
  member?: { id: string; name: string; phone: string; pointsEarned: number };
  cancelLog?: { reason: string; status: string; requestedAt: string };
}
```

### 3.2 Shifts

```
POST /order/shifts
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { openingCash: number }
  Note: chỉ mở được 1 ca OPEN tại một thời điểm
  Returns: ShiftResponse
  Page: /pos/shift (mở ca)

POST /order/shifts/{id}/close
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { closingCash: number, note?: string }
  Note: note bắt buộc nếu variance ≠ 0
  Returns: ShiftResponse
  Page: /pos/shift (đóng ca)

GET /order/shifts/current
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: ShiftResponse | null  (ca OPEN hiện tại của user)
  Page: /pos/shift, /pos/order (check ca trước khi tạo đơn)
  Note: 404 nếu không có ca OPEN

GET /order/shifts/{id}
  Returns: ShiftResponse
```

**ShiftResponse fields:**
```typescript
interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  status: "OPEN" | "CLOSED";
  openingCash: number;
  closingCash?: number;
  variance?: number;
  note?: string;
  openedAt: string;
  closedAt?: string;
  totalOrders: number;
  totalRevenue: number;
}
```

### 3.3 Returns

```
POST /order/returns
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: {
    originalOrderId?: string,  // optional nếu tìm theo SKU
    items: [{ productId, quantity, sku? }]
  }
  Note: quantity ≤ qty mua trong đơn gốc; hoàn kho RETURN transaction
  Returns: ReturnResponse
  Page: /returns/new

GET /order/returns/{id}
  Returns: ReturnResponse
```

---

## 4. Inventory Service — `/inventory`

### 4.1 Purchase Orders

```
POST /inventory/purchase-orders
  Auth: ADMIN, WAREHOUSE_STAFF
  Body: {
    supplierId: string,
    note?: string,
    items: [{ productId, orderedQty, unitCost }]
  }
  Returns: PurchaseOrderResponse (status=PENDING)
  Page: /inventory/purchase-orders/create

POST /inventory/purchase-orders/{id}/submit
  Auth: ADMIN, WAREHOUSE_STAFF
  Action: PENDING → SUBMITTED (gửi lên để BM confirm)
  Returns: PurchaseOrderResponse

POST /inventory/purchase-orders/{id}/confirm
  Auth: ADMIN, BRANCH_MANAGER
  Action: SUBMITTED → CONFIRMED
  Returns: PurchaseOrderResponse

POST /inventory/purchase-orders/{id}/cancel
  Auth: ADMIN, BRANCH_MANAGER
  Action: PENDING|SUBMITTED → CANCELLED
  Returns: PurchaseOrderResponse

POST /inventory/purchase-orders/{id}/receive
  Auth: ADMIN, WAREHOUSE_STAFF
  Body: {
    items: [{ productId, receivedQty, lotNumber?, expiryDate? }]
  }
  Action: update inventory + INSERT inventory_transactions (RECEIVE)
  Note: FULLY_RECEIVED nếu tất cả item đủ, ngược lại PARTIALLY_RECEIVED
        Nhận thiếu → publish po.received → Manager nhận notification
  Returns: PurchaseOrderResponse

GET /inventory/purchase-orders
  Auth: ADMIN, BRANCH_MANAGER, WAREHOUSE_STAFF
  Params: status?, page=0, size=20
  Returns: Page<PurchaseOrderResponse>
  Page: /inventory/purchase-orders

GET /inventory/purchase-orders/{id}
  Returns: PurchaseOrderResponse (full với items)
  Page: /inventory/receive/[poId]
```

**PurchaseOrderResponse fields:**
```typescript
interface PurchaseOrder {
  id: string;
  poNumber: string;         // "PO-20260512-0001"
  supplierId: string;
  supplierName: string;
  status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "PARTIALLY_RECEIVED" | "FULLY_RECEIVED" | "CANCELLED";
  note?: string;
  totalAmount: number;
  items: PoItem[];
  createdAt: string;
  confirmedAt?: string;
}
interface PoItem {
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  lotNumber?: string;
  expiryDate?: string;
}
```

### 4.2 Adjustments

```
POST /inventory/adjustments
  Auth: ADMIN, WAREHOUSE_STAFF
  Body: { productId, quantityDelta, lossType, description }
  Note:
    |quantityDelta| > 10% tồn kho → INSERT AdjustmentRequest PENDING (cần BM duyệt)
    |quantityDelta| ≤ 10% → thực hiện ngay
  Returns: AdjustmentRequestResponse

GET /inventory/adjustments/pending
  Auth: ADMIN, BRANCH_MANAGER
  Params: page=0, size=20
  Returns: Page<AdjustmentRequestResponse>
  Page: /manager/inventory

POST /inventory/adjustments/{id}/approve
  Auth: ADMIN, BRANCH_MANAGER
  Action: PENDING → APPROVED → thực hiện adjustment
  Returns: AdjustmentRequestResponse

POST /inventory/adjustments/{id}/reject
  Auth: ADMIN, BRANCH_MANAGER
  Body: { reason: string }
  Returns: AdjustmentRequestResponse
```

**AdjustmentRequestResponse:**
```typescript
interface AdjustmentRequest {
  id: string;
  productId: string;
  productName: string;
  currentQty: number;
  quantityDelta: number;     // âm = giảm
  lossType: "DAMAGED" | "LOST" | "EXPIRED";
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdBy: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}
```

### 4.3 Suppliers

```
GET /inventory/suppliers
  Auth: ADMIN, BRANCH_MANAGER, WAREHOUSE_STAFF
  Params: name?, page=0, size=20
  Returns: Page<SupplierResponse>
  Page: /supplier-management

GET /inventory/suppliers/{id}
  Returns: SupplierResponse

POST /inventory/suppliers
  Auth: ADMIN, BRANCH_MANAGER
  Body: { name, contactPerson?, phone?, email?, address? }
  Note: name unique
  Returns: SupplierResponse

PUT /inventory/suppliers/{id}
  Auth: ADMIN, BRANCH_MANAGER
  Body: { name?, contactPerson?, phone?, email?, address? }
  Returns: SupplierResponse

POST /inventory/suppliers/{id}/deactivate
  Auth: ADMIN, BRANCH_MANAGER
  Note: lỗi 409 nếu có PO đang active
  Returns: void
```

---

## 5. Loyalty & Promotion Service — `/loyalty`

### 5.1 Loyalty Members

```
POST /loyalty/members
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { fullName, phone, email? }
  Note: phone unique
  Returns: MemberResponse
  Page: /loyalty/members (modal đăng ký)

GET /loyalty/members?phone={phone}
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: MemberResponse
  Page: /loyalty/members (search), /pos/order (nhập SĐT loyalty)

GET /loyalty/members/check?phone={phone}
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: MemberResponse (404 nếu chưa đăng ký)
  Dùng: debounce check trước khi đổi điểm

GET /loyalty/members/{id}
  Returns: MemberResponse

POST /loyalty/members/{id}/redeem-preview
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { pointsToRedeem: number, orderTotal: number }
  Returns: RedeemResponse { discountAmount, remainingPoints }
  Dùng: preview discount trước khi thanh toán

POST /loyalty/members/{id}/redeem
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { pointsToRedeem: number, orderId: string, orderTotal: number }
  Note: SELECT FOR UPDATE chống race condition
  Returns: RedeemResponse
```

**MemberResponse:**
```typescript
interface LoyaltyMember {
  id: string;
  memberNumber: string;
  fullName: string;
  phone: string;
  email?: string;
  pointBalance: number;
  joinedAt: string;
  transactions?: PointTransaction[];
}
interface PointTransaction {
  id: string;
  type: "EARN" | "REDEEM" | "REFUND";
  points: number;        // âm nếu REDEEM
  description: string;
  createdAt: string;
}
```

### 5.2 Promotions

```
GET /loyalty/promotions
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: PromotionResponse[]  (chỉ active)
  Page: /promotions

GET /loyalty/promotions/{id}
  Returns: PromotionResponse

POST /loyalty/promotions
  Auth: BRANCH_MANAGER, ADMIN
  Body: { name, type, value, minOrderValue?, startDate, endDate, description? }
  Note: type = "PERCENTAGE" | "FIXED_AMOUNT"
        Không thể có 2 KM cùng loại + cùng phạm vi đang active đồng thời
  Returns: PromotionResponse

DELETE /loyalty/promotions/{id}
  Auth: BRANCH_MANAGER, ADMIN
  Action: deactivate (is_active = false)
  Returns: void
```

### 5.3 Coupons

```
GET /loyalty/coupons?promotionId={id}
  Auth: BRANCH_MANAGER, ADMIN
  Returns: CouponResponse[]
  Page: /coupons

POST /loyalty/coupons
  Auth: BRANCH_MANAGER, ADMIN
  Body: { promotionId, code, maxUsageTotal, maxUsagePerCustomer, expiresAt }
  Returns: CouponResponse

POST /loyalty/coupons/validate
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { code: string, orderTotal: number }
  Returns: CouponValidationResponse { valid, discountAmount, message? }
  Page: /pos/order (nhập mã coupon), /coupons (nút Validate test)
  Note: ≤ 300ms
```

---

## 6. Report Service — `/report`

### 6.1 Dashboard

```
GET /report/dashboard
  Auth: ADMIN, BRANCH_MANAGER
  Params: (không cần — backend tự filter theo X-Branch-Id)
  Returns: DashboardResponse
  Cache: Redis 1h, invalidate khi order.confirmed event
  Note: DB fail → trả {} (không lỗi)

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;        // % so với hôm qua
  topProducts: TopProduct[];
  dailyRevenue?: DailyRevenue[]; // 7 ngày qua
}
interface TopProduct {
  productId: string;
  productName: string;
  soldQty: number;
  revenue: number;
}
```

### 6.2 Revenue Report

```
GET /report/reports/revenue
  Auth: ADMIN, BRANCH_MANAGER
  Params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
  Note: nếu khoảng ≤ 31 ngày → trả ngay (≤ 2 giây)
        nếu > 31 ngày → 400 Bad Request, dùng async endpoint
  Returns: RevenueReportData[]

POST /report/reports/revenue/async
  Auth: ADMIN, BRANCH_MANAGER
  Body: { startDate, endDate }
  Returns: { jobId: string }
  Dùng: polling GET /reports/jobs/{jobId}/result

GET /report/reports/jobs/{jobId}/result
  Auth: ADMIN, BRANCH_MANAGER
  Returns: AsyncReportJobResponse { status: "PENDING"|"COMPLETED"|"FAILED", resultUrl?, data? }
  Note: poll mỗi 3-5 giây; dừng khi COMPLETED hoặc FAILED
        notification async: report.completed event → user nhận thông báo
```

### 6.3 Inventory Report

```
GET /report/reports/inventory
  Auth: ADMIN, BRANCH_MANAGER
  Params: tab = "low_stock" | "expiry" | "slow_moving"
  Returns: InventoryReportData (tùy tab)
  
  low_stock: [{ productId, productName, sku, quantity, minThreshold }]
  expiry:    [{ productId, productName, sku, expiryDate, quantity, lotNumber }]
  slow_moving: [{ productId, productName, sku, quantity, lastSoldAt, daysSinceLastSale }]

POST /report/reports/inventory/export
  Auth: ADMIN, BRANCH_MANAGER
  Params: tab
  Returns: PDF binary (Content-Type: application/pdf)
  Dùng: window.open(url) hoặc download via blob
```

---

## 7. Notification & Audit Service — `/notification`

### 7.1 Notifications

```
GET /notification/notifications/unread-count
  Auth: AUTHENTICATED
  Returns: { data: number }
  Polling: mỗi 30 giây (dừng khi visibilitychange = hidden)
  Implemented: useNotificationPolling hook → notification.store

GET /notification/notifications
  Auth: AUTHENTICATED
  Params: page=0, size=20, type? (filter theo loại)
  Returns: Page<NotificationResponse>
  Note: chỉ trả thông báo trong 30 ngày gần nhất, trong phạm vi role của user

PATCH /notification/notifications/{id}/read
  Auth: AUTHENTICATED
  Action: is_read = true
  Returns: void

PATCH /notification/notifications/read-all
  Auth: AUTHENTICATED
  Returns: void
```

**NotificationResponse:**
```typescript
interface Notification {
  id: string;
  type: "LOW_STOCK" | "EXPIRY_ALERT" | "CANCEL_REQUESTED" | "PO_RECEIVED" |
        "SHIFT_CLOSED" | "ACCOUNT_LOCKED" | "REPORT_COMPLETED";
  title: string;
  message: string;
  deepLink?: string;        // URL navigate khi click
  isRead: boolean;
  createdAt: string;
}
```

### 7.2 Audit Logs (ADMIN only)

```
GET /notification/audit-logs
  Auth: ADMIN
  Params: startDate?, endDate?, entityType?, userId?, action?, page=0, size=20
  Returns: Page<AuditLogResponse>

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  ipAddress: string;
  entityType: string;    // "Product", "Account", "SystemConfig"...
  entityId: string;
  action: string;        // "CREATE", "UPDATE", "DELETE", "UNLOCK"
  oldValue?: string;     // JSON
  newValue?: string;     // JSON
  createdAt: string;
}
```

---

## 8. Tổng hợp Services & Frontend Service Files

| Service Layer (FE) | Đã tạo | Endpoints cover |
|--------------------|--------|-----------------|
| `auth.service.ts` | ✅ | login, logout, changePassword |
| `auth.service.ts` (account) | ✅ | CRUD account, unlock |
| `systemConfig.service.ts` | ✅ | getAll, getByKey, update |
| `product.service.ts` | ✅ | search, getById, create, update, delete |
| `category.service.ts` | ✅ | getAll, create, update, delete |
| `order.service.ts` | ✅ | create, getById, getMyOrders, cancel, approve/reject |
| `shift.service.ts` | ✅ | open, close, getCurrent |
| `purchaseOrder.service.ts` | ✅ | create, submit, confirm, cancel, receive, list, getById |
| `inventory.service.ts` | ✅ | adjustments CRUD |
| `supplier.service.ts` | ✅ | CRUD suppliers |
| `loyalty.service.ts` | ✅ | members CRUD, redeem |
| `promotion.service.ts` | ✅ | list, create, deactivate |
| `coupon.service.ts` | ✅ | list, create, validate |
| `report.service.ts` | ✅ | dashboard, revenue, inventoryReport |
| `notification.service.ts` | ✅ | unreadCount, list, markRead, markAllRead |
| `auditLog.service.ts` | ✅ | list |
| Return service | ❌ | cần tạo `return.service.ts` |

### Return Service (cần tạo)

```typescript
// src/services/return.service.ts
import api from "@/lib/axios";
import type { ApiResponse } from "@/types";

export interface CreateReturnRequest {
  originalOrderId?: string;
  items: { productId: string; quantity: number; sku?: string }[];
}

export interface ReturnResponse {
  id: string;
  originalOrderId?: string;
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  totalRefund: number;
  createdAt: string;
}

export const returnService = {
  create: async (req: CreateReturnRequest): Promise<ReturnResponse> => {
    const res = await api.post<ApiResponse<ReturnResponse>>("/order/returns", req);
    return res.data.data;
  },
  getById: async (id: string): Promise<ReturnResponse> => {
    const res = await api.get<ApiResponse<ReturnResponse>>(`/order/returns/${id}`);
    return res.data.data;
  },
};
```

---

## 9. Error Handling chuẩn

```typescript
// Pattern dùng trong mọi page:
try {
  setIsLoading(true);
  const data = await someService.doSomething();
  // xử lý data
} catch (err: unknown) {
  const message = err instanceof Error
    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? err.message
    : "Đã có lỗi xảy ra";
  toast.error(message);
} finally {
  setIsLoading(false);
}

// HTTP Status mapping (backend đã chuẩn hóa):
// 400 → validation / business rule client có thể sửa
// 401 → axios interceptor tự redirect /login
// 403 → "Bạn không có quyền thực hiện thao tác này"
// 404 → "Không tìm thấy dữ liệu"
// 409 → "Dữ liệu đã tồn tại hoặc xung đột"
// 422 → "Không thể thực hiện: [lý do nghiệp vụ]"
```

---

## 10. Idempotency (POST /order/orders)

```typescript
import { v4 as uuidv4 } from "uuid";

// Trong POS order submission:
const idempotencyKey = uuidv4();
await api.post("/order/orders", body, {
  headers: { "Idempotency-Key": idempotencyKey },
});
// Key được lưu localStorage để retry nếu mạng fail
// Backend: key trùng → trả kết quả cũ (200), không tạo đơn mới
```
