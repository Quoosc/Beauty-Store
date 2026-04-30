# BeautyStore FE — Design Reference

> **Quy tắc bắt buộc:** Toàn bộ quá trình lập trình giao diện cho BeautyStore FE  
> **phải tham chiếu và tuân thủ 100%** theo thiết kế trong thư mục `src/` tại root workspace  
> (`d:\HK6 UIT\Kiến trúc phần mềm\src\`).

---

## 1. Vị trí thiết kế gốc

| Thư mục | Nội dung |
|---------|---------|
| `src/app/pages/` | 47 màn hình: Login, Dashboard, Products, POS, Inventory, Reports, ... |
| `src/app/components/` | Layout components (Header, Sidebars, KPICard, ...) |
| `src/app/components/pos/` | POS components (ProductSearch, ShoppingCart, OrderSummary, ...) |
| `src/app/components/warehouse/` | Warehouse components |
| `src/styles/theme.css` | CSS variables và custom theme |

**Lưu ý:** `src/` là hệ thống BeautyERP (admin/internal). BeautyStore FE là storefront customer-facing. Khi implement, cần **áp dụng design language** (màu sắc, spacing, typography, component style) từ `src/` vào context của customer store.

---

## 2. Design Tokens (từ `src/styles/theme.css` và components)

### 2.1 Màu sắc chính

```css
/* Gradient chính — lấy từ src/app/pages/Login.tsx, Header.tsx */
--pink-primary:    #FF69B4;   /* Hot pink */
--pink-dark:       #D946A6;   /* Deep pink — text primary */
--pink-darker:     #EC4899;   /* Pink-500 Tailwind */
--pink-brand:      #DB2777;   /* Pink-600 Tailwind — CTA buttons */

/* Backgrounds */
--bg-hero-from:   #FFDAE8;    /* Light pink */
--bg-hero-to:     #FFF0F8;    /* Near white pink */
--bg-section:     #FFF1F2;    /* Pink-50 Tailwind */
--bg-white:       #FFFFFF;

/* Gradient buttons */
--btn-gradient:   linear-gradient(to right, #FF69B4, #D946A6);
--btn-gradient-hover: linear-gradient(to right, #FF1493, #C026D3);
```

### 2.2 Ánh xạ sang Tailwind classes

| Design token | Tailwind class | Dùng khi |
|-------------|----------------|---------|
| Primary CTA | `bg-pink-600 hover:bg-pink-700` | Buttons chính (Mua ngay, Thêm vào giỏ) |
| Primary text | `text-pink-600` | Giá, links nổi bật |
| Primary gradient | `bg-gradient-to-r from-[#FF69B4] to-[#D946A6]` | Gradient buttons đặc biệt |
| Section bg | `bg-pink-50` | Nền section xen kẽ |
| Hero bg | `bg-gradient-to-r from-pink-50 to-rose-100` | Hero section |
| Border | `border-pink-200` | Card borders trong context pink |
| Admin header bg | `bg-gradient-to-r from-[#FFDAE8] to-[#FFF0F8]` | Admin-style headers |

---

## 3. Component Style Reference

### 3.1 Login Page (`src/app/pages/Login.tsx`)

**Design pattern áp dụng cho BeautyStore FE `/login`:**

```
Layout: 2 panel (lg:)
  Left panel (lg:w-1/2):
    - Background: bg-gradient-to-br from-[#FFE4F0] via-[#FFDAE8] to-[#FFB8D6]
    - Hexagon SVG pattern background (opacity-10)
    - Logo + tagline
    - Value proposition list
    
  Right panel (lg:w-1/2):
    - Background: bg-white
    - Form login
    - Welcome message: "Chào mừng trở lại 👋"
    - Input style: h-11, pl-10 (icon), border-gray-300, focus:ring-[#FFDAE8] focus:border-[#D946A6]
    - Submit button: gradient bg-gradient-to-r from-[#FF69B4] to-[#D946A6]
    - Error state: border-red-500, bg-red-50
```

**Customer store adaptation:** Giữ nguyên visual style nhưng thay nội dung cho customer context (email thay username, thêm link "Đăng ký").

---

### 3.2 Header / Navbar (`src/app/components/Header.tsx`)

**Design pattern áp dụng cho BeautyStore FE Navbar:**

```
Background: bg-gradient-to-r from-[#FFDAE8] to-[#FFF0F8]
Border: border-b border-pink-200
Shadow: shadow-md
Padding: px-6 py-4

Logo:
  - Icon: w-10 h-10, bg-gradient-to-br from-[#FF69B4] to-[#D946A6], rounded-lg
  - Sparkles icon (lucide)
  - Brand name: font-bold text-gray-900

Notification bell:
  - Badge: bg-red-500, absolute -top-1 -right-1, rounded-full
  
Avatar:
  - w-9 h-9, bg-gradient-to-br from-[#FF69B4] to-[#D946A6], rounded-full
```

---

### 3.3 Product Listing (`src/app/pages/ProductList.tsx`)

**Design pattern áp dụng cho `/products`:**

```
Search bar:
  - relative wrapper, Search icon (lucide) absolute left-3
  - Input pl-9 (để icon không đè text)
  - Debounce 300ms

Category filter tabs:
  - pill buttons: rounded-full, px-4 py-2
  - Active: bg-pink-600 text-white border-pink-600
  - Inactive: border, hover:bg-pink-600 hover:text-white

Product table / grid:
  - Admin dùng table view, Customer dùng card grid (2/3/4 cols)
  - Status badge: rounded, text-xs, font-medium
  - Action: 3-dot menu hoặc direct buttons
```

---

### 3.4 Dashboard KPI Cards (`src/app/components/KPICard.tsx`)

**Design pattern áp dụng cho cart summary / order summary:**

```
Card style:
  - rounded-xl (border-radius: 12px)
  - bg-white
  - shadow-sm
  - p-6

KPI value:
  - text-2xl font-bold
  - text-gray-900

KPI label:
  - text-sm text-gray-500

Trend indicator:
  - text-green-600 (tăng) / text-red-500 (giảm)
  - text-sm font-medium
```

---

### 3.5 Sidebar Navigation (`src/app/components/AdminSidebar.tsx`)

**Design pattern cho mobile drawer / navigation:**

```
Background:
  - Admin: bg-gradient từ #FF69B4 sang #D946A6 (vertical)
  - Customer mobile menu: bg-white (Sheet component)

Nav items:
  - padding: px-4 py-3
  - rounded: rounded-lg
  - Active: bg-white/20, text-white
  - Hover: hover:bg-white/10
  - Icon + text side by side
```

---

### 3.6 POS Shopping Cart (`src/app/components/pos/ShoppingCart.tsx`)

**Design pattern áp dụng cho `/cart`:**

```
Cart items:
  - flex gap-4, border-b
  - Alternating bg (bg-gray-50 on odd rows)
  
Quantity controls:
  - Nút +/-: small button, border, rounded
  - Input số lượng: text-center, w-12

Price format:
  - Tiếng Việt: toLocaleString("vi-VN") + "₫"
  - Total: text-right font-bold text-pink-600

Empty state:
  - Center text + icon
  - Nút "Tiếp tục mua sắm"
```

---

## 4. Màn hình cần implement và file tham chiếu

| Màn hình BeautyStore FE | File tham chiếu trong `src/` |
|------------------------|------------------------------|
| `/login` | `src/app/pages/Login.tsx` |
| `/register` | `src/app/pages/Login.tsx` (form phần right panel) |
| `/products` | `src/app/pages/ProductList.tsx` |
| `/products/[slug]` | `src/app/pages/CreateEditProduct.tsx` (product detail patterns) |
| `/cart` | `src/app/components/pos/ShoppingCart.tsx` |
| `/checkout` | `src/app/pages/POSOrder.tsx` (payment form patterns) |
| `/orders` | `src/app/pages/CashierOrders.tsx` |
| `/orders/[id]` | `src/app/pages/OrderDetails.tsx` |
| Navbar | `src/app/components/Header.tsx` |
| Footer | Tạo mới theo design language chung |
| Trang chủ hero | `src/app/pages/Login.tsx` (left panel gradient style) |

---

## 5. Typography & Spacing

### 5.1 Font sizes thường dùng

| Ngữ cảnh | Class |
|---------|-------|
| Hero title | `text-4xl md:text-5xl font-bold` |
| Page heading | `text-2xl font-bold` |
| Section heading | `text-xl font-semibold` |
| Card title | `text-sm font-medium` |
| Price lớn | `text-2xl font-bold text-pink-600` |
| Price nhỏ | `text-sm font-bold text-pink-600` |
| Body text | `text-sm text-gray-600` |
| Label | `text-sm font-semibold text-gray-700` |
| Caption | `text-xs text-gray-500` |

### 5.2 Spacing patterns

```
Container: container mx-auto px-4
Section:   py-12 (normal) / py-20 (hero)
Card:      p-4 (compact) / p-6 (normal)
Gap grid:  gap-4 (normal) / gap-6 (spacious)
```

---

## 6. Animation & Interaction

```css
/* Hover transitions — dùng nhất quán */
transition-colors     /* link, button color changes */
transition-shadow     /* card hover shadow */
transition-transform  /* image zoom on hover */

/* Scale on hover (nhẹ) */
hover:scale-105       /* product card image */

/* Duration */
duration-300          /* mặc định cho mọi transition */
```

---

## 7. Checklist Design Compliance

Trước khi submit bất kỳ trang/component nào:

- [ ] Màu sắc khớp với design tokens từ `src/` (đặc biệt pink gradient)
- [ ] Border radius: `rounded-xl` cho cards, `rounded-lg` cho buttons/inputs
- [ ] Shadow: `shadow-sm` default, `shadow-md` on hover
- [ ] Font weights khớp (headings: `font-bold`, body: default, label: `font-semibold`)
- [ ] Responsive: test mobile (375px), tablet (768px), desktop (1280px)
- [ ] Hover states có transition animation
- [ ] Empty states được thiết kế (không để blank)
- [ ] Loading states có skeleton hoặc spinner
- [ ] Vietnamese text cho mọi UI labels
