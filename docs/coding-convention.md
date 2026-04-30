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
| CSS class (Tailwind) | Tailwind utilities | `text-pink-600`, `bg-white` |

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
// components/shared/ProductCard.tsx
import type { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice !== undefined && product.salePrice < product.price;

  return (
    <div className="group rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={product.images[0] ?? "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-pink-600">
              -{Math.round(((product.price - displayPrice) / product.price) * 100)}%
            </Badge>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-sm text-gray-700 line-clamp-2 hover:text-pink-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-pink-600 font-bold text-sm">
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-gray-400 text-xs line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full mt-2 bg-pink-600 hover:bg-pink-700"
          onClick={() => onAddToCart?.(product)}
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          Thêm vào giỏ
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
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

## 8. Styling (Tailwind CSS)

### 8.1 Nguyên tắc

- **Chỉ dùng Tailwind utilities** — không viết custom CSS trừ khi Tailwind không đủ
- **Mobile-first:** base styles cho mobile, dùng `md:`, `lg:` cho larger breakpoints
- **Brand color:** `pink-600` là primary, `pink-50` cho background nhạt

### 8.2 Responsive breakpoints

| Breakpoint | Class prefix | Min-width |
|-----------|-------------|----------|
| Mobile (base) | — | 375px |
| Tablet | `md:` | 768px |
| Desktop | `lg:` | 1024px |
| Wide | `xl:` | 1280px |

### 8.3 Patterns chuẩn

```tsx
{/* Container chuẩn */}
<div className="container mx-auto px-4">

{/* Grid sản phẩm */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

{/* Section padding */}
<section className="py-12">

{/* CTA button primary */}
<Button className="bg-pink-600 hover:bg-pink-700">

{/* Hero gradient */}
<section className="bg-gradient-to-r from-pink-50 to-rose-100">

{/* Card */}
<div className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">

{/* Link hover */}
<Link className="hover:text-pink-600 transition-colors">
```

### 8.4 Không được

- Không dùng inline `style={{}}` trừ khi cần dynamic value không biểu diễn được bằng Tailwind
- Không dùng `!important`
- Không mix Tailwind với styled-components hay CSS modules
- Không hardcode màu hex trực tiếp — dùng Tailwind color tokens hoặc CSS variables

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
const [emailError, setEmailError] = useState("");

const handleEmailBlur = () => {
  if (!email.includes("@")) {
    setEmailError("Email không hợp lệ");
  } else {
    setEmailError("");
  }
};

// Trong JSX:
<Input onBlur={handleEmailBlur} />
{emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
```

### 10.3 Error boundaries

```typescript
// app/error.tsx — Next.js error boundary
"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Có lỗi xảy ra</h2>
      <button onClick={reset} className="text-pink-600 hover:underline">
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

## 11. Thiết kế & Design Reference

> **Quy tắc tuyệt đối:** Mọi trang, component và giao diện trong BeautyStore FE  
> **phải tham chiếu và tuân thủ 100%** theo thiết kế trong thư mục `src/` tại root workspace.

### 11.1 Quy trình implement UI

1. Tìm màn hình tương ứng trong `src/app/pages/` hoặc `src/app/components/`
2. Phân tích: màu sắc, layout, spacing, typography, interactions
3. Implement trong BeautyStore FE dùng Next.js + Tailwind + shadcn/ui
4. Kiểm tra visual match trước khi coi là hoàn thành

### 11.2 Không được tự ý thay đổi

- Màu sắc chính và gradient từ thiết kế `src/`
- Layout structure (header, sidebar, main content, footer)
- Kích thước và spacing của components
- Typography hierarchy (font sizes, weights)

Xem thêm chi tiết tại [design-reference.md](./design-reference.md).

---

## 12. Checklist trước khi commit

- [ ] Không có `any` type trong TypeScript
- [ ] Không gọi Axios trực tiếp trong component — qua `services/`
- [ ] `"use client"` chỉ khi thực sự cần event handler / browser API / Zustand hook
- [ ] Responsive đã kiểm tra trên mobile (375px) và desktop (1280px)
- [ ] Màu sắc và layout khớp với thiết kế trong `src/`
- [ ] Loading, empty state, error state đã xử lý
- [ ] Text giao diện bằng tiếng Việt
- [ ] Không hardcode URL, màu sắc, magic numbers
- [ ] Component file ≤ 150 lines
- [ ] Lỗi form hiển thị inline (không đợi submit)
- [ ] Toast messages bằng tiếng Việt
