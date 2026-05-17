# BeautyERP Frontend — Thiết kế cấu trúc file

> **Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · Zustand 5 · Axios  
> **Backend:** BeautyERP Microservices (Spring Boot) — api-gateway `:8080`  
> **Mục đích:** Hệ thống ERP nội bộ cho nhân viên (4 roles), không phải e-commerce storefront

---

## 1. Cấu trúc thư mục target

```
beautystore-fe/
├── src/
│   ├── app/                            ← Next.js App Router (CHỈ chứa pages)
│   │   ├── layout.tsx                  ← Root layout (minimal)
│   │   ├── page.tsx                    ✅ Redirect → /login
│   │   ├── globals.css
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                ✅ DONE — ERP login (username + 4 roles + quick login)
│   │   │
│   │   ├── force-change-password/
│   │   │   └── page.tsx                ✅ DONE — Force đổi mật khẩu lần đầu
│   │   ├── change-password/
│   │   │   └── page.tsx                ✅ DONE — Đổi mật khẩu tự nguyện
│   │   │
│   │   ├── admin/                      ← ADMIN only
│   │   │   └── page.tsx                ✅ DONE — Admin Dashboard (KPI, Revenue, Alerts)
│   │   │
│   │   ├── branch-manager/             ← BRANCH_MANAGER only
│   │   │   └── page.tsx                ✅ DONE — Branch Manager Dashboard
│   │   │
│   │   ├── pos/                        ← CASHIER (+ BRANCH_MANAGER)
│   │   │   ├── shift/
│   │   │   │   └── page.tsx            ✅ DONE — Mở/đóng ca, kết nối shiftService thực
│   │   │   └── order/
│   │   │       └── page.tsx            ✅ DONE — POS Order (bán hàng)
│   │   │
│   │   ├── cashier/
│   │   │   └── orders/
│   │   │       └── page.tsx            ✅ DONE — Lịch sử đơn hàng của cashier
│   │   │
│   │   ├── orders/
│   │   │   └── [orderId]/
│   │   │       └── page.tsx            ✅ DONE — Chi tiết đơn hàng
│   │   │
│   │   ├── returns/
│   │   │   └── new/
│   │   │       └── page.tsx            ✅ DONE — Trả hàng có hóa đơn
│   │   │
│   │   ├── products/                   ← ADMIN + BRANCH_MANAGER
│   │   │   ├── page.tsx                ✅ DONE — Danh sách sản phẩm
│   │   │   ├── create/
│   │   │   │   └── page.tsx            ✅ DONE — Tạo sản phẩm mới
│   │   │   └── [id]/edit/
│   │   │       └── page.tsx            ✅ DONE — Chỉnh sửa sản phẩm
│   │   │
│   │   ├── categories/
│   │   │   └── page.tsx                ✅ DONE — Quản lý danh mục 2 cấp
│   │   │
│   │   ├── supplier-management/
│   │   │   └── page.tsx                ✅ DONE — Quản lý nhà cung cấp
│   │   │
│   │   ├── inventory/                  ← WAREHOUSE_STAFF + BRANCH_MANAGER
│   │   │   ├── stock/page.tsx          ✅ DONE — Tồn kho
│   │   │   ├── purchase-orders/
│   │   │   │   ├── page.tsx            ✅ DONE — Danh sách Purchase Orders
│   │   │   │   └── create/page.tsx     ✅ DONE — Tạo Purchase Order
│   │   │   ├── receive/[poId]/page.tsx ✅ DONE — Nhận hàng theo PO
│   │   │   └── adjustments/page.tsx    ✅ DONE — Điều chỉnh kho
│   │   │
│   │   ├── warehouse/
│   │   │   └── page.tsx                ✅ DONE — Warehouse Staff Dashboard
│   │   │
│   │   ├── manager/                    ← BRANCH_MANAGER view
│   │   │   ├── products/page.tsx       ✅ DONE
│   │   │   ├── inventory/page.tsx      ✅ DONE
│   │   │   ├── orders/page.tsx         ✅ DONE — Duyệt hủy đơn giá trị cao
│   │   │   └── purchase-orders/page.tsx ✅ DONE
│   │   │
│   │   ├── loyalty/members/page.tsx    ✅ DONE — Loyalty Members
│   │   ├── promotions/page.tsx         ✅ DONE — Quản lý khuyến mãi
│   │   ├── coupons/page.tsx            ✅ DONE — Quản lý coupon
│   │   ├── revenue-report/page.tsx     ✅ DONE — Báo cáo doanh thu
│   │   ├── inventory-report/page.tsx   ✅ DONE — Báo cáo tồn kho
│   │   ├── notifications/page.tsx      ✅ DONE — Notification Center (polling 30s)
│   │   ├── audit-logs/page.tsx         ✅ DONE — Audit Logs (ADMIN only)
│   │   ├── user-management/page.tsx    ✅ DONE — Quản lý tài khoản (ADMIN only)
│   │   └── system-configuration/page.tsx ✅ DONE — Cấu hình hệ thống
│   │
│   ├── components/
│   │   ├── layout/                     ← Layout per-role (port từ src/)
│   │   │   ├── AdminSidebar.tsx        ✅ DONE
│   │   │   ├── BranchManagerSidebar.tsx ✅ DONE
│   │   │   ├── CashierSidebar.tsx      ✅ DONE — Next.js Link, active detection
│   │   │   ├── WarehouseStaffSidebar.tsx ✅ DONE
│   │   │   ├── Header.tsx              ✅ DONE — Notifications badge, user info
│   │   │   └── ERPLayout.tsx           ✅ DONE — Wrapper: sidebar + header + main
│   │   ├── shared/                     ← Reusable business components
│   │   │   ├── KPICard.tsx             ← (inline trong pages, không tạo riêng)
│   │   │   ├── RevenueChart.tsx        ← (inline trong revenue-report/page.tsx)
│   │   │   ├── AlertsPanel.tsx         ← (inline trong dashboard pages)
│   │   │   ├── NotificationBadge.tsx   ← (tích hợp trong Header.tsx)
│   │   │   └── StatusBadge.tsx         ← (inline trong từng page)
│   │   └── ui/                         ← shadcn/ui generated
│   │       └── cela-primitives.tsx     ✅ DONE — CelaCard, CelaButton, CelaInput, CelaSpinner, CelaEmptyState
│   │
│   ├── services/                       ← API calls — KHÔNG gọi Axios trong component
│   │   ├── auth.service.ts             ✅ DONE — login, logout, changePassword + accountService
│   │   ├── product.service.ts          ✅ DONE — /catalog/products/search, CRUD, getImageUrl
│   │   ├── order.service.ts            ✅ DONE — 8 endpoints + Idempotency-Key + returnService
│   │   ├── shift.service.ts            ✅ DONE — open, close, getCurrent, getById
│   │   ├── inventory.service.ts        ✅ DONE — stock, adjustments, approve/reject
│   │   ├── purchaseOrder.service.ts    ✅ DONE — PO CRUD, receiveGoods
│   │   ├── supplier.service.ts         ✅ DONE — CRUD suppliers
│   │   ├── loyalty.service.ts          ✅ DONE — members, points, redeem (history M2: xem FUTURE_IMPROVEMENTS)
│   │   ├── coupon.service.ts           ✅ DONE — validate, create, getAll (PUT/DELETE M3: xem FUTURE_IMPROVEMENTS)
│   │   ├── promotion.service.ts        ✅ DONE — getAll, create, deactivate (PUT M4: xem FUTURE_IMPROVEMENTS)
│   │   ├── notification.service.ts     ✅ DONE — unread-count, getAll, markAsRead
│   │   ├── report.service.ts           ✅ DONE — dashboard, revenue (sync+async), inventory
│   │   ├── auditLog.service.ts         ✅ DONE — getAll with filters
│   │   └── systemConfig.service.ts     ✅ DONE — getAll, update
│   │
│   ├── stores/
│   │   ├── auth.store.ts               ✅ DONE — sessionStorage persist, ROLE_REDIRECT, clearAuth
│   │   ├── pos.store.ts                ✅ DONE — cart, draft autosave 10s, shift state, syncShift()
│   │   └── notification.store.ts       ✅ DONE — unread count, polling, markAsRead/All
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                  ← (auth guard tích hợp trong middleware.ts)
│   │   ├── useNotificationPolling.ts   ✅ DONE — polling 30s, pause on visibilitychange
│   │   └── usePOSDraft.ts              ← (autosave logic có trong pos.store)
│   │
│   ├── lib/
│   │   ├── axios.ts                    ✅ DONE — withCredentials:true, 401→/login
│   │   └── utils.ts                    ← có sẵn (shadcn)
│   │
│   ├── constants/
│   │   ├── routes.ts                   ← (routes inline trong middleware.ts và sidebars)
│   │   └── config.ts                   ← (config qua NEXT_PUBLIC_API_URL env)
│   │
│   └── types/
│       └── index.ts                    ✅ DONE — Đầy đủ types cho 7 microservices
│
├── docs/
│   ├── project-structure.md            ✅ File này
│   ├── system-overview.md              ✅ Architecture, tech stack, API routing
│   ├── api-spec.md                     ✅ Tất cả endpoints theo từng service
│   ├── cela-ui-refactor.md             ✅ CÉLA design spec + task tracker (32/32 pages ✅)
│   ├── coding-convention.md            ✅ Coding standards (CÉLA styling rules)
│   ├── user-stories.md                 ✅ User stories gốc (tham khảo)
│   ├── API_TEST_GUIDE.md               ✅ Kết quả kiểm thử API (96/96 PASS — 2026-05-18)
│   ├── FUTURE_IMPROVEMENTS.md          📋 Tính năng chờ backend bổ sung (M2 M3 M4 M6)
│   └── API_INTEGRATION_PLAN.md         📚 Tài liệu lịch sử (tất cả issues đã xử lý — 2026-05-18)
│
├── middleware.ts                       ✅ DONE — Auth guard cookie 'jwt', 20 protected routes
├── .env.local                          ✅ DONE — NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
├── next.config.ts
└── package.json                        ✅ uuid đã cài (cho Idempotency-Key)
```

---

## 2. Convention đặt tên

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Page components | `page.tsx` (Next.js) | `app/pos/order/page.tsx` |
| Layout components | `PascalCase.tsx` | `AdminSidebar.tsx`, `ERPLayout.tsx` |
| Shared components | `PascalCase.tsx` | `KPICard.tsx`, `StatusBadge.tsx` |
| Service files | `camelCase.service.ts` | `order.service.ts` |
| Store files | `camelCase.store.ts` | `auth.store.ts`, `pos.store.ts` |
| Hook files | `usePascalCase.ts` | `useAuth.ts` |
| Types | `index.ts` (trung tâm) | `types/index.ts` |
| Constants | `camelCase.ts` | `routes.ts` |

---

## 3. Phân layer (bắt buộc tuân thủ)

```
Page (app/**/page.tsx)
  │  "use client" nếu cần state/event handler
  │  Dùng hooks + stores — KHÔNG gọi service trực tiếp
  ▼
Hooks (hooks/) / Stores (stores/)
  │  Business logic, state management
  │  Gọi services
  ▼
Services (services/*.service.ts)
  │  Chỉ gọi API — không có business logic
  │  Luôn dùng api instance từ lib/axios.ts
  ▼
lib/axios.ts  →  Backend api-gateway :8080
```

### Quy tắc bắt buộc

1. **KHÔNG gọi Axios trực tiếp trong component** — luôn qua `services/`
2. **KHÔNG lưu JWT vào `localStorage`** — backend set httpOnly cookie
3. **KHÔNG có refresh token flow** — hết phiên (8h) → redirect `/login`
4. **KHÔNG sửa shadcn files trong `components/ui/`** — ngoại trừ `cela-primitives.tsx` là file của project (được phép sửa)
5. **POS draft autosave** — `localStorage('pos_draft')` mỗi 10s, xóa sau payment thành công
6. **Idempotency-Key** — bắt buộc khi `POST /order/orders`, generate UUID phía client (đã tích hợp sẵn)

---

## 4. Auth Flow & Role Redirect

```
POST /api/v1/auth/login  { username, password }
        │
        ├── 200 OK → Backend set httpOnly cookie 'jwt' + trả User object trong body
        │   └── Redirect theo role (ROLE_REDIRECT map):
        │       ADMIN           → /admin
        │       BRANCH_MANAGER  → /branch-manager
        │       CASHIER         → /pos/shift
        │       WAREHOUSE_STAFF → /warehouse
        │
        ├── 401 → "Sai tên đăng nhập hoặc mật khẩu"
        └── 403 → forceChangePassword → redirect /force-change-password

Page refresh:
        user info persist trong sessionStorage (không phải token)
        cookie 'jwt' tự gửi (withCredentials: true)
        Cookie hết hạn (8h) → 401 → axios interceptor → redirect /login

LƯU Ý QUAN TRỌNG: Backend KHÔNG có GET /auth/me endpoint.
```

---

## 5. API Routing đã xác nhận (từ application.yml thực tế)

| FE gọi (gateway) | StripPrefix | Service nhận | Context-path | Controller |
|-----------------|-------------|-------------|-------------|------------|
| `/api/v1/auth/**` | =2 | auth-service :8081 | `/auth` | `/login`, `/logout`, `/accounts/**` |
| `/api/v1/catalog/**` | =2 | catalog-service :8082 | `/catalog` | `/products/search`, `/products/:id` |
| `/api/v1/order/**` | =2 | order-service :8083 | `/order` | `/orders/**`, `/shifts/**`, `/returns/**` |
| `/api/v1/inventory/**` | =2 | inventory-service :8084 | `/inventory` | `/stock/**`, `/purchase-orders/**` |
| `/api/v1/loyalty-promotion/**` | =2 | loyalty-promotion-service :8085 | `/loyalty-promotion` | `/members/**`, `/coupons/**`, `/promotions/**` |
| `/api/v1/report/**` | =2 | report-service :8086 | `/report` | `/dashboard`, `/revenue`, `/inventory` |
| `/api/v1/notification-audit/**` | =2 | notification-audit-service :8087 | `/notification-audit` | `/notifications/**`, `/audit-logs` |

---

## 6. Services mapping theo backend microservice

| Service file | Status | Backend service | Key endpoints |
|-------------|--------|----------------|---------------|
| `auth.service.ts` | ✅ Done | auth-service :8081 | login, logout, changePassword |
| `account.service.ts` (trong auth) | ✅ Done | auth-service :8081 | CRUD accounts (ADMIN only) |
| `product.service.ts` | ✅ Done | catalog-service :8082 | search, CRUD `/catalog/products` |
| `category.service.ts` | ✅ Done | catalog-service :8082 | CRUD `/catalog/categories` |
| `shift.service.ts` | ✅ Done | order-service :8083 | open, close, getCurrent |
| `order.service.ts` | ✅ Done | order-service :8083 | create (+Idempotency-Key), 8 endpoints |
| `returnService` (trong order) | ✅ Done | order-service :8083 | POST /order/returns |
| `inventory.service.ts` | ✅ Done | inventory-service :8084 | stock, adjustments, approve/reject |
| `purchaseOrder.service.ts` | ✅ Done | inventory-service :8084 | CRUD PO, receiveGoods |
| `supplier.service.ts` | ✅ Done | inventory-service :8084 | CRUD suppliers |
| `loyalty.service.ts` | ✅ Done | loyalty-promotion :8085 | members, points, redeem (points-history: M2 future) |
| `coupon.service.ts` | ✅ Done | loyalty-promotion :8085 | validate, CRUD |
| `promotion.service.ts` | ✅ Done | loyalty-promotion :8085 | CRUD, deactivate |
| `report.service.ts` | ✅ Done | report-service :8086 | dashboard, revenue (sync+async), inventory |
| `notification.service.ts` | ✅ Done | notification-audit :8087 | unread-count (poll 30s), read |
| `auditLog.service.ts` | ✅ Done | notification-audit :8087 | getAll (ADMIN only) |
| `systemConfig.service.ts` | ✅ Done | auth-service :8081 | getAll, update |

---

## 7. Trạng thái implementation

### Foundation (Đã hoàn thành ✅)

| File | Ghi chú |
|------|---------|
| `types/index.ts` | Đầy đủ types cho 7 microservices |
| `lib/axios.ts` | withCredentials:true, 401 → redirect /login |
| `services/auth.service.ts` | login(username), logout, changePassword + accountService |
| `services/product.service.ts` | /catalog/products/search (đúng endpoint), CRUD, getImageUrl |
| `services/shift.service.ts` | open, close, getCurrent, getById — path /order/shifts |
| `services/order.service.ts` | 8 endpoints + Idempotency-Key auto + returnService |
| `stores/auth.store.ts` | sessionStorage persist, ROLE_REDIRECT map, clearAuth |
| `stores/pos.store.ts` | cart, draft autosave localStorage('pos_draft'), shift state |
| `middleware.ts` | Cookie 'jwt' guard, 20 protected routes, redirect logic |
| `.env.local` | NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1 |
| `package.json` | uuid đã cài (Idempotency-Key generation) |

### Pages & Components (Đã hoàn thành ✅)

| File | Ghi chú |
|------|---------|
| `app/page.tsx` | redirect("/login") |
| `app/login/page.tsx` | ERP UI 2-panel, username field, quick login 4 roles, ROLE_REDIRECT |
| `app/pos/shift/page.tsx` | 3 states (no-shift/active/closing), kết nối shiftService thực |
| `components/layout/CashierSidebar.tsx` | Next.js Link, pathname active detection |
| `docs/project-structure.md` | File này |

### Tất cả đã hoàn thành ✅

Tất cả 5 Wave đã được implement xong. Không còn file nào ở trạng thái TODO.

**Tổng kết:**
- 29 pages đã tạo (bao gồm dynamic routes)
- 14 service files đã tạo/cập nhật
- 3 stores đã tạo
- 6 layout components đã tạo
- 1 hook đã tạo
- TypeScript: 0 errors (`npx tsc --noEmit`)

---

## 8. Thứ tự port pages từ src/ (Wave plan)

```
Wave 1 — Auth + Shell ✅ HOÀN THÀNH
  ✅ middleware.ts (auth guard)
  ✅ CashierSidebar.tsx
  ✅ AdminSidebar.tsx + BranchManagerSidebar.tsx + WarehouseStaffSidebar.tsx
  ✅ Header.tsx + ERPLayout.tsx
  ✅ app/force-change-password/page.tsx
  ✅ app/change-password/page.tsx

Wave 2 — POS Core (Cashier) ✅ HOÀN THÀNH
  ✅ stores/pos.store.ts
  ✅ services/shift.service.ts + order.service.ts
  ✅ app/pos/shift/page.tsx
  ✅ app/pos/order/page.tsx
  ✅ app/cashier/orders/page.tsx + app/orders/[orderId]/page.tsx
  ✅ app/returns/new/page.tsx

Wave 3 — Catalog + Inventory ✅ HOÀN THÀNH
  ✅ app/admin/page.tsx + app/branch-manager/page.tsx + app/warehouse/page.tsx
  ✅ app/products/* + app/categories/page.tsx
  ✅ app/inventory/* (4 pages) + app/supplier-management/page.tsx
  ✅ services/category.service.ts + inventory.service.ts + purchaseOrder.service.ts + supplier.service.ts
  ✅ app/manager/* (4 pages: products, inventory, orders, purchase-orders)

Wave 4 — Loyalty + Reports ✅ HOÀN THÀNH
  ✅ app/loyalty/members/page.tsx
  ✅ app/promotions/page.tsx + app/coupons/page.tsx
  ✅ app/revenue-report/page.tsx + app/inventory-report/page.tsx
  ✅ services/loyalty.service.ts + coupon.service.ts + promotion.service.ts + report.service.ts

Wave 5 — Admin Tools ✅ HOÀN THÀNH
  ✅ app/notifications/page.tsx + stores/notification.store.ts
  ✅ hooks/useNotificationPolling.ts
  ✅ app/user-management/page.tsx
  ✅ app/audit-logs/page.tsx
  ✅ app/system-configuration/page.tsx
  ✅ services/notification.service.ts + auditLog.service.ts + systemConfig.service.ts
```

---

## 9. Tiến độ tổng quan

```
Foundation:  ████████████████████  100% (11/11 files) ✅
Pages:       ████████████████████  100% (29/29 pages) ✅
Services:    ████████████████████  100% (14/14 services) ✅
Stores:      ████████████████████  100% (3/3 stores) ✅
Layout:      ████████████████████  100% (6/6 components) ✅
Hooks:       ████████████████████  100% (1/1 hooks) ✅
```

> Toàn bộ Wave 1–5 hoàn thành. CÉLA Design System 100%. TypeScript: 0 errors. Cập nhật lần cuối: 2026-05-18.
