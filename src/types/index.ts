export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: Category;
  stock: number;
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
