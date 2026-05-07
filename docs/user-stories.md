# User Story Document — BeautyERP FE (Internal ERP)

> User stories dành cho giao diện **nội bộ** BeautyERP, phục vụ 4 vai trò nhân viên.
> Mapping với backend user stories tại `BeautyERP/docs/user-stories.md` (US-01 đến US-34).

---

## MODULE 1: XÁC THỰC & TÀI KHOẢN

### US-FE-01 [SEC] — Đăng nhập nhân viên
**Story:** Là nhân viên (bất kỳ role), tôi muốn đăng nhập bằng **username** và mật khẩu để truy cập hệ thống ERP theo đúng vai trò của mình.

**Tiêu chí chấp nhận:**
- Form: username + password (KHÔNG phải email)
- Đăng nhập thành công → redirect theo role: ADMIN→`/admin`, CASHIER→`/pos/shift`, WAREHOUSE_STAFF→`/warehouse`, BRANCH_MANAGER→`/branch-manager`
- Sai thông tin → thông báo "Sai tên đăng nhập hoặc mật khẩu" (không tiết lộ trường nào sai)
- Tài khoản bị khóa (≥ 5 lần sai) → thông báo "Tài khoản bị khóa, vui lòng liên hệ Admin"
- JWT lưu httpOnly cookie (backend set) — không thể đọc bằng JavaScript
- Đăng xuất → Redis blacklist, xóa cookie, redirect `/login`

**Thuộc tính chất lượng — Security [SEC]:**
- Không expose chi tiết lý do thất bại (tránh user enumeration)
- SameSite=Strict cookie — CSRF protection
- Bộ đếm sai mật khẩu server-side, không reset khi xóa cookie/đổi IP

**Mapping backend:** US-01 (Login), US-11 (Logout)

---

### US-FE-02 [SEC] — Force đổi mật khẩu lần đầu
**Story:** Là nhân viên mới (tài khoản có `forceChangePassword=true`), tôi phải đổi mật khẩu ngay lần đầu đăng nhập trước khi dùng bất kỳ chức năng nào.

**Tiêu chí chấp nhận:**
- Sau login, nếu `forceChangePassword=true` → redirect `/force-change-password`
- Form: mật khẩu mới + xác nhận mật khẩu
- Validate: ≥ 8 ký tự, có chữ hoa/thường/số, không trùng mật khẩu cũ (backend check)
- Thành công → redirect đến trang phù hợp với role
- Mọi request khác khi chưa đổi mật khẩu → backend trả 403 → UI hiển thị lý do

**Thuộc tính chất lượng — Security [SEC]:**
- Không thể bypass dù gọi API trực tiếp (InternalSecretFilter enforce ở backend)
- Validate cả client-side (UX real-time) lẫn server-side (enforcement)

**Mapping backend:** US-02 (ForceChangePassword)

---

### US-FE-03 [USE] — Đổi mật khẩu tự nguyện
**Story:** Là nhân viên đã đăng nhập, tôi muốn đổi mật khẩu theo ý muốn để bảo mật tài khoản.

**Tiêu chí chấp nhận:**
- Form: mật khẩu hiện tại + mật khẩu mới + xác nhận
- Validate inline real-time khi blur field
- Mật khẩu mới: ≥ 8 ký tự, có chữ hoa/thường/số
- Thành công → toast "Đã đổi mật khẩu thành công"
- Sai mật khẩu hiện tại → toast lỗi rõ ràng

**Thuộc tính chất lượng — Usability [USE]:**
- Validate ngay khi blur từng field — không đợi submit
- Toggle hiển thị/ẩn mật khẩu

**Mapping backend:** US-01 (change-password endpoint)

---

### US-FE-04 [MNT] — Quản lý tài khoản nhân viên (ADMIN)
**Story:** Là ADMIN, tôi muốn quản lý tài khoản nhân viên (tạo, sửa, vô hiệu hóa, unlock) để kiểm soát quyền truy cập hệ thống.

**Tiêu chí chấp nhận:**
- Danh sách tài khoản: tên, username, role, chi nhánh, trạng thái (active/locked/deactivated)
- Tạo tài khoản mới → tự động `forceChangePassword=true`, nhân viên phải đổi mật khẩu lần đầu
- Sửa role → có hiệu lực từ phiên đăng nhập tiếp theo (không kick user ngay)
- Vô hiệu hóa → soft-delete, giữ nguyên lịch sử giao dịch (không thể đăng nhập)
- Unlock tài khoản bị khóa do sai mật khẩu ≥ 5 lần
- Không thể vô hiệu hóa Admin duy nhất còn lại (backend enforce 409)

**Thuộc tính chất lượng — Maintainability [MNT]:**
- Audit trail tự động ghi nhận mọi thay đổi tài khoản (AOP backend)
- Phân trang server-side

**Mapping backend:** US-01 (Account Management), US-27 (Quản lý tài khoản)

---

## MODULE 2: QUẢN LÝ CA LÀM VIỆC (CASHIER)

### US-FE-05 [REL] — Mở ca làm việc
**Story:** Là Cashier, tôi phải mở ca làm việc trước khi bắt đầu bán hàng để hệ thống ghi nhận tất cả giao dịch trong ca.

**Tiêu chí chấp nhận:**
- Form mở ca: nhập `openingCash` (tiền mặt đầu ca, số dương)
- Mở ca thành công → hiển thị trạng thái ca đang mở (thời gian mở, doanh số, số đơn real-time)
- Không thể tạo đơn hàng khi chưa có ca OPEN (backend enforce 403 với mã `SHIFT_NOT_OPEN`)
- Mỗi Cashier chỉ có 1 ca OPEN tại một thời điểm (backend enforce 409)
- Hiển thị thông tin ca đang mở khi truy cập trang `/pos/shift`

**Thuộc tính chất lượng — Reliability [REL]:**
- INSERT shift vào DB trước khi cho tạo đơn (không mất ca khi crash)

**Mapping backend:** US-15 (Shift Management), SD-11

---

### US-FE-06 [REL] — Đóng ca & đối chiếu tiền
**Story:** Là Cashier, tôi muốn đóng ca và đối chiếu tiền mặt cuối ngày để hoàn thành ca làm việc.

**Tiêu chí chấp nhận:**
- Form đóng ca: nhập `closingCash` (tiền mặt thực tế)
- Hiển thị tự động: `variance = closingCash − (openingCash + totalRevenueCash)`
- Nếu variance ≠ 0 → bắt buộc nhập ghi chú lý do trước khi đóng được
- Sau đóng ca → snapshot immutable (không sửa được), redirect về màn hình mở ca mới
- Nếu variance ≠ 0 → Manager nhận notification tự động (backend publish)
- Xác nhận dialog trước khi đóng ca

**Thuộc tính chất lượng — Reliability [REL]:**
- Dữ liệu ca là immutable snapshot sau khi đóng — không thể chỉnh sửa

**Mapping backend:** US-15 (Close Shift), SD-12

---

## MODULE 3: POS BÁN HÀNG (CASHIER)

### US-FE-07 [REL] [PERF] — Tạo đơn POS & thanh toán
**Story:** Là Cashier, tôi muốn tạo đơn hàng tại quầy (POS) và hoàn tất thanh toán nhanh chóng.

**Tiêu chí chấp nhận:**
- Tìm kiếm sản phẩm theo tên hoặc SKU → debounce 300ms → kết quả ≤ 300ms
- Thêm sản phẩm vào giỏ POS, điều chỉnh số lượng, xóa item
- Hiển thị real-time: tổng tiền, chiết khấu coupon, chiết khấu điểm, tiền thu, tiền thối
- Nút "Thanh toán" → POST /order/orders với `Idempotency-Key: {UUID}` (bấm 2 lần không tạo 2 đơn)
- Thành công → receipt URL, hiển thị tóm tắt, nút in hóa đơn
- Tồn kho không đủ → toast lỗi rõ ràng, không hoàn tất đơn
- Draft tự lưu mỗi 10s → `localStorage('pos_draft')`, khôi phục khi reload

**Thuộc tính chất lượng — Reliability + Performance [REL] [PERF]:**
- Idempotency-Key đảm bảo không tạo đơn trùng (bấm nhiều lần, mất mạng rồi retry)
- Draft autosave đảm bảo không mất dữ liệu khi reload/mất điện

**Mapping backend:** US-04 (Tạo đơn hàng), SD-06, SD-07, SD-10

---

### US-FE-08 [USE] — Áp coupon tại POS
**Story:** Là Cashier, tôi muốn áp dụng mã coupon tại POS để giảm giá cho khách.

**Tiêu chí chấp nhận:**
- Ô nhập mã coupon + nút "Áp dụng"
- Validate ≤ 300ms: còn hiệu lực, chưa hết lượt, đạt min_order_value
- Hiển thị lý do cụ thể nếu không hợp lệ (hết hạn / hết lượt / chưa đủ điều kiện / không tồn tại)
- Tổng tiền cập nhật real-time sau khi áp dụng
- Nút xóa coupon đã áp dụng (×)
- Loading spinner nhỏ trong nút "Áp dụng" khi đang validate

**Thuộc tính chất lượng — Usability [USE]:**
- Validate không blocking — chỉ gọi API khi nhấn nút

**Mapping backend:** US-08 (Coupon), SD-20, SD-21

---

### US-FE-09 [USE] — Loyalty tại POS (tra cứu + đổi điểm + đăng ký)
**Story:** Là Cashier, tôi muốn tra cứu, đăng ký và áp dụng điểm loyalty của khách hàng tại POS.

**Tiêu chí chấp nhận:**
- Tìm thành viên theo số điện thoại (search nhanh ≤ 300ms)
- Hiển thị: tên, mã thành viên, số điểm hiện có
- Nhập số điểm muốn đổi → hiển thị giá trị giảm (100 điểm = 10.000đ), tối đa 50% giá trị đơn
- Tổng tiền cập nhật real-time sau khi áp dụng điểm
- Đổi điểm sync tại backend (SELECT FOR UPDATE — không race condition)
- Đăng ký thành viên mới ngay tại POS (nhập tên + số điện thoại)
- Xóa/bỏ chọn thành viên đã chọn

**Thuộc tính chất lượng — Usability [USE]:**
- Hiển thị rõ số điểm tối đa có thể đổi trong đơn hiện tại

**Mapping backend:** US-18 (Loyalty Register), US-19 (Points Earn/Redeem), SD-17, SD-18, SD-19

---

### US-FE-10 [REL] — Tạo giao dịch trả hàng
**Story:** Là Cashier, tôi muốn tạo giao dịch trả hàng để hoàn trả sản phẩm và cập nhật tồn kho.

**Tiêu chí chấp nhận:**
- Tìm đơn gốc theo mã đơn hoặc SKU sản phẩm
- Hiển thị đơn gốc: sản phẩm, số lượng đã mua, đơn giá (snapshot immutable)
- Chọn sản phẩm trả + số lượng (không vượt quá qty đã mua trong đơn gốc)
- Xác nhận → backend tự hoàn kho (inventory transaction RETURN)
- Return_transaction liên kết với shift hiện tại của cashier
- Thành công → toast xác nhận, không cần in hóa đơn riêng

**Thuộc tính chất lượng — Reliability [REL]:**
- Validate qty_return ≤ qty_original tại frontend và backend
- Phải có ca OPEN để tạo trả hàng

**Mapping backend:** US-05 (Return), SD-08

---

### US-FE-11 [USE] — Yêu cầu hủy đơn hàng
**Story:** Là Cashier, tôi muốn yêu cầu hủy đơn hàng đã tạo.

**Tiêu chí chấp nhận:**
- Nhập lý do hủy (bắt buộc)
- Đơn ≤ 500.000đ → hủy ngay (hoàn kho trong cùng transaction), toast thành công
- Đơn > 500.000đ → gửi yêu cầu PENDING, toast "Đang chờ Branch Manager duyệt"
- Đơn đã hủy không thể phục hồi — hiển thị trạng thái CANCELLED/PENDING_CANCEL rõ ràng
- Ngưỡng 500.000đ lấy từ `order.cancel_approval_threshold` (system config)

**Thuộc tính chất lượng — Usability [USE]:**
- Xác nhận dialog trước khi gửi yêu cầu hủy

**Mapping backend:** US-16 (Cancel Order), SD-09

---

## MODULE 4: QUẢN LÝ KHO (WAREHOUSE_STAFF)

### US-FE-12 [REL] — Tạo Purchase Order
**Story:** Là Warehouse Staff, tôi muốn tạo đơn đặt hàng nhà cung cấp (PO) để nhập hàng mới.

**Tiêu chí chấp nhận:**
- Chọn nhà cung cấp từ danh sách
- Thêm sản phẩm + số lượng đặt + đơn giá (có thể thêm nhiều dòng)
- Mã PO tự sinh: `PO-YYYYMMDD-XXXX`
- PO mới tạo: trạng thái PENDING → cần confirm trước khi nhận hàng
- Phân trang danh sách PO, lọc theo status (PENDING/CONFIRMED/FULLY_RECEIVED/CANCELLED)

**Thuộc tính chất lượng — Reliability [REL]:**
- Tổng tiền PO tính real-time khi nhập qty × đơn giá

**Mapping backend:** US-06 (PO Create), SD-13

---

### US-FE-13 [REL] — Nhận hàng theo PO
**Story:** Là Warehouse Staff, tôi muốn ghi nhận hàng nhận được theo PO đã xác nhận để cập nhật tồn kho.

**Tiêu chí chấp nhận:**
- Chọn PO có trạng thái CONFIRMED
- Với mỗi sản phẩm trong PO: nhập `qty thực nhận`, `số lô`, `hạn sử dụng` (HSD)
- Tồn kho cập nhật ngay sau khi nhận (inventory transaction RECEIVE)
- Nhận đủ → PO status = FULLY_RECEIVED
- Nhận thiếu → PO status = PARTIALLY_RECEIVED, Manager nhận notification
- HSD phải là ngày tương lai; cảnh báo nếu < 30 ngày kể từ hôm nay

**Thuộc tính chất lượng — Reliability [REL]:**
- `inventory_transactions` append-only — không edit sau khi nhận

**Mapping backend:** US-06 (Receive Goods), SD-14

---

### US-FE-14 [REL] — Ghi nhận hàng hỏng/thất thoát
**Story:** Là Warehouse Staff, tôi muốn ghi nhận hàng hỏng, thất thoát hoặc hết hạn để điều chỉnh tồn kho chính xác.

**Tiêu chí chấp nhận:**
- Tìm sản phẩm → nhập số lượng, loại (DAMAGED / LOST / EXPIRED), mô tả (bắt buộc)
- Qty ≤ 10% tồn kho hiện tại → thực hiện ngay, cập nhật kho
- Qty > 10% → tạo yêu cầu điều chỉnh PENDING, toast "Đang chờ Branch Manager duyệt"
- Hiển thị % so với tồn kho để cashier nhận biết ngưỡng
- Ngưỡng 10% từ `inventory.large_adjustment_percent` (system config)

**Thuộc tính chất lượng — Reliability [REL]:**
- Mô tả bắt buộc — không cho submit nếu trống

**Mapping backend:** US-17 (Damaged Goods), SD-16

---

## MODULE 5: DUYỆT & QUẢN LÝ (BRANCH_MANAGER)

### US-FE-15 [REL] — Duyệt yêu cầu hủy đơn giá trị cao
**Story:** Là Branch Manager, tôi muốn duyệt hoặc từ chối yêu cầu hủy đơn giá trị cao để kiểm soát hoàn tiền.

**Tiêu chí chấp nhận:**
- Nhận notification khi có yêu cầu hủy đơn > 500.000đ
- Trang duyệt: thông tin đơn (items, tổng tiền), thông tin cashier, lý do hủy
- Nút "Phê duyệt" → backend hủy đơn + hoàn kho (atomic transaction)
- Nút "Từ chối" → đơn giữ nguyên trạng thái COMPLETED
- Dialog xác nhận với ô nhập lý do (cho cả approve và reject)

**Thuộc tính chất lượng — Reliability [REL]:**
- Hủy đơn và hoàn kho trong cùng một transaction (không mất nhất quán)

**Mapping backend:** US-16 (Cancel Approval), SD-09

---

### US-FE-16 [REL] — Duyệt điều chỉnh kho > 10%
**Story:** Là Branch Manager, tôi muốn duyệt hoặc từ chối các yêu cầu điều chỉnh kho lớn.

**Tiêu chí chấp nhận:**
- Danh sách adjustment requests đang PENDING (phân trang)
- Mỗi request: sản phẩm, số lượng, % so với tồn kho, loại (DAMAGED/LOST/EXPIRED), mô tả
- Nút "Phê duyệt" → tồn kho giảm ngay, inventory transaction ADJUSTMENT_LOSS
- Nút "Từ chối" → request cancelled, tồn kho không thay đổi

**Thuộc tính chất lượng — Reliability [REL]:**
- Không thể duyệt request đã xử lý (backend enforce)

**Mapping backend:** US-17 (Adjustment Approval)

---

### US-FE-17 [PERF] — Dashboard chi nhánh
**Story:** Là Branch Manager, tôi muốn xem dashboard theo thời gian thực để theo dõi hiệu quả kinh doanh của chi nhánh.

**Tiêu chí chấp nhận:**
- KPI cards: doanh thu hôm nay, số đơn hàng, giá trị đơn trung bình, tăng trưởng so với hôm qua
- Top sản phẩm bán chạy trong ngày (hiển thị tối đa 5)
- Cảnh báo: tồn kho thấp, hàng gần hết hạn, variance ca làm việc
- Dashboard load ≤ 2s; nếu DB lỗi → trả dữ liệu trống, không báo lỗi cho user
- Cache Redis 1h; tự expire và refresh 00:00 mỗi ngày

**Thuộc tính chất lượng — Performance [PERF]:**
- Dữ liệu từ pre-aggregated table — không query lại raw transactions
- ADMIN thấy toàn bộ hệ thống; BRANCH_MANAGER chỉ thấy chi nhánh mình

**Mapping backend:** US-09 (Dashboard), SD-22

---

## MODULE 6: THÔNG BÁO (ALL ROLES)

### US-FE-18 [USE] — Trung tâm thông báo
**Story:** Là nhân viên, tôi muốn nhận thông báo theo phạm vi vai trò để xử lý kịp thời các sự kiện quan trọng.

**Tiêu chí chấp nhận:**
- Badge số chưa đọc trên Header, cập nhật tự động mỗi 30s (polling GET `/unread-count`)
- Click chuông → danh sách thông báo (phân trang, lọc theo loại)
- Click từng thông báo → đánh dấu đã đọc + deeplink đến đúng trang liên quan
- Thông báo > 30 ngày không hiển thị (không xóa DB)
- Mỗi role chỉ thấy thông báo trong phạm vi của mình

**Phân quyền thông báo:**
| Role | Loại thông báo nhận được |
|------|--------------------------|
| CASHIER | Không nhận thông báo hệ thống |
| WAREHOUSE_STAFF | `LOW_STOCK`, `NEAR_EXPIRY` |
| BRANCH_MANAGER | `CANCEL_APPROVAL`, `SHIFT_VARIANCE`, `PO_PARTIAL`, `LOW_STOCK`, `NEAR_EXPIRY` |
| ADMIN | `ACCOUNT_LOCKED`, `REPORT_READY` + tất cả loại trên |

**Thuộc tính chất lượng — Usability [USE]:**
- Polling chỉ gọi endpoint `/unread-count` (số nguyên) — tối thiểu bandwidth
- Dừng polling khi tab không active (`document.visibilitychange`)

**Mapping backend:** US-22 (Notifications), SD-25, SD-26

---

## MODULE 7: QUẢN LÝ DANH MỤC & SẢN PHẨM (ADMIN + BRANCH_MANAGER)

### US-FE-19 [MNT] — Quản lý danh mục sản phẩm
**Story:** Là Admin/Branch Manager, tôi muốn quản lý cây danh mục 2 cấp để tổ chức hàng hóa.

**Tiêu chí chấp nhận:**
- Hiển thị cây danh mục: danh mục cha → danh mục con (tối đa 2 cấp)
- Tạo danh mục cha hoặc con; tên unique trong cùng cấp (backend enforce)
- Sửa tên danh mục
- Xóa danh mục: chỉ xóa được khi không có sản phẩm; xóa cha → tự xóa con (nếu con cũng trống)
- Dialog xác nhận trước khi xóa

**Thuộc tính chất lượng — Maintainability [MNT]:**
- Audit trail tự động ghi nhận thay đổi danh mục

**Mapping backend:** US-12 (Category Management)

---

### US-FE-20 [MNT] [PERF] — Quản lý sản phẩm (CRUD)
**Story:** Là Admin/Branch Manager, tôi muốn quản lý danh sách sản phẩm để cập nhật catalog hàng hóa.

**Tiêu chí chấp nhận:**
- Tìm kiếm full-text theo tên (hỗ trợ tiếng Việt có/không dấu), exact match theo SKU
- Kết quả ≤ 300ms; debounce 300ms; phân trang server-side
- Tạo sản phẩm: tên, SKU, barcode (EAN-13 hoặc Code-128), giá bán, giá vốn, danh mục, ảnh
- Upload ảnh atomic: upload thất bại → rollback bản ghi sản phẩm
- Cảnh báo nếu giá vốn > giá bán (không chặn lưu)
- Ngừng kinh doanh (soft-delete) — không xóa khỏi lịch sử đơn hàng

**Thuộc tính chất lượng — Maintainability + Performance [MNT] [PERF]:**
- Cache search Redis TTL 5 phút; invalidate khi sản phẩm thay đổi (backend)

**Mapping backend:** US-13 (Product Management), US-14 (Product Search), SD-04, SD-05

---

## MODULE 8: KHUYẾN MÃI & LOYALTY (ADMIN + BRANCH_MANAGER)

### US-FE-21 [FLX] — Quản lý khuyến mãi & coupon
**Story:** Là Admin/Branch Manager, tôi muốn tạo và quản lý chương trình khuyến mãi và mã coupon.

**Tiêu chí chấp nhận:**
- **Promotion:** CRUD; loại (PERCENTAGE / FIXED_AMOUNT), giá trị, min_order_value, maxDiscountCap, thời hạn
- Không cho tạo 2 KM cùng loại cùng phạm vi active đồng thời (backend enforce 409)
- **Coupon:** Tạo coupon gắn với promotion; max_usage_total, max_usage_per_customer
- Xem thống kê: used_count / max_usage_total
- Toggle active/inactive coupon

**Thuộc tính chất lượng — Flexibility [FLX]:**
- Chiến lược PERCENTAGE và FIXED_AMOUNT pluggable (Strategy pattern backend)

**Mapping backend:** US-08 (Coupon), US-20 (Promotion)

---

### US-FE-22 [USE] — Quản lý loyalty members
**Story:** Là Admin/Branch Manager, tôi muốn xem danh sách thành viên loyalty để theo dõi chương trình khách hàng thân thiết.

**Tiêu chí chấp nhận:**
- Danh sách thành viên: tên, mã thành viên, số điện thoại, điểm hiện có, ngày đăng ký
- Lọc theo điểm, sắp xếp theo ngày đăng ký / điểm
- Xem lịch sử điểm (EARN, REDEEM, REFUND) của từng thành viên
- Phân trang server-side

**Mapping backend:** US-19 (Loyalty Members)

---

## MODULE 9: BÁO CÁO (ADMIN + BRANCH_MANAGER)

### US-FE-23 [PERF] — Báo cáo doanh thu
**Story:** Là Admin/Branch Manager, tôi muốn xem báo cáo doanh thu theo khoảng thời gian để phân tích kinh doanh.

**Tiêu chí chấp nhận:**
- Chọn khoảng thời gian: ngày / tuần / tháng / tùy chọn
- ≤ 31 ngày: kết quả trả về ≤ 2s (sync API)
- > 31 ngày: báo cáo async → notification khi sẵn sàng (REPORT_READY)
- Hiển thị: tổng doanh thu, số đơn, giá trị đơn trung bình, top sản phẩm, biểu đồ theo ngày
- Export PDF và CSV

**Thuộc tính chất lượng — Performance [PERF]:**
- Data từ pre-aggregated table (daily_revenue_summary) — không query raw

**Mapping backend:** US-21 (Revenue Report), SD-23, SD-24

---

### US-FE-24 [PERF] — Báo cáo tồn kho
**Story:** Là Admin/Branch Manager/Warehouse Staff, tôi muốn xem báo cáo tồn kho để quản lý hàng hóa hiệu quả.

**Tiêu chí chấp nhận:**
- Sản phẩm sắp hết hàng (quantity ≤ min_threshold)
- Sản phẩm chậm luân chuyển (không bán trong X ngày — ngưỡng từ system config)
- Sản phẩm sắp hết hạn (HSD trong X ngày — ngưỡng từ system config)
- Lọc theo chi nhánh (ADMIN thấy tất cả; BM/WS chỉ thấy chi nhánh mình)

**Mapping backend:** US-21 (Inventory Report), SD-15

---

## MODULE 10: CẤU HÌNH HỆ THỐNG (ADMIN)

### US-FE-25 [MNT] — Cấu hình hệ thống
**Story:** Là Admin, tôi muốn chỉnh sửa cấu hình hệ thống (ngưỡng, tỷ lệ) để điều chỉnh business rule mà không cần restart server.

**Tiêu chí chấp nhận:**
- Danh sách tất cả system_configs: key, value, description, updatedBy, updatedAt
- Sửa giá trị → hiệu lực ngay (DEL Redis cache ở backend)
- Validate: giá trị phải là số hợp lệ theo loại key
- Audit log tự động ghi nhận mọi thay đổi config

**Config có thể sửa:**
| Key | Default | Mô tả |
|-----|---------|-------|
| `loyalty.points_rate` | 10000 | Đồng/điểm |
| `loyalty.redeem_rate` | 100 | 100 điểm = 10.000đ |
| `loyalty.max_redeem_percent` | 50 | Tối đa % đổi điểm |
| `inventory.default_min_threshold` | 10 | Ngưỡng tồn kho thấp |
| `inventory.expiry_alert_days` | 7 | Ngày trước HSD cảnh báo |
| `inventory.slow_moving_days` | 30 | Ngày không bán = chậm |
| `order.cancel_approval_threshold` | 500000 | Ngưỡng đơn hủy cần duyệt |
| `inventory.large_adjustment_percent` | 10 | Ngưỡng điều chỉnh cần duyệt |

**Thuộc tính chất lượng — Maintainability [MNT]:**
- Không hardcode bất kỳ threshold nào trong frontend — luôn đọc từ backend/config

**Mapping backend:** US-23 (System Config), SD-28, SD-29

---

### US-FE-26 [SUP] — Audit Log
**Story:** Là Admin, tôi muốn xem lịch sử thay đổi hệ thống để kiểm tra và truy vết vấn đề.

**Tiêu chí chấp nhận:**
- Bảng audit log: userId, action, entityType, entityId, oldValue, newValue, ipAddress, thời gian
- Lọc theo: loại entity, user, khoảng thời gian
- Phân trang server-side (10 dòng/trang)
- Không có nút sửa/xóa — immutable (DB chỉ có INSERT + SELECT permission)

**Thuộc tính chất lượng — Supportability [SUP]:**
- Dữ liệu audit không thể sửa hay xóa — audit trail hoàn chỉnh

**Mapping backend:** US-10 (Audit Log), SD-27

---

## TỔNG KẾT USER STORIES

| Mã US | Tên | QA | Module | Role |
|-------|-----|----|--------|------|
| US-FE-01 | Đăng nhập nhân viên | SEC | Auth | All |
| US-FE-02 | Force đổi mật khẩu lần đầu | SEC | Auth | All |
| US-FE-03 | Đổi mật khẩu tự nguyện | USE | Auth | All |
| US-FE-04 | Quản lý tài khoản nhân viên | MNT | Auth | ADMIN |
| US-FE-05 | Mở ca làm việc | REL | Shift | CASHIER |
| US-FE-06 | Đóng ca & đối chiếu tiền | REL | Shift | CASHIER |
| US-FE-07 | Tạo đơn POS & thanh toán | REL+PERF | POS | CASHIER |
| US-FE-08 | Áp coupon tại POS | USE | POS | CASHIER |
| US-FE-09 | Loyalty tại POS (tra cứu + đổi điểm) | USE | POS | CASHIER |
| US-FE-10 | Tạo giao dịch trả hàng | REL | POS | CASHIER |
| US-FE-11 | Yêu cầu hủy đơn hàng | USE | POS | CASHIER |
| US-FE-12 | Tạo Purchase Order | REL | Inventory | WS |
| US-FE-13 | Nhận hàng theo PO | REL | Inventory | WS |
| US-FE-14 | Ghi nhận hàng hỏng/thất thoát | REL | Inventory | WS |
| US-FE-15 | Duyệt yêu cầu hủy đơn cao | REL | Approval | BM |
| US-FE-16 | Duyệt điều chỉnh kho > 10% | REL | Approval | BM |
| US-FE-17 | Dashboard chi nhánh | PERF | Report | BM+ADMIN |
| US-FE-18 | Trung tâm thông báo (polling 30s) | USE | Notification | All |
| US-FE-19 | Quản lý danh mục 2 cấp | MNT | Catalog | ADMIN+BM |
| US-FE-20 | Quản lý sản phẩm (CRUD) | MNT+PERF | Catalog | ADMIN+BM |
| US-FE-21 | Quản lý khuyến mãi & coupon | FLX | Loyalty | ADMIN+BM |
| US-FE-22 | Quản lý loyalty members | USE | Loyalty | ADMIN+BM |
| US-FE-23 | Báo cáo doanh thu | PERF | Report | ADMIN+BM |
| US-FE-24 | Báo cáo tồn kho | PERF | Report | ADMIN+BM+WS |
| US-FE-25 | Cấu hình hệ thống | MNT | Config | ADMIN |
| US-FE-26 | Audit Log | SUP | Config | ADMIN |

**QA attributes:** SEC (Security), USE (Usability), PERF (Performance), REL (Reliability), MNT (Maintainability), FLX (Flexibility), SUP (Supportability)
