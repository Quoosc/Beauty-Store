# Codex Prompts — BeautyERP FE

> Mỗi file prompt là một đơn vị công việc độc lập cho Codex.
> Thực hiện theo thứ tự Wave 1 → 5. Mỗi Wave phụ thuộc vào Wave trước đó.

---

## Danh sách Waves

| Wave | File | Nội dung | Phụ thuộc |
|------|------|----------|-----------|
| 1 | [codex-wave1.md](./codex-wave1.md) | Auth Shell: force-change-password, sidebars (Admin/BM/WS), Header, ERPLayout | Không |
| 2 | [codex-wave2.md](./codex-wave2.md) | POS Core: POS Order, Cashier Orders, Order Detail, Returns | Wave 1 |
| 3 | [codex-wave3.md](./codex-wave3.md) | Catalog + Inventory: Dashboards, Products, Categories, Stock, PO, Adjustments | Wave 1 |
| 4 | [codex-wave4.md](./codex-wave4.md) | Loyalty + Reports: Members, Promotions, Coupons, Revenue/Inventory Report | Wave 1–3 |
| 5 | [codex-wave5.md](./codex-wave5.md) | Admin Tools: Notifications, User Management, Audit Logs, System Config | Wave 1–4 |

---

## Tổng số file cần tạo

| Loại | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 | Tổng |
|------|--------|--------|--------|--------|--------|------|
| Services (mới/update) | 0 | 2 | 4+1stub | 3 | 3 | 13 |
| Pages | 2 | 4 | 16 | 5 | 4 | 31 |
| Components/Layout | 5 | 0 | 0 | 0 | 2 update | 7 |
| Stores | 0 | 0 | 0 | 0 | 1 | 1 |
| Hooks | 0 | 0 | 0 | 0 | 1 | 1 |

---

## Quy trình sau khi Codex coding xong từng Wave

### Sau mỗi Wave, Claude review theo checklist sau:

**1. Cấu trúc file**
- [x] Đúng đường dẫn, đúng naming convention (camelCase.service.ts, PascalCase.tsx)
- [x] `"use client"` chỉ có khi cần thiết (useState/useEffect/event handlers)
- [x] Import đúng (`@/` alias, không dùng relative path dài)

**2. Design compliance**
- [x] Màu sắc đúng với src/ (pink gradient, đúng hex codes)
- [x] Sidebar gradient: `from-[#FF85C0] to-[#EC4899]`
- [x] Header background: `from-[#FFDAE8] to-[#FFF0F8]`
- [x] Button primary: `from-[#FF69B4] to-[#D946A6]`
- [x] Cards: `rounded-xl bg-white shadow-sm`

**3. Luồng nghiệp vụ**
- [x] API paths đúng (đối chiếu với `system-overview.md` Section 7.4)
- [x] Business rules được enforce đúng (thresholds từ system config, không hardcode)
- [x] Error handling: try/catch + toast.error() ở mọi API call
- [x] Loading states: spinner/skeleton khi đang fetch

**4. Security & Auth**
- [x] `branchId` KHÔNG bao giờ lấy từ form/param — chỉ từ JWT (backend inject)
- [x] Role guard đúng cho từng page
- [x] Không lưu JWT vào localStorage

**5. POS-specific (Wave 2)**
- [x] `Idempotency-Key` header có trong POST /order/orders
- [x] Draft autosave mỗi 10s
- [x] `resetForNewOrder()` gọi sau payment thành công
- [x] Success overlay xanh lá hiện đúng

**6. Notifications (Wave 5)**
- [x] Polling dừng khi tab ẩn (visibilitychange)
- [x] `unreadCount` trong Header kết nối đúng với notification.store
- [x] Không dùng WebSocket

---

## Design Reference Quick Lookup

| Screen cần implement | File src/ cần đọc |
|---------------------|-------------------|
| Force/Change password | `src/app/pages/ForceChangePassword.tsx`, `ChangePassword.tsx` |
| Admin Sidebar | `src/app/components/AdminSidebar.tsx` |
| BM Sidebar | `src/app/components/BranchManagerSidebar.tsx` |
| WS Sidebar | `src/app/components/WarehouseStaffSidebar.tsx` |
| Header | `src/app/components/Header.tsx` |
| POS Order | `src/app/pages/POSOrder.tsx` (906 lines) |
| Cashier Orders | `src/app/pages/CashierOrders.tsx` |
| Order Detail | `src/app/pages/OrderDetails.tsx` |
| Returns | `src/app/pages/ReturnOrder.tsx` |
| Admin Dashboard | `src/app/pages/AdminDashboard.tsx` |
| BM Dashboard | `src/app/pages/BranchManagerDashboard.tsx` |
| WS Dashboard | `src/app/pages/WarehouseStaffDashboard.tsx` |
| Products list | `src/app/pages/ProductList.tsx` |
| Create/Edit product | `src/app/pages/CreateEditProduct.tsx` |
| Categories | `src/app/pages/CategoryManagement.tsx` |
| Inventory Stock | `src/app/pages/InventoryStock.tsx` |
| PO List | `src/app/pages/PurchaseOrderList.tsx` |
| Create PO | `src/app/pages/CreatePurchaseOrder.tsx` |
| Receive Goods | `src/app/pages/ReceiveGoods.tsx` |
| Adjustments | `src/app/pages/InventoryAdjustments.tsx` |
| Manager Orders | `src/app/pages/manager/ManagerOrders.tsx` |
| Manager Inventory | `src/app/pages/manager/ManagerInventory.tsx` |
| Loyalty Members | `src/app/pages/LoyaltyMembers.tsx` |
| Promotions | `src/app/pages/PromotionsManagement.tsx` |
| Coupons | `src/app/pages/CouponsManagement.tsx` |
| Revenue Report | `src/app/pages/RevenueReport.tsx` |
| Inventory Report | `src/app/pages/InventoryReport.tsx` |
| Notifications | `src/app/pages/NotificationsCenter.tsx` |
| User Management | `src/app/pages/UserManagement.tsx` |
| Audit Logs | `src/app/pages/AuditLogs.tsx` |
| System Config | `src/app/pages/SystemConfiguration.tsx` |
| Supplier Mgmt | `src/app/pages/SupplierManagement.tsx` |
