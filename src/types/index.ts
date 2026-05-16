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

/** Spring Data Page — dùng cho các service trả Page<T> chuẩn */
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

/** Catalog-service dùng custom PagedProductResponse: 'products' + 'total' (không phải Spring Data) */
export interface CatalogPagedData<T> {
  products: T[];
  total: number;
  page: number;
  size: number;
}

// ------------------------------------------------------------
// CATALOG — catalog-service :8082
// ------------------------------------------------------------

/** Khớp với CategoryResponse.java */
export interface Category {
  id: string;            // UUID
  name: string;
  parentId: string | null;
  level: number;         // 1 = parent, 2 = child
  createdAt?: string;
  updatedAt?: string;
  children?: Category[];
}

/** Khớp với ProductStatus enum */
export type ProductStatus = "ACTIVE" | "DISCONTINUED";

/** Khớp với ProductResponse.java */
export interface Product {
  id: string;            // UUID
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  sellingPrice: number;
  costPrice: number | null;
  imageUrl: string | null;   // BE trả string đơn, không phải mảng
  status: ProductStatus;
  expiryDate: string | null;
  branchId: string;
  categoryId: string;        // BE trả UUID, không embed Category object
  createdAt?: string;
  updatedAt?: string;
}

// ------------------------------------------------------------
// ORDER — order-service :8083
// ------------------------------------------------------------

/** Khớp với OrderStatus enum */
export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "RETURNED";

/** Dùng nội bộ cho cancel log */
export type CancelLogStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Khớp với OrderItemResponse.java */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

/** Khớp với OrderResponse.java */
export interface Order {
  id: string;            // UUID
  shiftId: string;
  cashierId: string;
  branchId: string;
  loyaltyMemberId: string | null;
  couponCode: string | null;
  subtotal: number;
  discountAmount: number;       // tổng giảm giá (coupon + points)
  pointsRedeemed: number | null;
  pointsDiscount: number;
  total: number;
  tenderedAmount: number;
  changeAmount: number;
  status: OrderStatus;
  receiptUrl: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/** Request body tạo đơn hàng */
export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  loyaltyMemberId?: string;    // đúng tên BE nhận
  couponDiscount?: number;
  pointsRedeemed?: number;     // đúng tên BE nhận
  pointsDiscount?: number;
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

export interface ReturnTransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

// ------------------------------------------------------------
// SHIFT — order-service :8083
// ------------------------------------------------------------

export type ShiftStatus = "OPEN" | "CLOSED";

/** Khớp với ShiftResponse.summary nested object */
export interface ShiftSummary {
  orderCount: number;
  totalRevenue: number;
  cancelCount: number;
  returnCount: number;
}

/** Khớp với ShiftResponse.java */
export interface Shift {
  id: string;
  cashierId: string;
  branchId: string;
  status: ShiftStatus;
  openingCash: number;
  closingCash: number | null;
  variance: number | null;
  note: string | null;
  summary: ShiftSummary | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface InventoryReportRow {
  productId: string;
  productName: string;
  sku: string;
  branchId: string;
  quantity: number;
  minThreshold: number;
  isLowStock: boolean;
}

export type AdjustmentLossType = "DAMAGED" | "LOST" | "EXPIRED";

/** Khớp với AdjustmentRequest BE — field là lossType, không phải type */
export interface AdjustmentRequest {
  productId: string;
  quantity: number;
  lossType: AdjustmentLossType;
  description: string;
}

/** Khớp với SupplierResponse.java */
export interface Supplier {
  id: string;
  name: string;
  taxCode: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Khớp với PurchaseOrderResponse.java */
export interface PurchaseOrder {
  id: string;
  poCode: string;
  supplier: Supplier;            // nested object, không phải flat supplierId/supplierName
  branchId: string;
  status: POStatus;
  createdBy: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  items: POItem[];
  createdAt: string;
  updatedAt: string;
}

/** Khớp với PoItemResponse.java */
export interface POItem {
  id: string;
  productId: string;
  orderedQty: number;
  receivedQty: number;
  lotNumber: string | null;
  expiryDate: string | null;
  createdAt: string;
}

// ------------------------------------------------------------
// LOYALTY & PROMOTION — loyalty-promotion-service :8085
// ------------------------------------------------------------

/** Khớp với LoyaltyMemberResponse.java */
export interface LoyaltyMember {
  id: string;
  memberCode: string;
  fullName: string;
  phone: string;
  pointBalance: number;
  branchId: string | null;
  createdAt: string;
}

/** Khớp với PromotionResponse.java — active (không phải isActive) */
export interface Promotion {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;         // đúng tên BE (không phải value)
  minOrderValue: number;
  maxDiscountCap: number | null;
  startDate: string;
  endDate: string;
  active: boolean;               // Lombok @Data tạo isActive() getter nhưng JSON serialize là 'active'
  branchId: string | null;
}

/** Khớp với CouponResponse.java — active (không phải isActive) */
export interface Coupon {
  id: string;
  code: string;
  promotionId: string;
  maxUsageTotal: number;
  maxUsagePerCustomer: number;
  usedCount: number;
  active: boolean;
}

/** Khớp với CouponValidationResponse.java — BE không có field isValid */
export interface CouponValidationResponse {
  discountAmount: number;
  promotionId: string;
  promotionName: string;
}

/** Khớp với RedeemPreviewResponse.java */
export interface RedeemPreviewResponse {
  pointsToRedeem: number;
  discountAmount: number;
  maxAllowed: number;
}

/** Response sau khi đổi điểm thành công */
export interface RedeemResponse {
  discountAmount: number;
  actualPointsRedeemed: number;
  remainingBalance: number;
}

// ------------------------------------------------------------
// NOTIFICATION — notification-audit-service :8087
// ------------------------------------------------------------

export type NotificationType =
  | "LOW_STOCK"
  | "NEAR_EXPIRY"
  | "SHIFT_VARIANCE"
  | "CANCEL_APPROVAL"
  | "ADJUSTMENT_APPROVAL"     // BE có, FE trước đó thiếu
  | "PO_PARTIAL"
  | "REPORT_COMPLETED"        // đúng tên — không phải REPORT_READY
  | "ACCOUNT_LOCKED";         // Admin nhận khi tài khoản bị khóa sau 5 lần sai

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

/** Khớp với DashboardResponse.RevenueSummary */
export interface DashboardRevenueSummary {
  today: number;
  orderCount: number;
  averageOrderValue: number;
  totalDiscount: number;
  vsPreviousDayPercent: number | null;
}

/** Khớp với DashboardResponse.DailyChartPoint */
export interface DashboardChartPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

/** Khớp với DashboardResponse.TopProductEntry */
export interface DashboardTopProduct {
  productId: string;
  productName: string;
  soldQty: number;
  revenue: number;
}

/** Khớp với DashboardResponse.AlertEntry */
export interface DashboardAlert {
  type: string;
  productId: string;
  message: string;
}

/**
 * Khớp với DashboardResponse.java — cấu trúc nested, KHÔNG phải flat.
 * BE dùng @JsonInclude(NON_NULL) nên field có thể vắng mặt khi null.
 */
export interface DashboardData {
  revenue?: DashboardRevenueSummary;
  chart7Days?: DashboardChartPoint[];
  topProducts?: DashboardTopProduct[];
  alerts?: DashboardAlert[];
}

/** Khớp với AsyncReportJobResponse.java — status chỉ có PROCESSING/COMPLETED/FAILED */
export interface ReportJob {
  jobId: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt?: string;
  data?: unknown;
}

// ------------------------------------------------------------
// SYSTEM CONFIG — auth-service :8081
// ------------------------------------------------------------

/** Khớp với SystemConfigResponse.java — field là configKey/configValue */
export interface SystemConfig {
  id: string;
  configKey: string;
  configValue: string;
  description: string;
  minValue: string | null;
  maxValue: string | null;
  updatedBy: string | null;
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
