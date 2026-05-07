# CODEX PROMPT — Wave 5: Admin Tools + Notifications

## IMPORTANT: Read this entire document before writing a single line of code.

---

## 1. Project Context

**BeautyERP FE** — internal ERP. Wave 5 implements the notification system (polling), user account management, audit logs, and system configuration.

**Waves 1–4 must be complete.** All services, sidebars, and business pages must exist.

### Already implemented — DO NOT modify:
- Everything from Waves 1–4
- `src/types/index.ts` — Notification, NotificationType, AuditLog, SystemConfig, User already defined

---

## 2. Files to Implement

### New store:
```
src/stores/notification.store.ts
```

### New hook:
```
src/hooks/useNotificationPolling.ts
```

### New service files:
```
src/services/notification.service.ts
src/services/auditLog.service.ts
src/services/systemConfig.service.ts
```

### New page files:
```
src/app/notifications/page.tsx
src/app/user-management/page.tsx
src/app/audit-logs/page.tsx
src/app/system-configuration/page.tsx
```

### Update existing component:
```
src/components/layout/Header.tsx    (connect real unreadCount from notification.store)
```

---

## 3. Design Source — MANDATORY

| File to implement | Source design file |
|------------------|--------------------|
| `notifications/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\NotificationsCenter.tsx` |
| `user-management/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\UserManagement.tsx` |
| `audit-logs/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\AuditLogs.tsx` |
| `system-configuration/page.tsx` | `d:\HK6 UIT\Kiến trúc phần mềm\src\app\pages\SystemConfiguration.tsx` |
| Role-specific notification pages | `src\app\pages\admin\AdminNotifications.tsx`, `manager\ManagerNotifications.tsx`, etc. |

**Read each source file completely before implementing.**

---

## 4. New Services

### 4.1 `src/services/notification.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, Notification, PaginatedResponse, NotificationType } from "@/types";

export const notificationService = {
  // GET /notification-audit/notifications/unread-count
  // Called every 30s — returns a simple number
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<number>>(
      `/notification-audit/notifications/unread-count`
    );
    return res.data.data;
  },

  // GET /notification-audit/notifications?page=&size=&type=
  getAll: async (params?: { page?: number; size?: number; type?: NotificationType }) => {
    const res = await api.get<PaginatedResponse<Notification>>(
      `/notification-audit/notifications`,
      { params }
    );
    return res.data.data;
  },

  // PATCH /notification-audit/notifications/{id}/read
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notification-audit/notifications/${id}/read`);
  },

  // Mark all as read (batch)
  markAllAsRead: async (): Promise<void> => {
    await api.patch(`/notification-audit/notifications/read-all`);
  },
};
```

### 4.2 `src/services/auditLog.service.ts`

```typescript
import api from "@/lib/axios";
import type { AuditLog, PaginatedResponse } from "@/types";

export const auditLogService = {
  // GET /notification-audit/audit-logs?page=&size=&entityType=&userId=&startDate=&endDate=
  getAll: async (params?: {
    page?: number;
    size?: number;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const res = await api.get<PaginatedResponse<AuditLog>>(
      `/notification-audit/audit-logs`,
      { params }
    );
    return res.data.data;
  },
};
```

### 4.3 `src/services/systemConfig.service.ts`

```typescript
import api from "@/lib/axios";
import type { ApiResponse, SystemConfig } from "@/types";

export const systemConfigService = {
  // GET /auth/system-configs
  getAll: async (): Promise<SystemConfig[]> => {
    const res = await api.get<ApiResponse<SystemConfig[]>>(`/auth/system-configs`);
    return res.data.data;
  },

  // PUT /auth/system-configs/{key}
  update: async (key: string, value: string): Promise<SystemConfig> => {
    const res = await api.put<ApiResponse<SystemConfig>>(
      `/auth/system-configs/${key}`,
      { value }
    );
    return res.data.data;
  },
};
```

---

## 5. Notification Store

### 5.1 `src/stores/notification.store.ts`

```typescript
import { create } from "zustand";
import type { Notification, NotificationType } from "@/types";
import { notificationService } from "@/services/notification.service";

interface NotificationStore {
  unreadCount: number;
  notifications: Notification[];
  isPolling: boolean;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  // Actions
  fetchUnreadCount: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  loadNotifications: (params?: { page?: number; type?: NotificationType }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isPolling: false,
  pollingIntervalId: null,

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Silently fail — polling errors should not disturb UX
    }
  },

  startPolling: () => {
    const { isPolling, fetchUnreadCount } = get();
    if (isPolling) return; // prevent double-polling

    fetchUnreadCount(); // immediate first fetch
    const id = setInterval(fetchUnreadCount, 30000); // then every 30s
    set({ isPolling: true, pollingIntervalId: id });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) clearInterval(pollingIntervalId);
    set({ isPolling: false, pollingIntervalId: null });
  },

  loadNotifications: async (params) => {
    try {
      const result = await notificationService.getAll(params);
      set({ notifications: result.content });
    } catch {
      // keep existing notifications
    }
  },

  markAsRead: async (id: string) => {
    await notificationService.markAsRead(id);
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  setUnreadCount: (count: number) => set({ unreadCount: count }),
}));
```

---

## 6. Notification Polling Hook

### 6.1 `src/hooks/useNotificationPolling.ts`

```typescript
"use client";
import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notification.store";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Start/stop polling based on auth state and page visibility.
 * Use this hook once in ERPLayout.tsx or a top-level authenticated component.
 */
export function useNotificationPolling() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { startPolling, stopPolling } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    startPolling();

    // Pause polling when tab is hidden; resume when visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopPolling();
      } else {
        startPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, startPolling, stopPolling]);
}
```

---

## 7. Update Header.tsx — Connect Real Notification Count

In `src/components/layout/Header.tsx`, replace the placeholder `unreadCount = 0` with the real store:

```typescript
// BEFORE (Wave 1 placeholder):
const unreadCount = 0;

// AFTER (Wave 5 — real data):
import { useNotificationStore } from "@/stores/notification.store";
const unreadCount = useNotificationStore(s => s.unreadCount);
```

Also add the polling hook to `ERPLayout.tsx`:
```typescript
// In ERPLayout.tsx, add after existing imports:
import { useNotificationPolling } from "@/hooks/useNotificationPolling";

// Inside the ERPLayout component body (before return):
useNotificationPolling();
```

---

## 8. Page Specs

All pages: `"use client"` + `<ERPLayout>` wrapper.

---

### 8.1 `src/app/notifications/page.tsx` — Trung tâm thông báo
**Design source:** `src\app\pages\NotificationsCenter.tsx`

**State:**
```typescript
const { notifications, loadNotifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
const [activeType, setActiveType] = useState<NotificationType | "ALL">("ALL");
const [page, setPage] = useState(0);
const [isLoading, setIsLoading] = useState(true);
```

**Load on mount + when type/page changes:**
```typescript
useEffect(() => {
  setIsLoading(true);
  loadNotifications({
    page,
    type: activeType !== "ALL" ? activeType : undefined,
  }).finally(() => setIsLoading(false));
}, [activeType, page]);
```

**Layout:**
```
Page title: "Thông báo" + unread badge (bg-red-500 text-white rounded-full px-2 py-0.5 text-sm)

Action bar:
  Filter tabs (horizontal scroll): [Tất cả | Tồn kho thấp | Sắp hết hạn | Chênh lệch ca | Chờ duyệt hủy | Nhận hàng thiếu | Báo cáo sẵn sàng | Khóa tài khoản*]
  * "Khóa tài khoản" tab only shown if role = ADMIN
  
  "Đánh dấu tất cả đã đọc" button (gray outlined) — if unreadCount > 0
```

**Notification list:**
```
Each notification card (white bg, rounded-xl, border, p-4, hover:shadow-md):
  Left: Icon circle (color by type) | Right: content + time

  Icon colors by type:
    LOW_STOCK:        bg-red-100 text-red-600   (AlertTriangle)
    NEAR_EXPIRY:      bg-amber-100 text-amber-600 (Clock)
    SHIFT_VARIANCE:   bg-orange-100 text-orange-600 (AlertCircle)
    CANCEL_APPROVAL:  bg-blue-100 text-blue-600  (CheckSquare)
    PO_PARTIAL:       bg-purple-100 text-purple-600 (Package)
    REPORT_READY:     bg-green-100 text-green-600 (FileText)
    ACCOUNT_LOCKED:   bg-gray-100 text-gray-600  (Lock)

  Content:
    Title: font-semibold text-gray-900 (if unread: font-bold + blue-600 dot on left)
    Message: text-sm text-gray-600 line-clamp-2
    Time: text-xs text-gray-400 (formatDateTime)
  
  Unread indicator: left border-l-4 border-pink-500 (if !isRead)
  Read indicator:   bg-white (normal)
  Unread bg:        bg-pink-50

  Click handler:
    1. markAsRead(notification.id)
    2. router.push(notification.deepLinkPath)  // deeplink to relevant page
```

**Empty state:**
```
Bell icon w-16 h-16 text-gray-300 mx-auto
"Không có thông báo nào" text-gray-500
```

**Pagination:** standard.

---

### 8.2 `src/app/user-management/page.tsx` — Quản lý tài khoản
**Design source:** `src\app\pages\UserManagement.tsx`
**Role guard:** ADMIN only. Other roles → redirect or show "Không có quyền truy cập".

**State:**
```typescript
const [users, setUsers] = useState<User[]>([]);
const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
const [showCreateDialog, setShowCreateDialog] = useState(false);
const [editingUser, setEditingUser] = useState<User | null>(null);
```

**Load users:**
```typescript
// GET /auth/accounts?page=&size=&search=&role=
const loadUsers = async () => {
  const result = await accountService.getAll({ search, role: roleFilter !== "ALL" ? roleFilter : undefined });
  setUsers(result.content ?? result); // handle both paginated and array response
};
```

**Filters bar:**
```
Search: Input "Tìm tên hoặc username..."
Role: Select [Tất cả | Admin | Branch Manager | Cashier | Warehouse Staff]
"+ Tạo tài khoản" button (pink gradient)
```

**Users table:**
```
Columns: Họ tên | Username | Vai trò | Chi nhánh | Trạng thái | Thao tác

Role badge (color-coded):
  ADMIN:           bg-red-100 text-red-700 "Admin"
  BRANCH_MANAGER:  bg-amber-100 text-amber-700 "Branch Manager"
  CASHIER:         bg-green-100 text-green-700 "Cashier"
  WAREHOUSE_STAFF: bg-blue-100 text-blue-700 "Warehouse Staff"

Status badge:
  active (not locked, not deleted): bg-green-100 text-green-700 "Hoạt động"
  isLocked = true:                  bg-red-100 text-red-700 "Bị khóa" + 🔒
  soft-deleted:                     bg-gray-100 text-gray-400 "Vô hiệu"

Actions:
  "Sửa"          → opens edit Dialog
  "Mở khóa"      → accountService.unlock(id) (only shown if isLocked)
  "Vô hiệu hóa"  → accountService.deactivate(id) + confirm dialog (only if active)
```

**Create/Edit Dialog:**
```
Title: "Tạo tài khoản mới" or "Cập nhật tài khoản"

Fields:
  - Họ tên đầy đủ (fullName): Input (required)
  - Tên đăng nhập (username): Input (required, lowercase, no spaces, only create)
  - Vai trò (role): Select [ADMIN | BRANCH_MANAGER | CASHIER | WAREHOUSE_STAFF]
  - Chi nhánh (branchId): Select from branches list
    - Disabled + cleared if role = ADMIN (ADMIN has no branch)

Note (create only): "Tài khoản mới sẽ yêu cầu đổi mật khẩu khi đăng nhập lần đầu."

Submit: accountService.create(data) or accountService.update(id, data)
Error 409: "Tên đăng nhập đã tồn tại"

After create/update: reload users list, close dialog, toast.success()
```

**Business rule enforcement:**
```typescript
// When deactivating: confirm with user
// Backend returns 409 if trying to deactivate last Admin — show friendly error:
// "Không thể vô hiệu hóa Admin duy nhất còn lại trong hệ thống"

// Role change note: show info alert
// "Thay đổi vai trò có hiệu lực từ phiên đăng nhập tiếp theo của nhân viên này."
```

**Load branches (for selector):**
```typescript
// GET /auth/branches (or from accounts endpoint — check what's available)
// If no dedicated endpoint: hardcode a simple list or skip branch dropdown for MVP
```

---

### 8.3 `src/app/audit-logs/page.tsx` — Audit Log
**Design source:** `src\app\pages\AuditLogs.tsx`
**Role guard:** ADMIN only.

**State:**
```typescript
const [logs, setLogs] = useState<AuditLog[]>([]);
const [filters, setFilters] = useState({
  entityType: "",
  userId: "",
  startDate: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
});
const [page, setPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);
```

**Filter bar:**
```
Loại entity: Input "Lọc theo loại..." (e.g. "User", "Product", "Order")
Người thực hiện: Input userId or username
Từ ngày / Đến ngày: date inputs
"Tìm kiếm" button
```

**Audit log table:**
```
Columns: Thời gian | Người dùng | Hành động | Đối tượng | IP | Chi tiết

Hành động: colored badges
  CREATE: bg-green-100 text-green-700
  UPDATE: bg-blue-100 text-blue-700
  DELETE: bg-red-100 text-red-700

Đối tượng: "{entityType} #{entityId.slice(-8)}"

"Chi tiết" button → opens Dialog showing oldValue vs newValue (JSON diff view):
  Left col: "Trước" — JSON.stringify(JSON.parse(oldValue), null, 2)
  Right col: "Sau"  — JSON.stringify(JSON.parse(newValue), null, 2)
  Use <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">

IMPORTANT: No edit, no delete buttons — this is immutable append-only data.
```

**Empty state:** ClipboardList icon + "Chưa có log nào trong khoảng thời gian này"

**Pagination:** standard.

---

### 8.4 `src/app/system-configuration/page.tsx` — Cấu hình hệ thống
**Design source:** `src\app\pages\SystemConfiguration.tsx`
**Role guard:** ADMIN only.

**State:**
```typescript
const [configs, setConfigs] = useState<SystemConfig[]>([]);
const [editingKey, setEditingKey] = useState<string | null>(null);
const [editValue, setEditValue] = useState<string>("");
const [isSaving, setIsSaving] = useState(false);
```

**Load on mount:**
```typescript
systemConfigService.getAll().then(setConfigs).catch(() => toast.error("Không thể tải cấu hình"));
```

**Layout:**
```
Page title: "Cấu hình hệ thống"
Info banner: "Thay đổi cấu hình có hiệu lực ngay lập tức, không cần khởi động lại hệ thống."
             (blue info card, icon Info)
```

**Config groups (group by prefix):**
```
Group "Chương trình khách hàng thân thiết" (loyalty.*):
  - loyalty.points_rate       "Tỷ lệ tích điểm (VND/điểm)"
  - loyalty.redeem_rate       "Tỷ lệ đổi điểm (điểm/10.000đ)"
  - loyalty.max_redeem_percent "Tối đa % giá trị đơn được đổi điểm"

Group "Quản lý tồn kho" (inventory.*):
  - inventory.default_min_threshold  "Ngưỡng tồn kho tối thiểu (đơn vị)"
  - inventory.expiry_alert_days      "Cảnh báo hết hạn trước (ngày)"
  - inventory.slow_moving_days       "Hàng chậm luân chuyển sau (ngày)"
  - inventory.large_adjustment_percent "Ngưỡng điều chỉnh cần duyệt (%)"

Group "Đơn hàng" (order.*):
  - order.cancel_approval_threshold  "Ngưỡng đơn hủy cần duyệt (VND)"
```

**Each config row:**
```
Layout: [Key icon] | [Label] | [Current value] | [Sửa / Lưu / Hủy buttons]

View mode:
  Label: font-medium text-gray-900
  Key:   text-xs text-gray-400 (config key)
  Value: text-lg font-bold text-pink-600 (formatted by type)
  "Sửa" button (pencil icon)

Edit mode (inline):
  Input pre-filled with current value
  "Lưu" button (green) | "Hủy" button (gray)
  Loading spinner on Save
```

**Save handler:**
```typescript
async function handleSave(key: string) {
  if (!editValue.trim()) return;
  // Validate: must be positive number
  if (isNaN(Number(editValue)) || Number(editValue) <= 0) {
    toast.error("Giá trị phải là số dương");
    return;
  }
  setIsSaving(true);
  try {
    await systemConfigService.update(key, editValue);
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: editValue } : c));
    setEditingKey(null);
    toast.success("Đã cập nhật cấu hình. Hiệu lực ngay lập tức.");
  } catch {
    toast.error("Cập nhật thất bại, thử lại sau");
  } finally {
    setIsSaving(false);
  }
}
```

**Value display formatter by key:**
```typescript
function formatConfigValue(key: string, value: string): string {
  const num = Number(value);
  if (key.includes("threshold") && key.includes("cancel")) return formatVND(num);
  if (key.includes("percent")) return `${num}%`;
  if (key.includes("days")) return `${num} ngày`;
  if (key.includes("rate") && key.includes("points")) return `${num.toLocaleString("vi-VN")} VND/điểm`;
  if (key.includes("redeem_rate")) return `${num} điểm = 10.000₫`;
  return value;
}
```

---

## 9. Role Guards

Apply to all pages that need access control:
```typescript
// Pattern for ADMIN-only pages:
const user = useAuthStore(s => s.user);
const router = useRouter();

useEffect(() => {
  if (user && user.role !== "ADMIN") {
    toast.error("Bạn không có quyền truy cập trang này");
    router.push("/");
  }
}, [user, router]);

if (!user || user.role !== "ADMIN") {
  return (
    <ERPLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldOff className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium">Không có quyền truy cập</p>
      </div>
    </ERPLayout>
  );
}
```

---

## 10. Notification Type Labels & Icons

```typescript
// Reusable mapping — define once, use in notifications/page.tsx
import {
  AlertTriangle, Clock, AlertCircle, CheckSquare,
  Package, FileText, Lock
} from "lucide-react";

export const NOTIFICATION_CONFIG: Record<NotificationType, {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}> = {
  LOW_STOCK:       { label: "Tồn kho thấp",     icon: AlertTriangle, color: "text-red-600",    bgColor: "bg-red-100" },
  NEAR_EXPIRY:     { label: "Sắp hết hạn",       icon: Clock,         color: "text-amber-600",  bgColor: "bg-amber-100" },
  SHIFT_VARIANCE:  { label: "Chênh lệch ca",      icon: AlertCircle,   color: "text-orange-600", bgColor: "bg-orange-100" },
  CANCEL_APPROVAL: { label: "Chờ duyệt hủy đơn", icon: CheckSquare,   color: "text-blue-600",   bgColor: "bg-blue-100" },
  PO_PARTIAL:      { label: "Nhận hàng thiếu",    icon: Package,       color: "text-purple-600", bgColor: "bg-purple-100" },
  REPORT_READY:    { label: "Báo cáo sẵn sàng",  icon: FileText,      color: "text-green-600",  bgColor: "bg-green-100" },
  ACCOUNT_LOCKED:  { label: "Tài khoản bị khóa", icon: Lock,          color: "text-gray-600",   bgColor: "bg-gray-100" },
};
```

---

## 11. Business Rules

```
NOTIFICATIONS:
  1. Poll GET /unread-count every 30s — NEVER use WebSocket
  2. Stop polling when tab hidden (visibilitychange) — resume on visible
  3. Notifications > 30 days: filtered out at backend query layer (not deleted)
  4. Each role only sees their own notification types (enforced by backend)
  5. markAsRead + deeplink navigation on click

USER MANAGEMENT:
  1. Create: forceChangePassword=true always (backend sets this)
  2. Role change: takes effect on NEXT login (not immediate kick)
  3. Cannot deactivate last Admin (409 from backend)
  4. Deactivated users: soft-delete, history preserved
  5. Unlock: only for isLocked (too many failed attempts)

SYSTEM CONFIG:
  1. All values must be positive numbers
  2. Changes take effect IMMEDIATELY (backend DEL Redis cache)
  3. Every change auto-logged in audit_log (AOP backend)
  4. No hardcoded thresholds in frontend — always from this page

AUDIT LOG:
  1. Read-only — no edit, no delete UI
  2. DB permission is INSERT+SELECT only (backend enforces)
  3. Filter by date range, entityType, userId
```

---

## 12. Implementation Order

1. `src/services/notification.service.ts`
2. `src/services/auditLog.service.ts`
3. `src/services/systemConfig.service.ts`
4. `src/stores/notification.store.ts`
5. `src/hooks/useNotificationPolling.ts`
6. **Update** `src/components/layout/Header.tsx` (connect real unreadCount)
7. **Update** `src/components/layout/ERPLayout.tsx` (add `useNotificationPolling()` call)
8. `src/app/notifications/page.tsx`
9. `src/app/system-configuration/page.tsx`
10. `src/app/user-management/page.tsx`
11. `src/app/audit-logs/page.tsx`
