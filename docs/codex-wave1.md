# CODEX PROMPT — Wave 1: Auth Shell (Remaining)

## IMPORTANT: Read this entire document before writing a single line of code.

---

## 1. Project Context

You are implementing **BeautyERP FE** — an **internal ERP system** for beauty retail store employees. This is **NOT** a customer storefront.

**4 employee roles:** ADMIN, BRANCH_MANAGER, CASHIER, WAREHOUSE_STAFF.

**Tech stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Zustand 5, Axios.

**Backend:** Spring Boot microservices via API Gateway at `http://localhost:8080/api/v1`. JWT in httpOnly cookie (set by backend, NOT accessible via JS). No refresh token.

### Already implemented — DO NOT modify:
- `src/lib/axios.ts` — axios instance, withCredentials:true, 401→redirect /login
- `src/stores/auth.store.ts` — user state, sessionStorage persist, ROLE_REDIRECT map, login/logout/clearAuth
- `src/stores/pos.store.ts` — POS cart + draft autosave
- `src/services/auth.service.ts` — login(username,password), logout(), changePassword(current,new), accountService CRUD
- `src/services/product.service.ts`, `order.service.ts`, `shift.service.ts`
- `src/middleware.ts` — cookie 'jwt' guard, protected routes, force-change-password redirect
- `src/types/index.ts` — ALL TypeScript interfaces (User, UserRole, ApiResponse<T>, etc.)
- `src/app/login/page.tsx` ✅
- `src/app/pos/shift/page.tsx` ✅
- `src/components/layout/CashierSidebar.tsx` ✅

---

## 2. Design Source — MANDATORY

All visual designs exist at `d:\HK6 UIT\Kiến trúc phần mềm\src\app\`. You MUST port these designs pixel-perfectly into Next.js.

**Do not invent UI** — read and copy the design from the source files listed per component below.

### Core design tokens (extract from src/styles/theme.css):
```
Pink gradient (buttons):  bg-gradient-to-r from-[#FF69B4] to-[#D946A6]
Pink gradient (sidebar):  bg-gradient-to-b from-[#FF85C0] to-[#EC4899]
Header background:        bg-gradient-to-r from-[#FFDAE8] to-[#FFF0F8]
Page background:          bg-gray-50 (#F5F6FA)
Border accent:            border-pink-200
Primary text:             text-gray-900 / text-gray-800
Secondary text:           text-gray-600
Input focus ring:         focus:ring-2 focus:ring-[#FFDAE8] focus:border-[#D946A6]
Card:                     rounded-xl bg-white shadow-sm p-6
```

### Role color map (for badges, accents):
```typescript
const ROLE_COLORS = {
  ADMIN: "#E53E3E",           // red
  BRANCH_MANAGER: "#D97706",  // amber
  CASHIER: "#059669",         // green
  WAREHOUSE_STAFF: "#2563EB", // blue
};
```

---

## 3. Files to Implement

```
src/app/force-change-password/page.tsx
src/app/change-password/page.tsx
src/components/layout/AdminSidebar.tsx
src/components/layout/BranchManagerSidebar.tsx
src/components/layout/WarehouseStaffSidebar.tsx
src/components/layout/Header.tsx
src/components/layout/ERPLayout.tsx
```

---

## 4. Detailed Specs per File

---

### 4.1 `src/app/force-change-password/page.tsx`

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\ForceChangePassword.tsx`

**Purpose:** First-login mandatory password change. Middleware already redirects here when `forceChangePassword=true` after login.

**Layout:** Standalone page — NO ERPLayout, NO sidebar.
```
Full-screen: min-h-screen bg-gradient-to-br from-[#FFE4F0] via-[#FFDAE8] to-[#FFB8D6]
Center card: max-w-md w-full mx-auto mt-20 bg-white rounded-2xl shadow-xl p-8
```

**Content:**
```
Top: Logo icon (w-12 h-12, bg-gradient-to-br from-[#FF69B4] to-[#D946A6], rounded-xl) 
     + Sparkles icon (white, w-6 h-6)
Heading: "Đặt mật khẩu mới" (text-2xl font-bold text-gray-900 mt-4)
Sub: "Đây là lần đăng nhập đầu tiên. Hãy đặt mật khẩu mới để bảo mật tài khoản."
     (text-sm text-gray-600 mt-2 text-center)
```

**Form fields:**
```
1. "Mật khẩu mới" 
   - type="password" with show/hide toggle (Eye/EyeOff icon from lucide-react)
   - Icon: Lock (absolute left-3)
   - Input: h-11 w-full pl-10 pr-10 border border-gray-300 rounded-lg ...

2. "Xác nhận mật khẩu mới"
   - Same style with show/hide toggle

3. Submit button: "Đặt mật khẩu"
   - w-full h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white font-semibold rounded-lg
   - Loading state: spinner + "Đang xử lý..."
   - Disabled while loading
```

**Client-side validation (validate onBlur + onSubmit):**
```typescript
// Rules:
// 1. Mật khẩu mới: ≥ 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số
// 2. Xác nhận: phải khớp với mật khẩu mới
const validatePassword = (pwd: string) => {
  if (pwd.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(pwd)) return "Phải có ít nhất 1 chữ hoa";
  if (!/[a-z]/.test(pwd)) return "Phải có ít nhất 1 chữ thường";
  if (!/[0-9]/.test(pwd)) return "Phải có ít nhất 1 chữ số";
  return null;
};
```

**Error display:** `<p className="text-red-600 text-xs mt-1">{error}</p>` below each input.

**API call:**
```typescript
"use client";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// In submit handler:
const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/admin",
  BRANCH_MANAGER: "/branch-manager",
  CASHIER: "/pos/shift",
  WAREHOUSE_STAFF: "/warehouse",
};

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  // validate first...
  try {
    setIsLoading(true);
    await authService.changePassword("", newPassword); 
    // currentPassword is empty for force-change (user has temp password from login)
    toast.success("Đã đặt mật khẩu thành công!");
    const user = useAuthStore.getState().user;
    router.push(user ? ROLE_REDIRECT[user.role] : "/login");
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Đặt mật khẩu thất bại");
  } finally {
    setIsLoading(false);
  }
}
```

---

### 4.2 `src/app/change-password/page.tsx`

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\ChangePassword.tsx`

**Purpose:** Voluntary password change for any logged-in user.

**Layout:** Wrapped in `<ERPLayout>` (import from `@/components/layout/ERPLayout`).

**Content inside ERPLayout:**
```
Page heading: "Đổi mật khẩu" (text-2xl font-bold text-gray-900)
Card: max-w-lg bg-white rounded-xl shadow-sm p-8
```

**Form fields:**
```
1. "Mật khẩu hiện tại"    (type=password, icon=Lock, show/hide toggle)
2. "Mật khẩu mới"         (type=password, icon=Lock, show/hide toggle)
3. "Xác nhận mật khẩu mới" (type=password, icon=Lock, show/hide toggle)
Submit: "Đổi mật khẩu" (same gradient button style)
```

**Validation:** Same rules as force-change + currentPassword required (not empty).

**API call:**
```typescript
await authService.changePassword(currentPassword, newPassword);
// On success: toast.success("Đã đổi mật khẩu thành công!") — stay on page, reset form
// On error: toast.error(message)
```

---

### 4.3 `src/components/layout/AdminSidebar.tsx`

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\components\AdminSidebar.tsx`
Port this component EXACTLY. Use Next.js `Link` (not React Router), `usePathname` for active detection.

**"use client"** — required (usePathname hook).

**Sidebar structure:**
```tsx
<aside className="w-64 h-screen flex-shrink-0 flex flex-col relative overflow-hidden"
       style={{ background: "linear-gradient(to bottom, #FF85C0, #EC4899)" }}>
  {/* Hexagon SVG pattern overlay — opacity-5 */}
  {/* Decorative blur circles */}
  
  {/* Logo section */}
  <div className="p-6 border-b border-white/20">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-white font-bold text-sm">BeautyERP</p>
        <p className="text-white/70 text-xs">Quản trị hệ thống</p>
      </div>
    </div>
  </div>

  {/* Navigation */}
  <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
    {/* Section groups with NavItem components */}
  </nav>

  {/* Footer */}
  <div className="p-4 border-t border-white/20">
    <Link href="/change-password" className="...">Đổi mật khẩu</Link>
    <button onClick={handleLogout} className="...">Đăng xuất</button>
  </div>
</aside>
```

**NavItem pattern:**
```tsx
function NavItem({ href, icon: Icon, label, badge }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
        ${isActive 
          ? "bg-white/15 text-white" 
          : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}
```

**NavSection pattern:**
```tsx
function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider px-4 mb-2">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
```

**Full navigation menu:**
```
[TỔNG QUAN]
  Dashboard         href="/admin"              icon=LayoutDashboard

[QUẢN LÝ]
  Sản phẩm          href="/products"           icon=Package
  Danh mục          href="/categories"         icon=Tag
  Nhà cung cấp      href="/supplier-management" icon=Truck

[VẬN HÀNH]
  Tồn kho           href="/inventory/stock"                  icon=Warehouse
  Purchase Orders   href="/inventory/purchase-orders"        icon=ShoppingBag
  Điều chỉnh kho    href="/inventory/adjustments"            icon=ClipboardEdit

[CHƯƠNG TRÌNH]
  Loyalty Members   href="/loyalty/members"    icon=Heart
  Khuyến mãi        href="/promotions"         icon=Gift
  Coupon            href="/coupons"            icon=Ticket

[BÁO CÁO]
  Doanh thu         href="/revenue-report"     icon=TrendingUp
  Tồn kho           href="/inventory-report"   icon=BarChart2

[HỆ THỐNG]
  Tài khoản         href="/user-management"    icon=Users
  Audit Log         href="/audit-logs"         icon=ClipboardList
  Cấu hình          href="/system-configuration" icon=Settings
  Thông báo         href="/notifications"      icon=Bell
```

**Logout:**
```typescript
const { logout } = useAuthStore();
const router = useRouter();
async function handleLogout() {
  await logout();
  router.push("/login");
}
```

---

### 4.4 `src/components/layout/BranchManagerSidebar.tsx`

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\components\BranchManagerSidebar.tsx`

Same gradient + structure as AdminSidebar. Subtitle: "Quản lý chi nhánh".

**Navigation menu:**
```
[TỔNG QUAN]
  Dashboard         href="/branch-manager"     icon=LayoutDashboard

[VẬN HÀNH POS]
  Mở/Đóng ca        href="/pos/shift"          icon=Clock
  Bán hàng          href="/pos/order"          icon=ShoppingCart
  Đơn hàng của tôi  href="/cashier/orders"     icon=Receipt
  Duyệt hủy đơn     href="/manager/orders"     icon=CheckSquare
  Trả hàng          href="/returns/new"        icon=RotateCcw

[KHO HÀNG]
  Tồn kho           href="/inventory/stock"              icon=Warehouse
  Purchase Orders   href="/inventory/purchase-orders"    icon=ShoppingBag
  Duyệt điều chỉnh  href="/manager/inventory"            icon=ClipboardCheck

[CATALOG]
  Sản phẩm          href="/manager/products"   icon=Package
  Danh mục          href="/categories"         icon=Tag

[CHƯƠNG TRÌNH]
  Loyalty Members   href="/loyalty/members"    icon=Heart
  Khuyến mãi        href="/promotions"         icon=Gift
  Coupon            href="/coupons"            icon=Ticket

[BÁO CÁO]
  Doanh thu         href="/revenue-report"     icon=TrendingUp
  Tồn kho           href="/inventory-report"   icon=BarChart2
  Thông báo         href="/notifications"      icon=Bell
```

---

### 4.5 `src/components/layout/WarehouseStaffSidebar.tsx`

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\components\WarehouseStaffSidebar.tsx`

Same gradient + structure. Subtitle: "Quản lý kho".

**Navigation menu:**
```
[TỔNG QUAN]
  Dashboard         href="/warehouse"          icon=LayoutDashboard

[KHO HÀNG]
  Tồn kho           href="/inventory/stock"              icon=Warehouse
  Purchase Orders   href="/inventory/purchase-orders"    icon=ShoppingBag
  Nhận hàng         href="/inventory/purchase-orders"    icon=PackageCheck
  Điều chỉnh kho    href="/inventory/adjustments"        icon=ClipboardEdit
  Nhà cung cấp      href="/supplier-management"          icon=Truck

[THÔNG BÁO]
  Thông báo         href="/notifications"      icon=Bell
```

---

### 4.6 `src/components/layout/Header.tsx`

**Design source:** `d:\HK6 UIT\Kiến trúc phần mềm\src\app\components\Header.tsx`

**"use client"** — required.

**Props:** none — reads everything from stores.

```tsx
export function Header() {
  const user = useAuthStore(s => s.user);
  const { logout } = useAuthStore();
  const router = useRouter();
  // unreadCount: placeholder 0 — notification.store not yet implemented
  const unreadCount = 0;

  const initials = user?.fullName
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="bg-gradient-to-r from-[#FFDAE8] to-[#FFF0F8] border-b border-pink-200 shadow-sm px-6 py-4 flex items-center justify-between flex-shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-[#FF69B4] to-[#D946A6] rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">BeautyERP</span>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-pink-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User info + dropdown */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#FF69B4] to-[#D946A6] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.role?.replace("_", " ")}</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-2 rounded-lg hover:bg-pink-100 transition-colors text-gray-600 hover:text-gray-900"
            title="Đăng xuất">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

### 4.7 `src/components/layout/ERPLayout.tsx`

**"use client"** — required (reads from auth store).

**Purpose:** Wraps all authenticated pages. Selects sidebar based on user role.

```tsx
"use client";
import { useAuthStore } from "@/stores/auth.store";
import { AdminSidebar } from "./AdminSidebar";
import { BranchManagerSidebar } from "./BranchManagerSidebar";
import { CashierSidebar } from "./CashierSidebar";
import { WarehouseStaffSidebar } from "./WarehouseStaffSidebar";
import { Header } from "./Header";
import type { UserRole } from "@/types";

const SIDEBAR_MAP: Record<UserRole, React.ComponentType> = {
  ADMIN: AdminSidebar,
  BRANCH_MANAGER: BranchManagerSidebar,
  CASHIER: CashierSidebar,
  WAREHOUSE_STAFF: WarehouseStaffSidebar,
};

export function ERPLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);
  const role = user?.role ?? "CASHIER";
  const SidebarComponent = SIDEBAR_MAP[role];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SidebarComponent />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## 5. Mandatory Coding Conventions

```typescript
// ✅ CORRECT patterns:
"use client";                          // only when: useState/useEffect/events/browser APIs
import { useAuthStore } from "@/stores/auth.store";
const user = useAuthStore(s => s.user); // select individual fields, not whole store
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles, Bell, LogOut, ... } from "lucide-react";

// ❌ FORBIDDEN:
import axios from "axios";             // never — use services
import { useRouter } from "next/router"; // wrong — use next/navigation
console.log(...)                       // use toast or no logging
// @ts-ignore                          // never
```

**Tailwind CSS rules:**
- Use Tailwind classes only — no inline `style={}` except for gradient backgrounds when Tailwind can't express them
- `rounded-xl` for cards, `rounded-lg` for inputs/buttons
- `shadow-sm` default, `shadow-md` on hover
- `transition-colors duration-200` on interactive elements
- ALL text: Vietnamese

**Typescript rules:**
- No `any` — use proper types from `@/types`
- Export components as named exports: `export function AdminSidebar() {}`
- Props interface above component: `interface NavItemProps { href: string; icon: LucideIcon; label: string; badge?: number; }`

---

## 6. Dependencies & Import Paths

```typescript
// Types
import type { User, UserRole } from "@/types";

// Stores
import { useAuthStore } from "@/stores/auth.store";

// Services
import { authService } from "@/services/auth.service";

// shadcn/ui (already installed)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

---

## 7. Build Order

Implement in this exact order (each depends on the previous):
1. `AdminSidebar.tsx` (standalone)
2. `BranchManagerSidebar.tsx` (standalone)
3. `WarehouseStaffSidebar.tsx` (standalone)
4. `Header.tsx` (needs auth.store)
5. `ERPLayout.tsx` (needs all sidebars + Header)
6. `force-change-password/page.tsx` (standalone — no ERPLayout)
7. `change-password/page.tsx` (needs ERPLayout)
