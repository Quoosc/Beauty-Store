// ============================================================
// BEAUTYERP — Core TypeScript Types
// Sync với backend BeautyERP (Spring Boot Microservices)
// ============================================================

// ------------------------------------------------------------
// AUTH & USER
// ------------------------------------------------------------

/** 4 roles theo backend auth-service */
export type UserRole =
  | "ADMIN"
  | "BRANCH_MANAGER"
  | "CASHIER"
  | "WAREHOUSE_STAFF";

/** Khớp với AccountResponse.java của auth-service */
export interface User {
  id: string;                    // UUID
  fullName: string;
  username: string;
  role: UserRole;
  branchId: string | null;       // null nếu ADMIN
  forceChangePassword: boolean;
  isLocked: boolean;
}

/** Khớp với LoginResponse.java — backend trả user info sau khi set cookie */
export interface LoginResponse {
  user: User;
  // JWT được set qua httpOnly cookie, KHÔNG có trong response body
}

// ------------------------------------------------------------
// API RESPONSE WRAPPER
// Khớp với ApiResponse<T>.java — common/dto
// ------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: PaginatedData<T>;
}

// ------------------------------------------------------------
// CATALOG — catalog-service :8082
// ------------------------------------------------------------

/** Khớp với CategoryResponse.java */
export interface Category {
  id: string;            // UUID
  name: string;
  slug: string;
  parentId: string | null;
  level: number;         // 1 = parent, 2 = child
  children?: Category[];
}

/** Khớp với ProductStatus enum */
export type ProductStatus = "ACTIVE" | "DISCONTINUED";

/** Khớp với ProductResponse.java */
export interface Product {
  id: string;            // UUID
  sku: string;
  barcode: string;
  name: string;
  slug: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  imageUrls: string[];
  status: ProductStatus;
  expiryDate: string | null;
  branchId: string;
  category: Category;
}

// ------------------------------------------------------------
// ORDER — order-service :8083
// ------------------------------------------------------------

/** Khớp với OrderStatus enum */
export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "RETURNED";

/** Khớp với CancelLogStatus enum */
export type CancelLogStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Khớp với OrderItemResponse.java */
export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Khớp với OrderResponse.java */
export interface Order {
  id: string;            // UUID
  idempotencyKey: string;
  shiftId: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  items: OrderItem[];
  subtotal: number;
  couponDiscount: number;
  pointsDiscount: number;
  total: number;
  status: OrderStatus;
  receiptUrl: string | null;
  createdAt: string;
}

/** Request body tạo đơn hàng */
export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  memberId?: string;
  pointsToRedeem?: number;
  tenderedAmount: number;
}

/** Khớp với ReturnResponse.java */
export interface ReturnTransaction {
  id: string;
  originalOrderId: string;
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  totalRefund: number;
  createdAt: string;
}

// ------------------------------------------------------------
// SHIFT — order-service :8083
// ------------------------------------------------------------

export type ShiftStatus = "OPEN" | "CLOSED";

/** Khớp với ShiftResponse.java */
export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  status: ShiftStatus;
  openingCash: number;
  closingCash: number | null;
  variance: number | null;
  completedOrders: number;
  totalRevenue: number;
  cancelledOrders: number;
  returnedOrders: number;
  openedAt: string;
  closedAt: string | null;
}

// ------------------------------------------------------------
// INVENTORY — inventory-service :8084
// ------------------------------------------------------------

export type POStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FULLY_RECEIVED"
  | "PARTIALLY_RECEIVED"
  | "CANCELLED";

export interface InventoryStock {
  productId: string;
  productName: string;
  sku: string;
  branchId: string;
  quantity: number;
  minThreshold: number;
  isLowStock: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  status: POStatus;
  items: POItem[];
  totalAmount: number;
  createdAt: string;
}

export interface POItem {
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  lotNumber: string | null;
  expiryDate: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  taxCode: string;
  phone: string;
  address: string;
}

// ------------------------------------------------------------
// LOYALTY & PROMOTION — loyalty-promotion-service :8085
// ------------------------------------------------------------

export interface LoyaltyMember {
  id: string;
  memberCode: string;
  fullName: string;
  phone: string;
  pointBalance: number;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minOrderValue: number;
  maxDiscountCap: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  promotionId: string;
  maxUsageTotal: number;
  maxUsagePerCustomer: number;
  usedCount: number;
  isActive: boolean;
}

export interface CouponValidationResponse {
  isValid: boolean;
  discountAmount: number;
  reason?: string;   // nếu không hợp lệ
}

// ------------------------------------------------------------
// NOTIFICATION — notification-audit-service :8087
// ------------------------------------------------------------

export type NotificationType =
  | "LOW_STOCK"
  | "NEAR_EXPIRY"
  | "SHIFT_VARIANCE"
  | "CANCEL_APPROVAL"
  | "PO_PARTIAL"
  | "REPORT_READY";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  deepLinkPath: string;
  isRead: boolean;
  createdAt: string;
}

// ------------------------------------------------------------
// REPORT — report-service :8086
// ------------------------------------------------------------

export interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;    // % so với hôm qua
  topProducts: { productId: string; productName: string; soldQty: number }[];
}

// ------------------------------------------------------------
// SYSTEM CONFIG — auth-service :8081
// ------------------------------------------------------------

export interface SystemConfig {
  key: string;
  value: string;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// AUDIT LOG — notification-audit-service :8087
// ------------------------------------------------------------

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: string | null;  // JSON string
  newValue: string | null;  // JSON string
  ipAddress: string;
  createdAt: string;
}
