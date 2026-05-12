# BeautyERP FE — System Overview

## 1. Giới thiệu dự án

BeautyERP FE là **giao diện nội bộ (internal ERP)** của hệ thống quản lý bán lẻ mỹ phẩm BeautyERP, phục vụ **4 vai trò nhân viên**:

| Role | Redirect sau login | Phạm vi chính |
|------|--------------------|--------------|
| `ADMIN` | `/admin` | Quản lý toàn hệ thống, tài khoản, cấu hình, audit |
| `BRANCH_MANAGER` | `/branch-manager` | Dashboard chi nhánh, phê duyệt, báo cáo |
| `CASHIER` | `/pos/shift` | Bán hàng tại quầy (POS), ca làm việc |
| `WAREHOUSE_STAFF` | `/warehouse` | Quản lý kho, nhập hàng, điều chỉnh |

> **Lưu ý quan trọng:** BeautyERP FE là cổng nội bộ cho nhân viên — **không phải** cổng mua sắm cho khách hàng. Không có customer registration, không có customer cart, không có customer checkout.

---

## 2. Tech Stack

| Thành phần | Công nghệ | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.x |
| Runtime | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| State Management | Zustand | 5.x |
| HTTP Client | Axios | 1.x |
| Notifications | Sonner | 2.x |
| Icons | lucide-react | latest |
| Theme | next-themes | 0.4.x |

---

## 3. Kiến trúc ứng dụng

### 3.1 Kiến trúc tổng thể

```
Browser (Nhân viên — 4 roles)
       │
       ▼
┌──────────────────────────────────────────┐
│        BeautyERP FE (Next.js)            │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │  App Router  │  │  Zustand Stores  │  │
│  │  (Pages)     │  │  Auth/POS/Notif  │  │
│  └──────────────┘  └──────────────────┘  │
│           │                              │
│  ┌──────────────────────────────────┐    │
│  │      Service Layer (Axios)       │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
       │  HTTP / REST API (httpOnly cookie JWT)
       ▼
┌──────────────────────────────────────────┐
│   BeautyERP API Gateway :8080            │
│   ├── Verify JWT + Redis blacklist       │
│   ├── Inject X-User-Id, X-Role, X-Branch-Id headers
│   └── Route → 7 microservices (8081–8087)│
└──────────────────────────────────────────┘
```

### 3.2 Phân layer (bắt buộc tuân thủ)

```
Page (app/**/page.tsx)
  │  "use client" chỉ khi cần state/event. Không gọi service trực tiếp.
  ▼
Hooks (hooks/) / Stores (stores/)
  │  Business logic, state management. Gọi services.
  ▼
Services (services/*.service.ts)
  │  Chỉ gọi API — không có business logic. Dùng api từ lib/axios.ts.
  ▼
lib/axios.ts  →  API Gateway :8080/api/v1
```

---

## 4. CÉLA Design System

BeautyERP FE dùng **CÉLA** — hệ thống design của thương hiệu mỹ phẩm sang trọng tông espresso/rose/champagne. Toàn bộ token định nghĩa trong `src/app/globals.css`.

### 4.1 CÉLA Color Tokens

| Token | Hex | Ứng dụng |
|-------|-----|----------|
| `--cela-ivory` | `#faf7f2` | Page background |
| `--cela-paper` | `#ffffff` | Card, modal background |
| `--cela-fog` | `#ece4da` | Divider, table row hover |
| `--cela-mist` | `#d8cec5` | Border chính |
| `--cela-stone` | `#8a7a6f` | Secondary text, placeholder |
| `--cela-cocoa` | `#6b574f` | Tertiary text, eyebrow label |
| `--cela-espresso` | `#3c2e2a` | Primary text, primary button bg |
| `--cela-rose` | `#b76e79` | Accent, CTA, active state, focus ring |
| `--cela-champagne` | `#c9a87a` | Gold accent |
| `--cela-gold` | `#b8945c` | Gold text, PENDING badge |
| `--cela-success` | `#6b8e6a` | Trạng thái thành công (COMPLETED, OPEN) |
| `--cela-danger` | `#b04848` | Lỗi, hủy, CANCELLED |
| `--cela-shadow-soft` | — | Shadow card nhẹ |
| `--cela-shadow-md` | — | Shadow modal, overlay |

> **Tuyệt đối không dùng:** `bg-pink-*`, `text-gray-*`, `border-gray-*`, `shadow-sm`, `shadow-xl`, `bg-green-*`, `bg-red-*`, `text-blue-*` (Tailwind color classes cũ).

### 4.2 CÉLA Typography

| Ngữ cảnh | Style |
|---------|-------|
| Page h1 | `fontFamily: "var(--cela-display)"`, `fontSize: 28`, `fontStyle: "italic"`, rose span phụ đề |
| Page eyebrow | `fontSize: 11`, `letterSpacing: "0.18em"`, `textTransform: "uppercase"`, `color: "var(--cela-cocoa)"` |
| Section heading | `fontSize: 15`, `fontWeight: 600`, `color: "var(--cela-espresso)"` |
| Body text | `fontSize: 13`, `color: "var(--cela-espresso)"` |
| Muted text | `fontSize: 12`, `color: "var(--cela-stone)"` |
| Price / KPI | `fontFamily: "var(--cela-mono)"`, `fontWeight: 700`, `color: "var(--cela-espresso)"` |

**Font families:**
- `--cela-display`: Cormorant Garamond (serif, dùng cho h1 page header)
- `--cela-sans`: Manrope (body text)
- `--cela-mono`: JetBrains Mono (giá tiền, mã đơn, code)

### 4.3 CÉLA Primitives (`components/ui/cela-primitives.tsx`)

Component dùng chung — **ưu tiên dùng thay vì viết lại:**

| Component | Props chính |
|-----------|------------|
| `CelaCard` | `padding?`, `style?` |
| `CelaButton` | `variant` (`primary`\|`secondary`\|`rose`\|`danger`\|`ghost`), `size?` |
| `CelaInput` | `icon?`, `...InputHTMLAttributes` |
| `CelaSpinner` | — |
| `CelaEmptyState` | `icon?`, `title?`, `description?` |

### 4.4 Styling rule

- **Inline `style={{}}`** là cách chính cho màu sắc, border, shadow, typography
- **Tailwind** chỉ dùng cho layout: `flex`, `grid`, `gap-*`, `p-*`, `w-*`, `h-*`, `hidden`, responsive breakpoints
- Xem chi tiết trong `docs/coding-convention.md` Section 8 và `docs/cela-ui-refactor.md`

---

## 5. Danh sách màn hình theo role

### CASHIER
| Route | Màn hình | Status |
|-------|---------|--------|
| `/pos/shift` | Quản lý ca (mở/xem/đóng) | ✅ DONE |
| `/pos/order` | POS Bán hàng | ✅ DONE |
| `/cashier/orders` | Lịch sử đơn hàng của cashier | ✅ DONE |
| `/orders/[orderId]` | Chi tiết đơn hàng | ✅ DONE |
| `/returns/new` | Tạo giao dịch trả hàng | ✅ DONE |

### WAREHOUSE_STAFF
| Route | Màn hình | Status |
|-------|---------|--------|
| `/warehouse` | Dashboard kho (tồn kho thấp, PO chờ) | ✅ DONE |
| `/inventory/stock` | Xem tồn kho per sản phẩm | ✅ DONE |
| `/inventory/purchase-orders` | Danh sách Purchase Orders | ✅ DONE |
| `/inventory/purchase-orders/create` | Tạo PO | ✅ DONE |
| `/inventory/receive/[poId]` | Nhận hàng theo PO | ✅ DONE |
| `/inventory/adjustments` | Ghi hàng hỏng/thất thoát | ✅ DONE |

### BRANCH_MANAGER
| Route | Màn hình | Status |
|-------|---------|--------|
| `/branch-manager` | Dashboard chi nhánh (KPI, revenue, alerts) | ✅ DONE |
| `/manager/orders` | Duyệt yêu cầu hủy đơn > 500k | ✅ DONE |
| `/manager/inventory` | Duyệt điều chỉnh kho > 10% | ✅ DONE |
| `/manager/products` | Quản lý sản phẩm chi nhánh | ✅ DONE |
| `/manager/purchase-orders` | Xem PO chi nhánh | ✅ DONE |

### ADMIN
| Route | Màn hình | Status |
|-------|---------|--------|
| `/admin` | Admin Dashboard (KPI toàn hệ thống) | ✅ DONE |
| `/user-management` | CRUD tài khoản nhân viên | ✅ DONE |
| `/audit-logs` | Xem audit log (immutable) | ✅ DONE |
| `/system-configuration` | Cập nhật system_configs (threshold, rate) | ✅ DONE |

### SHARED
| Route | Màn hình | Role | Status |
|-------|---------|------|--------|
| `/products` | Danh sách & CRUD sản phẩm | ADMIN + BM | ✅ DONE |
| `/products/create` | Tạo sản phẩm mới | ADMIN + BM | ✅ DONE |
| `/products/[id]/edit` | Sửa sản phẩm | ADMIN + BM | ✅ DONE |
| `/categories` | Quản lý danh mục 2 cấp | ADMIN + BM | ✅ DONE |
| `/supplier-management` | CRUD nhà cung cấp | ADMIN + WS | ✅ DONE |
| `/loyalty/members` | Xem thành viên loyalty | ADMIN + BM | ✅ DONE |
| `/promotions` | CRUD promotion | ADMIN + BM | ✅ DONE |
| `/coupons` | CRUD coupon | ADMIN + BM | ✅ DONE |
| `/revenue-report` | Báo cáo doanh thu (charts + export) | ADMIN + BM | ✅ DONE |
| `/inventory-report` | Báo cáo tồn kho (slow-moving, low-stock) | ADMIN + BM + WS | ✅ DONE |
| `/notifications` | Notification center (polling 30s) | All | ✅ DONE |
| `/force-change-password` | Đổi mật khẩu bắt buộc lần đầu | All | ✅ DONE |
| `/change-password` | Đổi mật khẩu tự nguyện | All | ✅ DONE |

---

## 6. State Management (Zustand)

### 6.1 Auth Store (`stores/auth.store.ts`) ✅ DONE

```typescript
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;  // username, KHÔNG phải email
  logout: () => Promise<void>;
  clearAuth: () => void;
}
```

- Persist user info vào `sessionStorage` (không phải token — backend set httpOnly cookie)
- `ROLE_REDIRECT`: ADMIN → `/admin`, BRANCH_MANAGER → `/branch-manager`, CASHIER → `/pos/shift`, WAREHOUSE_STAFF → `/warehouse`
- Backend **không có** `GET /auth/me` — user info chỉ từ sessionStorage

### 6.2 POS Store (`stores/pos.store.ts`) ✅ DONE

```typescript
interface POSStore {
  currentShift: Shift | null;
  cartItems: CartItem[];
  appliedCoupon: { code: string; discountAmount: number } | null;
  member: { id: string; name: string; code: string; phone: string; points: number } | null;
  appliedPoints: number;
  tenderedAmount: string;

  addToCart(product, qty?): void;
  removeFromCart(productId): void;
  updateQuantity(productId, qty): void;
  clearCart(): void;
  saveDraft(): void;       // → localStorage('pos_draft')
  loadDraft(): boolean;
  clearDraft(): void;
  resetForNewOrder(): void; // gọi sau khi thanh toán thành công
}
```

- Draft autosave mỗi 10s → `localStorage('pos_draft')`
- Xóa draft sau `resetForNewOrder()`
- Validate stock tại client (không vượt quá available qty hiển thị)

### 6.3 Notification Store (`stores/notification.store.ts`) ✅ DONE

```typescript
interface NotificationStore {
  unreadCount: number;
  notifications: Notification[];
  isPolling: boolean;
  startPolling(): void;     // GET /unread-count mỗi 30s
  stopPolling(): void;
  markAsRead(id: string): void;
  loadNotifications(page?: number): void;
}
```

---

## 7. API Integration

### 7.1 Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 7.2 Axios Instance

```typescript
// lib/axios.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,  // http://localhost:8080/api/v1
  withCredentials: true,   // tự gửi httpOnly JWT cookie trong mọi request
  timeout: 10000,
});
// Response interceptor: status 401 → window.location.href = "/login"
// KHÔNG có Authorization: Bearer header — JWT qua cookie
```

### 7.3 API Gateway routing

```
Client gọi: GET /api/v1/{service}/{path}
Gateway: strip "/api/v1" → forward /{service}/{path} → microservice (context-path /{service})
```

| FE gọi (gateway) | StripPrefix | Service nhận | Context-path | Port |
|-----------------|-------------|-------------|-------------|------|
| `/api/v1/auth/**` | =2 | auth-service | `/auth` | 8081 |
| `/api/v1/catalog/**` | =2 | catalog-service | `/catalog` | 8082 |
| `/api/v1/order/**` | =2 | order-service | `/order` | 8083 |
| `/api/v1/inventory/**` | =2 | inventory-service | `/inventory` | 8084 |
| `/api/v1/loyalty-promotion/**` | =2 | loyalty-promotion-service | `/loyalty-promotion` | 8085 |
| `/api/v1/report/**` | =2 | report-service | `/report` | 8086 |
| `/api/v1/notification-audit/**` | =2 | notification-audit-service | `/notification-audit` | 8087 |

### 7.4 Endpoints theo service

#### auth-service :8081 (`/api/v1/auth/**`)
| Endpoint (relative) | Method | Mô tả | Role |
|---------------------|--------|-------|------|
| `/auth/login` | POST | Đăng nhập, set httpOnly cookie | Public |
| `/auth/logout` | POST | Đăng xuất, Redis blacklist jti | All |
| `/auth/change-password` | POST | Đổi mật khẩu (current + new) | All |
| `/auth/accounts` | GET | Danh sách tài khoản | ADMIN |
| `/auth/accounts` | POST | Tạo tài khoản nhân viên | ADMIN |
| `/auth/accounts/{id}` | PUT | Cập nhật tài khoản | ADMIN |
| `/auth/accounts/{id}` | DELETE | Vô hiệu hóa (soft-delete) | ADMIN |
| `/auth/accounts/{id}/unlock` | POST | Mở khóa tài khoản | ADMIN |
| `/auth/system-configs` | GET | Xem tất cả cấu hình | ADMIN |
| `/auth/system-configs/{key}` | PUT | Cập nhật config → DEL Redis | ADMIN |

#### catalog-service :8082 (`/api/v1/catalog/**`)
| Endpoint (relative) | Method | Mô tả | Role |
|---------------------|--------|-------|------|
| `/catalog/products/search` | GET | Tìm kiếm full-text (q, categoryId, status, page, size) | All |
| `/catalog/products/{id}` | GET | Chi tiết sản phẩm | All |
| `/catalog/products` | POST | Tạo sản phẩm (multipart/form-data) | ADMIN/BM |
| `/catalog/products/{id}` | PUT | Cập nhật sản phẩm | ADMIN/BM |
| `/catalog/products/{id}` | DELETE | Ngừng kinh doanh (soft-delete) | ADMIN/BM |
| `/catalog/categories` | GET | Danh sách danh mục (cây 2 cấp) | All |
| `/catalog/categories` | POST | Tạo danh mục | ADMIN/BM |
| `/catalog/categories/{id}` | PUT | Sửa danh mục | ADMIN/BM |
| `/catalog/categories/{id}` | DELETE | Xóa danh mục (nếu không có sản phẩm) | ADMIN/BM |

#### order-service :8083 (`/api/v1/order/**`)
| Endpoint (relative) | Method | Mô tả | Role |
|---------------------|--------|-------|------|
| `/order/shifts` | POST | Mở ca (openingCash) | CASHIER |
| `/order/shifts/current` | GET | Ca đang mở hiện tại | CASHIER |
| `/order/shifts/{id}` | GET | Chi tiết ca | CASHIER/BM/ADMIN |
| `/order/shifts/{id}/close` | POST | Đóng ca (closingCash + note) | CASHIER |
| `/order/orders` | POST | Tạo đơn POS — **bắt buộc Idempotency-Key header** | CASHIER/BM/ADMIN |
| `/order/orders/my` | GET | Đơn trong ca của cashier hiện tại | CASHIER |
| `/order/orders/{id}` | GET | Chi tiết đơn | All |
| `/order/orders/branch/{branchId}` | GET | Đơn của chi nhánh | BM/ADMIN |
| `/order/orders/{id}/cancel` | POST | Yêu cầu hủy đơn | CASHIER/BM |
| `/order/orders/{id}/cancel/approve` | POST | Duyệt hủy đơn | BM |
| `/order/orders/{id}/cancel/reject` | POST | Từ chối hủy đơn | BM |
| `/order/orders/receipts/{id}` | GET | Lấy receipt PDF (snapshot immutable) | CASHIER/BM/ADMIN |
| `/order/returns` | POST | Tạo trả hàng | CASHIER |

#### inventory-service :8084 (`/api/v1/inventory/**`)
| Endpoint (relative) | Method | Mô tả | Role |
|---------------------|--------|-------|------|
| `/inventory/stock` | GET | Danh sách tồn kho (filter by branch) | WS/BM/ADMIN |
| `/inventory/stock/{productId}` | GET | Tồn kho của 1 sản phẩm | WS/BM/ADMIN |
| `/inventory/purchase-orders` | GET | Danh sách PO | WS/BM/ADMIN |
| `/inventory/purchase-orders` | POST | Tạo PO | WS/ADMIN |
| `/inventory/purchase-orders/{id}` | GET | Chi tiết PO | WS/BM/ADMIN |
| `/inventory/purchase-orders/{id}/confirm` | POST | Xác nhận PO (PENDING→CONFIRMED) | BM/ADMIN |
| `/inventory/purchase-orders/{id}/receive` | POST | Nhận hàng (qty, lot, expiryDate) | WS/ADMIN |
| `/inventory/purchase-orders/{id}/cancel` | POST | Hủy PO | BM/ADMIN |
| `/inventory/adjustments` | POST | Ghi nhận hàng hỏng/thất thoát | WS |
| `/inventory/adjustments` | GET | Danh sách điều chỉnh PENDING | BM |
| `/inventory/adjustments/{id}/approve` | POST | Duyệt điều chỉnh | BM |
| `/inventory/adjustments/{id}/reject` | POST | Từ chối điều chỉnh | BM |
| `/inventory/suppliers` | GET | Danh sách nhà cung cấp | WS/ADMIN |
| `/inventory/suppliers` | POST | Tạo nhà cung cấp | WS/ADMIN |
| `/inventory/suppliers/{id}` | PUT | Cập nhật nhà cung cấp | WS/ADMIN |

#### loyalty-promotion-service :8085 (`/api/v1/loyalty-promotion/**`)
| Endpoint (relative) | Method | Mô tả | Role |
|---------------------|--------|-------|------|
| `/loyalty-promotion/members` | GET | Danh sách loyalty members | BM/ADMIN |
| `/loyalty-promotion/members/search` | GET | Tìm theo số điện thoại (POS lookup) | CASHIER |
| `/loyalty-promotion/members` | POST | Đăng ký thành viên mới | CASHIER |
| `/loyalty-promotion/members/{id}` | GET | Thông tin + điểm thành viên | CASHIER/BM |
| `/loyalty-promotion/members/{id}/redeem` | POST | Đổi điểm (sync + SELECT FOR UPDATE) | CASHIER |
| `/loyalty-promotion/coupons/validate` | POST | Validate coupon ≤ 300ms | CASHIER |
| `/loyalty-promotion/coupons` | GET | Danh sách coupon | BM/ADMIN |
| `/loyalty-promotion/coupons` | POST | Tạo coupon | BM/ADMIN |
| `/loyalty-promotion/coupons/{id}` | PUT | Cập nhật coupon | BM/ADMIN |
| `/loyalty-promotion/promotions` | GET | Danh sách promotion | BM/ADMIN |
| `/loyalty-promotion/promotions` | POST | Tạo promotion | BM/ADMIN |
| `/loyalty-promotion/promotions/{id}` | PUT | Cập nhật promotion | BM/ADMIN |

#### report-service :8086 (`/api/v1/report/**`)
| Endpoint (relative) | Method | Mô tả | Role |
|---------------------|--------|-------|------|
| `/report/dashboard` | GET | Dashboard pre-aggregated (Redis cache 1h) | BM/ADMIN |
| `/report/revenue` | GET | Báo cáo doanh thu sync (≤ 31 ngày, ≤ 2s) | BM/ADMIN |
| `/report/revenue/async` | POST | Yêu cầu báo cáo async (> 31 ngày) | BM/ADMIN |
| `/report/inventory` | GET | Báo cáo tồn kho (low-stock, slow-moving) | BM/ADMIN/WS |

#### notification-audit-service :8087 (`/api/v1/notification-audit/**`)
| Endpoint (relative) | Method | Mô tả | Role |
|---------------------|--------|-------|------|
| `/notification-audit/notifications/unread-count` | GET | Số chưa đọc — **polling mỗi 30s** | All |
| `/notification-audit/notifications` | GET | Danh sách notification (page, type filter) | All |
| `/notification-audit/notifications/{id}/read` | PATCH | Đánh dấu đã đọc + điều hướng deeplink | All |
| `/notification-audit/audit-logs` | GET | Audit log (phân trang, ADMIN only) | ADMIN |

---

## 8. Authentication Flow

```
Nhân viên nhập username + password   ← KHÔNG dùng email
          │
          ▼
   POST /api/v1/auth/login
          │
   ┌──────┴──────────────┐
   │   200 OK            │ → Backend set httpOnly cookie 'jwt' (8h TTL)
   └──────┬──────────────┘   → Response body: ApiResponse<{ user: User }>
          │                  → auth.store.login() → setUser + sessionStorage
          │                  → Redirect theo ROLE_REDIRECT map
          │
   ┌──────┴──────────────┐
   │   401               │ → "Sai tên đăng nhập hoặc mật khẩu"
   └──────┬──────────────┘
          │
   ┌──────┴──────────────┐
   │   423 / 403         │ → forceChangePassword=true → redirect /force-change-password
   └─────────────────────┘   hoặc isLocked=true → "Tài khoản bị khóa, liên hệ Admin"

Mọi request sau đó:
  → Cookie 'jwt' tự gửi kèm (withCredentials: true)
  → API Gateway verify JWT + Redis blacklist
  → Inject X-User-Id, X-Role, X-Branch-Id → forward đến service
  → 401 từ bất kỳ API nào → axios interceptor → redirect /login

Page refresh trong cùng tab:
  → Cookie 'jwt' tự gửi
  → User info từ sessionStorage → restore auth state
  → Cookie hết hạn (8h) → API 401 → redirect /login

LƯU Ý: Backend KHÔNG có GET /auth/me endpoint.
        Mở tab mới → sessionStorage trống → cần đăng nhập lại.
```

---

## 9. Các nguyên tắc bắt buộc

1. **Tuân thủ CÉLA Design System:** Mọi trang và component dùng `var(--cela-*)` tokens — không dùng Tailwind color class cũ. Xem `docs/cela-ui-refactor.md` và `docs/coding-convention.md` Section 8.
2. **Phân layer nghiêm ngặt:** Page → Hooks/Stores → Services → Axios. **KHÔNG gọi Axios trực tiếp trong component.**
3. **Không lưu JWT vào localStorage/sessionStorage** — backend set httpOnly cookie.
4. **Không có refresh token flow** — hết phiên (8h) → redirect `/login`.
5. **Idempotency-Key bắt buộc** khi `POST /order/orders` — generate UUID v4 phía client (đã tích hợp trong order.service.ts).
6. **POS draft autosave:** `localStorage('pos_draft')` mỗi 10s, xóa sau `resetForNewOrder()`.
7. **Notification polling:** `GET /notification-audit/notifications/unread-count` mỗi 30s — **KHÔNG dùng WebSocket.**
8. **Branch isolation:** KHÔNG truyền branchId từ client body/param — backend tự lấy từ JWT header.
9. **Responsive:** Mọi trang responsive từ mobile (375px) đến desktop (1440px). Desktop-first vì đây là ERP.
10. **Vietnamese UI:** Toàn bộ text giao diện bằng tiếng Việt.
11. **Không có customer features:** Không có `/register`, không có customer cart, không có customer checkout.
