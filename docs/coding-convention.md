# BeautyStore FE — Coding Convention

> Tài liệu này là chuẩn bắt buộc cho **toàn bộ** code trong dự án BeautyStore FE.  
> Mọi code mới phải tuân thủ. Mọi deviation phải có comment giải thích lý do.

---

## Mục lục

1. [Cấu trúc file & thư mục](#1-cấu-trúc-file--thư-mục)
2. [Đặt tên](#2-đặt-tên)
3. [TypeScript](#3-typescript)
4. [Components (React/Next.js)](#4-components-reactnextjs)
5. [Pages (App Router)](#5-pages-app-router)
6. [Stores (Zustand)](#6-stores-zustand)
7. [Services (Axios)](#7-services-axios)
8. [Styling (Tailwind CSS)](#8-styling-tailwind-css)
9. [Data Fetching & Side Effects](#9-data-fetching--side-effects)
10. [Error Handling](#10-error-handling)
11. [Thiết kế & Design Reference](#11-thiết-kế--design-reference)
12. [Checklist trước khi commit](#12-checklist-trước-khi-commit)

---

## 1. Cấu trúc file & thư mục

### 1.1 Quy tắc tổ chức

```
src/
├── app/            ← Next.js App Router — pages only (không đặt logic components ở đây)
├── components/
│   ├── layout/     ← Navbar, Footer (dùng 1 lần trong layout.tsx)
│   ├── shared/     ← Reusable UI components (ProductCard, CategoryCard, ...)
│   └── ui/         ← shadcn/ui generated — KHÔNG sửa trực tiếp
├── services/       ← Tất cả API calls — không gọi axios trực tiếp trong component
├── stores/         ← Zustand stores
├── lib/            ← Axios instance, utilities
├── constants/      ← App-wide constants (routes, config values, ...)
└── types/          ← TypeScript interfaces & types
```

**Quy tắc:**
- Components trong `app/` chỉ là page entry points — logic phức tạp tách ra `components/`
- Không gọi Axios trực tiếp trong component — luôn qua `services/`
- Không hardcode API URL, màu sắc, giá trị cấu hình — dùng constants hoặc Tailwind tokens
- Mỗi file component tối đa **150 lines** — nếu vượt, tách thành sub-component hoặc custom hook

### 1.2 Tên file

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Page | `page.tsx` | `app/products/page.tsx` |
| Layout | `layout.tsx` | `app/layout.tsx` |
| Component | `PascalCase.tsx` | `ProductCard.tsx`, `Navbar.tsx` |
| Store | `camelCase.store.ts` | `cart.store.ts` |
| Service | `camelCase.service.ts` | `product.service.ts` |
| Types | `index.ts` hoặc `camelCase.types.ts` | `types/index.ts` |
| Utility | `camelCase.ts` | `formatPrice.ts` |

---

## 2. Đặt tên

### 2.1 Nguyên tắc chung

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | `PascalCase` | `ProductCard`, `Navbar`, `CartSummary` |
| Interface / Type | `PascalCase` | `Product`, `CartItem`, `ApiResponse<T>` |
| Const object (enum thay thế) | `PascalCase` | `OrderStatus.PENDING` |
| Store hook | `use` + `PascalCase` + `Store` | `useCartStore`, `useAuthStore` |
| Service object | `camelCase` + `Service` | `productService`, `authService` |
| Utility function | `camelCase` | `formatPrice`, `slugify`, `cn` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_CART_ITEMS`, `API_TIMEOUT` |
| CSS variable (CÉLA) | `var(--cela-*)` | `var(--cela-rose)`, `var(--cela-espresso)` |

### 2.2 Đặt tên component theo loại

```
Shared component    : {Descriptor}          → ProductCard, CategoryBadge, PriceTag
Layout component    : {Name}                → Navbar, Footer
Form component      : {Name}Form            → LoginForm, CheckoutForm
Modal/Dialog        : {Name}Modal           → ConfirmModal, AddressModal
Skeleton/Loading    : {Name}Skeleton        → ProductCardSkeleton, ProductListSkeleton
```

### 2.3 Props interface

```typescript
// Đặt ngay trên component, không tách file riêng trừ khi dùng nhiều nơi
interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  className?: string;
}
```

---

## 3. TypeScript

### 3.1 Interfaces trong `types/index.ts`

```typescript
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;      // optional field dùng ?, không dùng | null
  images: string[];
  category: Category;
  stock: number;
  rating: number;
  reviewCount: number;
}

// Generic wrappers — dùng cho mọi API response
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 3.2 Const object thay thế enum

```typescript
// Dùng const object — tree-shaking tốt hơn TypeScript enum
export const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// Sử dụng:
const status: OrderStatus = OrderStatus.PENDING;
```

### 3.3 Quy tắc TypeScript

- **Không dùng `any`** — dùng `unknown` nếu type chưa biết, sau đó type guard
- Luôn khai báo return type cho service functions
- Dùng `FC` (import từ react) thay vì `React.FC`
- Dùng `as const` cho object literals cần immutability

---

## 4. Components (React/Next.js)

### 4.1 Cấu trúc component chuẩn

```typescript
// components/shared/StatusBadge.tsx — ví dụ component CÉLA chuẩn
import type { FC } from "react";
import type { OrderStatus } from "@/types";

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  COMPLETED: { bg: "rgba(107,142,106,0.15)", color: "var(--cela-success)", label: "Hoàn thành" },
  PENDING:   { bg: "rgba(201,168,122,0.20)", color: "var(--cela-gold)",    label: "Chờ xử lý" },
  CANCELLED: { bg: "rgba(183,110,121,0.15)", color: "var(--cela-danger)",  label: "Đã hủy" },
  RETURNED:  { bg: "rgba(201,168,122,0.20)", color: "var(--cela-gold)",    label: "Trả hàng" },
};

interface StatusBadgeProps {
  status: OrderStatus;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  const s = STATUS_STYLE[status] ?? { bg: "var(--cela-fog)", color: "var(--cela-stone)", label: status };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
};

export default StatusBadge;
```

### 4.2 Server vs Client Components

```typescript
// Server Component (mặc định) — không có "use client"
// Dùng cho: data fetching, static content, SEO-critical pages
export default async function ProductsPage() {
  const products = await productService.getProducts();
  return <ProductList products={products} />;
}

// Client Component — thêm "use client" ở đầu file
// Dùng khi: event handlers, useState, useEffect, browser APIs, Zustand store
"use client";
export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  return (
    <Button onClick={() => addItem(product)}>Thêm vào giỏ</Button>
  );
}
```

**Quy tắc:**
- Mặc định là **Server Component** — không thêm `"use client"` khi không cần
- Tách phần interactive thành Client Component nhỏ thay vì `"use client"` cả page
- Không dùng `useEffect` để fetch data — dùng async Server Component

---

## 5. Pages (App Router)

### 5.1 Server Page chuẩn

```typescript
// app/products/page.tsx
import type { Metadata } from "next";
import ProductList from "@/components/shared/ProductList";
import { productService } from "@/services/product.service";

export const metadata: Metadata = {
  title: "Sản phẩm | BeautyStore",
  description: "Khám phá hàng nghìn sản phẩm mỹ phẩm chính hãng",
};

export default async function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tất cả sản phẩm</h1>
      {/* ... */}
    </div>
  );
}
```

### 5.2 Dynamic routes

```typescript
// app/products/[slug]/page.tsx
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);
  // ...
}
```

### 5.3 Protected pages (auth required)

```typescript
// app/orders/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";  // server-side session check

export default async function OrdersPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  // ...
}
```

---

## 6. Stores (Zustand)

### 6.1 Store structure chuẩn

```typescript
// stores/cart.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
}

interface CartActions {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

interface CartStore extends CartState, CartActions {
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + (i.product.salePrice ?? i.product.price) * i.quantity,
          0
        ),
    }),
    { name: "beautystore-cart" }
  )
);
```

**Quy tắc:**
- Tách riêng `State` interface và `Actions` interface
- Computed values (totalItems, totalPrice) là **functions** trong store, không là computed state
- Dùng `persist` middleware cho cart (localStorage)
- **Không** đặt async API calls trong store actions — gọi service bên ngoài rồi `set`

---

## 7. Services (Axios)

### 7.1 Service object chuẩn

```typescript
// services/product.service.ts
import axiosInstance from "@/lib/axios";
import type { Product, PaginatedResponse, ApiResponse } from "@/types";

export interface ProductSearchParams {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest";
}

export const productService = {
  getProducts: async (params?: ProductSearchParams): Promise<PaginatedResponse<Product>> => {
    const { data } = await axiosInstance.get<ApiResponse<PaginatedResponse<Product>>>(
      "/catalog/products",
      { params }
    );
    return data.data;
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const { data } = await axiosInstance.get<ApiResponse<Product>>(
      `/catalog/products/${slug}`
    );
    return data.data;
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const { data } = await axiosInstance.get<ApiResponse<Product[]>>(
      "/catalog/products/search",
      { params: { q: query } }
    );
    return data.data;
  },
};
```

### 7.2 Axios instance chuẩn

```typescript
// lib/axios.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
  withCredentials: true,   // gửi httpOnly JWT cookie
  timeout: 10000,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

**Quy tắc:**
- Service là **plain object** với typed methods — không dùng class
- Luôn destructure `{ data }` từ Axios response
- Generic type cho response: `axiosInstance.get<ApiResponse<T>>(...)`
- Params interface khai báo trong cùng file service
- **Không** gọi `axiosInstance` trực tiếp trong component — luôn qua service

---

## 8. Styling — CÉLA Design System

> BeautyERP FE dùng **CÉLA design system** — thương hiệu mỹ phẩm sang trọng. Mọi màu sắc, typography, shadow đều phải dùng CÉLA tokens, không dùng Tailwind color class cũ.

### 8.1 Nguyên tắc cốt lõi

- **Inline `style={{}}` là cách chính** cho mọi giá trị màu sắc, border, shadow, typography
- **Tailwind chỉ dùng cho:** layout (`flex`, `grid`, `hidden`, `gap-*`, `p-*`, `w-*`, `h-*`), responsive breakpoints, và hover state (`hover:bg-[var(--cela-fog)]`)
- **KHÔNG dùng:** Tailwind color classes (`bg-pink-*`, `text-gray-*`, `border-gray-*`, `shadow-sm`, `shadow-md`, v.v.)
- **KHÔNG hardcode hex** — dùng CSS variables `var(--cela-*)`

### 8.2 CÉLA Color Tokens

Tất cả tokens định nghĩa trong `src/app/globals.css`:

| Token | Hex | Ứng dụng |
|-------|-----|----------|
| `--cela-ivory` | `#faf7f2` | Page background |
| `--cela-paper` | `#ffffff` | Card background |
| `--cela-fog` | `#ece4da` | Divider, hover bg |
| `--cela-mist` | `#d8cec5` | Border chính |
| `--cela-stone` | `#8a7a6f` | Secondary text |
| `--cela-cocoa` | `#6b574f` | Tertiary text, eyebrow |
| `--cela-espresso` | `#3c2e2a` | Primary text, primary button |
| `--cela-rose` | `#b76e79` | Accent, CTA, active state |
| `--cela-champagne` | `#c9a87a` | Gold accent |
| `--cela-gold` | `#b8945c` | Gold text |
| `--cela-success` | `#6b8e6a` | Trạng thái thành công |
| `--cela-danger` | `#b04848` | Lỗi, hủy, nguy hiểm |
| `--cela-shadow-soft` | — | Shadow nhẹ cho card |
| `--cela-shadow-md` | — | Shadow modal, dropdown |

### 8.3 CÉLA Typography

| Ngữ cảnh | Style |
|---------|-------|
| Page h1 | `fontFamily: "var(--cela-display)"`, `fontSize: 28`, `fontWeight: 700`, `fontStyle: "italic"` |
| Page eyebrow | `fontSize: 11`, `letterSpacing: "0.18em"`, `textTransform: "uppercase"`, `color: "var(--cela-cocoa)"` |
| Section heading | `fontSize: 15`, `fontWeight: 600`, `color: "var(--cela-espresso)"` |
| Body | `fontSize: 13`, `color: "var(--cela-espresso)"` |
| Muted | `fontSize: 12`, `color: "var(--cela-stone)"` |
| Mono (price, code) | `fontFamily: "var(--cela-mono)"` |

### 8.4 Patterns chuẩn

```tsx
{/* Page header — bắt buộc mọi trang trong ERPLayout */}
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
  <div>
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 4px" }}>
      BEAUTY ERP
    </p>
    <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 700, color: "var(--cela-espresso)", fontStyle: "italic", lineHeight: 1.2, margin: 0 }}>
      Tên trang <span style={{ color: "var(--cela-rose)" }}>phụ đề</span>
    </h1>
  </div>
  <button style={{ background: "var(--cela-espresso)", color: "#fff", border: 0, borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
    Hành động
  </button>
</div>

{/* Card container */}
<div style={{ background: "var(--cela-paper)", border: "1px solid var(--cela-mist)", borderRadius: 16, padding: "20px 24px", boxShadow: "var(--cela-shadow-soft)" }}>

{/* Button primary (espresso) */}
<button style={{ background: "var(--cela-espresso)", color: "#fff", border: 0, borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>

{/* Button rose (CTA) */}
<button style={{ background: "var(--cela-rose)", color: "#fff", border: 0, borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>

{/* Button secondary (outlined) */}
<button style={{ background: "var(--cela-ivory)", color: "var(--cela-espresso)", border: "1px solid var(--cela-mist)", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>

{/* Button danger */}
<button style={{ background: "var(--cela-danger)", color: "#fff", border: 0, borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>

{/* Input */}
<input style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--cela-mist)", borderRadius: 8, fontSize: 13, color: "var(--cela-espresso)", background: "var(--cela-ivory)", outline: "none", fontFamily: "var(--cela-sans)" }} />

{/* Status badge */}
<span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "rgba(107,142,106,0.15)", color: "var(--cela-success)" }}>
  Hoàn thành
</span>

{/* Table */}
<table style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr style={{ borderBottom: "2px solid var(--cela-fog)" }}>
      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cela-stone)" }}>Cột</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item, i) => (
      <tr key={item.id} style={{ borderBottom: "1px solid var(--cela-fog)" }} className="hover:bg-[var(--cela-fog)] transition-colors">
        <td style={{ padding: "12px", fontSize: 13, color: "var(--cela-espresso)" }}>{item.value}</td>
      </tr>
    ))}
  </tbody>
</table>

{/* Loading spinner */}
<div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
  <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--cela-mist)", borderTopColor: "var(--cela-rose)", animation: "spin 0.7s linear infinite" }} />
</div>

{/* Empty state */}
<div style={{ textAlign: "center", padding: "48px 24px", color: "var(--cela-stone)" }}>
  <Icon style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.4 }} />
  <p style={{ fontSize: 14, fontWeight: 500 }}>Chưa có dữ liệu</p>
</div>
```

### 8.5 Không được

- **KHÔNG** dùng `bg-pink-*`, `text-gray-*`, `border-gray-*`, `shadow-sm`, `shadow-md`, `shadow-xl`, `bg-green-*`, `bg-red-*`, `text-blue-*` — đây là Tailwind color class cũ
- **KHÔNG** dùng `style={{ color: "red" }}`, `style={{ color: "#FF0000" }}` — hardcode hex không phải CÉLA token
- **KHÔNG** dùng `!important`
- **KHÔNG** mix styled-components hay CSS modules
- **KHÔNG** thêm Tailwind màu mới ngoài danh sách cho phép

### 8.6 CÉLA Primitives (`components/ui/cela-primitives.tsx`)

Các component dùng chung đã được tạo sẵn — ưu tiên dùng thay vì viết lại:

| Component | Props chính | Dùng khi |
|-----------|------------|---------|
| `CelaCard` | `padding?`, `style?` | Mọi card container |
| `CelaButton` | `variant` (`primary`/`secondary`/`rose`/`danger`/`ghost`), `size?` | Mọi button |
| `CelaInput` | `icon?`, `...InputHTMLAttributes` | Text input, search |
| `CelaSpinner` | — | Loading state |
| `CelaEmptyState` | `icon?`, `title?`, `description?` | Empty list/table |

---

## 9. Data Fetching & Side Effects

### 9.1 Server Components — fetch trực tiếp

```typescript
// Async Server Component — đây là cách ưu tiên
export default async function ProductsPage() {
  const products = await productService.getProducts({ limit: 20 });
  return <ProductGrid products={products.data} />;
}
```

### 9.2 Client Components — search với debounce

```typescript
"use client";
import { useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";

export function ProductSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce 300ms — không gọi API liên tục khi đang gõ
  const handleSearch = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await productService.searchProducts(query);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  }, 300);
}
```

### 9.3 Loading & Suspense

```typescript
// Dùng Suspense cho Server Components
import { Suspense } from "react";
import ProductListSkeleton from "@/components/shared/ProductListSkeleton";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductListServer />
    </Suspense>
  );
}
```

---

## 10. Error Handling

### 10.1 API errors trong components

```typescript
const handleAddToCart = async (product: Product) => {
  try {
    addItem(product);  // Zustand — không thể fail
    toast.success("Đã thêm vào giỏ hàng");
  } catch {
    toast.error("Không thể thêm sản phẩm. Vui lòng thử lại.");
  }
};

const handleCheckout = async () => {
  setIsLoading(true);
  try {
    const order = await orderService.createOrder(orderData);
    router.push(`/orders/${order.id}`);
    toast.success("Đặt hàng thành công!");
    clearCart();
  } catch {
    toast.error("Đặt hàng thất bại. Vui lòng thử lại.");
  } finally {
    setIsLoading(false);
  }
};
```

### 10.2 Form validation — inline, không đợi submit

```typescript
const [passwordError, setPasswordError] = useState("");

const handlePasswordBlur = () => {
  if (password.length < 8) {
    setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
  } else {
    setPasswordError("");
  }
};

// Trong JSX:
<input onBlur={handlePasswordBlur} />
{passwordError && (
  <p style={{ fontSize: 11, color: "var(--cela-danger)", marginTop: 4 }}>
    {passwordError}
  </p>
)}
```

### 10.3 Error boundaries

```typescript
// app/error.tsx — Next.js error boundary
"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--cela-espresso)" }}>Có lỗi xảy ra</h2>
      <button
        onClick={reset}
        style={{ color: "var(--cela-rose)", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
      >
        Thử lại
      </button>
    </div>
  );
}
```

**Quy tắc:**
- Dùng `toast` (Sonner) cho thông báo lỗi — không dùng `alert()`
- Lỗi form hiển thị **inline** ngay dưới field, không đợi submit toàn form
- Message lỗi bằng **tiếng Việt** — không expose technical error messages
- Luôn có `finally { setIsLoading(false) }` để tránh UI bị kẹt loading

---

## 11. CÉLA Design Reference

> **Quy tắc tuyệt đối:** Mọi trang và component trong BeautyStore FE phải tuân thủ **CÉLA Design System** — thương hiệu mỹ phẩm sang trọng tông espresso/rose/champagne.

### 11.1 Tài liệu tham chiếu

| File | Nội dung |
|------|---------|
| `docs/cela-ui-refactor.md` | Spec đầy đủ: tokens, patterns, từng trang (Section 2–8) |
| `src/app/globals.css` | Toàn bộ CSS variables `--cela-*` |
| `src/components/ui/cela-primitives.tsx` | `CelaCard`, `CelaButton`, `CelaInput`, `CelaSpinner`, `CelaEmptyState` |

### 11.2 Quy trình implement UI mới

1. Đọc spec trang tương ứng trong `docs/cela-ui-refactor.md`
2. Dùng `CelaCard`, `CelaButton`, `CelaInput` từ `cela-primitives.tsx` làm base
3. Màu sắc: **chỉ dùng `var(--cela-*)` trong inline `style={{}}`**
4. Layout: Tailwind utilities (`flex`, `grid`, `gap-*`, `p-*`)
5. Verify: không còn Tailwind color class (`text-gray-*`, `bg-pink-*`, v.v.)

### 11.3 Không được tự ý thay đổi

- Màu sắc CÉLA — không tự thêm màu ngoài token đã định nghĩa
- Page header pattern (`cela-display` font + eyebrow `letterSpacing: "0.18em"` + rose span)
- Status badge pattern (`{ bg: string; color: string; label: string }` + inline style)
- Typography scale (font sizes, weights, letter spacing)

### 11.4 Checklist verify CÉLA compliance

```bash
# 0 violations → pass
grep -rn "bg-pink-\|text-gray-\|border-gray-\|shadow-sm\b\|shadow-xl\b\|bg-green-\|bg-red-" src/app --include="*.tsx"

# 32 → tất cả pages có header đúng
grep -rn "cela-display" src/app --include="*.tsx" -l | wc -l
grep -rn "letterSpacing.*0\.18" src/app --include="*.tsx" -l | wc -l
```

---

## 12. Checklist trước khi commit

- [ ] Không có `any` type trong TypeScript
- [ ] Không gọi Axios trực tiếp trong component — qua `services/`
- [ ] `"use client"` chỉ khi thực sự cần event handler / browser API / Zustand hook
- [ ] Responsive đã kiểm tra trên mobile (375px) và desktop (1280px)
- [ ] **CÉLA:** Không có Tailwind color class (`bg-pink-*`, `text-gray-*`, `border-gray-*`, `shadow-sm`, v.v.)
- [ ] **CÉLA:** Màu sắc dùng `var(--cela-*)` trong inline `style={{}}`
- [ ] **CÉLA:** Page header có `fontFamily: "var(--cela-display)"` + eyebrow `letterSpacing: "0.18em"`
- [ ] Loading, empty state, error state đã xử lý (dùng `CelaSpinner`, `CelaEmptyState`)
- [ ] Text giao diện bằng tiếng Việt
- [ ] Không hardcode URL, màu sắc hex, magic numbers
- [ ] Lỗi form hiển thị inline với `color: "var(--cela-danger)"` (không đợi submit)
- [ ] Toast messages bằng tiếng Việt (dùng Sonner)
