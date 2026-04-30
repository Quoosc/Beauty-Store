# BeautyStore FE — System Overview

## 1. Giới thiệu dự án

BeautyStore FE là giao diện người dùng (customer-facing storefront) của hệ thống bán lẻ mỹ phẩm BeautyStore. Đây là ứng dụng web dành cho **khách hàng cuối** — người dùng có thể duyệt sản phẩm, thêm vào giỏ hàng, thanh toán và quản lý tài khoản.

**Khác biệt so với BeautyERP:** BeautyERP là hệ thống nội bộ dành cho nhân viên (Admin, Cashier, Branch Manager, Warehouse Staff). BeautyStore FE là cổng mua sắm công khai dành cho khách hàng.

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
Browser (Khách hàng)
       │
       ▼
┌──────────────────────────────────────────┐
│        BeautyStore FE (Next.js)          │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │  App Router  │  │  Zustand Stores  │  │
│  │  (Pages)     │  │  (Client State)  │  │
│  └──────────────┘  └──────────────────┘  │
│           │                              │
│  ┌──────────────────────────────────┐    │
│  │      Service Layer (Axios)       │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
       │  HTTP / REST API
       ▼
┌────────────────────────┐
│   BeautyERP Backend    │
│  (Spring Cloud + MS)   │
└────────────────────────┘
```

### 3.2 Cấu trúc thư mục chuẩn

```
beautystore-fe/
├── src/
│   ├── app/                        ← Next.js App Router (pages only)
│   │   ├── page.tsx                ← Trang chủ (Hero, Categories, Sale Banner)
│   │   ├── layout.tsx              ← Root layout (Navbar, Footer, Toaster)
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx            ← Đăng nhập
│   │   ├── register/
│   │   │   └── page.tsx            ← Đăng ký tài khoản
│   │   ├── products/
│   │   │   ├── page.tsx            ← Danh sách & tìm kiếm sản phẩm
│   │   │   └── [slug]/
│   │   │       └── page.tsx        ← Chi tiết sản phẩm
│   │   ├── cart/
│   │   │   └── page.tsx            ← Giỏ hàng
│   │   ├── checkout/
│   │   │   └── page.tsx            ← Thanh toán
│   │   ├── orders/
│   │   │   ├── page.tsx            ← Lịch sử đơn hàng (auth required)
│   │   │   └── [id]/
│   │   │       └── page.tsx        ← Chi tiết đơn hàng
│   │   ├── sale/
│   │   │   └── page.tsx            ← Sản phẩm khuyến mãi
│   │   └── account/
│   │       └── page.tsx            ← Trang tài khoản cá nhân
│   ├── components/
│   │   ├── layout/                 ← Navbar, Footer
│   │   ├── shared/                 ← ProductCard, CategoryCard, v.v.
│   │   └── ui/                     ← shadcn/ui — KHÔNG sửa trực tiếp
│   ├── services/                   ← Tất cả API calls (Axios)
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── order.service.ts
│   │   └── cart.service.ts
│   ├── stores/                     ← Zustand stores
│   │   ├── auth.store.ts
│   │   └── cart.store.ts
│   ├── lib/
│   │   ├── axios.ts                ← Axios instance + interceptors
│   │   └── utils.ts                ← cn() và helpers
│   ├── constants/                  ← App-wide constants
│   └── types/
│       └── index.ts                ← TypeScript interfaces
├── docs/                           ← Tài liệu dự án (thư mục này)
├── AGENTS.md
├── CLAUDE.md
├── package.json
└── next.config.ts
```

---

## 4. Design System

### 4.1 Màu sắc chính

| Token | Tailwind class | Hex | Ứng dụng |
|-------|----------------|-----|----------|
| Primary | `pink-600` | `#DB2777` | CTA buttons, links, accents |
| Primary Hover | `pink-700` | `#BE185D` | Button hover states |
| Primary Light | `pink-50` | `#FFF1F2` | Section backgrounds |
| Hero Gradient | `from-pink-50 to-rose-100` | — | Hero section background |
| Admin Gradient | `from-[#FF69B4] to-[#D946A6]` | — | Gradient elements (from src/) |
| Text Primary | `gray-800` | `#1F2937` | Main headings |
| Text Secondary | `gray-600` | `#4B5563` | Body text |
| Text Muted | `gray-400` | `#9CA3AF` | Placeholder, disabled |

> **Bắt buộc:** Mọi màu sắc phải khớp với thiết kế trong thư mục `src/` tại root workspace.
> Xem [design-reference.md](./design-reference.md) để biết chi tiết.

### 4.2 Typography

| Ngữ cảnh | Class | Ví dụ |
|---------|-------|-------|
| Hero heading | `text-4xl md:text-5xl font-bold text-gray-800` | "Khám phá vẻ đẹp của bạn" |
| Section heading | `text-2xl font-bold` | "Danh mục nổi bật" |
| Card title | `font-medium text-gray-700` | Tên sản phẩm |
| Price | `text-pink-600 font-bold` | "299.000₫" |
| Body | `text-gray-600 text-sm` | Mô tả |

### 4.3 shadcn/ui Components sử dụng

| Component | Ứng dụng |
|-----------|---------|
| `Button` | CTA, actions (variant: default=pink, outline, ghost) |
| `Card`, `CardContent`, `CardHeader` | Product cards, forms |
| `Input`, `Label` | Forms (login, search, checkout) |
| `Badge` | Tags, trạng thái đơn hàng |
| `Sheet` | Mobile menu, cart drawer |
| `Separator` | Dividers trong cart, checkout |
| `DropdownMenu` | User account menu |
| `Sonner` | Toast notifications (success/error) |

---

## 5. Danh sách màn hình

| Route | Tên màn hình | Auth | Mô tả |
|-------|-------------|------|-------|
| `/` | Trang chủ | Public | Hero, danh mục nổi bật, sale banner |
| `/products` | Danh sách sản phẩm | Public | Search, filter, phân trang |
| `/products/[slug]` | Chi tiết sản phẩm | Public | Ảnh, mô tả, giá, thêm vào giỏ |
| `/cart` | Giỏ hàng | Public | Danh sách, điều chỉnh SL, tóm tắt |
| `/checkout` | Thanh toán | Required | Địa chỉ, xác nhận, đặt hàng |
| `/login` | Đăng nhập | Guest-only | Form email/password |
| `/register` | Đăng ký | Guest-only | Form tạo tài khoản |
| `/sale` | Khuyến mãi | Public | Sản phẩm giảm giá |
| `/orders` | Lịch sử đơn hàng | Required | Danh sách đơn hàng |
| `/orders/[id]` | Chi tiết đơn hàng | Required | Trạng thái, items, tổng tiền |
| `/account` | Tài khoản | Required | Thông tin cá nhân, đổi mật khẩu |

---

## 6. State Management (Zustand)

### 6.1 Cart Store

```typescript
interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}
```

- Persisted vào `localStorage` key `beautystore-cart`
- Tính toán giỏ hàng hoàn toàn client-side, không round-trip server

### 6.2 Auth Store

```typescript
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
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
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,   // gửi httpOnly JWT cookie
  timeout: 10000,
});
```

### 7.3 Endpoints chính

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/auth/login` | POST | Đăng nhập, nhận JWT httpOnly cookie |
| `/auth/logout` | POST | Đăng xuất, xóa cookie |
| `/auth/register` | POST | Đăng ký tài khoản |
| `/catalog/products` | GET | Danh sách sản phẩm (phân trang, filter) |
| `/catalog/products/search` | GET | Tìm kiếm theo tên/SKU |
| `/catalog/products/{slug}` | GET | Chi tiết sản phẩm |
| `/catalog/categories` | GET | Danh mục (2 cấp) |
| `/orders` | POST | Tạo đơn hàng |
| `/orders` | GET | Lịch sử đơn hàng |
| `/orders/{id}` | GET | Chi tiết đơn hàng |
| `/promotions/coupons/validate` | POST | Validate mã coupon |
| `/loyalty/members` | GET | Thông tin loyalty member |

---

## 8. Authentication Flow

```
Khách hàng nhập email + password
          │
          ▼
   POST /auth/login
          │
   ┌──────┴──────┐
   │   Success   │ → httpOnly cookie JWT được set
   └──────┬──────┘   → Zustand: setUser(userData)
          │           → Redirect về trang chủ / trang trước đó
          │
   ┌──────┴──────┐
   │   Failed    │ → Toast error "Email hoặc mật khẩu không đúng"
   └─────────────┘

Mọi request sau đó: httpOnly cookie tự động gửi kèm
→ Backend verify JWT tại API Gateway
→ Nếu 401: redirect về /login
```

---

## 9. Các nguyên tắc bắt buộc

1. **Tuân thủ thiết kế `src/`:** Mọi trang và component phải tham chiếu và khớp 100% với thiết kế trong thư mục `src/` tại root workspace.
2. **Client-side cart:** Giỏ hàng tính toán hoàn toàn phía client (Zustand + localStorage), không round-trip server.
3. **Responsive:** Mọi trang phải responsive từ mobile (375px) đến desktop (1440px).
4. **Vietnamese UI:** Toàn bộ text giao diện bằng tiếng Việt.
5. **Pink brand:** Primary color là `pink-600` (#DB2777), hover là `pink-700`.
6. **httpOnly cookie:** Không lưu JWT vào localStorage — để backend set cookie.
7. **Service layer:** Không gọi Axios trực tiếp trong component — luôn qua `services/`.
