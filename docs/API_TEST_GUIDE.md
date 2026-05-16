# BeautyERP — Hướng dẫn Kiểm thử API từ Frontend

> **Ngày tạo:** 2026-05-16  
> **Phiên bản:** 1.0  
> **Mục tiêu:** Kiểm thử toàn bộ luồng API từ Frontend (Next.js) qua API Gateway đến các microservice backend theo từng role.

---

## Mục lục

1. [Môi trường & Chuẩn bị](#1-môi-trường--chuẩn-bị)
2. [Tài khoản kiểm thử](#2-tài-khoản-kiểm-thử)
3. [Kiểm thử theo Role — ADMIN](#3-kiểm-thử-theo-role--admin)
4. [Kiểm thử theo Role — CASHIER](#4-kiểm-thử-theo-role--cashier)
5. [Kiểm thử theo Role — WAREHOUSE_STAFF](#5-kiểm-thử-theo-role--warehouse_staff)
6. [Kiểm thử theo Role — BRANCH_MANAGER](#6-kiểm-thử-theo-role--branch_manager)
7. [Luồng nghiệp vụ liên service](#7-luồng-nghiệp-vụ-liên-service)
8. [Kết quả kiểm thử thực tế (2026-05-16)](#8-kết-quả-kiểm-thử-thực-tế-2026-05-16)
9. [Các vấn đề đã phát hiện](#9-các-vấn-đề-đã-phát-hiện)

---

## 1. Môi trường & Chuẩn bị

### 1.1 Services cần chạy

| Service | Port | Lệnh khởi động |
|---------|------|---------------|
| PostgreSQL | 5433 | Docker container |
| Redis | 6379 | Docker container |
| RabbitMQ | 5672 | Docker container |
| API Gateway | 8080 | `java -jar api-gateway-*.jar` |
| auth-service | 8081 | `java -jar auth-service-*.jar` |
| catalog-service | 8082 | `java -jar catalog-service-*.jar` |
| order-service | 8083 | `java -jar order-service-*.jar` |
| inventory-service | 8084 | `java -jar inventory-service-*.jar` |
| loyalty-promotion-service | 8085 | `java -jar loyalty-promotion-service-*.jar` |
| report-service | 8086 | `java -jar report-service-*.jar` |
| notification-audit-service | 8087 | `java -jar notification-audit-service-*.jar` |
| Frontend (Next.js) | 3000 | `npm run dev` |

### 1.2 Biến môi trường frontend

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 1.3 Cách đọc bảng test

Mỗi test case ghi rõ:
- **Trang (FE)**: URL trang trong Next.js
- **Hành động UI**: thao tác người dùng thực hiện
- **Service method**: hàm trong `src/services/*.service.ts`
- **API call**: `METHOD /api/v1{path}`
- **Expected**: HTTP status + nội dung response mong đợi
- **✅/❌**: kết quả kiểm thử thực tế

---

## 2. Tài khoản kiểm thử

| Username | Password | Role | Branch |
|----------|----------|------|--------|
| `admin` | `Admin@1234` | ADMIN | null (toàn hệ thống) |
| `testcreate1` | `Admin@1234` | CASHIER | `11111111-1111-1111-1111-111111111111` |
| *(tạo thêm)* | *(tự đặt)* | WAREHOUSE_STAFF | Branch ID cụ thể |
| *(tạo thêm)* | *(tự đặt)* | BRANCH_MANAGER | Branch ID cụ thể |

> **Lưu ý:** Tài khoản mới tạo sẽ có `forceChangePassword = true` — phải đổi mật khẩu trước khi dùng. Xem [Section 3.1.2](#312-tạo-tài-khoản-mới--change-password-flow).

---

## 3. Kiểm thử theo Role — ADMIN

> **Scope:** Toàn hệ thống, không bị giới hạn branch.  
> **Redirect sau login:** `/admin`

### 3.1 Auth & Account Management

#### 3.1.1 Đăng nhập

| | Chi tiết |
|---|---|
| **Trang (FE)** | `/login` |
| **Hành động UI** | Nhập username `admin`, password `Admin@1234` → Click "Đăng nhập" |
| **Service method** | `authService.login({ username, password })` |
| **API call** | `POST /api/v1/auth/login` |
| **Body** | `{ "username": "admin", "password": "Admin@1234" }` |
| **Expected** | `200` · Cookie `jwt` được set · Redirect `/admin` |
| **Kiểm tra thêm** | Browser DevTools → Application → Cookies: xem `jwt` là httpOnly |

#### 3.1.2 Tạo tài khoản mới + Change Password flow

| Bước | Trang (FE) | Hành động UI | API call | Expected |
|------|-----------|--------------|----------|---------|
| 1 | `/user-management` | Click "Thêm tài khoản" | — | Modal mở |
| 2 | Modal | Điền form: fullName, username, password, role=CASHIER, branchId | `POST /api/v1/auth/accounts` | `201` · AccountResponse |
| 3 | — | Đăng nhập bằng tài khoản mới | `POST /api/v1/auth/login` | `200` · `forceChangePassword: true` |
| 4 | `/force-change-password` | Redirect tự động | — | Middleware chặn mọi route khác |
| 5 | Form | Nhập mật khẩu tạm (mà Admin đã đặt) + mật khẩu mới (≥8 ký tự, hoa/thường/số) | `POST /api/v1/auth/change-password` | `200` |
| 6 | — | Redirect `/pos/shift` (với CASHIER) | — | Cookie `jwt` mới |

**Quy tắc mật khẩu mới:**
- Tối thiểu 8 ký tự
- Có chữ hoa + chữ thường + số
- Không trùng mật khẩu cũ

#### 3.1.3 Quản lý tài khoản

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Xem danh sách | Load `/user-management` | `GET /api/v1/auth/accounts` | `200` · Array accounts |
| Sửa tài khoản | Click "Sửa" → edit form → Save | `PUT /api/v1/auth/accounts/{id}` | `200` · AccountResponse updated |
| Vô hiệu hóa | Click "Vô hiệu hóa" | `DELETE /api/v1/auth/accounts/{id}` | `200` · soft-delete |
| Mở khóa | Click "Mở khóa" (account bị lock ≥5 sai password) | `PATCH /api/v1/auth/accounts/{id}/unlock` | `200` |

> **Kiểm tra vô hiệu hóa:** Đăng nhập tài khoản vừa vô hiệu hóa → phải nhận lỗi, không login được.

#### 3.1.4 Đăng xuất

| | Chi tiết |
|---|---|
| **Trang (FE)** | Bất kỳ trang nào → Header → Click avatar → "Đăng xuất" |
| **API call** | `POST /api/v1/auth/logout` |
| **Expected** | `200` · Cookie `jwt` bị xóa · Redirect `/login` |

---

### 3.2 System Configuration

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Xem cấu hình | Load `/system-configuration` | `GET /api/v1/auth/system-configs` | `200` · Array key-value |
| Xem theo key | Click vào 1 config | `GET /api/v1/auth/system-configs/{key}` | `200` · `{ configKey, configValue }` |
| Cập nhật | Edit value → Save | `PUT /api/v1/auth/system-configs/{key}` | `200` · Giá trị mới |

**Keys quan trọng cần test:**

| Key | Default | Ảnh hưởng |
|-----|---------|----------|
| `loyalty.points_rate` | `10000` | Đồng/điểm khi tích điểm |
| `loyalty.max_redeem_percent` | `50` | Tối đa % giá trị đơn được đổi điểm |
| `order.cancel_approval_threshold` | `500000` | Ngưỡng hủy đơn cần duyệt (VND) |
| `inventory.large_adjustment_percent` | `10` | % điều chỉnh kho cần Manager duyệt |
| `inventory.expiry_alert_days` | `7` | Ngày trước hạn để cảnh báo |

> **Verify ngay:** Sau khi đổi config → không restart service → config mới có hiệu lực.

---

### 3.3 Catalog — Danh mục & Sản phẩm

#### 3.3.1 Danh mục

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Xem cây danh mục | Load `/categories` | `GET /api/v1/catalog/categories` | `200` · Tree 2 cấp |
| Tạo danh mục cha | Form "Thêm" → name, description | `POST /api/v1/catalog/categories` | `201` |
| Tạo danh mục con | Chọn parent → form "Thêm" | `POST /api/v1/catalog/categories` với `parentId` | `201` |
| Sửa danh mục | Click "Sửa" → edit → save | `PUT /api/v1/catalog/categories/{id}` | `200` |
| Xóa danh mục rỗng | Click "Xóa" (không có sản phẩm) | `DELETE /api/v1/catalog/categories/{id}` | `200` |
| Xóa danh mục có SP | Click "Xóa" | `DELETE /api/v1/catalog/categories/{id}` | `409` · "Danh mục đang có sản phẩm" |

#### 3.3.2 Sản phẩm

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Tìm kiếm | Load `/products` → nhập keyword | `GET /api/v1/catalog/products/search?query=&page=&size=` | `200` · PaginatedResponse |
| Tạo sản phẩm | `/products/create` → điền form + upload ảnh | `POST /api/v1/catalog/products` (multipart/form-data) | `201` |
| Xem chi tiết | Click vào sản phẩm | `GET /api/v1/catalog/products/{id}` | `200` |
| Sửa sản phẩm | `/products/{id}/edit` → edit → save | `PUT /api/v1/catalog/products/{id}` (multipart) | `200` |
| Ngừng kinh doanh | Click "Ngừng kinh doanh" | `DELETE /api/v1/catalog/products/{id}` | `200` · soft-delete |

**Kiểm tra ràng buộc:**
- Giá vốn > giá bán → cảnh báo nhưng vẫn lưu được
- SKU trùng → `409 Conflict`
- Hạn sử dụng là ngày quá khứ → validation lỗi

---

### 3.4 Dashboard ADMIN

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Load dashboard | Truy cập `/admin` | `GET /api/v1/report/dashboard` | `200` · DashboardData (KPI cards, charts) |
| Dashboard DB fail | (mock lỗi) | `GET /api/v1/report/dashboard` | `200` · `{}` (không show lỗi cho user) |

---

### 3.5 Báo cáo

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Doanh thu ≤31 ngày | `/revenue-report` → chọn from/to ≤31 ngày | `GET /api/v1/report/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD` | `200` · RevenueReport |
| Doanh thu >31 ngày | Chọn khoảng dài → Submit | `POST /api/v1/report/reports/revenue/async` | `202` · `{ jobId }` |
| Poll kết quả async | Frontend tự poll | `GET /api/v1/report/reports/jobs/{jobId}/result` | `200` khi xong · `202` khi đang xử lý |
| Tồn kho hiện tại | `/inventory-report` → tab "Tồn kho hiện tại" | `GET /api/v1/report/reports/inventory?tab=current_stock` | `200` |
| Hàng chậm luân chuyển | Tab "Chậm luân chuyển" | `GET /api/v1/report/reports/inventory?tab=slow_moving` | `200` |
| Gần hết hạn | Tab "Gần hết hạn" | `GET /api/v1/report/reports/inventory?tab=near_expiry` | `200` |
| Export PDF | Click "Xuất PDF" | `POST /api/v1/report/reports/inventory/export` | `200` · PDF blob |

---

### 3.6 Audit Log & Notifications

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Xem audit log | `/audit-logs` | `GET /api/v1/notification-audit/audit-logs` | `200` · Array AuditLog |
| Filter audit | Chọn entityType, action, from/to | `GET /api/v1/notification-audit/audit-logs?entityType=&action=&from=&to=` | `200` · filtered |
| Xem thông báo | Click chuông → `/notifications` | `GET /api/v1/notification-audit/notifications` | `200` · Array Notification |
| Số thông báo chưa đọc | Auto polling 30s | `GET /api/v1/notification-audit/notifications/unread-count` | `200` · `{ count: N }` |
| Đánh dấu đã đọc | Click vào 1 notification | `PATCH /api/v1/notification-audit/notifications/{id}/read` | `200` |
| Đánh dấu tất cả | Click "Đánh dấu tất cả đã đọc" | `PATCH /api/v1/notification-audit/notifications/read-all` | `200` |

---

## 4. Kiểm thử theo Role — CASHIER

> **Scope:** Chỉ trong ca làm việc của mình, trong branch được gán.  
> **Redirect sau login:** `/pos/shift`  
> **Điều kiện bắt buộc:** Phải có ca `OPEN` trước khi tạo đơn hàng.

### 4.1 Quản lý Ca làm việc (Shift)

#### 4.1.1 Mở ca

| | Chi tiết |
|---|---|
| **Trang (FE)** | `/pos/shift` |
| **Hành động UI** | Nhập số tiền đầu ca → Click "Mở ca" |
| **Service method** | `shiftService.open({ openingCash })` |
| **API call** | `POST /api/v1/order/shifts` |
| **Body** | `{ "openingCash": 1000000 }` |
| **Expected** | `201` · ShiftResponse với `status: "OPEN"` |
| **Verify** | Không thể mở ca thứ 2 khi đang có ca OPEN |

**Test bảo vệ trùng ca:**

| Test | API call | Expected |
|------|----------|---------|
| Mở ca đang có ca OPEN | `POST /api/v1/order/shifts` lần 2 | `409` · "SHIFT_ALREADY_OPEN" |
| ADMIN cố mở ca (không có branchId) | `POST /api/v1/order/shifts` | `403` · "BRANCH_REQUIRED" |

#### 4.1.2 Xem ca hiện tại

| | Chi tiết |
|---|---|
| **Hành động UI** | Load `/pos/shift` khi đã có ca |
| **API call** | `GET /api/v1/order/shifts/current` |
| **Expected** | `200` · ShiftResponse `status: "OPEN"` |

#### 4.1.3 Đóng ca

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | Nhập `closingCash` → Click "Đóng ca" | `POST /api/v1/order/shifts/{id}/close` | `200` |
| 2 | closingCash = openingCash (không chênh lệch) | Body: `{ "closingCash": 1000000 }` | `200` · `variance: 0` |
| 3 | closingCash ≠ tổng (có chênh lệch) | Body: `{ "closingCash": 900000 }` | `400` nếu không có `note` |
| 4 | Có chênh lệch + nhập note | Body: `{ "closingCash": 900000, "note": "Thiếu 100k" }` | `200` · variance = -100000 |
| 5 | Đóng ca → Manager nhận notification | RabbitMQ: `shift.closed` | Notification-audit tạo thông báo |

---

### 4.2 POS — Tạo đơn hàng

#### 4.2.1 Luồng tạo đơn cơ bản

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | Vào `/pos/order` | — | Phải có ca OPEN, nếu không → redirect `/pos/shift` |
| 2 | Tìm sản phẩm theo tên/SKU | `GET /api/v1/catalog/products/search?query=` | `200` · Danh sách SP |
| 3 | Thêm vào giỏ | localStorage draft | Giỏ hàng cập nhật |
| 4 | Click "Thanh toán" | `POST /api/v1/order/orders` + Header `Idempotency-Key: {uuid}` | `201` · `{ orderId, receiptUrl }` |
| 5 | Bấm 2 lần (idempotency) | `POST /api/v1/order/orders` với cùng key | `200` · Kết quả cũ (không tạo đơn trùng) |

**Body tạo đơn:**
```json
{
  "shiftId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 2, "unitPrice": 150000 }
  ],
  "discountAmount": 0,
  "pointsRedeemed": 0,
  "couponCode": null,
  "loyaltyMemberId": null,
  "paymentMethod": "CASH",
  "cashReceived": 300000
}
```

#### 4.2.2 Tích điểm Loyalty

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | Nhập SĐT khách hàng | `GET /api/v1/loyalty-promotion/members?phone=0700012345` | `200` · LoyaltyMember |
| 2 | KH chưa đăng ký | `GET /api/v1/loyalty-promotion/members?phone=` | `404` → hiện nút "Đăng ký" |
| 3 | Đăng ký mới | Form → Submit | `POST /api/v1/loyalty-promotion/members` | `200` · LoyaltyMember mới |
| 4 | Thanh toán có member | Gắn `memberId` vào order | `POST /api/v1/order/orders` với `memberId` | `201` |
| 5 | Điểm tích async | RabbitMQ `order.confirmed` → loyalty-service | Điểm được cộng sau vài giây |

**Công thức tích điểm:** `floor(actualAmountPaid / points_rate)` (points_rate đọc từ system_configs)

#### 4.2.3 Đổi điểm

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | Xem số dư điểm | `GET /api/v1/loyalty-promotion/members/{id}` | `200` · `{ pointBalance }` |
| 2 | Preview đổi điểm | Nhập số điểm muốn đổi | `POST /api/v1/loyalty-promotion/members/{id}/redeem-preview` | `200` · `{ discount, pointsUsed }` |
| 3 | Xác nhận đổi | Click "Xác nhận đổi điểm" | `POST /api/v1/loyalty-promotion/members/{id}/redeem` | `200` · Số dư giảm |
| 4 | Vượt 50% giá trị đơn | Nhập điểm > 50% | `400` · "Quá tối đa 50% giá trị đơn" |

#### 4.2.4 Coupon

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | Nhập mã coupon | Click "Áp dụng" | `POST /api/v1/loyalty-promotion/coupons/validate` | `200` · `{ discountAmount, promotionId, promotionName }` |
| 2 | Coupon hết hạn | — | `400` · "Coupon đã hết hạn" |
| 3 | Coupon hết lượt | — | `409` · Hết lượt sử dụng |
| 4 | Order total < min_order_value | — | `400` · "Đơn hàng chưa đủ giá trị tối thiểu" |

---

### 4.3 Xem Lịch sử Đơn hàng

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Đơn trong ca | `/cashier/orders` | `GET /api/v1/order/orders/my` | `200` · Chỉ đơn trong ca hiện tại |
| Chi tiết đơn | Click vào đơn | `GET /api/v1/order/orders/{id}` | `200` · OrderDetail với items |
| Hóa đơn PDF | Click "In lại hóa đơn" | `GET /api/v1/order/orders/receipts/{id}` | `200` · PDF blob (immutable snapshot) |

---

### 4.4 Hủy Đơn

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Hủy đơn ≤500.000đ | Click "Hủy đơn" → xác nhận | `POST /api/v1/order/orders/{id}/cancel` | `200` · Đơn CANCELLED · Kho được hoàn |
| Hủy đơn >500.000đ | Click "Hủy đơn" → xác nhận | `POST /api/v1/order/orders/{id}/cancel` | `202` · cancel_log tạo PENDING → chờ Manager duyệt |
| Hủy đơn đã CANCELLED | Thử cancel lần 2 | `POST /api/v1/order/orders/{id}/cancel` | `409` |

> **Ngưỡng `500.000đ`** đọc từ `system_configs.order.cancel_approval_threshold` — không hardcode.

---

### 4.5 Trả hàng (Return)

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | `/returns/new` → Nhập mã đơn gốc | `GET /api/v1/order/orders/{id}` | `200` · OrderDetail |
| 2 | Chọn items muốn trả, nhập số lượng | — | Validate qty ≤ qty_original |
| 3 | Confirm trả | Submit form | `POST /api/v1/order/returns` | `200` · ReturnTransaction · Kho được hoàn |
| 4 | Trả quá số lượng | qty_return > qty_original | `400` · Validation lỗi |
| 5 | Xem chi tiết return | `GET /api/v1/order/returns/{id}` | `200` · ReturnDetail |

**Body trả hàng:**
```json
{
  "originalOrderId": "uuid",
  "shiftId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 1 }
  ],
  "reason": "Sản phẩm lỗi"
}
```

---

## 5. Kiểm thử theo Role — WAREHOUSE_STAFF

> **Scope:** Trong branch được gán. Quản lý kho, nhập hàng.  
> **Redirect sau login:** `/warehouse`

### 5.1 Xem Tồn kho

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Tồn kho hiện tại | `/inventory/stock` | `GET /api/v1/report/reports/inventory?tab=current_stock` | `200` · Array stock items |
| Badge tồn kho thấp | Auto highlight | (trong response: `quantity ≤ minThreshold`) | Badge "Thấp" hiển thị |

> **Lưu ý:** Endpoint tồn kho thực chất đến từ **report-service** (qua internal FeignClient từ inventory-service), không phải inventory-service trực tiếp.

---

### 5.2 Nhà cung cấp (Supplier)

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Danh sách | `/supplier-management` | `GET /api/v1/inventory/suppliers` | `200` · Array suppliers |
| Xem chi tiết | Click vào supplier | `GET /api/v1/inventory/suppliers/{id}` | `200` |
| Tạo mới | Form → Submit | `POST /api/v1/inventory/suppliers` | `201` |
| Cập nhật | Edit → Save | `PUT /api/v1/inventory/suppliers/{id}` | `200` |
| Vô hiệu hóa | Click "Vô hiệu hóa" | `POST /api/v1/inventory/suppliers/{id}/deactivate` | `200` |

---

### 5.3 Đơn nhập hàng (Purchase Order)

#### 5.3.1 Tạo PO

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | `/inventory/purchase-orders/create` | — | Load danh sách suppliers |
| 2 | Chọn supplier, thêm items, số lượng, đơn giá | — | Form validation |
| 3 | Click "Tạo PO" | `POST /api/v1/inventory/purchase-orders` | `201` · PO với status `PENDING` · Mã PO-YYYYMMDD-XXXX |

**PO State Machine:** `PENDING → CONFIRMED → FULLY_RECEIVED / PARTIALLY_RECEIVED / CANCELLED`

| State | Action | API call | Ai thực hiện |
|-------|--------|----------|-------------|
| PENDING | Submit để duyệt | `POST /api/v1/inventory/purchase-orders/{id}/submit` | WAREHOUSE_STAFF |
| PENDING | Huỷ | `POST /api/v1/inventory/purchase-orders/{id}/cancel` | WAREHOUSE_STAFF |
| CONFIRMED | Nhận hàng | `POST /api/v1/inventory/purchase-orders/{id}/receive` | WAREHOUSE_STAFF |

> **Xem Section 6.3** để biết cách BRANCH_MANAGER confirm PO.

#### 5.3.2 Nhận hàng từ PO

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | `/inventory/receive/{poId}` | `GET /api/v1/inventory/purchase-orders/{id}` | `200` · PO detail với items |
| 2 | Nhập qty nhận, số lô, hạn SD cho từng item | — | Form |
| 3 | Confirm nhận | `POST /api/v1/inventory/purchase-orders/{id}/receive` | `200` · Kho cộng quantity |
| 4 | Nhận đủ | qty_received = qty_ordered | PO status → `FULLY_RECEIVED` |
| 5 | Nhận thiếu | qty_received < qty_ordered | PO status → `PARTIALLY_RECEIVED` · Notification gửi Manager |

**Body nhận hàng:**
```json
{
  "items": [
    {
      "poItemId": "uuid",
      "receivedQty": 50,
      "lotNumber": "LOT-2026-001",
      "expiryDate": "2027-05-16"
    }
  ]
}
```

---

### 5.4 Điều chỉnh Kho (Adjustment)

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | `/inventory/adjustments` → Click "Tạo điều chỉnh" | — | Form |
| 2 | Chọn sản phẩm, nhập qty giảm, loại (DAMAGED/LOST/EXPIRED), mô tả bắt buộc | — | Form validation |
| 3 | qty ≤ 10% tồn kho | Submit | `POST /api/v1/inventory/adjustments` | `201` · Adjustment APPROVED ngay · Kho giảm |
| 4 | qty > 10% tồn kho | Submit | `POST /api/v1/inventory/adjustments` | `201` · Adjustment `PENDING` · Chờ Manager duyệt |

> **Ngưỡng 10%** đọc từ `system_configs.inventory.large_adjustment_percent`.

**Body điều chỉnh:**
```json
{
  "productId": "uuid",
  "quantityDelta": -5,
  "lossType": "DAMAGED",
  "description": "Hàng vỡ trong quá trình vận chuyển"
}
```

---

## 6. Kiểm thử theo Role — BRANCH_MANAGER

> **Scope:** Trong branch được gán. Kế thừa quyền Cashier + Warehouse Staff.  
> **Redirect sau login:** `/branch-manager`

### 6.1 Dashboard Chi nhánh

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Load dashboard | `/branch-manager` | `GET /api/v1/report/dashboard` | `200` · Data scoped theo branchId của Manager |

---

### 6.2 Duyệt Hủy Đơn

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | `/manager/orders` → Tab "Chờ duyệt hủy" | `GET /api/v1/order/orders/branch/{branchId}` | `200` · filter `cancelStatus = PENDING` |
| 2 | Click "Duyệt hủy" | `POST /api/v1/order/orders/{id}/cancel/approve` | `200` · Đơn CANCELLED · Kho hoàn |
| 3 | Click "Từ chối" | `POST /api/v1/order/orders/{id}/cancel/reject` | `200` · cancel_log REJECTED |

---

### 6.3 Duyệt Đơn Nhập Hàng (PO)

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | `/manager/purchase-orders` | `GET /api/v1/inventory/purchase-orders?status=PENDING` | `200` |
| 2 | Click "Confirm" | `POST /api/v1/inventory/purchase-orders/{id}/confirm` | `200` · PO → CONFIRMED |
| 3 | Click "Hủy PO" | `POST /api/v1/inventory/purchase-orders/{id}/cancel` | `200` · PO → CANCELLED |

---

### 6.4 Duyệt Điều chỉnh Kho

| Bước | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| 1 | `/manager/inventory` → Danh sách chờ duyệt | `GET /api/v1/inventory/adjustments/pending` | `200` |
| 2 | Click "Duyệt" | `POST /api/v1/inventory/adjustments/{id}/approve` | `200` · Kho giảm ngay |
| 3 | Click "Từ chối" | `POST /api/v1/inventory/adjustments/{id}/reject` | `200` · Adjustment REJECTED |

---

### 6.5 Quản lý Sản phẩm (scoped)

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Xem danh sách | `/manager/products` | `GET /api/v1/catalog/products/search` | `200` |
| Sửa sản phẩm | Edit form → Save | `PUT /api/v1/catalog/products/{id}` | `200` |

---

### 6.6 Báo cáo (scoped theo branch)

| Test | Hành động UI | API call | Expected |
|------|--------------|----------|---------|
| Doanh thu | `/revenue-report` | `GET /api/v1/report/reports/revenue?from=&to=` | `200` · Data của branch này |
| Tồn kho | `/inventory-report` | `GET /api/v1/report/reports/inventory?tab=current_stock` | `200` |

---

## 7. Luồng nghiệp vụ liên service

### 7.1 Luồng tạo đơn hàng hoàn chỉnh (End-to-End)

```
[FE: /pos/order] ──POST /order/orders + Idempotency-Key──► [order-service]
                                                              │
                                    ┌─────────────────────────┘
                                    │ FeignClient (internal)
                                    ▼
                            [inventory-service]
                            deductStock() ── thành công
                                    │
                          COMMIT transaction
                                    │
                    ┌───────────────┴──────────────┐
                    ▼                              ▼
          Publish order.confirmed          Generate PDF receipt
          (RabbitMQ)                               │
                    │                              ▼
          ┌─────────┼─────────────┐        [Return receiptUrl]
          ▼         ▼             ▼
    [loyalty]  [report]  [notification-audit]
  tích điểm  update     ghi audit log
             dashboard
```

**Test verify:**
1. Tạo đơn → `201` trả về
2. Kiểm tra inventory giảm đúng quantity
3. Sau 2-3 giây: `GET /loyalty-promotion/members/{id}` → `pointBalance` tăng
4. `GET /report/dashboard` → `orderCount` và `totalRevenue` tăng
5. `GET /notification-audit/audit-logs` → có bản ghi audit mới

### 7.2 Luồng cảnh báo tồn kho thấp

```
[inventory-service] ── sau deductStock ──► AlertService.checkThreshold()
                                              │
                    quantity ≤ min_threshold  │
                                              ▼
                              Redis SETNX "alert:{productId}:{branchId}:low_stock" EX 86400
                              (dedup trong 24h — không spam)
                                              │
                                              ▼
                              [notification-audit-service]
                              INSERT notification (LOW_STOCK)
                                              │
                                              ▼
                    [FE: polling 30s] ◄── GET /notification-audit/notifications/unread-count
```

**Test verify:** Đặt tồn kho sản phẩm về sát ngưỡng → tạo đơn → Cashier thấy badge notification mới.

### 7.3 Luồng hủy đơn có duyệt

```
[Cashier: /pos/order] ──POST /orders/{id}/cancel──► [order-service]
                                                       │
                            total > threshold          │
                                                       ▼
                                          INSERT cancel_log (PENDING)
                                          publish cancel.requested
                                                       │
                                                       ▼
                                   [notification-audit-service]
                                   INSERT notification cho Manager
                                                       │
                                                       ▼
                   [Manager: /manager/orders] ◄── GET /order/orders/branch/{branchId}
                                                  filter cancelStatus=PENDING
                                                       │
                   POST /orders/{id}/cancel/approve    │
                   ───────────────────────────────────►│
                                                       ▼
                                     BEGIN TX → CANCELLED → hoàn kho → COMMIT
```

---

## 8. Kết quả kiểm thử thực tế (2026-05-16)

### 8.1 Kiểm thử API trực tiếp (curl qua API Gateway :8080)

| # | Service | Endpoint | Method | Expected | Kết quả |
|---|---------|----------|--------|----------|---------|
| 1 | Auth | `/auth/login` | POST | 200 | ✅ PASS |
| 2 | Auth | `/auth/accounts` | GET | 200 | ✅ PASS |
| 3 | Auth | `/auth/system-configs` | GET | 200 | ✅ PASS |
| 4 | Auth | `/auth/system-configs/points_rate` | GET | 200 | ✅ PASS |
| 5 | Auth | `/auth/system-configs/points_rate` | PUT | 200 | ✅ PASS |
| 6 | Auth | `/auth/accounts` (create) | POST | 201 | ✅ PASS |
| 7 | Catalog | `/catalog/categories` | GET | 200 | ✅ PASS |
| 8 | Catalog | `/catalog/categories` | POST | 201 | ✅ PASS |
| 9 | Catalog | `/catalog/categories/{id}` | GET | 200 | ✅ PASS |
| 10 | Catalog | `/catalog/products/search` | GET | 200 | ✅ PASS |
| 11 | Order | `/order/shifts` (open) | POST | 201 | ✅ PASS |
| 12 | Order | `/order/shifts/current` | GET | 200 | ✅ PASS |
| 13 | Order | `/order/shifts/{id}` | GET | 200 | ✅ PASS |
| 14 | Order | `/order/shifts` (duplicate) | POST | 409 | ✅ PASS |
| 15 | Order | `/order/shifts` (admin no branch) | POST | 403 | ✅ PASS |
| 16 | Order | `/order/shifts/{id}/close` | POST | 200 | ✅ PASS |
| 17 | Inventory | `/inventory/suppliers` | GET | 200 | ✅ PASS |
| 18 | Inventory | `/inventory/suppliers` | POST | 201 | ✅ PASS |
| 19 | Inventory | `/inventory/purchase-orders` | GET | 200 | ✅ PASS |
| 20 | Inventory | `/inventory/adjustments/pending` | GET | 200 | ✅ PASS |
| 21 | Loyalty | `/loyalty-promotion/members/all` | GET | 200 | ✅ PASS |
| 22 | Loyalty | `/loyalty-promotion/members` | POST | 200 | ✅ PASS |
| 23 | Loyalty | `/loyalty-promotion/members?phone=` | GET | 200 | ✅ PASS |
| 24 | Loyalty | `/loyalty-promotion/members/{id}` | GET | 200 | ✅ PASS |
| 25 | Loyalty | `/loyalty-promotion/promotions` | GET | 200 | ✅ PASS |
| 26 | Loyalty | `/loyalty-promotion/coupons?promotionId=` | GET | 200 | ✅ PASS |
| 27 | Report | `/report/dashboard` | GET | 200 | ✅ PASS |
| 28 | Report | `/report/reports/revenue?from=&to=` | GET | 200 | ✅ PASS |
| 29 | Report | `/report/reports/inventory?tab=current_stock` | GET | 200 | ✅ PASS |
| 30 | Report | `/report/reports/inventory?tab=slow_moving` | GET | 200 | ✅ PASS |
| 31 | Report | `/report/reports/inventory?tab=near_expiry` | GET | 200 | ✅ PASS |
| 32 | Notif-Audit | `/notification-audit/notifications` | GET | 200 | ✅ PASS |
| 33 | Notif-Audit | `/notification-audit/notifications/unread-count` | GET | 200 | ✅ PASS |
| 34 | Notif-Audit | `/notification-audit/audit-logs` | GET | 200 | ✅ PASS |

**Tổng kết: 34/34 PASS (30 unique endpoints, kiểm thử qua curl trực tiếp)**

### 8.2 Endpoints chưa kiểm thử (48/78)

Phần lớn chưa test là các luồng phức tạp cần dữ liệu chuỗi (tạo PO → confirm → receive; tạo đơn → cancel → approve):

| Service | Chưa test |
|---------|-----------|
| Auth | logout, change-password, accounts/{id} GET/PUT/DELETE, accounts/{id}/unlock |
| Catalog | categories PUT/DELETE, products/{id} GET/POST/PUT/DELETE, images/{filename} |
| Order | orders (tất cả), returns (tất cả) |
| Inventory | adjustments POST/approve/reject, PO POST/submit/confirm/cancel/receive/{id} GET, suppliers/{id} GET/PUT/deactivate |
| Loyalty | members/check, redeem-preview, redeem, promotions/{id}/POST/DELETE, coupons POST/validate |
| Report | inventory/export, revenue/async, jobs/{jobId}/result |
| Notif-Audit | notifications/{id}/read, notifications/read-all |

---

## 9. Các vấn đề đã phát hiện

### 9.1 Bugs đã fix trong session này (2026-05-16)

| # | Vấn đề | Service | File | Trạng thái |
|---|--------|---------|------|-----------|
| 1 | `POST /order/shifts` → 500 — PostgreSQL enum type mismatch khi SELECT | order-service | `ShiftRepository.java` | ✅ Fixed |
| 2 | `POST /order/shifts` → 500 — PostgreSQL enum type mismatch khi INSERT | order-service | `Shift.java` | ✅ Fixed |
| 3 | `POST /loyalty-promotion/members` → 500 — branch_id NOT NULL nhưng admin không có branchId | loyalty-promotion-service | `LoyaltyMember.java` + Migration V2 | ✅ Fixed |

**Chi tiết fix #1 & #2:**
```java
// Shift.java — giữ @JdbcTypeCode(SqlTypes.NAMED_ENUM) để Hibernate bind đúng type khi INSERT
@Enumerated(EnumType.STRING)
@JdbcTypeCode(SqlTypes.NAMED_ENUM)  // BẮT BUỘC để INSERT không bị "character varying" error
@Column(name = "status", nullable = false)
private ShiftStatus status = ShiftStatus.OPEN;

// ShiftRepository.java — native query với CAST để SELECT WHERE không bị "operator does not exist"
@Query(value = "SELECT * FROM order_service.shifts WHERE cashier_id = :cashierId AND status = CAST(:status AS shift_status) LIMIT 1", nativeQuery = true)
Optional<Shift> findByCashierIdAndStatus(@Param("cashierId") UUID cashierId, @Param("status") String status);

// ShiftService.java — truyền String thay vì enum
shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN.name())
```

### 9.2 API Mismatch Frontend ↔ Backend (chưa fix)

| # | Vấn đề | Priority | Giải pháp |
|---|--------|----------|----------|
| M1 | `inventoryService.getStock()` gọi `GET /inventory/inventory/stock` không tồn tại | 🔴 CRITICAL | Dùng `reportService.getInventoryReport({ tab: 'current_stock' })` |
| M2 | `loyaltyService.getPointHistory()` gọi `GET /members/{id}/points-history` không tồn tại | 🟡 HIGH | Ẩn tab lịch sử điểm hoặc backend thêm endpoint |
| M3 | `couponService.update/deactivate()` gọi PUT/DELETE không có trên backend | 🟡 HIGH | Ẩn nút sửa/xóa coupon trên UI |
| M4 | `promotionService.update()` gọi PUT không có | 🟡 HIGH | Ẩn nút sửa promotion |
| M5 | `orderService.getCancelRequests()` gọi `/cancel-requests` không tồn tại | 🔴 CRITICAL | Dùng `GET /orders/branch/{branchId}` + filter PENDING |
| M6 | `returnService.getReturnsByOrder()` gọi `/returns/order/{id}` không tồn tại | 🟡 HIGH | Dùng `GET /returns/{id}` khi biết returnId |
| M7 | Adjustment threshold hardcode 10% thay vì đọc từ system_configs | 🟠 MEDIUM | Gọi `systemConfigService.getByKey('inventory.large_adjustment_percent')` |
| M8 | `force-change-password` truyền `oldPassword: ""` — backend cần mật khẩu cũ | 🔴 CRITICAL | Thêm trường "Mật khẩu tạm thời" vào form |

### 9.3 Gateway Prefix sai trong `api-spec.md` (đã cập nhật)

| Service | Prefix sai | Prefix đúng |
|---------|-----------|------------|
| loyalty-promotion-service | `/loyalty` | `/loyalty-promotion` |
| notification-audit-service | `/notification` | `/notification-audit` |
