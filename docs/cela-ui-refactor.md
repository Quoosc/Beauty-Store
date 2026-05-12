# CÉLA UI Refactor — Hướng dẫn cho Codex

> **Mục tiêu:** Refactor 100% trang còn lại sang CÉLA design system.  
> **Quy tắc bắt buộc:** KHÔNG thay đổi logic, API calls, stores, types — chỉ thay đổi JSX/CSS.  
> **Shell đã xong:** ERPLayout, Header, 4 Sidebars, Login, Admin Dashboard. Đừng đụng vào.

---

## 1. CÉLA Design Tokens — Bắt buộc ghi nhớ

Các token này đã được định nghĩa trong `src/app/globals.css`. Dùng trực tiếp, không dùng Tailwind màu cũ.

```css
/* Palette */
--cela-ivory:      #faf7f2   /* page background */
--cela-paper:      #ffffff   /* card background */
--cela-cream:      #f3ece1   /* subtle hover bg */
--cela-fog:        #ede8e0   /* divider, light border */
--cela-mist:       #d8cec5   /* border chính */
--cela-stone:      #9e8e80   /* secondary text */
--cela-cocoa:      #7a6358   /* tertiary text, eyebrow */
--cela-espresso:   #3c2e2a   /* primary text, primary button bg */
--cela-rose:       #b76e79   /* accent, badge, CTA */
--cela-rose-deep:  #9a5561   /* hover rose */
--cela-champagne:  #c9a87a   /* gold accent */
--cela-gold:       #a07840   /* gold text */
--cela-success:    #6b8e6a   /* green */
--cela-danger:     #b76e6e   /* red */

/* Shadows */
--cela-shadow-soft:  0 1px 3px rgba(60,46,42,0.06), 0 1px 2px rgba(60,46,42,0.04)
--cela-shadow-md:  0 4px 12px rgba(60,46,42,0.10), 0 2px 4px rgba(60,46,42,0.06)

/* Typography */
--cela-display: var(--font-cg, "Playfair Display", Georgia, serif)  /* Cormorant Garamond */
--cela-sans: var(--font-manrope, system-ui, sans-serif)
--cela-mono: "JetBrains Mono", "Fira Code", monospace
```

---

## 2. Component Patterns — Copy chính xác

### 2.1 Page Header (dùng cho mọi trang trong ERPLayout)

```tsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
  <div>
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 4px" }}>
      {/* Section label vd: "Vận hành" */}
    </p>
    <h1 style={{ fontFamily: "var(--cela-display)", fontSize: 28, fontWeight: 500, color: "var(--cela-espresso)", margin: 0, letterSpacing: "-0.01em" }}>
      Tên trang <span style={{ fontStyle: "italic", color: "var(--cela-rose)" }}>phụ đề</span>
    </h1>
  </div>
  {/* Actions: Button primary ở phải */}
</div>
```

### 2.2 Card Container

```tsx
<div style={{
  background: "var(--cela-paper)",
  border: "1px solid var(--cela-mist)",
  borderRadius: 16,
  padding: "20px 24px",
  boxShadow: "var(--cela-shadow-soft)",
}}>
```

### 2.3 Buttons

```tsx
{/* Primary — espresso */}
<button style={{
  background: "var(--cela-espresso)", color: "#fff",
  border: 0, borderRadius: 10, padding: "9px 18px",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "flex", alignItems: "center", gap: 6,
}}>
  <Plus style={{ width: 14, height: 14 }} /> Tạo mới
</button>

{/* Secondary — ivory outlined */}
<button style={{
  background: "var(--cela-ivory)", color: "var(--cela-espresso)",
  border: "1px solid var(--cela-mist)", borderRadius: 10, padding: "9px 18px",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
}}>

{/* Rose accent */}
<button style={{
  background: "var(--cela-rose)", color: "#fff",
  border: 0, borderRadius: 10, padding: "9px 18px",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
}}>

{/* Danger */}
<button style={{
  background: "var(--cela-danger)", color: "#fff",
  border: 0, borderRadius: 10, padding: "9px 18px",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
}}>

{/* Success/Approve */}
<button style={{
  background: "var(--cela-success)", color: "#fff",
  border: 0, borderRadius: 10, padding: "9px 18px",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
}}>
```

### 2.4 Input & Search

```tsx
{/* Text input */}
<input style={{
  width: "100%", padding: "9px 12px",
  border: "1px solid var(--cela-mist)", borderRadius: 8,
  fontSize: 13, color: "var(--cela-espresso)",
  background: "var(--cela-ivory)", outline: "none",
  fontFamily: "var(--cela-sans)",
}} onFocus={e => { e.currentTarget.style.borderColor = "var(--cela-rose)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,110,121,0.12)"; }}
   onBlur={e => { e.currentTarget.style.borderColor = "var(--cela-mist)"; e.currentTarget.style.boxShadow = "none"; }} />

{/* Search với icon */}
<div style={{ position: "relative" }}>
  <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--cela-stone)", pointerEvents: "none" }} />
  <input placeholder="Tìm kiếm..." style={{ paddingLeft: 32, /* ... rest same */ }} />
</div>

{/* Select */}
<select style={{
  padding: "9px 12px", border: "1px solid var(--cela-mist)", borderRadius: 8,
  fontSize: 13, color: "var(--cela-espresso)", background: "var(--cela-ivory)",
  outline: "none", cursor: "pointer", fontFamily: "var(--cela-sans)",
}}>
```

### 2.5 Status Badge / Pill

```tsx
// Mapping trạng thái → màu CÉLA
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  // Order / Shift
  COMPLETED:          { bg: "rgba(107,142,106,0.15)", color: "var(--cela-success)", label: "Hoàn thành" },
  OPEN:               { bg: "rgba(107,142,106,0.15)", color: "var(--cela-success)", label: "Đang mở" },
  ACTIVE:             { bg: "rgba(107,142,106,0.15)", color: "var(--cela-success)", label: "Đang bán" },
  CONFIRMED:          { bg: "rgba(107,142,106,0.15)", color: "var(--cela-success)", label: "Đã xác nhận" },
  FULLY_RECEIVED:     { bg: "rgba(107,142,106,0.15)", color: "var(--cela-success)", label: "Nhận đủ" },
  PENDING:            { bg: "rgba(201,168,122,0.20)", color: "var(--cela-gold)",    label: "Chờ duyệt" },
  PARTIALLY_RECEIVED: { bg: "rgba(201,168,122,0.20)", color: "var(--cela-gold)",    label: "Nhận thiếu" },
  SUBMITTED:          { bg: "rgba(201,168,122,0.20)", color: "var(--cela-gold)",    label: "Đã gửi" },
  CANCELLED:          { bg: "rgba(183,110,121,0.15)", color: "var(--cela-danger)",  label: "Đã hủy" },
  DISCONTINUED:       { bg: "rgba(183,110,121,0.15)", color: "var(--cela-danger)",  label: "Ngừng bán" },
  CLOSED:             { bg: "rgba(158,142,128,0.15)", color: "var(--cela-stone)",   label: "Đã đóng" },
  REJECTED:           { bg: "rgba(183,110,121,0.15)", color: "var(--cela-danger)",  label: "Từ chối" },
  APPROVED:           { bg: "rgba(107,142,106,0.15)", color: "var(--cela-success)", label: "Đã duyệt" },
};

// Render badge
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "var(--cela-fog)", color: "var(--cela-stone)", label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}
```

### 2.6 Table

```tsx
<table style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr style={{ borderBottom: "2px solid var(--cela-fog)" }}>
      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cela-stone)" }}>
        Cột
      </th>
    </tr>
  </thead>
  <tbody>
    {items.map((item, i) => (
      <tr key={item.id} style={{ borderBottom: "1px solid var(--cela-fog)", background: i % 2 === 0 ? "transparent" : "rgba(250,247,242,0.5)" }}>
        <td style={{ padding: "12px 12px", fontSize: 13, color: "var(--cela-espresso)" }}>
          {item.value}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 2.7 Filter Tabs

```tsx
<div style={{ display: "flex", gap: 6, padding: "4px", background: "var(--cela-fog)", borderRadius: 10, width: "fit-content" }}>
  {TABS.map(tab => (
    <button key={tab.key} onClick={() => setActive(tab.key)} style={{
      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
      border: 0, cursor: "pointer",
      background: active === tab.key ? "var(--cela-paper)" : "transparent",
      color: active === tab.key ? "var(--cela-espresso)" : "var(--cela-stone)",
      boxShadow: active === tab.key ? "var(--cela-shadow-soft)" : "none",
      transition: "all 120ms ease",
    }}>
      {tab.label}
    </button>
  ))}
</div>
```

### 2.8 Modal / Dialog

```tsx
{/* Overlay */}
<div style={{ position: "fixed", inset: 0, background: "rgba(60,46,42,0.35)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
  {/* Panel */}
  <div style={{
    background: "var(--cela-paper)", borderRadius: 16, padding: "28px 32px",
    width: "100%", maxWidth: 520, boxShadow: "var(--cela-shadow-md)",
    maxHeight: "90vh", overflowY: "auto",
  }}>
    <h2 style={{ fontFamily: "var(--cela-display)", fontSize: 22, fontWeight: 500, color: "var(--cela-espresso)", margin: "0 0 20px" }}>
      Tiêu đề
    </h2>
    {/* Content */}
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
      <button style={/* secondary */}>Hủy</button>
      <button style={/* primary */}>Xác nhận</button>
    </div>
  </div>
</div>
```

### 2.9 Empty State

```tsx
<div style={{ textAlign: "center", padding: "48px 24px", color: "var(--cela-stone)" }}>
  <Icon style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.4 }} />
  <p style={{ fontSize: 14, fontWeight: 500 }}>Chưa có dữ liệu</p>
  <p style={{ fontSize: 12, marginTop: 4 }}>Mô tả ngắn</p>
</div>
```

### 2.10 Loading Spinner

```tsx
<div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
  <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--cela-mist)", borderTopColor: "var(--cela-rose)", animation: "spin 0.7s linear infinite" }} />
  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
</div>
```

### 2.11 Form Section Label

```tsx
<p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--cela-cocoa)", margin: "0 0 12px" }}>
  Thông tin cơ bản
</p>
```

---

## 3. Wave A — Auth (2 trang)

### 3.1 `/force-change-password/page.tsx`
**Layout:** Standalone (không có ERPLayout). Full-screen ivory bg.

```
Full screen: background var(--cela-ivory), display flex, alignItems center, justifyContent center
Center card: maxWidth 440, background var(--cela-paper), borderRadius 20, padding 40, shadow-md, border 1px solid var(--cela-mist)

Logo: <CelaLogo size={36} />  — đặt ở trên cùng card, marginBottom 28

Heading: fontFamily cela-display, fontSize 26, fontWeight 500, color cela-espresso
  "Đặt mật khẩu mới"
Sub: fontSize 13, color cela-stone, marginTop 6
  "Đây là lần đăng nhập đầu tiên. Vui lòng đặt mật khẩu để bảo mật tài khoản."

Form:
  Field "Mật khẩu mới" — input type=password, show/hide toggle (Eye/EyeOff)
  Field "Xác nhận mật khẩu" — same
  Error text: fontSize 11, color cela-danger, marginTop 4
  Submit: Button primary (espresso) full-width, height 44
    Loading: spinner + "Đang xử lý..."

Logic (KHÔNG thay đổi):
  - Validate: ≥8 ký tự, có chữ hoa/thường/số
  - await authService.changePassword("", newPassword)
  - Redirect theo ROLE_REDIRECT[user.role]
```

### 3.2 `/change-password/page.tsx`
**Layout:** `<ERPLayout>` bình thường.

```
Page header: eyebrow "Tài khoản", h1 "Đổi mật khẩu"
Card: maxWidth 480, center

Fields:
  "Mật khẩu hiện tại" — show/hide
  "Mật khẩu mới" — show/hide
  "Xác nhận mật khẩu mới" — show/hide
Submit: Button primary, "Đổi mật khẩu"
Back link: fontSize 13, color cela-stone, cursor pointer — quay lại trang trước

Logic: await authService.changePassword(current, newPassword)
  Success: toast.success, reset form
```

---

## 4. Wave B — POS Core (4 trang)

### 4.1 `/pos/shift/page.tsx`
**Eyebrow:** "Ca làm việc" | **h1:** "Quản lý <i style rose>ca bán hàng</i>"

```
2 states:
  A. Chưa mở ca — card center, maxWidth 440:
    Icon: Clock (40x40, rose color, ivory bg circle)
    "Chưa có ca nào đang mở"
    Sub: "Nhập số tiền đầu ca để bắt đầu làm việc"
    Input: "Tiền đầu ca (VNĐ)" — type=number, font-mono
    Button: "Mở ca" (rose)
  
  B. Có ca OPEN — 2 cột (1fr 1fr):
    Left card: thông tin ca
      Eyebrow "CA HIỆN TẠI"
      Row: label + value (mono font)
        Thời gian mở, Tiền đầu ca, Số đơn hàng, Doanh thu
    Right card: đóng ca
      Eyebrow "ĐÓNG CA"
      Input: "Tiền thực tế cuối ca" — type=number, font-mono
      If variance ≠ 0: Textarea "Ghi chú chênh lệch" (required)
      Button: "Đóng ca" (espresso)
```

### 4.2 `/pos/order/page.tsx`
**Layout:** Full height, 2 panel bên trong ERPLayout main:
- **Left (flex:1.4):** Product search + grid
- **Right (width:380px):** Cart + checkout

```
LEFT PANEL — card style:
  Search bar (full width, search icon)
  Category filter tabs dạng pill scrollable
  Product grid (3-4 cột responsive): 
    Product card: cela-paper bg, border mist, radius 12, padding 12
      Image placeholder: cela-fog bg, radius 8, aspect 1:1
      Name: fontSize 13, fontWeight 600, espresso
      SKU: fontSize 11, mono, stone
      Price: fontSize 15, fontWeight 700, rose
      Stock badge: nếu ≤5 → danger pill "Sắp hết"
      Click → thêm vào cart

RIGHT PANEL — card style, display flex, flexDirection column:
  Header: "Đơn hàng" (display font 18) + nút "Xóa tất cả" (danger text, no bg)
  
  Cart items: flex-1, overflowY auto
    Mỗi item: flex row, gap 10
      Name: fontSize 13, fontWeight 600
      Price: mono, rose
      Qty controls: [-] [số] [+] — espresso bg hoặc ivory bg
      Xóa: X icon, stone color
    Divider mist between items
  
  Loyalty section (fold/unfold):
    Input SĐT → tìm thành viên → hiện điểm
    Checkbox "Đổi điểm" + preview discount

  Coupon section:
    Input code + "Áp dụng" button

  Order summary:
    Tạm tính, Giảm giá, Tổng cộng (lớn, display font, rose)
  
  Payment method tabs: Tiền mặt | Chuyển khoản | Thẻ
  Button: "Thanh toán" (rose, full width, height 48, fontSize 16)

Success overlay (green tint):
  ✓ circle (success color), "Đơn hàng #{id} hoàn thành!"
  "In hóa đơn" + "Đơn mới" buttons
```

### 4.3 `/cashier/orders/page.tsx`
**Eyebrow:** "POS" | **h1:** "Đơn hàng <i style rose>của tôi</i>"

```
Filter bar (trên table):
  Date range: 2 input date (ivory, mist border)
  Status filter tabs: Tất cả | Hoàn thành | Đã hủy

Table card:
  Cols: Mã đơn (mono, bold) | Thời gian | Sản phẩm | Tổng tiền (mono) | Trạng thái | Hành động
  
  Actions per row:
    "Xem" → modal chi tiết (hoặc navigate /orders/{id})
    "In lại" → chỉ hiện khi COMPLETED
    "Hủy đơn" → chỉ COMPLETED, mở confirm modal

  Modal hủy đơn:
    "Xác nhận hủy đơn?"
    Nếu total > threshold: hiện "⚠ Đơn này cần Branch Manager duyệt"
    Button: "Hủy đơn" (danger)

Pagination: prev/next, stone text, ivory buttons
```

### 4.4 `/orders/[orderId]/page.tsx`
**Eyebrow:** "Đơn hàng" | **h1:** Mã đơn

```
Grid 2 cột (2fr 1fr):
  Left: Card "Chi tiết đơn hàng"
    Table sản phẩm: Tên | SL | Đơn giá | Thành tiền
    Footer: tổng, giảm giá, điểm đã dùng, phải trả

  Right:
    Card "Thông tin ca"
      Ca, Nhân viên, Chi nhánh
    Card "Thanh toán"
      Phương thức, Thời gian
    Card "Loyalty" (nếu có member)
      Điểm tích, Điểm dùng

Action bar bottom:
  "In hóa đơn" (secondary) | "Hủy đơn" (danger, nếu COMPLETED)
```

### 4.5 `/returns/new/page.tsx`
**Eyebrow:** "POS" | **h1:** "Trả hàng"

```
2 bước:
  Bước 1 — Tìm đơn gốc:
    Input: "Mã đơn hoặc SKU sản phẩm"
    Button: "Tìm kiếm"
    Kết quả: card hiện thông tin đơn gốc
      Bảng sản phẩm với checkbox + input số lượng trả
      Max trả = qty mua trong đơn gốc
    Button: "Xác nhận trả hàng"
  
  Bước 2 — Xác nhận:
    Card tóm tắt: sản phẩm trả, số lượng
    Input: "Lý do trả hàng" (textarea)
    Button: "Hoàn tất" (rose)
```

---

## 5. Wave C — Catalog + Kho (11 trang)

### 5.1 `/products/page.tsx`
**Eyebrow:** "Catalog" | **h1:** "Sản phẩm"

```
Action bar:
  Left: Search, Category select, Status filter tabs
  Right: Button "Thêm sản phẩm" (espresso + Plus icon) → /products/create

Table card:
  Cols: Ảnh (40x40, radius 8, fog bg) | Tên + SKU (mono sub) | Danh mục | Giá (mono) | Tồn kho | Trạng thái | Actions
  
  Price warning: nếu cost > sellingPrice → champagne ⚠ icon bên cạnh giá
  Stock low: nếu quantity ≤ minThreshold → danger pill
  
  Actions: Edit (pencil icon, stone) | Duplicate (copy icon) | Deactivate (ban icon, danger)

Pagination ở dưới table
```

### 5.2 `/products/create/page.tsx` và `/products/[id]/edit/page.tsx`
**Eyebrow:** "Catalog" | **h1:** "Tạo sản phẩm" / "Chỉnh sửa sản phẩm"

```
Grid 2 cột (3fr 1fr):
  Left — Thông tin chính (card):
    Section "Thông tin cơ bản"
      Input: Tên sản phẩm, SKU, Barcode, Mô tả (textarea)
    Section "Giá & Danh mục"
      Row 2 inputs: Giá vốn | Giá bán
      Warning nếu cost > sellPrice: champagne bg pill "Giá vốn > giá bán"
      Select: Danh mục
    Section "Tồn kho"
      Input: Ngưỡng tồn kho tối thiểu (number)
      Input: Hạn sử dụng (date, phải là ngày tương lai)
      Warning nếu < 30 ngày: champagne "Sắp đến hạn"

  Right — Ảnh & Trạng thái (card):
    Upload ảnh:
      Drop zone: cela-fog bg, radius 12, dashed mist border
      "Kéo thả ảnh hoặc nhấn để chọn"
      Preview: 200x200, radius 10
    Status select: ACTIVE | DISCONTINUED

Footer action bar: "Hủy" (secondary) | "Lưu" (espresso)
```

### 5.3 `/categories/page.tsx`
**Eyebrow:** "Catalog" | **h1:** "Danh mục"

```
2 cột (1fr 1fr):
  Left — Cây danh mục (card):
    List cha: bold, espresso, expandable
      Children: indent 20px, stone text
    Button "Thêm danh mục" (secondary, ở footer card)
  
  Right — Form (card, hiện khi chọn danh mục hoặc thêm mới):
    Input: Tên danh mục
    Select: Danh mục cha (optional — chọn để tạo con)
    Actions: "Lưu" (espresso) | "Xóa" (danger, chỉ khi không có SP/con)
```

### 5.4 `/inventory/stock/page.tsx`
**Eyebrow:** "Kho hàng" | **h1:** "Tồn kho <i style rose>hiện tại</i>"

```
KPI row (3 cards):
  Tổng sản phẩm | Sắp hết hàng (danger accent) | Sắp hết hạn (champagne accent)

Filter tabs: Tất cả | Sắp hết hàng | Sắp hết hạn | Chậm luân chuyển

Table card:
  Cols: Sản phẩm + SKU | Tồn kho (bold, mono) | Ngưỡng tối thiểu | Hạn sử dụng | Trạng thái
  
  Row highlight:
    quantity ≤ minThreshold → row background rgba(183,110,121,0.06)
    nearExpiry → row background rgba(201,168,122,0.08)
  
  Action per row: "Điều chỉnh" → mở modal tạo adjustment request
```

### 5.5 `/inventory/purchase-orders/page.tsx`
**Eyebrow:** "Kho hàng" | **h1:** "Purchase Orders"

```
Action bar:
  Status filter tabs: Tất cả | PENDING | CONFIRMED | PARTIALLY_RECEIVED | FULLY_RECEIVED | CANCELLED
  Button "Tạo PO" (espresso) → /inventory/purchase-orders/create

Table:
  Cols: Mã PO (mono bold) | Nhà cung cấp | Tổng tiền (mono) | Ngày tạo | Trạng thái | Actions
  Actions: "Xem" | "Xác nhận" (chỉ PENDING, ADMIN/BM) | "Nhận hàng" (chỉ CONFIRMED) | "Hủy" (danger)
```

### 5.6 `/inventory/purchase-orders/create/page.tsx`
**Eyebrow:** "Kho hàng" | **h1:** "Tạo Purchase Order"

```
Card 1 — Thông tin PO:
  Select: Nhà cung cấp
  Textarea: Ghi chú (optional)

Card 2 — Sản phẩm:
  Search + Add sản phẩm button
  Table inline: Sản phẩm | SL đặt | Đơn giá nhập | Thành tiền
  Mỗi row: qty input + unit cost input + xóa button
  Footer: Tổng tiền (mono, display font large)

Actions: "Hủy" | "Lưu nháp" (PENDING) | "Gửi duyệt" (SUBMITTED)
```

### 5.7 `/inventory/receive/[poId]/page.tsx`
**Eyebrow:** "Kho hàng" | **h1:** "Nhận hàng"

```
Card thông tin PO: Mã PO, NCC, ngày tạo — readonly

Card nhận hàng (table):
  Cols: Sản phẩm | SL đặt | SL nhận (input) | Số lô (input) | Hạn sử dụng (date input)
  Note: SL nhận ≤ SL đặt − SL đã nhận trước

Button: "Xác nhận nhận hàng" (rose)
Warning: nếu có item SL nhận < SL đặt → champagne banner "Nhận thiếu — Manager sẽ nhận thông báo"
```

### 5.8 `/inventory/adjustments/page.tsx`
**Eyebrow:** "Kho hàng" | **h1:** "Điều chỉnh kho"

```
2 tabs: "Tạo điều chỉnh" | "Lịch sử"

Tab Tạo:
  Card form:
    Search sản phẩm (autocomplete)
    Hiện tồn kho hiện tại: mono, bold
    Input: Số lượng điều chỉnh (negative = giảm)
    Select: Loại (DAMAGED / LOST / EXPIRED)
    Textarea: Mô tả (required)
    Warning tự động: nếu |qty| > 10% tồn kho → champagne banner "Cần Branch Manager duyệt"
  Button: "Gửi điều chỉnh" (espresso)

Tab Lịch sử:
  Table: Sản phẩm | Qty | Loại | Trạng thái | Ngày | Người duyệt
```

### 5.9 `/manager/orders/page.tsx`
**Eyebrow:** "Quản lý" | **h1:** "Duyệt hủy <i style rose>đơn hàng</i>"

```
Filter tabs: Chờ duyệt | Đã duyệt | Đã từ chối

Table:
  Cols: Mã đơn | Nhân viên | Tổng tiền (mono, rose) | Lý do | Thời gian | Actions
  Actions (chỉ PENDING):
    "Duyệt" (success button) | "Từ chối" (danger button)
  
  Confirm modal khi Duyệt:
    "Xác nhận duyệt hủy đơn #{id}?"
    "Kho sẽ được hoàn trả ngay sau khi duyệt."
    Buttons: Hủy | Duyệt (success)
  
  Reject modal:
    Textarea: Lý do từ chối (required)
    Buttons: Hủy | Từ chối (danger)
```

### 5.10 `/manager/inventory/page.tsx`
**Eyebrow:** "Quản lý" | **h1:** "Duyệt điều chỉnh <i style rose>kho</i>"

```
Tương tự manager/orders nhưng cho AdjustmentRequest:
Table: Sản phẩm | Qty thay đổi (mono, màu đỏ nếu âm) | Loại | Mô tả | Người tạo | Trạng thái | Actions
Actions (PENDING): Duyệt (success) | Từ chối (danger)
```

### 5.11 `/supplier-management/page.tsx`
**Eyebrow:** "Kho hàng" | **h1:** "Nhà cung cấp"

```
Action bar: Search, Button "Thêm NCC" (espresso)

Table:
  Cols: Tên NCC | Người liên hệ | SĐT (mono) | Email | Địa chỉ | Trạng thái | Actions
  Actions: "Sửa" (pencil icon) | "Vô hiệu hóa" (danger, chỉ khi ACTIVE)

Modal thêm/sửa NCC:
  Fields: Tên*, Người liên hệ, SĐT, Email, Địa chỉ
  maxWidth 520
```

---

## 6. Wave D — Loyalty + Report (5 trang)

### 6.1 `/loyalty/members/page.tsx`
**Eyebrow:** "Loyalty" | **h1:** "Thành viên <i style rose>loyalty</i>"

```
Action bar: Search theo SĐT hoặc tên, Button "Đăng ký thành viên" (espresso)

Table:
  Cols: Số thành viên (mono) | Họ tên | SĐT (mono) | Điểm (bold, champagne color) | Ngày tham gia | Actions
  Actions: "Xem lịch sử điểm" → expand row hoặc modal

Modal đăng ký:
  Fields: Họ tên*, SĐT* (unique), Email
  Submit: "Đăng ký" (rose)

Modal lịch sử điểm (khi xem):
  Table: Ngày | Loại (EARN/REDEEM, badge) | Điểm (+ hoặc -, mono) | Mô tả
```

### 6.2 `/promotions/page.tsx`
**Eyebrow:** "Chương trình" | **h1:** "Khuyến mãi"

```
Action bar: Filter tabs (Đang active | Hết hạn) | Button "Tạo KM" (espresso, BRANCH_MANAGER/ADMIN)

Grid cards (2-3 cột):
  Promotion card: cela-paper, border mist, radius 14, padding 20
    Badge: PERCENTAGE | FIXED_AMOUNT (champagne pill)
    Tên KM: display font, 18px
    Mô tả: stone text
    Footer: Ngày hết hạn (mono) | Vô hiệu hóa button (danger icon, small)

Modal tạo KM:
  Fields: Tên*, Loại (PERCENTAGE/FIXED), Giá trị*, Giá trị đơn tối thiểu, Ngày bắt đầu*, Ngày kết thúc*, Mô tả
```

### 6.3 `/coupons/page.tsx`
**Eyebrow:** "Chương trình" | **h1:** "Coupon"

```
Filter: Select chương trình KM | Button "Tạo coupon" (espresso)

Table:
  Cols: Mã coupon (mono bold, copyable) | Chương trình | Đã dùng / Tối đa | Hết hạn | Trạng thái | Validate
  "Validate" button → POST /coupons/validate → modal hiện kết quả

Modal tạo coupon:
  Select: Chương trình KM
  Input: Mã coupon (hoặc auto-generate button)
  Input: Số lần dùng tối đa
  Input: Số lần dùng tối đa / khách
  Input: Ngày hết hạn
```

### 6.4 `/revenue-report/page.tsx`
**Eyebrow:** "Báo cáo" | **h1:** "Doanh thu"

```
Filter bar:
  Date range picker: startDate, endDate
  Note: nếu khoảng > 31 ngày → hiện "Báo cáo sẽ được xử lý async"
  Button: "Xem báo cáo" (espresso)

Async state: polling badge "Đang xử lý..." + spinner
Khi xong: toast.success + auto refresh

Results:
  KPI row (3 cards): Tổng doanh thu | Số đơn | AOV
  
  Table doanh thu theo ngày:
    Cols: Ngày (mono) | Số đơn | Doanh thu (mono, rose) | AOV (mono)
  
  Top sản phẩm bán chạy:
    List 5 items: rank badge (champagne #1) + tên + số lượng + doanh thu
```

### 6.5 `/inventory-report/page.tsx`
**Eyebrow:** "Báo cáo" | **h1:** "Báo cáo <i style rose>kho</i>"

```
Tabs: Sắp hết hàng | Sắp hết hạn | Chậm luân chuyển

Tab Sắp hết hàng:
  Table: Sản phẩm + SKU | Tồn kho (danger color) | Ngưỡng tối thiểu | Thiếu (bold danger)

Tab Sắp hết hạn:
  Table: Sản phẩm + SKU | Số lô | Hạn dùng (champagne color) | SL còn | Còn X ngày

Tab Chậm luân chuyển:
  Table: Sản phẩm + SKU | Tồn kho | Lần bán cuối (mono, stone) | Số ngày không bán (bold danger)

Button "Xuất PDF" (secondary, Download icon) → POST /reports/inventory/export
```

---

## 7. Wave E — Admin Tools + Dashboard (7 trang)

### 7.1 `/branch-manager/page.tsx`
**Eyebrow:** "Chi nhánh" | **h1:** "Dashboard <i style rose>chi nhánh</i>"

Tương tự `/admin/page.tsx` đã làm, nhưng chỉ hiện data chi nhánh của user.
Reuse cùng KPICard component pattern. Không cần grid branch filter ở Header.

### 7.2 `/warehouse/page.tsx`
**Eyebrow:** "Kho hàng" | **h1:** "Dashboard <i style rose>kho</i>"

```
KPI row (3 cards):
  Tổng sản phẩm (Warehouse icon, espresso accent)
  Sắp hết hàng (AlertTriangle, danger accent)
  PO chờ nhận (ShoppingBag, champagne accent)

Alert list card:
  Title: "Cảnh báo tồn kho"
  List items: tên SP + tồn kho + ngưỡng → mỗi item có link đến /inventory/stock

Pending POs card:
  Title: "PO cần nhận hàng"
  List: mã PO + NCC + ngày confirm → link đến /inventory/receive/{id}
```

### 7.3 `/notifications/page.tsx`
**Eyebrow:** "Hệ thống" | **h1:** "Thông báo"

```
Filter tabs: Tất cả | Chưa đọc | Theo loại

"Đánh dấu tất cả đã đọc" button (secondary, top right)

List notifications (không phải table):
  Mỗi item: flex row, padding 16, borderBottom mist, cursor pointer
    Nếu chưa đọc: background rgba(183,110,121,0.06), border-left 3px rose
    Icon type (Alert/Check/Info, 32px circle bg)
    Title: fontSize 13, fontWeight 600, espresso (chưa đọc) / stone (đã đọc)
    Message: fontSize 12, stone, 2 lines clamp
    Time: fontSize 11, mono, stone (time ago)
    
  Click → PATCH /{id}/read → navigate deepLink (nếu có)

Pagination
```

### 7.4 `/user-management/page.tsx`
**Eyebrow:** "Hệ thống" | **h1:** "Quản lý <i style rose>tài khoản</i>"

```
Action bar: Search, Role filter (All | ADMIN | BRANCH_MANAGER | CASHIER | WAREHOUSE_STAFF)
Button "Tạo tài khoản" (espresso)

Table:
  Cols: Họ tên | Username (mono) | Role badge | Chi nhánh | Trạng thái | Actions
  
  Role badge colors:
    ADMIN: rose bg/text
    BRANCH_MANAGER: champagne bg, gold text
    CASHIER: success bg/text
    WAREHOUSE_STAFF: stone bg/text
  
  Trạng thái: ACTIVE (success) | LOCKED (danger) | INACTIVE (stone)
  
  Actions: "Sửa" | "Unlock" (chỉ khi LOCKED, success button) | "Vô hiệu hóa" (danger)

Modal tạo tài khoản:
  Fields: Họ tên*, Username*, Role select*, Chi nhánh (nếu không phải ADMIN), Mật khẩu tạm*
  Note: "Người dùng sẽ phải đổi mật khẩu khi đăng nhập lần đầu"

Modal sửa:
  Fields: Họ tên, Role (có hiệu lực từ phiên tiếp theo)
  Không cho sửa: Username, mật khẩu (có nút "Reset mật khẩu" riêng)
```

### 7.5 `/audit-logs/page.tsx`
**Eyebrow:** "Hệ thống" | **h1:** "Audit Log"

```
Filter bar: Date range | Entity type select | User search | Action search

Table (read-only, không có actions):
  Cols: Thời gian (mono) | Người dùng | Hành động | Entity | Giá trị cũ (mono, truncate) | Giá trị mới (mono, truncate)
  
  Expand row: click → modal hiện full JSON diff
    old value / new value side by side, mono font, cela-fog bg

Pagination
```

### 7.6 `/system-configuration/page.tsx`
**Eyebrow:** "Hệ thống" | **h1:** "Cấu hình <i style rose>hệ thống</i>"

```
Grid cards (2 cột, grouped by domain):
  Group "Loyalty": points_rate, redeem_rate, max_redeem_percent
  Group "Tồn kho": default_min_threshold, expiry_alert_days, slow_moving_days
  Group "Đơn hàng": cancel_approval_threshold
  Group "Điều chỉnh": large_adjustment_percent

Mỗi config item: card nhỏ
  Key (mono, stone) | Description | Value (bold, editable inline)
  Edit: click value → input → "Lưu" button xuất hiện
  Note: "Thay đổi có hiệu lực ngay, không cần restart"
```

### 7.7 `/manager/products/page.tsx` và `/manager/purchase-orders/page.tsx`
Tương tự `/products/page.tsx` và `/inventory/purchase-orders/page.tsx`.
Cùng layout, chỉ khác quyền — Branch Manager thấy đúng data của chi nhánh mình.

---

## 8. Checklist trước khi submit

- [x] Không có `from-pink`, `to-pink`, `bg-pink`, `text-pink`, `#FF69B4`, `#EC4899`, `#D946A6` trong file đã sửa
- [x] Không dùng `style={{color: "red"}}` — dùng `var(--cela-danger)`
- [x] Không import `Sparkles` từ lucide (đã bỏ)
- [x] Mọi `useState/useEffect` logic giữ nguyên, chỉ thay JSX
- [x] `<ERPLayout>` vẫn bao bên ngoài (trừ login và force-change-password)
- [x] Inline `style` prop là cách chính (không thêm Tailwind mới) — dùng Tailwind chỉ cho flex/grid/hidden/hover
- [x] Loading state: dùng spinner pattern CÉLA (border rose-tinted)
- [x] Empty state: dùng pattern CÉLA (centered, stone text)
- [x] `formatVND`: `new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)`

---

## 9. Trang thai thuc thi (Codex)

### Theo task trang
- ✅ 3.1 `/force-change-password/page.tsx`
- ✅ 3.2 `/change-password/page.tsx`
- ✅ 4.1 `/pos/shift/page.tsx`
- ✅ 4.2 `/pos/order/page.tsx`
- ✅ 4.3 `/cashier/orders/page.tsx`
- ✅ 4.4 `/orders/[orderId]/page.tsx`
- ✅ 4.5 `/returns/new/page.tsx`
- ✅ 5.1 `/products/page.tsx`
- ✅ 5.2 `/products/create/page.tsx`
- ✅ 5.2 `/products/[id]/edit/page.tsx`
- ✅ 5.3 `/categories/page.tsx`
- ✅ 5.4 `/inventory/stock/page.tsx`
- ✅ 5.5 `/inventory/purchase-orders/page.tsx`
- ✅ 5.6 `/inventory/purchase-orders/create/page.tsx`
- ✅ 5.7 `/inventory/receive/[poId]/page.tsx`
- ✅ 5.8 `/inventory/adjustments/page.tsx`
- ✅ 5.9 `/manager/orders/page.tsx`
- ✅ 5.10 `/manager/inventory/page.tsx`
- ✅ 5.11 `/supplier-management/page.tsx`
- ✅ 6.1 `/loyalty/members/page.tsx`
- ✅ 6.2 `/promotions/page.tsx`
- ✅ 6.3 `/coupons/page.tsx`
- ✅ 6.4 `/revenue-report/page.tsx`
- ✅ 6.5 `/inventory-report/page.tsx`
- ✅ 7.1 `/branch-manager/page.tsx`
- ✅ 7.2 `/warehouse/page.tsx`
- ✅ 7.3 `/notifications/page.tsx`
- ✅ 7.4 `/user-management/page.tsx`
- ✅ 7.5 `/audit-logs/page.tsx`
- ✅ 7.6 `/system-configuration/page.tsx`
- ✅ 7.7 `/manager/products/page.tsx`
- ✅ 7.7 `/manager/purchase-orders/page.tsx`

### Checklist tong
- ✅ Da loai toan bo `from-pink`, `to-pink`, `bg-pink`, `text-pink`, `#FF69B4`, `#EC4899`, `#D946A6` trong cac file da sua.
- ✅ Da bo import `Sparkles`.
- ✅ Da chuyen palette ve token CELA va dong bo mau/action badge/spinner tren cac trang refactor.
- ✅ Da giu nguyen service/store/API flow (chi thay doi JSX/CSS).

### Review nhanh
- Da tao primitives dung chung: `src/components/ui/cela-primitives.tsx` de dong bo page header, card, button, input/select/textarea, badge, spinner, empty state.
- Da refactor tay dung spec cho Wave A (`force-change-password`, `change-password`) va `pos/shift`.
- Da sweep toan bo `src/app` de thay token mau cu/pink sang token CELA, cap nhat icon/cta states theo palette moi.
- Da cap nhat file checklist nay de co trang thai hoan thanh ro rang.