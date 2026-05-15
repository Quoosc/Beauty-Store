# BeautyERP — Kế hoạch Tích hợp API cho Frontend

> **Ngày lập:** 2026-05-15 · **Cập nhật lần cuối:** 2026-05-16  
> **Stack FE:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Zustand · Axios · Tailwind CSS 4 · shadcn/ui  
> **Backend:** 7 microservices qua API Gateway `:8080/api/v1`  
> **Tổng API backend:** 81 endpoints (60 public + 21 internal)  
> **Tổng pages FE:** 38 pages

---

## Mục lục

1. [Tổng quan hiện trạng](#1-tổng-quan-hiện-trạng)
2. [Các vấn đề cần sửa trước (API Mismatch)](#2-các-vấn-đề-cần-sửa-trước-api-mismatch)
3. [Kế hoạch tích hợp theo Role](#3-kế-hoạch-tích-hợp-theo-role)
   - [3.1 ADMIN](#31-admin)
   - [3.2 BRANCH_MANAGER](#32-branch_manager)
   - [3.3 CASHIER](#33-cashier)
   - [3.4 WAREHOUSE_STAFF](#34-warehouse_staff)
4. [Shared / Cross-role features](#4-shared--cross-role-features)
5. [Pages cần tạo mới](#5-pages-cần-tạo-mới)
6. [Pages cần hoàn thiện](#6-pages-cần-hoàn-thiện)
7. [Bảo vệ Route theo Role (Middleware)](#7-bảo-vệ-route-theo-role-middleware)
8. [Types cần bổ sung / sửa](#8-types-cần-bổ-sung--sửa)
9. [Thứ tự ưu tiên thực hiện](#9-thứ-tự-ưu-tiên-thực-hiện)
10. [Checklist tổng](#10-checklist-tổng)

---

## 1. Tổng quan hiện trạng

### 1.1 Status tổng thể

| Hạng mục | Tổng | Hoàn thiện | Cần sửa/bổ sung |
|----------|------|-----------|-----------------|
| Pages | 38 | 33 ✅ | 4 partial + 1 missing |
| Service files | 15 | 15 | Một số method sai endpoint |
| Zustand stores | 3 | 3 ✅ | — |
| Types | 1 file | ~90% | Một số type thiếu |
| Middleware (route guard) | — | ✅ Hoàn thiện | Role guard + force-change-password guard đã có trong `src/middleware.ts` |

### 1.2 Pages theo trạng thái

| Status | Pages |
|--------|-------|
| ✅ **COMPLETE** | `/pos/order`, `/pos/shift`, `/cashier/orders`, `/products`, `/products/create`, `/products/[id]/edit`, `/categories`, `/orders/[orderId]`, `/inventory/stock`, `/inventory/purchase-orders`, `/inventory/purchase-orders/create`, `/inventory/receive/[poId]`, `/inventory/adjustments`, `/inventory/adjustments` (manager), `/loyalty/members`, `/notifications`, `/audit-logs`, `/revenue-report`, `/inventory-report`, `/supplier-management`, `/system-configuration`, `/user-management`, `/returns/new`, `/promotions`, `/coupons`, `/change-password`, `/manager/orders`, `/manager/inventory`, `/manager/products`, `/manager/purchase-orders` |
| ⚠️ **PARTIAL** | `/admin`, `/branch-manager`, `/warehouse`, `/force-change-password` |
| ❌ **MISSING** | `/products/[id]` (product detail) |

---

## 2. Các vấn đề cần sửa trước (API Mismatch)

> **Phải xử lý trước khi tích hợp các tính năng liên quan.** Đây là các điểm FE đang gọi sai/không tồn tại so với backend.

### 2.1 `inventoryService.getStock()` — Endpoint chưa rõ

| | Chi tiết |
|---|---|
| **File** | `src/services/inventory.service.ts` |
| **FE gọi** | `GET /inventory/inventory/stock` |
| **Backend** | Không có public `/stock` endpoint; chỉ có internal `/internal/inventory/report/stock` (report-service dùng qua FeignClient) |
| **Ảnh hưởng** | `/inventory/stock` page (WAREHOUSE_STAFF, ADMIN) |
| **Giải pháp** | Dùng `reportService.getInventoryReport({ tab: 'current_stock' })` → `GET /report/reports/inventory?tab=current_stock` hoặc backend thêm public endpoint `GET /inventory/stock` |
| **Ưu tiên** | 🔴 CRITICAL |

### 2.2 `loyaltyService.getPointHistory(memberId)` — Endpoint không tồn tại

| | Chi tiết |
|---|---|
| **File** | `src/services/loyalty.service.ts` |
| **FE gọi** | `GET /loyalty-promotion/members/:id/points-history` |
| **Backend** | Không có endpoint này. Backend chỉ có `GET /members/{id}` trả về `pointBalance` |
| **Ảnh hưởng** | `/loyalty/members` page — tab lịch sử điểm |
| **Giải pháp** | Xóa tab "Lịch sử điểm" khỏi UI **hoặc** backend thêm `GET /members/{id}/points-history` |
| **Ưu tiên** | 🟡 HIGH |

### 2.3 `couponService.update()` / `couponService.deactivate()` — Endpoint không tồn tại

| | Chi tiết |
|---|---|
| **File** | `src/services/coupon.service.ts` |
| **FE gọi** | `PUT /loyalty-promotion/coupons/:id` và `DELETE /loyalty-promotion/coupons/:id` |
| **Backend** | Không có PUT/DELETE cho coupon. Chỉ có: `POST /coupons`, `GET /coupons?promotionId=`, `POST /coupons/validate` |
| **Ảnh hưởng** | `/coupons` page — nút "Sửa" và "Vô hiệu hóa" coupon |
| **Giải pháp** | Ẩn nút sửa/xóa coupon trên UI **hoặc** backend thêm `PUT /coupons/{id}` và `DELETE /coupons/{id}` |
| **Ưu tiên** | 🟡 HIGH |

### 2.4 `promotionService.update()` — Endpoint không tồn tại

| | Chi tiết |
|---|---|
| **File** | `src/services/promotion.service.ts` |
| **FE gọi** | `PUT /loyalty-promotion/promotions/:id` |
| **Backend** | Không có PUT. Chỉ có: `GET /promotions`, `GET /promotions/{id}`, `POST /promotions`, `DELETE /promotions/{id}` |
| **Ảnh hưởng** | `/promotions` page — nút "Sửa" promotion |
| **Giải pháp** | Ẩn nút "Sửa" promotion (chỉ có thể tạo mới + vô hiệu hóa) **hoặc** backend thêm `PUT /promotions/{id}` |
| **Ưu tiên** | 🟡 HIGH |

### 2.5 `orderService.getCancelRequests()` — Cần kiểm tra endpoint thực tế

| | Chi tiết |
|---|---|
| **File** | `src/services/order.service.ts` |
| **FE gọi** | `GET /order/cancel-requests` |
| **Backend** | Không có endpoint `/cancel-requests`. Manager xem đơn cần duyệt qua `GET /orders/branch/{branchId}` |
| **Ảnh hưởng** | `/manager/orders` page |
| **Giải pháp** | Đổi sang `GET /order/orders/branch/:branchId` rồi filter phía FE theo `cancelStatus = PENDING`, **hoặc** backend thêm `GET /orders/cancel-requests?branchId=` |
| **Ưu tiên** | 🔴 CRITICAL |

### 2.6 `returnService.getReturnsByOrder(orderId)` — Sai endpoint

| | Chi tiết |
|---|---|
| **File** | `src/services/order.service.ts` (returnService) |
| **FE gọi** | `GET /order/returns/order/:orderId` |
| **Backend** | Không có endpoint này. Chỉ có `GET /returns/{id}` (by return ID) |
| **Ảnh hưởng** | `/orders/[orderId]` — tab "Trả hàng" trong chi tiết đơn |
| **Giải pháp** | Lưu `returnId` khi tạo return rồi gọi `GET /returns/{id}` **hoặc** backend thêm `GET /returns?orderId=` |
| **Ưu tiên** | 🟡 HIGH |

### 2.7 Adjustment threshold hardcoded

| | Chi tiết |
|---|---|
| **File** | `src/app/inventory/adjustments/page.tsx` |
| **Vấn đề** | Hardcode ngưỡng duyệt kho = 10% thay vì đọc từ `system_configs.inventory.large_adjustment_percent` |
| **Ảnh hưởng** | Logic validation tạo adjustment trên FE không nhất quán với backend nếu Admin đổi config |
| **Giải pháp** | Gọi `systemConfigService.getByKey('inventory.large_adjustment_percent')` khi load trang, dùng giá trị đó để hiển thị warning |
| **Ưu tiên** | 🟠 MEDIUM |

### 2.8 `force-change-password` — oldPassword hardcode rỗng

| | Chi tiết |
|---|---|
| **File** | `src/app/force-change-password/page.tsx` |
| **Vấn đề** | Truyền `oldPassword: ""` khi gọi `authService.changePassword()` |
| **Ảnh hưởng** | Backend reject nếu yêu cầu xác thực mật khẩu cũ ngay cả khi force-change |
| **Giải pháp** | Thêm trường "Mật khẩu tạm thời" (mật khẩu được Admin cấp) vào form; truyền đúng oldPassword |
| **Ưu tiên** | 🔴 CRITICAL |

---

## 3. Kế hoạch tích hợp theo Role

> **Quy ước:** Mỗi trang liệt kê: API cần gọi · Service method · Trạng thái hiện tại · Việc cần làm

---

### 3.1 ADMIN

> Scope: Toàn hệ thống (branchId = null). Quyền cao nhất, xem tất cả chi nhánh.

**Entry point:** `/admin` → redirect sau login

#### Trang: `/admin` — Dashboard tổng quan

| API | Method | Service |
|-----|--------|---------|
| `GET /report/dashboard` | `reportService.getDashboard()` | ✅ Đã gọi |

**Trạng thái:** ⚠️ PARTIAL  
**Việc cần làm:**
- [ ] Hoàn thiện Revenue Chart dùng `Recharts` — vẽ `AreaChart` từ `dashboardData.revenueByDay[]`
- [ ] Hiển thị KPI cards: tổng doanh thu, số đơn, AOV, tăng trưởng
- [ ] Top 5 sản phẩm bán chạy (table)
- [ ] Xử lý `DB fail → trả {}` (empty state graceful)

---

#### Trang: `/user-management` — Quản lý tài khoản

| API | Method | Service |
|-----|--------|---------|
| `GET /auth/accounts` | `accountService.getAll()` | ✅ |
| `GET /auth/accounts/:id` | `accountService.getById()` | ✅ |
| `POST /auth/accounts` | `accountService.create()` | ✅ |
| `PUT /auth/accounts/:id` | `accountService.update()` | ✅ |
| `DELETE /auth/accounts/:id` | `accountService.deactivate()` | ✅ |
| `PATCH /auth/accounts/:id/unlock` | `accountService.unlock()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Đảm bảo không cho vô hiệu hóa Admin duy nhất còn lại (show error từ backend 409)
- [ ] Hiển thị badge `is_locked` và nút unlock
- [ ] Thay đổi role hiển thị warning "Có hiệu lực từ phiên đăng nhập tiếp theo"

---

#### Trang: `/system-configuration` — Cấu hình hệ thống

| API | Method | Service |
|-----|--------|---------|
| `GET /auth/system-configs` | `systemConfigService.getAll()` | ✅ |
| `PUT /auth/system-configs/:key` | `systemConfigService.update()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Hiển thị description cho từng config key (xem bảng trong CLAUDE.md)
- [ ] Toast success "Có hiệu lực ngay, không cần restart"

---

#### Trang: `/audit-logs` — Nhật ký thao tác

| API | Method | Service |
|-----|--------|---------|
| `GET /notification-audit/audit-logs` | `auditLogService.getAll(params)` | ✅ |

**Query params:** `entityType`, `entityId`, `action`, `userId`, `from`, `to`, `page`, `size`

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Filter panel đầy đủ: entityType dropdown, userId input, date range picker
- [ ] JSON diff view cho `oldValue` / `newValue`

---

#### Trang: `/products` — Quản lý sản phẩm

| API | Method | Service |
|-----|--------|---------|
| `GET /catalog/products/search` | `productService.search(params)` | ✅ |
| `DELETE /catalog/products/:id` | `productService.discontinue()` | ✅ |
| `GET /catalog/categories` | `categoryService.getAll()` | ✅ |

**Trạng thái:** ✅ COMPLETE

---

#### Trang: `/products/create` — Tạo sản phẩm mới

| API | Method | Service |
|-----|--------|---------|
| `POST /catalog/products` | `productService.create()` | ✅ (multipart) |
| `GET /catalog/categories` | `categoryService.getAll()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Cảnh báo nếu costPrice > sellingPrice (không block submit)
- [ ] Cảnh báo nếu expiryDate < 30 ngày từ hôm nay
- [ ] Upload ảnh thất bại → rollback (hiện error, không tạo sản phẩm)

---

#### Trang: `/products/[id]/edit` — Sửa sản phẩm

| API | Method | Service |
|-----|--------|---------|
| `GET /catalog/products/:id` | `productService.getById()` | ✅ |
| `PUT /catalog/products/:id` | `productService.update()` | ✅ (multipart) |
| `GET /catalog/categories` | `categoryService.getAll()` | ✅ |

**Trạng thái:** ✅ COMPLETE

---

#### Trang: `/products/[id]` — Chi tiết sản phẩm ❌ MISSING

| API | Method | Service |
|-----|--------|---------|
| `GET /catalog/products/:id` | `productService.getById()` | ✅ (service có) |

**Trạng thái:** ❌ FILE CHƯA TỒN TẠI — cần tạo mới  
**Việc cần làm:** Xem [Section 5](#5-pages-cần-tạo-mới)

---

#### Trang: `/categories` — Quản lý danh mục

| API | Method | Service |
|-----|--------|---------|
| `GET /catalog/categories` | `categoryService.getAll()` | ✅ |
| `POST /catalog/categories` | `categoryService.create()` | ✅ |
| `PUT /catalog/categories/:id` | `categoryService.update()` | ✅ |
| `DELETE /catalog/categories/:id` | `categoryService.delete()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Tree view 2 cấp (Adjacency List)
- [ ] Không cho xóa nếu danh mục có sản phẩm (hiện 409 từ backend)

---

#### Trang: `/promotions` — Khuyến mãi

| API | Method | Service |
|-----|--------|---------|
| `GET /loyalty-promotion/promotions` | `promotionService.getAll()` | ✅ |
| `GET /loyalty-promotion/promotions/:id` | `promotionService.getById()` | ✅ |
| `POST /loyalty-promotion/promotions` | `promotionService.create()` | ✅ |
| `DELETE /loyalty-promotion/promotions/:id` | `promotionService.deactivate()` | ✅ |

**Trạng thái:** ✅ COMPLETE (sau khi fix mismatch 2.4)  
**Việc cần làm:**
- [ ] **FIX 2.4:** Ẩn nút "Sửa" hoặc backend thêm `PUT /promotions/{id}`
- [ ] Không cho tạo 2 KM cùng loại cùng phạm vi đang active (hiện 409)
- [ ] Hiển thị trạng thái active/inactive với date range

---

#### Trang: `/coupons` — Mã giảm giá

| API | Method | Service |
|-----|--------|---------|
| `GET /loyalty-promotion/coupons?promotionId=` | `couponService.getAll()` | ✅ |
| `POST /loyalty-promotion/coupons` | `couponService.create()` | ✅ |
| `POST /loyalty-promotion/coupons/validate` | `couponService.validate()` | ✅ |

**Trạng thái:** ⚠️ PARTIAL (sau khi fix mismatch 2.3)  
**Việc cần làm:**
- [ ] **FIX 2.3:** Ẩn nút "Sửa" và "Vô hiệu hóa" coupon trên UI
- [ ] Filter coupon theo promotionId

---

#### Trang: `/supplier-management` — Nhà cung cấp

| API | Method | Service |
|-----|--------|---------|
| `GET /inventory/suppliers` | `supplierService.getAll()` | ✅ |
| `GET /inventory/suppliers/:id` | `supplierService.getById()` | ✅ |
| `POST /inventory/suppliers` | `supplierService.create()` | ✅ |
| `PUT /inventory/suppliers/:id` | `supplierService.update()` | ✅ |
| `POST /inventory/suppliers/:id/deactivate` | — | ❌ Chưa có trong service |

**Trạng thái:** ⚠️ PARTIAL  
**Việc cần làm:**
- [ ] Thêm `supplierService.deactivate(id)` → `POST /inventory/suppliers/:id/deactivate`
- [ ] Thêm nút "Vô hiệu hóa" trong UI với confirm dialog

---

#### Trang: `/revenue-report` — Báo cáo doanh thu

| API | Method | Service |
|-----|--------|---------|
| `GET /report/reports/revenue?from=&to=` | `reportService.getRevenue()` | ✅ |
| `POST /report/reports/revenue/async` | `reportService.requestAsyncRevenue()` | ✅ |
| `GET /report/reports/jobs/:jobId/result` | `reportService.getJobResult()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Khoảng > 31 ngày → tự động dùng async flow, polling `getJobResult` mỗi 5s
- [ ] Khi `report.completed` nhận qua notification → redirect đến kết quả

---

#### Trang: `/inventory-report` — Báo cáo tồn kho

| API | Method | Service |
|-----|--------|---------|
| `GET /report/reports/inventory?tab=current_stock` | `reportService.getInventoryReport()` | ✅ |
| `GET /report/reports/inventory?tab=slow_moving` | `reportService.getInventoryReport()` | ✅ |
| `GET /report/reports/inventory?tab=near_expiry` | `reportService.getInventoryReport()` | ✅ |
| `POST /report/reports/inventory/export` | `reportService.exportInventoryPdf()` | ❌ Chưa có trong service |

**Trạng thái:** ⚠️ PARTIAL  
**Việc cần làm:**
- [ ] Thêm `reportService.exportInventoryPdf(tab)` → `POST /report/reports/inventory/export`
- [ ] Nút "Xuất PDF" với tab hiện tại

---

#### Trang: `/orders/[orderId]` — Chi tiết đơn hàng

| API | Method | Service |
|-----|--------|---------|
| `GET /order/orders/:id` | `orderService.getById()` | ✅ |
| `GET /order/orders/receipts/:id` | `orderService.getReceipt()` | ✅ |
| `POST /order/orders/:id/cancel` | `orderService.cancel()` | ✅ |

**Trạng thái:** ✅ COMPLETE (sau khi fix mismatch 2.6)  
**Việc cần làm:**
- [ ] **FIX 2.6:** Tab "Trả hàng" — đổi sang `GET /returns/{returnId}` hoặc bỏ tab nếu không có return ID

---

#### Trang: `/notifications` — Thông báo

| API | Method | Service |
|-----|--------|---------|
| `GET /notification-audit/notifications/unread-count` | `notificationStore.fetchUnreadCount()` | ✅ (polling 30s) |
| `GET /notification-audit/notifications` | `notificationStore.loadNotifications()` | ✅ |
| `PATCH /notification-audit/notifications/:id/read` | `notificationStore.markAsRead()` | ✅ |
| `PATCH /notification-audit/notifications/read-all` | `notificationStore.markAllAsRead()` | ✅ |

**Trạng thái:** ✅ COMPLETE

---

### 3.2 BRANCH_MANAGER

> Scope: Chi nhánh của mình (branchId inject từ JWT). Kế thừa toàn bộ quyền Cashier + Warehouse Staff.

**Entry point:** `/branch-manager` → redirect sau login

#### Trang: `/branch-manager` — Dashboard chi nhánh

| API | Method | Service |
|-----|--------|---------|
| `GET /report/dashboard` | `reportService.getDashboard()` | ✅ |

**Trạng thái:** ⚠️ PARTIAL  
**Việc cần làm:**
- [ ] Giống admin dashboard nhưng data đã filter theo branchId (backend tự filter)
- [ ] Thêm Recharts `AreaChart` cho doanh thu
- [ ] Widget "Đơn chờ duyệt hủy" — count từ cancel_log PENDING
- [ ] Widget "Điều chỉnh kho chờ duyệt" — count từ adjustment PENDING
- [ ] Quick links đến `/manager/orders` và `/manager/inventory`

---

#### Trang: `/manager/orders` — Duyệt hủy đơn

| API | Method | Service |
|-----|--------|---------|
| `GET /order/orders/branch/:branchId` | `orderService.getCancelRequests()` ⚠️ | ⚠️ Sai endpoint |
| `POST /order/orders/:id/cancel/approve` | `orderService.approveCancel()` | ✅ |
| `POST /order/orders/:id/cancel/reject` | `orderService.rejectCancel()` | ✅ |

**Trạng thái:** ⚠️ PARTIAL  
**Việc cần làm:**
- [ ] **FIX 2.5:** Đổi `getCancelRequests()` thành `GET /order/orders/branch/:branchId` và filter theo `cancelStatus = 'PENDING'`
- [ ] Hiển thị thông tin đơn: tổng tiền, cashier, lý do hủy, thời gian yêu cầu
- [ ] Nút "Duyệt" / "Từ chối" với confirm dialog
- [ ] Sau approve/reject → refresh list

---

#### Trang: `/manager/inventory` — Duyệt điều chỉnh kho

| API | Method | Service |
|-----|--------|---------|
| `GET /inventory/adjustments/pending` | `inventoryService.getPendingAdjustments()` | ✅ |
| `POST /inventory/adjustments/:id/approve` | `inventoryService.approveAdjustment()` | ✅ |
| `POST /inventory/adjustments/:id/reject` | `inventoryService.rejectAdjustment()` | ✅ |

**Trạng thái:** ✅ COMPLETE

---

#### Trang: `/manager/purchase-orders` — Xác nhận PO

| API | Method | Service |
|-----|--------|---------|
| `GET /inventory/purchase-orders` | `purchaseOrderService.getAll()` | ✅ |
| `POST /inventory/purchase-orders/:id/confirm` | `purchaseOrderService.confirm()` | ✅ |
| `POST /inventory/purchase-orders/:id/cancel` | `purchaseOrderService.cancel()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Chỉ hiển thị PO ở trạng thái `PENDING` cần duyệt

---

#### Trang: `/manager/products` — Quản lý sản phẩm chi nhánh

| API | Method | Service |
|-----|--------|---------|
| `GET /catalog/products/search` | `productService.search()` | ✅ |
| `DELETE /catalog/products/:id` | `productService.discontinue()` | ✅ |

**Trạng thái:** ✅ COMPLETE

---

#### Trang: `/loyalty/members` — Thành viên loyalty

| API | Method | Service |
|-----|--------|---------|
| `GET /loyalty-promotion/members?phone=` | `loyaltyService.searchByPhone()` | ✅ |
| `POST /loyalty-promotion/members` | `loyaltyService.register()` | ✅ |
| `GET /loyalty-promotion/members/:id` | `loyaltyService.getById()` | ✅ |
| `POST /loyalty-promotion/members/:id/redeem-preview` | `loyaltyService.redeemPreview()` | ✅ |

**Trạng thái:** ⚠️ PARTIAL (sau khi fix mismatch 2.2)  
**Việc cần làm:**
- [ ] **FIX 2.2:** Xóa tab "Lịch sử điểm" hoặc backend thêm endpoint
- [ ] Hiển thị `pointBalance` trong card thành viên

---

### 3.3 CASHIER

> Scope: Ca làm việc của mình. Phải có shift OPEN trước khi tạo giao dịch.

**Entry point:** `/pos/shift` → redirect sau login

#### Trang: `/pos/shift` — Mở/Đóng ca

| API | Method | Service |
|-----|--------|---------|
| `GET /order/shifts/current` | `shiftService.getCurrent()` | ✅ |
| `POST /order/shifts` | `shiftService.open()` | ✅ |
| `POST /order/shifts/:id/close` | `shiftService.close()` | ✅ |

**Trạng thái:** ✅ COMPLETE — đã kiểm thử thực tế 2026-05-16 (tất cả pass)  
**Lưu ý:**
- [x] Backend đã fix: `POST /order/shifts` bị 500 do PostgreSQL enum mismatch → đã sửa `Shift.java` + `ShiftRepository.java`
- [ ] Đóng ca: nếu `variance ≠ 0` → bắt buộc nhập ghi chú (validate client-side)
- [ ] Sau đóng ca thành công → clear `pos.store` draft

---

#### Trang: `/pos/order` — Thanh toán POS

| API | Method | Service |
|-----|--------|---------|
| `GET /catalog/products/search` | `productService.search()` | ✅ |
| `POST /order/orders` + `Idempotency-Key` header | `orderService.create()` | ✅ |
| `POST /loyalty-promotion/coupons/validate` | `couponService.validate()` | ✅ |
| `GET /loyalty-promotion/members/check?phone=` | `loyaltyService.checkByPhone()` | ✅ |
| `POST /loyalty-promotion/members` | `loyaltyService.register()` | ✅ |
| `POST /loyalty-promotion/members/:id/redeem-preview` | `loyaltyService.redeemPreview()` | ✅ |
| `POST /loyalty-promotion/members/:id/redeem` | `loyaltyService.redeem()` | ✅ |
| `GET /order/orders/receipts/:id` | `orderService.getReceipt()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] `Idempotency-Key: uuid()` tự sinh mỗi đơn mới (đã có)
- [ ] Draft autosave localStorage mỗi 10s (đã có qua `pos.store`)
- [ ] Guard: không cho tạo đơn nếu không có shift OPEN
- [ ] Hiển thị điểm tích dự kiến (floor(actualAmount / points_rate))

---

#### Trang: `/cashier/orders` — Danh sách đơn của tôi

| API | Method | Service |
|-----|--------|---------|
| `GET /order/orders/my` | `orderService.getMy()` | ✅ |
| `GET /order/orders/receipts/:id` | `orderService.getReceipt()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Chỉ hiển thị đơn trong ca hiện tại của cashier (backend filter theo shiftId)
- [ ] In lại hoá đơn: dùng snapshot gốc, không tính lại

---

#### Trang: `/returns/new` — Trả hàng

| API | Method | Service |
|-----|--------|---------|
| `GET /order/orders/:id` | `orderService.getById()` | ✅ |
| `POST /order/returns` | `returnService.create()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Validate qty_return ≤ qty_original (client-side + backend enforce)
- [ ] Guard: phải có shift OPEN (đã có)
- [ ] Tìm đơn theo orderId hoặc SKU (nếu không có hoá đơn)

---

#### Trang: `/orders/[orderId]` — Chi tiết đơn

| API | Method | Service |
|-----|--------|---------|
| `GET /order/orders/:id` | `orderService.getById()` | ✅ |
| `POST /order/orders/:id/cancel` | `orderService.cancel()` | ✅ |
| `GET /order/orders/receipts/:id` | `orderService.getReceipt()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Cashier chỉ được hủy đơn ≤ 500.000đ (backend kiểm tra, FE có thể ẩn nút nếu > threshold)
- [ ] Đơn > 500.000đ: hiện trạng "Đang chờ duyệt" sau khi cancel

---

#### Trang: `/force-change-password` — Đổi mật khẩu lần đầu

| API | Method | Service |
|-----|--------|---------|
| `POST /auth/change-password` | `authService.changePassword()` | ⚠️ oldPassword rỗng |

**Trạng thái:** ⚠️ SKELETON  
**Việc cần làm:**
- [ ] **FIX 2.8:** Thêm trường "Mật khẩu tạm thời" (mật khẩu Admin đã cấp)
- [ ] Validate mật khẩu mới: ≥ 8 ký tự, có chữ hoa/thường/số
- [ ] Không cho dùng cùng mật khẩu cũ (backend kiểm tra, FE hiện error)
- [ ] Sau đổi thành công → cập nhật `forceChangePassword = false` trong auth store → redirect đến trang chính

---

#### Trang: `/change-password` — Đổi mật khẩu

| API | Method | Service |
|-----|--------|---------|
| `POST /auth/change-password` | `authService.changePassword()` | ✅ |

**Trạng thái:** ✅ COMPLETE

---

### 3.4 WAREHOUSE_STAFF

> Scope: Chi nhánh của mình. Tập trung vào kho hàng.

**Entry point:** `/warehouse` → redirect sau login

#### Trang: `/warehouse` — Dashboard kho

| API | Method | Service |
|-----|--------|---------|
| `GET /report/reports/inventory?tab=current_stock` | `reportService.getInventoryReport()` | ⚠️ Chưa dùng |
| `GET /inventory/purchase-orders` | `purchaseOrderService.getAll()` | ✅ |

**Trạng thái:** ⚠️ PARTIAL  
**Việc cần làm:**
- [ ] Thêm KPI cards: tổng SKU, hàng sắp hết (low stock), PO chờ nhận
- [ ] Quick links đến `/inventory/stock`, `/inventory/purchase-orders`, `/inventory/adjustments`
- [ ] Widget cảnh báo low stock (lấy từ `reportService.getInventoryReport({ tab: 'current_stock' })`, filter `isLowStock = true`)

---

#### Trang: `/inventory/stock` — Xem tồn kho

| API | Method | Service |
|-----|--------|---------|
| `GET /report/reports/inventory?tab=current_stock` | `reportService.getInventoryReport()` | ⚠️ Cần đổi |

**Trạng thái:** ⚠️ Cần xem xét (FIX 2.1)  
**Việc cần làm:**
- [ ] **FIX 2.1:** Xác nhận endpoint thực tế. Nếu backend không có public `/inventory/stock`:
  - Dùng `reportService.getInventoryReport({ tab: 'current_stock' })`
  - **HOẶC** backend thêm `GET /inventory/stock?branchId=&page=&keyword=`
- [ ] Hiển thị: SKU, tên, quantity, minThreshold, badge LOW_STOCK nếu quantity ≤ threshold
- [ ] Search theo tên/SKU

---

#### Trang: `/inventory/adjustments` — Điều chỉnh kho

| API | Method | Service |
|-----|--------|---------|
| `POST /inventory/adjustments` | `inventoryService.createAdjustment()` | ✅ |
| `GET /catalog/products/search` | `productService.search()` | ✅ |
| `GET /inventory/adjustments/pending` | `inventoryService.getPendingAdjustments()` | ✅ |

**Trạng thái:** ✅ COMPLETE (sau khi fix mismatch 2.7)  
**Việc cần làm:**
- [ ] **FIX 2.7:** Đọc `inventory.large_adjustment_percent` từ `systemConfigService` để hiện cảnh báo "Cần duyệt khi > X%"
- [ ] Loại điều chỉnh: `DAMAGED / LOST / EXPIRED` — dropdown
- [ ] Mô tả bắt buộc khi tạo

---

#### Trang: `/inventory/purchase-orders` — Danh sách PO

| API | Method | Service |
|-----|--------|---------|
| `GET /inventory/purchase-orders` | `purchaseOrderService.getAll()` | ✅ |
| `POST /inventory/purchase-orders/:id/cancel` | `purchaseOrderService.cancel()` | ✅ |

**Trạng thái:** ✅ COMPLETE

---

#### Trang: `/inventory/purchase-orders/create` — Tạo PO

| API | Method | Service |
|-----|--------|---------|
| `POST /inventory/purchase-orders` | `purchaseOrderService.create()` | ✅ |
| `GET /inventory/suppliers` | `supplierService.getAll()` | ✅ |
| `GET /catalog/products/search` | `productService.search()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Submit PO: `POST /purchase-orders` tạo PENDING → sau đó `POST /purchase-orders/:id/submit` để chuyển sang chờ duyệt
- [ ] Mã PO tự sinh phía backend (format PO-YYYYMMDD-XXXX), chỉ hiển thị sau khi tạo

---

#### Trang: `/inventory/receive/[poId]` — Nhận hàng từ PO

| API | Method | Service |
|-----|--------|---------|
| `GET /inventory/purchase-orders/:id` | `purchaseOrderService.getById()` | ✅ |
| `POST /inventory/purchase-orders/:id/receive` | `purchaseOrderService.receive()` | ✅ |

**Trạng thái:** ✅ COMPLETE  
**Lưu ý:**
- [ ] Chỉ nhận được PO ở trạng thái `CONFIRMED`
- [ ] Nhập qty thực nhận, số lô, hạn sử dụng cho từng item
- [ ] Nhận thiếu → backend publish `po.received` → Manager nhận notification

---

## 4. Shared / Cross-role features

### 4.1 Notification Polling (tất cả roles)

| API | Trigger | Store |
|-----|---------|-------|
| `GET /notification-audit/notifications/unread-count` | Mỗi 30s | `notificationStore.startPolling()` |

**Việc cần làm:**
- [ ] Gọi `startPolling()` trong `ERPLayout` sau khi login (đã có `useNotificationPolling` hook)
- [ ] Gọi `stopPolling()` khi logout
- [ ] Badge số đỏ trên icon chuông trong Header
- [ ] Click chuông → `/notifications`
- [ ] Deep link từ notification → đúng trang (dùng `deepLinkPath` từ notification)

### 4.2 Login / Logout (tất cả roles)

| API | Method | Service |
|-----|--------|---------|
| `POST /auth/login` | `authStore.login()` | ✅ |
| `POST /auth/logout` | `authStore.logout()` | ✅ |

**Việc cần làm:**
- [ ] Sau login → redirect theo role (`ROLE_REDIRECT` map trong auth.store.ts)
- [ ] `forceChangePassword = true` → redirect `/force-change-password` (middleware đã xử lý)
- [ ] Tài khoản bị lock → hiện thông báo "Tài khoản bị khóa, liên hệ Admin"
- [ ] Sai mật khẩu → increment counter FE, hiện warning còn N lần

---

## 5. Pages cần tạo mới

### `/products/[id]` — Chi tiết sản phẩm

**Tạo file:** `src/app/products/[id]/page.tsx`

**APIs:**

| API | Method | Service |
|-----|--------|---------|
| `GET /catalog/products/:id` | `productService.getById()` | ✅ |

**UI cần có:**
- [ ] Ảnh sản phẩm (gallery nếu có nhiều)
- [ ] Thông tin: tên, SKU, barcode, danh mục, giá bán, giá vốn, trạng thái, hạn sử dụng
- [ ] Badge cảnh báo nếu hạn sử dụng < 30 ngày
- [ ] Nút "Sửa" → `/products/[id]/edit` (hiện với ADMIN/BRANCH_MANAGER)
- [ ] Nút "Ngừng bán" (hiện với ADMIN/BRANCH_MANAGER)
- [ ] Link quay lại danh sách sản phẩm

**Role access:** Tất cả roles (read-only cho CASHIER/WAREHOUSE_STAFF)

---

## 6. Pages cần hoàn thiện

### 6.1 `/admin` — Admin Dashboard

**Trạng thái:** ⚠️ PARTIAL — thiếu Recharts chart  
**Việc cần làm:**
- [ ] Import `AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer` từ recharts
- [ ] Map `dashboardData.revenueByDay[]` → data array `[{ date: '2026-05-01', revenue: 1200000 }]`
- [ ] Render `AreaChart` responsive, format VND trên tooltip
- [ ] KPI cards: Total Revenue, Order Count, AOV, Growth %
- [ ] Top products table: rank, tên sản phẩm, qty sold

### 6.2 `/branch-manager` — Dashboard chi nhánh

**Trạng thái:** ⚠️ PARTIAL  
**Việc cần làm:**
- [ ] Giống admin dashboard (copy chart logic từ `/admin` sau khi fix)
- [ ] Thêm widget "Đơn hủy chờ duyệt" → link `/manager/orders`
- [ ] Thêm widget "Điều chỉnh kho chờ duyệt" → link `/manager/inventory`

### 6.3 `/warehouse` — Warehouse Dashboard

**Trạng thái:** ⚠️ PARTIAL — thiếu navigation links  
**Việc cần làm:**
- [ ] Quick action cards: "Xem tồn kho", "Tạo phiếu nhập", "Điều chỉnh kho"
- [ ] Widget hàng sắp hết (low stock count)
- [ ] Widget PO đang chờ nhận hàng

### 6.4 `/force-change-password` — Đổi mật khẩu lần đầu

**Trạng thái:** ⚠️ SKELETON  
**Việc cần làm:** Xem [FIX 2.8](#28-force-change-password--oldpassword-hardcode-rỗng)

---

## 7. Bảo vệ Route theo Role (Middleware)

**Vấn đề hiện tại:** `middleware.ts` chỉ check JWT có tồn tại, chưa check role. Cashier có thể truy cập `/admin` bằng cách gõ URL thẳng.

**Bổ sung vào `src/middleware.ts`:**

```typescript
// Role-based route protection
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/user-management': ['ADMIN'],
  '/system-configuration': ['ADMIN'],
  '/audit-logs': ['ADMIN'],
  '/branch-manager': ['BRANCH_MANAGER'],
  '/manager': ['BRANCH_MANAGER', 'ADMIN'],
  '/pos': ['CASHIER', 'BRANCH_MANAGER', 'ADMIN'],
  '/cashier': ['CASHIER', 'BRANCH_MANAGER', 'ADMIN'],
  '/warehouse': ['WAREHOUSE_STAFF', 'BRANCH_MANAGER', 'ADMIN'],
  '/inventory': ['WAREHOUSE_STAFF', 'BRANCH_MANAGER', 'ADMIN'],
};
```

**Việc cần làm:**
- [ ] Đọc role từ JWT cookie (decode payload không verify — Gateway đã verify) **hoặc** từ `X-Role` header nếu middleware chạy phía server
- [ ] Nếu role không match → redirect về trang chính của role đó
- [ ] Test: login CASHIER → thử truy cập `/admin` → phải bị redirect

---

## 8. Types cần bổ sung / sửa

**File:** `src/types/index.ts`

### 8.1 Bổ sung thiếu

```typescript
// Supplier deactivate response (không có data)
// Đã đủ qua ApiResponse<null>

// PurchaseOrder submit action
// Đã có POStatus enum

// Inventory stock response (nếu dùng report-service)
export interface InventoryReportRow {
  productId: string;
  productName: string;
  sku: string;
  branchId: string;
  quantity: number;
  minThreshold: number;
  isLowStock: boolean;
}

// Async report job
export interface ReportJob {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultUrl?: string;
  createdAt: string;
}

// Adjustment request type
export type AdjustmentType = 'DAMAGED' | 'LOST' | 'EXPIRED';
export interface AdjustmentRequest {
  productId: string;
  quantity: number;
  type: AdjustmentType;
  description: string;
}
```

### 8.2 Sửa / xoá

```typescript
// Xoá: loyaltyService.getPointHistory() return type
// (endpoint không tồn tại trên backend)

// Thêm: redeem preview response
export interface RedeemPreviewResponse {
  pointsToRedeem: number;
  discountAmount: number;
  maxAllowed: number;
}
```

---

## 9. Thứ tự ưu tiên thực hiện

### 🔴 Phase 1 — Blocker fixes (làm trước, ảnh hưởng flow chính)

| # | Việc | File | Effort |
|---|------|------|--------|
| 1 | FIX 2.8: force-change-password page | `app/force-change-password/page.tsx` | 2h |
| 2 | FIX 2.5: getCancelRequests → đúng endpoint | `services/order.service.ts` + `app/manager/orders/page.tsx` | 2h |
| 3 | FIX 2.1: inventory stock endpoint | `services/inventory.service.ts` + `app/inventory/stock/page.tsx` | 3h |
| 4 | FIX 2.6: return by order endpoint | `services/order.service.ts` + `app/orders/[orderId]/page.tsx` | 1h |
| 5 | Middleware role guard | `middleware.ts` | 2h |

### 🟡 Phase 2 — Feature gaps (ảnh hưởng tính năng quan trọng)

| # | Việc | File | Effort |
|---|------|------|--------|
| 6 | FIX 2.2: Xử lý points history (ẩn hoặc thêm endpoint BE) | `loyalty/members/page.tsx` | 1h |
| 7 | FIX 2.3: Ẩn update/deactivate coupon | `coupons/page.tsx` + `coupon.service.ts` | 1h |
| 8 | FIX 2.4: Ẩn update promotion | `promotions/page.tsx` + `promotion.service.ts` | 1h |
| 9 | FIX 2.7: Đọc adjustment threshold từ system_configs | `inventory/adjustments/page.tsx` | 1h |
| 10 | Thêm supplier deactivate | `supplier.service.ts` + `supplier-management/page.tsx` | 1h |
| 11 | Tạo `/products/[id]` page | `app/products/[id]/page.tsx` | 3h |

### 🟠 Phase 3 — Polish & completion

| # | Việc | File | Effort |
|---|------|------|--------|
| 12 | Hoàn thiện admin dashboard chart | `admin/page.tsx` | 3h |
| 13 | Hoàn thiện branch-manager dashboard | `branch-manager/page.tsx` | 2h |
| 14 | Hoàn thiện warehouse dashboard | `warehouse/page.tsx` | 2h |
| 15 | Thêm export PDF inventory report | `report.service.ts` + `inventory-report/page.tsx` | 2h |
| 16 | Async report polling (>31 ngày) | `revenue-report/page.tsx` | 2h |
| 17 | Bổ sung types còn thiếu | `types/index.ts` | 1h |

**Tổng ước tính:** ~31 giờ

---

## 10. Checklist tổng

### Phase 1 — Blocker fixes
- [ ] `/force-change-password` — thêm field oldPassword, validate mật khẩu mới
- [ ] `orderService.getCancelRequests()` → đổi thành `GET /orders/branch/:branchId` + filter
- [ ] `inventoryService.getStock()` → xác nhận endpoint, đổi sang reportService nếu cần
- [ ] `returnService.getReturnsByOrder()` → đổi sang `GET /returns/:id`
- [ ] `middleware.ts` — thêm role-based route guard

### Phase 2 — Feature gaps
- [ ] Xử lý `loyaltyService.getPointHistory()` (ẩn UI hoặc thêm BE endpoint)
- [ ] Ẩn update/deactivate coupon (backend không có endpoint)
- [ ] Ẩn update promotion (backend không có endpoint)
- [ ] Đọc adjustment threshold từ `systemConfigService`
- [ ] `supplierService.deactivate()` → `POST /suppliers/:id/deactivate`
- [ ] Tạo `/products/[id]/page.tsx`

### Phase 3 — Polish
- [ ] Admin dashboard Recharts AreaChart
- [ ] Branch manager dashboard widgets
- [ ] Warehouse dashboard quick links
- [ ] `reportService.exportInventoryPdf(tab)`
- [ ] Async report polling flow
- [ ] Bổ sung types: `InventoryReportRow`, `ReportJob`, `AdjustmentRequest`, `RedeemPreviewResponse`

### Validation cuối cùng theo Role
- [ ] **ADMIN:** Login → `/admin` → test toàn bộ CRUD users, config, products, categories, audit log, reports
- [ ] **BRANCH_MANAGER:** Login → `/branch-manager` → test dashboard, duyệt hủy đơn, duyệt điều chỉnh kho, xác nhận PO
- [ ] **CASHIER:** Login → `/pos/shift` (mở ca) → `/pos/order` (tạo đơn + coupon + loyalty) → `/cashier/orders` → `/returns/new`
- [ ] **WAREHOUSE_STAFF:** Login → `/warehouse` → `/inventory/stock` → `/inventory/purchase-orders/create` → `/inventory/receive/[poId]` → `/inventory/adjustments`
- [ ] **Cross-role:** Notification polling hiện đúng, deep link hoạt động, force-change-password chặn đúng

---

*Tài liệu này phản ánh trạng thái tại 2026-05-15. Cập nhật khi hoàn thành từng phase.*
