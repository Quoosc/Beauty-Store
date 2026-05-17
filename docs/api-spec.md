# API Integration Spec — BeautyERP Frontend

> **Base URL:** `http://localhost:8080/api/v1`  
> **Auth:** JWT trong httpOnly cookie `jwt` (set bởi backend, không đọc được từ JS)  
> **Axios instance:** `@/lib/axios` — `withCredentials: true`, 401 → redirect `/login`  
> **Response format:** `{ success: boolean, data: T, message?: string }`  
> **Cập nhật:** 2026-05-16 — đồng bộ toàn bộ type/field với BE: SystemConfig, Order, Shift, PurchaseOrder, Dashboard, Notification, Adjustment, Member, Coupon, Promotion, ReturnResponse, AuditLog, RevenueReport params  
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
  Returns: { userId, username, fullName, role, branchId, forceChangePassword }
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
  Body: { username, fullName, role, branchId? }
  Returns: AccountResponse  (includes temporaryPassword in response for first-time login)
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
  Returns: SystemConfigResponse[]  [{ configKey, configValue, description }]
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
  Returns: PagedProductResponse { products: Product[], total, page, size, totalPages }
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
  unit: string;
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
  expiryDate?: string;  // ISO date
  status: "ACTIVE" | "DISCONTINUED";
  branchId?: string;
  createdAt: string;
  updatedAt: string;
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
  Body: { name: string }
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
    items: [{ productId, quantity }],
    loyaltyMemberId?: string,
    couponCode?: string,
    couponDiscount?: number,
    pointsRedeemed?: number,
    pointsDiscount?: number,
    tenderedAmount: number,   ← BẮT BUỘC
    branchId?: string,        // chỉ ADMIN
  }
  Returns: OrderResponse { id, status, total, receiptUrl, ... }
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
  Params: page, size, status?
  Returns: Page<OrderResponse>
  Page: /manager/orders (list đơn toàn chi nhánh)

GET /order/orders/branch/{branchId}/pending-cancels
  Auth: BRANCH_MANAGER, ADMIN
  Params: page, size
  Returns: OrderResponse[]  ← chỉ đơn COMPLETED có CancelLog PENDING
  Page: /manager/orders (duyệt hủy đơn)
  Note: trả về Order với hasPendingCancel=true, pendingCancelReason, pendingCancelNote

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
  cashierId: string;
  shiftId: string;
  branchId: string;
  loyaltyMemberId?: string;
  couponCode?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  total: number;               // ← tên field là `total` (không phải totalAmount)
  tenderedAmount?: number;
  changeAmount?: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "RETURNED";
  hasPendingCancel?: boolean;      // true nếu đơn đang chờ Manager duyệt hủy
  pendingCancelReason?: string;    // lý do cashier nhập khi yêu cầu hủy
  pendingCancelNote?: string;      // ghi chú bổ sung
  receiptUrl: string;
  createdAt: string;
  updatedAt: string;
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
  branchId: string;
  status: "OPEN" | "CLOSED";
  openingCash: number;
  closingCash?: number;
  variance?: number;
  note?: string;
  openedAt: string;
  closedAt?: string;
  summary?: ShiftSummary;
  createdAt: string;
  updatedAt: string;
}
interface ShiftSummary {
  orderCount: number;    // ← tên field là `orderCount` (không phải totalOrders)
  totalRevenue: number;
  cancelCount: number;
  returnCount: number;
}
```

### 3.3 Returns

```
POST /order/returns
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: {
    originalOrderId?: string,
    items: [{ productId, quantity }],
    reason?: string
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
    items: [{ productId, orderedQty }]
  }
  Returns: PurchaseOrderResponse (status=PENDING)
  Page: /inventory/purchase-orders/create

POST /inventory/purchase-orders/{id}/submit
  Auth: ADMIN, WAREHOUSE_STAFF
  Action: PENDING → CONFIRMED (gửi để chờ BM confirm)
  Returns: PurchaseOrderResponse

POST /inventory/purchase-orders/{id}/confirm
  Auth: ADMIN, BRANCH_MANAGER
  Action: SUBMITTED → CONFIRMED
  Returns: PurchaseOrderResponse

POST /inventory/purchase-orders/{id}/cancel
  Auth: ADMIN, BRANCH_MANAGER
  Action: PENDING|CONFIRMED → CANCELLED
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
  poCode: string;           // "PO-20260512-0001"  ← field name là `poCode` (không phải poNumber)
  supplier: Supplier;
  branchId: string;
  status: "PENDING" | "CONFIRMED" | "PARTIALLY_RECEIVED" | "FULLY_RECEIVED" | "CANCELLED";
  createdBy: string;
  confirmedBy?: string;
  confirmedAt?: string;
  items: PoItem[];
  createdAt: string;
  updatedAt: string;
}
interface Supplier {
  id: string;
  name: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
interface PoItem {
  id: string;
  productId: string;
  orderedQty: number;
  receivedQty: number;
  lotNumber?: string;
  expiryDate?: string;
  createdAt: string;
}
```

### 4.2 Adjustments

```
POST /inventory/adjustments
  Auth: ADMIN, WAREHOUSE_STAFF
  Body: { productId, quantity, lossType, description }
  Note:
    quantity > 10% tồn kho hiện tại → INSERT AdjustmentRequest PENDING (cần BM duyệt)
    quantity ≤ 10% → thực hiện ngay
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
  branchId: string;
  currentQuantity: number;   // ← tên field là `currentQuantity` (không phải currentQty)
  adjustmentQty: number;     // ← tên field là `adjustmentQty` (không phải quantityDelta)
  lossType: "DAMAGED" | "LOST" | "EXPIRED";
  note: string;              // ← tên field là `note` (không phải description)
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string;       // ← tên field là `requestedBy` (không phải createdBy)
  approvedBy?: string;
  approvedAt?: string;
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
  Body: { name, taxCode, contactPerson?, phone, email?, address? }
  Note: name unique; taxCode format 10 hoặc 13 chữ số
  Returns: SupplierResponse

PUT /inventory/suppliers/{id}
  Auth: ADMIN, BRANCH_MANAGER
  Body: { name, taxCode, contactPerson?, phone, email?, address? }
  Returns: SupplierResponse

POST /inventory/suppliers/{id}/deactivate
  Auth: ADMIN, BRANCH_MANAGER
  Note: lỗi 409 nếu có PO đang active
  Returns: void
```

---

## 5. Loyalty & Promotion Service — `/loyalty-promotion`

### 5.1 Loyalty Members

```
POST /loyalty-promotion/members
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { fullName, phone }
  Note: phone unique; phone phải đúng 10 chữ số
  Returns: MemberResponse
  Page: /loyalty/members (modal đăng ký)

GET /loyalty-promotion/members?phone={phone}
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: MemberResponse
  Page: /loyalty/members (search), /pos/order (nhập SĐT loyalty)

GET /loyalty-promotion/members/check?phone={phone}
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: MemberResponse (404 nếu chưa đăng ký)
  Dùng: debounce check trước khi đổi điểm

GET /loyalty-promotion/members/{id}
  Returns: MemberResponse

POST /loyalty-promotion/members/{id}/redeem-preview
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { pointsToRedeem: number, orderTotal: number }
  Returns: RedeemResponse { discountAmount, actualPointsRedeemed, remainingBalance }
  Dùng: preview discount trước khi thanh toán

POST /loyalty-promotion/members/{id}/redeem
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { pointsToRedeem: number, orderTotal: number }
  Note: SELECT FOR UPDATE chống race condition
  Returns: RedeemResponse
```

**MemberResponse:**
```typescript
interface LoyaltyMember {
  id: string;
  memberCode: string;    // ← tên field là `memberCode` (không phải memberNumber)
  fullName: string;
  phone: string;
  pointBalance: number;
  branchId: string;
  createdAt: string;     // ← tên field là `createdAt` (không phải joinedAt)
}
```

### 5.2 Promotions

```
GET /loyalty-promotion/promotions
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Returns: PromotionResponse[]  (chỉ active)
  Page: /promotions

GET /loyalty-promotion/promotions/{id}
  Returns: PromotionResponse

POST /loyalty-promotion/promotions
  Auth: BRANCH_MANAGER, ADMIN
  Body: { name, type, discountValue, maxDiscountCap?, minOrderValue?, startDate, endDate, branchId?, forceCreate? }
  Note: type = "PERCENTAGE" | "FIXED_AMOUNT"
        Không thể có 2 KM cùng loại + cùng phạm vi đang active đồng thời
  Returns: PromotionResponse

DELETE /loyalty-promotion/promotions/{id}
  Auth: BRANCH_MANAGER, ADMIN
  Action: deactivate (is_active = false)
  Returns: void

⚠️ PUT /loyalty-promotion/promotions/{id} — CHƯA IMPLEMENT (xem FUTURE_IMPROVEMENTS.md M4)
```

### 5.3 Coupons

```
GET /loyalty-promotion/coupons?promotionId={id}
  Auth: BRANCH_MANAGER, ADMIN
  Returns: CouponResponse[]
  Page: /coupons

POST /loyalty-promotion/coupons
  Auth: BRANCH_MANAGER, ADMIN
  Body: { promotionId, code?, maxUsageTotal, maxUsagePerCustomer? }
  Returns: CouponResponse

POST /loyalty-promotion/coupons/validate
  Auth: CASHIER, BRANCH_MANAGER, ADMIN
  Body: { code: string, orderTotal: number, branchId?: string, memberId?: string }
  Returns: CouponValidationResponse { discountAmount, promotionId, promotionName }
  Page: /pos/order (nhập mã coupon), /coupons (nút Validate test)
  Note: ≤ 300ms; lỗi 4xx nếu coupon không hợp lệ

⚠️ PUT /loyalty-promotion/coupons/{id} — CHƯA IMPLEMENT (xem FUTURE_IMPROVEMENTS.md M3)
⚠️ DELETE /loyalty-promotion/coupons/{id} — CHƯA IMPLEMENT (xem FUTURE_IMPROVEMENTS.md M3)
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
  revenue: RevenueSummary;
  chart7Days: DailyChartPoint[];
  topProducts: TopProductEntry[];
  alerts: AlertEntry[];
}
interface RevenueSummary {
  today: number;                  // ← tên field là `today` (không phải totalRevenue)
  orderCount: number;             // ← tên field là `orderCount` (không phải totalOrders)
  averageOrderValue: number;
  totalDiscount: number;
  vsPreviousDayPercent: number;   // ← tên field là `vsPreviousDayPercent` (không phải revenueGrowth)
}
interface DailyChartPoint {
  date: string;                   // "YYYY-MM-DD"
  revenue: number;                // ← tên field là `revenue` (không phải totalRevenue)
  orderCount: number;
}
interface TopProductEntry {
  productId: string;
  productName: string;
  soldQty: number;
  revenue: number;
}
interface AlertEntry {
  type: string;
  productId: string;
  message: string;
}
```

### 6.2 Revenue Report

```
GET /report/reports/revenue
  Auth: ADMIN, BRANCH_MANAGER
  Params: from (YYYY-MM-DD), to (YYYY-MM-DD)   ← params là `from` và `to` (không phải startDate/endDate)
  Note: nếu khoảng ≤ 31 ngày → trả ngay (≤ 2 giây)
        nếu > 31 ngày → 400 Bad Request, dùng async endpoint
  Returns: RevenueReportResponse { from, to, totalRevenue, orderCount, averageOrderValue, totalDiscount, netRevenue, dailyData[] }

POST /report/reports/revenue/async
  Auth: ADMIN, BRANCH_MANAGER
  Body: { from, to, branchId? }   ← body fields là `from` và `to` (không phải startDate/endDate)
  Returns: AsyncReportJobResponse { jobId, status, message, createdAt }
  Dùng: polling GET /reports/jobs/{jobId}/result

GET /report/reports/jobs/{jobId}/result
  Auth: ADMIN, BRANCH_MANAGER
  Returns: AsyncReportJobResponse { jobId, status: "PROCESSING"|"COMPLETED"|"FAILED", message, createdAt, data? }
  Note: poll mỗi 3-5 giây; dừng khi COMPLETED hoặc FAILED
        notification async: report.completed event → user nhận thông báo
```

### 6.3 Inventory Report

```
GET /report/reports/inventory
  Auth: ADMIN, BRANCH_MANAGER
  Params: tab = "current_stock" | "near_expiry" | "slow_moving"
          ← tab values: `current_stock` (không phải low_stock), `near_expiry` (không phải expiry)
  Returns: InventoryReportData (tùy tab)
  
  current_stock: [{ productId, productName, sku, quantity, minThreshold }]
  near_expiry:   [{ productId, productName, sku, expiryDate, quantity, lotNumber }]
  slow_moving:   [{ productId, productName, sku, quantity, lastSoldAt, daysSinceLastSale }]

POST /report/reports/inventory/export
  Auth: ADMIN, BRANCH_MANAGER
  Params: tab
  Returns: PDF binary (Content-Type: application/pdf)
  Dùng: window.open(url) hoặc download via blob
```

---

## 7. Notification & Audit Service — `/notification-audit`

### 7.1 Notifications

```
GET /notification-audit/notifications/unread-count
  Auth: AUTHENTICATED
  Returns: { data: number }
  Polling: mỗi 30 giây (dừng khi visibilitychange = hidden)
  Implemented: useNotificationPolling hook → notification.store

GET /notification-audit/notifications
  Auth: AUTHENTICATED
  Params: page=0, size=20, type? (filter theo loại)
  Returns: Page<NotificationResponse>
  Note: chỉ trả thông báo trong 30 ngày gần nhất, trong phạm vi role của user

PATCH /notification-audit/notifications/{id}/read
  Auth: AUTHENTICATED
  Action: is_read = true
  Returns: void

PATCH /notification-audit/notifications/read-all
  Auth: AUTHENTICATED
  Returns: void
```

**NotificationResponse:**
```typescript
interface Notification {
  id: string;
  userId: string;
  branchId?: string;
  type: "LOW_STOCK" | "NEAR_EXPIRY" | "CANCEL_APPROVAL" | "PO_PARTIAL" |
        "SHIFT_VARIANCE" | "ACCOUNT_LOCKED" | "REPORT_COMPLETED" | "ADJUSTMENT_APPROVAL";
  // ← enum values đúng: NEAR_EXPIRY (không phải EXPIRY_ALERT), CANCEL_APPROVAL (không phải CANCEL_REQUESTED),
  //   PO_PARTIAL (không phải PO_RECEIVED), SHIFT_VARIANCE (không phải SHIFT_CLOSED)
  title: string;
  message: string;
  deepLinkPath?: string;    // ← tên field là `deepLinkPath` (không phải deepLink)
  isRead: boolean;
  createdAt: string;
}
```

### 7.2 Audit Logs (ADMIN only)

```
GET /notification-audit/audit-logs
  Auth: ADMIN
  Params: from?, to?, entityType?, entityId?, userId?, action?, page=0, size=20
  Returns: Page<AuditLogResponse>

interface AuditLog {
  id: string;
  userId: string;
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
  shiftId: string;
  cashierId: string;
  branchId: string;
  reason?: string;
  totalRefund: number;
  items: ReturnItemResponse[];
  createdAt: string;
}
export interface ReturnItemResponse {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  refundAmount: number;
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
