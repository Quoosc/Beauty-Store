# BeautyERP FE — Hướng dẫn sửa lỗi UI/UX (Fix Guide)

> **Mục tiêu:** Đưa toàn bộ UI về khớp 100% với thiết kế gốc trong `src/app/`.  
> **Thứ tự thực hiện:** Group A → Group B → Group C. Mỗi task độc lập, có thể làm song song trong cùng group.  
> **Không thay đổi:** logic nghiệp vụ, API calls, Zustand stores, TypeScript types.

---

## GROUP A — CSS / Style fixes (nhanh, ít rủi ro)

### A1. Tất cả 4 Sidebar — Thêm blur circle thứ 4 + sửa nav text color + font size + border

**Files cần sửa:**
- `src/components/layout/AdminSidebar.tsx`
- `src/components/layout/BranchManagerSidebar.tsx`
- `src/components/layout/WarehouseStaffSidebar.tsx`
- `src/components/layout/CashierSidebar.tsx`

**Thay đổi 1 — Thêm blur circle thứ 4** (thêm vào sau vòng thứ 3, trước thẻ đóng của khối decorative circles):
```html
<!-- Thêm vào sau 3 div blur circles hiện có -->
<div className="absolute top-2/3 right-4 w-24 h-24 bg-pink-200/10 rounded-full blur-xl pointer-events-none"></div>
```

**Thay đổi 2 — Border header** (tìm `border-white/20`, đổi thành):
```
border-white/10
```

**Thay đổi 3 — Nav item inactive color** (tìm class `text-white/80`, đổi thành):
```
text-pink-100
```
Áp dụng cho cả hover state: `hover:text-white` giữ nguyên. Chỉ đổi màu inactive default.

**Thay đổi 4 — Nav item font size** (tìm `text-sm font-medium` trong nav item label, đổi thành):
```
text-base font-medium
```

**Thay đổi 5 — Section title color** (tìm class `text-white/50` trong section dividers, đổi thành):
```
text-pink-200/70
```

**Thay đổi 6 — Separator border** (tìm `border-white/20` trong `<div className="border-t ...">` separator giữa nav items và Đổi mật khẩu, đổi thành):
```
border-white/10
```

**Thay đổi 7 — Đổi mật khẩu button** (tìm button Đổi mật khẩu, đổi class text inactive thành):
```
text-pink-100 hover:bg-white/10 hover:text-white
```

---

### A2. Notifications — Sửa màu unread dot + filter tab shape

**File:** `src/app/notifications/page.tsx`

**Thay đổi 1 — Unread indicator dot** (tìm `bg-pink-500 rounded-full` ở cuối mỗi notification item — cái chấm nhỏ báo chưa đọc, đổi thành):
```
bg-blue-600 rounded-full
```

**Thay đổi 2 — Filter tab active style** (tìm class active tab trong `visibleTypes.map`, đổi):
```diff
- "bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white"
+ "bg-[#D946A6] text-white"
```

**Thay đổi 3 — Filter tab shape** (tìm `rounded-lg` trên tất cả filter tab buttons, đổi thành):
```
rounded-full
```

**Thay đổi 4 — Tab inactive style** (tìm class inactive tab, đổi):
```diff
- "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
+ "bg-gray-100 text-gray-700 hover:bg-gray-200"
```

---

### A3. ProductList — Sửa filter tab shape + border input

**File:** `src/app/products/page.tsx`

**Thay đổi 1 — Search/filter input border** (tìm `border border-gray-300` trên input search, đổi thành):
```
border-2 border-gray-300 focus:ring-[#FF69B4]
```

**Thay đổi 2 — Status filter tab active** (tìm class active tab trên bộ lọc trạng thái):
```diff
- "bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white"
+ "bg-[#D946A6] text-white"
```

**Thay đổi 3 — Status filter tab shape** (tất cả filter tab buttons đổi `rounded-lg` → `rounded-full`).

---

## GROUP B — Bổ sung tính năng trung bình

### B1. Header — Thêm Branch Dropdown + Date Picker

**File:** `src/components/layout/Header.tsx`

**Mô tả:** Thiết kế gốc có 3 vùng trong header: Logo (trái) | Branch + Date (giữa) | Bell + Avatar (phải). Hiện tại implement chỉ có Logo trái và Bell+Avatar phải, thiếu phần giữa.

**Yêu cầu thêm vào giữa header** (sau phần logo, trước phần notification):
```tsx
{/* Center controls - chỉ hiển thị khi user là ADMIN */}
{user?.role === "ADMIN" && (
  <div className="flex items-center gap-4">
    {/* Branch Dropdown */}
    <div className="relative">
      <select
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent cursor-pointer"
        defaultValue="all"
      >
        <option value="all">Tất cả chi nhánh</option>
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>

    {/* Date Picker */}
    <div className="relative">
      <input
        type="date"
        defaultValue={new Date().toISOString().split("T")[0]}
        className="appearance-none bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent cursor-pointer"
      />
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  </div>
)}
```

**Import thêm:** `ChevronDown, Calendar` từ `lucide-react`.

> **Lưu ý:** Branch dropdown chỉ hiển thị cho ADMIN (BM chỉ thấy chi nhánh của mình). Giá trị dropdown là UI-only (không cần gọi API vì branchId được inject từ JWT ở backend).

---

### B2. ProductList — Thêm cột "Hạn dùng" + MoreVertical menu

**File:** `src/app/products/page.tsx`

**Thay đổi 1 — Thêm cột "Hạn dùng" vào `<thead>`** (sau cột Giá vốn, trước cột Trạng thái):
```html
<th className="text-center px-4 py-3">Hạn dùng</th>
```

**Thay đổi 2 — Thêm cell "Hạn dùng" vào `<tbody>`** (tương ứng vị trí trong row):
```tsx
<td className="px-4 py-4 text-center">
  {p.expiryDate ? (
    (() => {
      const days = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000);
      return (
        <span className={`flex items-center justify-center gap-1 text-xs font-medium ${
          days <= 7 ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-gray-500"
        }`}>
          {(days <= 30) && <Clock className="w-3 h-3" />}
          {new Date(p.expiryDate).toLocaleDateString("vi-VN")}
        </span>
      );
    })()
  ) : (
    <span className="text-gray-300 text-xs">—</span>
  )}
</td>
```

**Import thêm:** `Clock` từ `lucide-react`. Field `expiryDate` kiểu `string | null` đã có trong type `Product`.

**Thay đổi 3 — Thay thế nút "Sửa" + "Ngừng KD" bằng MoreVertical dropdown menu:**

Thay vì 2 nút text inline, dùng dropdown:
```tsx
{/* Actions column */}
<td className="px-4 py-4">
  <div className="relative group flex justify-center">
    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
      <MoreVertical className="w-4 h-4" />
    </button>
    <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 hidden group-hover:block">
      <button
        onClick={() => router.push(`/products/${p.id}/edit`)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
      >
        <Edit2 className="w-4 h-4" /> Chỉnh sửa
      </button>
      <button
        onClick={() => router.push(`/products/${p.id}/edit`)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Copy className="w-4 h-4" /> Nhân bản
      </button>
      <button
        onClick={() => handleDiscontinue(p.id)}
        disabled={p.status === "INACTIVE"}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl disabled:opacity-40"
      >
        <Ban className="w-4 h-4" /> Ngừng kinh doanh
      </button>
    </div>
  </div>
</td>
```

**Import thêm:** `MoreVertical, Edit2, Copy, Ban` từ `lucide-react`.

> **Lưu ý về "Nhân bản":** Chức năng duplicate product chưa có API — tạm thời navigate đến `/products/create` (đủ để UI đúng với thiết kế gốc).

---

### B3. ManagerPurchaseOrders — Thêm Supplier filter + expandable rows

**File:** `src/app/manager/purchase-orders/page.tsx`

**Thay đổi 1 — Thêm state cho supplier filter và expand:**
```tsx
const [supplierSearch, setSupplierSearch] = useState("");
const [expandedId, setExpandedId] = useState<string | null>(null);
```

**Thay đổi 2 — Thêm supplier search input vào filter bar** (đặt cùng hàng với status tabs):
```tsx
<div className="bg-white rounded-xl shadow-sm p-4">
  <div className="flex items-center gap-4 flex-wrap">
    {/* Status tabs đã có */}
    <div className="flex gap-2 overflow-x-auto flex-1">
      {STATUS_TABS.map(...)}
    </div>
    {/* Supplier filter mới */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={supplierSearch}
        onChange={(e) => setSupplierSearch(e.target.value)}
        placeholder="Tìm nhà cung cấp..."
        className="h-9 pl-9 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF69B4]"
      />
    </div>
  </div>
</div>
```

**Thay đổi 3 — Filter orders theo supplierSearch** (thêm vào biến `orders` hiển thị):
```tsx
const displayedOrders = orders.filter(po =>
  supplierSearch === "" ||
  po.supplierName.toLowerCase().includes(supplierSearch.toLowerCase())
);
```

**Thay đổi 4 — Thêm expandable row** (click vào row để toggle expand xem items):
- Row có `onClick={() => setExpandedId(expandedId === po.id ? null : po.id)}`
- Sau `<tr key={po.id}>`, thêm:
```tsx
{expandedId === po.id && po.items && po.items.length > 0 && (
  <tr>
    <td colSpan={7} className="px-6 py-0 bg-gray-50">
      <div className="py-3">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Chi tiết sản phẩm</p>
        <div className="space-y-1">
          {po.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm text-gray-700">
              <span>{item.productName ?? item.productId}</span>
              <span className="text-gray-500">SL: {item.orderedQty} × {item.unitPrice?.toLocaleString("vi-VN")}đ</span>
            </div>
          ))}
        </div>
      </div>
    </td>
  </tr>
)}
```

**Import thêm:** `Search` từ `lucide-react`.

---

## GROUP C — Tính năng lớn (refactor toàn bộ page)

### C1. RevenueReport — Nâng cấp toàn diện

**File:** `src/app/revenue-report/page.tsx`

**Toàn bộ page cần refactor.** Giữ nguyên: API calls (`reportService.getRevenue`, `reportService.requestAsyncRevenue`), types. Thay đổi UI.

#### C1.1 — KPI: 4 cards thay vì 3

Thêm card thứ 4 "Doanh thu thuần":
```tsx
// Tính toán thêm (từ reportData)
const totalDiscounts = reportData?.reduce((s, d) => s + (d.totalDiscount ?? 0), 0) ?? 0;
const netRevenue = totalRevenue - totalDiscounts;
```

4 KPI cards theo layout `grid-cols-4`:
```
[Tổng doanh thu — green]  [Số đơn hoàn thành — blue]  [Giá trị đơn TB — purple]  [Doanh thu thuần — teal | subtitle: "Sau giảm giá Xđ"]
```

Icon và màu:
- Tổng DT: `DollarSign`, `bg-green-100 text-green-600`
- Số đơn: `ShoppingCart`, `bg-blue-100 text-blue-600`
- TB đơn: `TrendingUp`, `bg-purple-100 text-purple-600`
- DT thuần: `TrendingDown`, `bg-teal-100 text-teal-600` + subtitle `Sau giảm giá {formatVND(totalDiscounts)}`

#### C1.2 — Thêm Quick Preset buttons

Thêm vào filter bar, dưới dòng date inputs:
```tsx
<div className="flex items-center justify-between mt-4">
  <div className="flex gap-2">
    {[
      { label: "Hôm nay",   preset: "today" },
      { label: "7 ngày",    preset: "7days" },
      { label: "30 ngày",   preset: "30days" },
      { label: "Tháng này", preset: "thisMonth" },
    ].map(({ label, preset }) => (
      <button
        key={preset}
        onClick={() => handleQuickPreset(preset)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {label}
      </button>
    ))}
  </div>
  <div className="flex gap-3">
    <button onClick={handleGenerate} disabled={isLoading}
      className="px-4 py-2 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] disabled:opacity-50 font-medium text-sm flex items-center gap-2">
      <FileText className="w-4 h-4" /> XEM BÁO CÁO
    </button>
    {reportData && (
      <button onClick={handleExportCsv}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center gap-2">
        <Download className="w-4 h-4" /> XUẤT CSV
      </button>
    )}
  </div>
</div>
```

Logic `handleQuickPreset`:
```tsx
function handleQuickPreset(preset: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  if (preset === "today") { setStartDate(fmt(today)); setEndDate(fmt(today)); }
  else if (preset === "7days") {
    const from = new Date(today); from.setDate(today.getDate() - 6);
    setStartDate(fmt(from)); setEndDate(fmt(today));
  }
  else if (preset === "30days") {
    const from = new Date(today); from.setDate(today.getDate() - 29);
    setStartDate(fmt(from)); setEndDate(fmt(today));
  }
  else if (preset === "thisMonth") {
    setStartDate(fmt(new Date(today.getFullYear(), today.getMonth(), 1)));
    setEndDate(fmt(today));
  }
  setReportData(null); setIsAsync(false);
}
```

#### C1.3 — Thay BarChart bằng AreaChart

Thay `<BarChart>` bằng `<AreaChart>` với gradient fill:
```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={reportData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
    <defs>
      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#D946A6" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#D946A6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
    <XAxis dataKey="date"
      tickFormatter={(d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
      tick={{ fontSize: 12 }} />
    <YAxis tickFormatter={(v: number) => (v / 1000000).toFixed(1) + "M"} tick={{ fontSize: 12 }} />
    <Tooltip
      formatter={(v) => [formatVND(Number(v)), "Doanh thu"]}
      labelFormatter={(d) => new Date(d).toLocaleDateString("vi-VN")}
      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
    <Area type="monotone" dataKey="totalRevenue" stroke="#D946A6" strokeWidth={2} fill="url(#colorRevenue)" />
  </AreaChart>
</ResponsiveContainer>
```

#### C1.4 — Thêm PieChart danh mục (layout `grid-cols-5`)

Thay layout chart hiện tại thành `grid-cols-5`:
```tsx
<div className="grid grid-cols-5 gap-6 mb-6">
  {/* AreaChart - 3 cols */}
  <div className="col-span-3 bg-white rounded-xl shadow-sm p-6">
    <h3 className="font-semibold text-gray-900 mb-4">Doanh thu theo ngày</h3>
    {/* AreaChart như C1.3 */}
  </div>

  {/* PieChart - 2 cols */}
  <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
    <h3 className="font-semibold text-gray-900 mb-4">Phân tích theo danh mục</h3>
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={topProducts.slice(0, 4).map(p => ({ name: p.productName, value: p.revenue }))}
          cx="50%" cy="50%"
          innerRadius={55} outerRadius={85}
          paddingAngle={2} dataKey="value"
        >
          {topProducts.slice(0, 4).map((_, index) => (
            <Cell key={index} fill={["#FF69B4","#9D7FD8","#F59E0B","#EC4899"][index % 4]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatVND(Number(v))} />
      </PieChart>
    </ResponsiveContainer>
    {/* Legend */}
    <div className="mt-3 space-y-1.5">
      {topProducts.slice(0, 4).map((p, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ["#FF69B4","#9D7FD8","#F59E0B","#EC4899"][i] }} />
            <span className="text-gray-700 truncate max-w-[120px]">{p.productName}</span>
          </div>
          <span className="font-medium text-gray-900 text-xs">{formatVND(p.revenue)}</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Import thêm:** `PieChart, Pie, Cell, AreaChart, Area, CartesianGrid` từ `recharts`. `FileText` từ `lucide-react`.

#### C1.5 — Thêm bảng "Doanh thu theo ca làm việc"

Sau phần Top Products, thêm section mới. Bảng này dùng data `reportData` (mỗi ngày có thông tin ca):
```tsx
{/* Shift revenue table — hiển thị nếu reportData có dữ liệu */}
<div className="bg-white rounded-xl shadow-sm overflow-hidden">
  <div className="p-6 border-b border-gray-100">
    <h3 className="font-semibold text-gray-900">Doanh thu theo ngày (chi tiết)</h3>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
        <tr>
          <th className="text-left px-6 py-3">Ngày</th>
          <th className="text-right px-4 py-3">Số đơn HT</th>
          <th className="text-right px-4 py-3">Tổng doanh thu</th>
          <th className="text-right px-4 py-3">Giá trị TB đơn</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {reportData.map((d) => (
          <tr key={d.date} className="hover:bg-gray-50">
            <td className="px-6 py-3 text-sm font-medium text-gray-900">
              {new Date(d.date).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-3 text-right text-sm text-gray-700">{d.orderCount}</td>
            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatVND(d.totalRevenue)}</td>
            <td className="px-4 py-3 text-right text-sm text-green-600">{formatVND(d.averageOrderValue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

#### C1.6 — Redesign Async state

Thay amber banner đơn giản bằng centered card đẹp hơn (khi `isAsync === true && !isLoading`):
```tsx
{isAsync && !isLoading && (
  <div className="bg-white rounded-xl shadow-sm p-12">
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#FF69B4] to-[#D946A6] rounded-full flex items-center justify-center">
        <FileText className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Báo cáo cần xử lý bất đồng bộ</h3>
      <p className="text-gray-600 mb-6">
        Khoảng thời gian bạn chọn là <span className="font-bold">{daysDiff} ngày</span> (vượt quá 31 ngày).
        Báo cáo sẽ được xử lý trong nền và bạn sẽ nhận được thông báo khi hoàn tất.
      </p>
      <button
        onClick={handleAsyncRequest}
        className="px-6 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] transition-colors font-medium flex items-center gap-2 mx-auto"
      >
        <FileText className="w-5 h-5" /> YÊU CẦU BÁO CÁO NGAY
      </button>
    </div>
  </div>
)}
```

---

### C2. NotificationsCenter — 2-Panel Layout với Detail Panel

**File:** `src/app/notifications/page.tsx`

**Toàn bộ layout cần refactor.** Giữ nguyên: store hooks, `markAsRead`, `markAllAsRead`, `loadNotifications`.

#### C2.1 — Thêm state cho selected notification

```tsx
import type { Notification } from "@/types"; // hoặc dùng type từ store

const [selectedNotification, setSelectedNotification] = useState<
  (typeof notifications)[0] | null
>(null);
```

#### C2.2 — Đổi layout từ single column sang 2-panel

```tsx
return (
  <ERPLayout>
    {/* Outer container dùng flex row thay vì space-y-6 */}
    <div className="flex h-full gap-0 -m-6"> {/* negative margin để full-width */}

      {/* LEFT PANEL — Notification List */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 min-w-0">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-bold text-gray-900">Thông báo</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAllAsRead()}
              className="text-sm text-[#D946A6] hover:text-[#C026D3] font-medium">
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 bg-white border-b border-gray-200 overflow-x-auto flex-shrink-0">
          <div className="flex gap-2">
            {visibleTypes.map((t) => (
              <button key={t.key} onClick={() => setActiveType(t.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeType === t.key
                    ? "bg-[#D946A6] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
          {isLoading ? (
            <div className="flex justify-center py-16">
              {/* spinner */}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <Bell className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500">Không có thông báo nào</p>
            </div>
          ) : (
            notifications.map((n) => {
              const config = NOTIFICATION_CONFIG[n.type] ?? { label: n.type, icon: Bell, color: "text-gray-600", bgColor: "bg-gray-100" };
              const Icon = config.icon;
              const isSelected = selectedNotification?.id === n.id;
              return (
                <button key={n.id}
                  onClick={async () => {
                    await markAsRead(n.id);
                    setSelectedNotification(n);
                  }}
                  className={`w-full px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                    !n.isRead ? "bg-white" : "bg-gray-50/50"
                  } ${isSelected ? "border-l-4 border-[#D946A6]" : "border-l-4 border-transparent"}`}
                >
                  <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900">{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(n.createdAt)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Detail (480px, chỉ hiển thị khi có selectedNotification) */}
      {selectedNotification && (
        <div className="w-[480px] bg-white flex flex-col border-l border-gray-200 flex-shrink-0">
          <NotificationDetailPanel
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
          />
        </div>
      )}
    </div>
  </ERPLayout>
);
```

#### C2.3 — Tạo component `NotificationDetailPanel`

Tạo mới **trong cùng file** `src/app/notifications/page.tsx` (đặt phía trên `export default`):

```tsx
import { useRouter } from "next/navigation";
import { X, ChevronRight, Package, Clock, Scale, Hand, Truck, FileBarChart, FileText, Check } from "lucide-react";

function NotificationDetailPanel({
  notification,
  onClose,
}: {
  notification: { id: string; type: string; title: string; message: string; createdAt: string; deepLinkPath: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  // Parse metadata từ message (nếu backend trả về JSON trong metadata field)
  // Notification type → render logic

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-900">Chi tiết thông báo</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header icon + title */}
        {(() => {
          const config = NOTIFICATION_CONFIG[notification.type] ?? {
            label: notification.type, icon: Bell, color: "text-gray-600", bgColor: "bg-gray-100"
          };
          const Icon = config.icon;
          return (
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <div className={`w-12 h-12 ${config.bgColor} rounded-full flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600">{formatDateTime(notification.createdAt)}</p>
              </div>
            </div>
          );
        })()}

        {/* Message */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">{notification.message}</p>
        </div>

        {/* Type-specific CTA */}
        {notification.type === "LOW_STOCK" && (
          <button
            onClick={() => router.push("/inventory/purchase-orders/create")}
            className="w-full px-4 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] font-medium flex items-center justify-center gap-2"
          >
            TẠO PHIẾU NHẬP HÀNG <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {notification.type === "NEAR_EXPIRY" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Vui lòng xem xét giảm giá hoặc xử lý sản phẩm này trước khi hết hạn.
            </p>
          </div>
        )}

        {notification.type === "SHIFT_VARIANCE" && (
          <button
            onClick={() => router.push(notification.deepLinkPath)}
            className="w-full px-4 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] font-medium flex items-center justify-center gap-2"
          >
            XEM CA LÀM VIỆC <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {notification.type === "CANCEL_APPROVAL" && (
          <div className="flex gap-3">
            <button
              onClick={() => router.push(notification.deepLinkPath)}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              TỪ CHỐI
            </button>
            <button
              onClick={() => router.push(notification.deepLinkPath)}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              DUYỆT HỦY
            </button>
          </div>
        )}

        {notification.type === "PO_PARTIAL" && (
          <button
            onClick={() => router.push(notification.deepLinkPath)}
            className="w-full px-4 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] font-medium flex items-center justify-center gap-2"
          >
            XEM PHIẾU NHẬP <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {notification.type === "REPORT_READY" && (
          <button
            onClick={() => router.push(notification.deepLinkPath)}
            className="w-full px-4 py-3 bg-[#D946A6] text-white rounded-lg hover:bg-[#C026D3] font-medium flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" /> XEM BÁO CÁO
          </button>
        )}

        {/* Fallback CTA — cho các type khác */}
        {!["LOW_STOCK","NEAR_EXPIRY","SHIFT_VARIANCE","CANCEL_APPROVAL","PO_PARTIAL","REPORT_READY"].includes(notification.type) && (
          <button
            onClick={() => router.push(notification.deepLinkPath)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
          >
            XEM CHI TIẾT <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
```

> **Lưu ý về `CANCEL_APPROVAL` CTA:** Nút Duyệt/Từ chối trong detail panel điều hướng đến `/manager/orders` (deepLinkPath) để thực hiện action thực. Không gọi API trực tiếp từ notification panel để tránh duplicate logic.

---

### C3. LoyaltyMembers — Thêm CashierView

**File:** `src/app/loyalty/members/page.tsx`

**Yêu cầu:** Thêm 2 tabs ở đầu trang: `Tra cứu thành viên` (CASHIER) và `Danh sách` (ADMIN/BM). Tab hiển thị theo role.

#### C3.1 — Thêm tab switcher

```tsx
const isCashier = user?.role === "CASHIER";
const [activeTab, setActiveTab] = useState<"lookup" | "list">(isCashier ? "lookup" : "list");
```

Tab bar (chỉ hiển thị nếu có quyền xem cả 2):
```tsx
{!isCashier && (
  <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
    {[
      { key: "lookup", label: "Tra cứu / Đăng ký" },
      { key: "list",   label: "Danh sách thành viên" },
    ].map(({ key, label }) => (
      <button key={key} onClick={() => setActiveTab(key as "lookup" | "list")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          activeTab === key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
        }`}>
        {label}
      </button>
    ))}
  </div>
)}
```

#### C3.2 — CashierView: Lookup + Register

Khi `activeTab === "lookup"` hoặc `isCashier`, render:

```tsx
<CashierLoyaltyView />
```

Tạo component `CashierLoyaltyView` trong cùng file:

```tsx
function CashierLoyaltyView() {
  const [phone, setPhone] = useState("");
  const [member, setMember] = useState<LoyaltyMember | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Register form state
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsSearching(true);
    setNotFound(false);
    setMember(null);
    try {
      const data = await loyaltyService.searchByPhone(phone.trim());
      setMember(data);
    } catch {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;
    setIsRegistering(true);
    try {
      const data = await loyaltyService.register({ fullName: regName.trim(), phone: regPhone.trim() });
      setMember(data);
      setShowRegister(false);
      toast.success("Đăng ký thành viên thành công!");
    } catch {
      toast.error("Đăng ký thất bại — số điện thoại có thể đã tồn tại");
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Search form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tra cứu thành viên</h3>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel" value={phone}
              onChange={(e) => { setPhone(e.target.value); setMember(null); setNotFound(false); }}
              placeholder="Nhập số điện thoại..."
              className="h-11 w-full pl-9 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <button type="submit" disabled={isSearching || !phone.trim()}
            className="h-11 px-5 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
            {isSearching ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>
      </div>

      {/* Found member */}
      {member && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#FF69B4] rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">{member.fullName[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{member.fullName}</p>
              <p className="text-sm text-gray-500">{member.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{member.pointBalance.toLocaleString("vi-VN")}</p>
              <p className="text-xs text-amber-600 mt-1">Điểm tích lũy</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{member.totalOrders ?? "—"}</p>
              <p className="text-xs text-blue-600 mt-1">Đơn hàng</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-gray-700">
                {new Date(member.joinDate).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ngày tham gia</p>
            </div>
          </div>
        </div>
      )}

      {/* Not found — offer register */}
      {notFound && !showRegister && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Không tìm thấy thành viên với số điện thoại này</p>
          <button
            onClick={() => { setShowRegister(true); setRegPhone(phone); }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            Đăng ký thành viên mới
          </button>
        </div>
      )}

      {/* Register form */}
      {showRegister && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Đăng ký thành viên mới</h3>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
              <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                placeholder="Nguyễn Thị An"
                className="h-11 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                placeholder="0901234567"
                className="h-11 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowRegister(false)}
                className="flex-1 h-11 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Hủy
              </button>
              <button type="submit" disabled={isRegistering || !regName.trim() || !regPhone.trim()}
                className="flex-1 h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
                {isRegistering ? "Đang đăng ký..." : "Xác nhận đăng ký"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

**Import thêm:** `Phone, Users` từ `lucide-react`. `toast` từ `sonner`. `loyaltyService` đã có.

---

## Checklist sau khi implement

```
Group A — Style fixes
[ ] A1: 4 Sidebar — blur circle 4, text-pink-100, text-base, border-white/10
[ ] A2: Notifications — bg-blue-600 dot, rounded-full tabs, bg-[#D946A6] active
[ ] A3: ProductList — border-2, rounded-full tabs, bg-[#D946A6] active

Group B — Medium features
[ ] B1: Header — Branch dropdown + Date picker (ADMIN only)
[ ] B2: ProductList — Cột Hạn dùng + Clock warning + MoreVertical menu
[ ] B3: ManagerPurchaseOrders — Supplier filter + expandable rows

Group C — Large features
[ ] C1: RevenueReport — 4 KPI cards, Quick presets, AreaChart, PieChart, Shift table, Async redesign
[ ] C2: NotificationsCenter — 2-panel layout + NotificationDetailPanel + type-specific CTAs
[ ] C3: LoyaltyMembers — Tab switcher + CashierLoyaltyView (lookup + register)

Final
[ ] npx tsc --noEmit → 0 errors
```

---

## Lưu ý kỹ thuật

1. **TypeScript:** Không thêm `any`. Nếu field không có trong type `Notification` (ví dụ `deepLinkPath`), kiểm tra `src/types/index.ts` — field đã có sẵn.
2. **`loyaltyService`:** Đã có `searchByPhone`, `register` trong `src/services/loyalty.service.ts`.
3. **Recharts PieChart:** `recharts` đã cài (`"recharts": "^3.8.1"` trong package.json). Import `PieChart, Pie, Cell` từ `recharts`.
4. **2-panel layout (C2):** `ERPLayout` wrap toàn bộ, bên trong dùng `-m-6` để stretch full-width nếu cần, hoặc điều chỉnh `min-h-0 overflow-hidden` trên thẻ cha.
5. **`totalDiscount` field (C1):** Nếu `RevenueReportData` chưa có field này, bỏ KPI "Doanh thu thuần" hoặc tính `netRevenue = 0` — không tự thêm field vào type.
