# User Story Document — BeautyStore FE (Customer Storefront)

## MODULE 1: XÁC THỰC & TÀI KHOẢN

### US-01 [SEC]
**Story:** Là một Khách hàng, tôi muốn đăng nhập bằng email và mật khẩu để truy cập tài khoản và xem lịch sử đơn hàng của mình.

**Tiêu chí chấp nhận:**
* Đăng nhập thành công nhận JWT (httpOnly cookie), redirect về trang chủ hoặc trang trước đó
* Sai thông tin thông báo chung "Email hoặc mật khẩu không đúng" — không tiết lộ trường nào sai
* JWT lưu httpOnly cookie, không localStorage — không thể đọc bằng JavaScript
* Phiên đăng nhập 8 giờ; đăng xuất invalidate token ngay lập tức (Redis blacklist)

**Thuộc tính chất lượng — Security [SEC]:**
* Mật khẩu hash bcrypt ở backend (không gửi plaintext ngoài HTTPS)
* CSRF protection: SameSite=Strict cookie
* Không expose thông tin chi tiết về lý do thất bại (tránh user enumeration)

---

### US-02 [USE]
**Story:** Là một Khách hàng mới, tôi muốn đăng ký tài khoản bằng email, tên và mật khẩu để có thể mua hàng và theo dõi đơn hàng.

**Tiêu chí chấp nhận:**
* Form: tên đầy đủ, email (unique), mật khẩu (tối thiểu 8 ký tự), xác nhận mật khẩu
* Validate inline ngay khi blur từng field — không đợi submit
* Kiểm tra email trùng trước khi tạo; nếu đã tồn tại → thông báo rõ
* Đăng ký thành công tự động đăng nhập và redirect về trang chủ

**Thuộc tính chất lượng — Usability [USE]:**
* Lỗi validate hiển thị ngay dưới field khi blur, không chờ submit
* Password strength indicator real-time (Yếu / Trung bình / Mạnh)

---

### US-03 [SEC]
**Story:** Là một Khách hàng đã đăng nhập, tôi muốn xem và chỉnh sửa thông tin tài khoản (tên, email, mật khẩu) để cập nhật dữ liệu cá nhân.

**Tiêu chí chấp nhận:**
* Trang tài khoản chỉ truy cập khi đã đăng nhập — redirect về `/login` nếu chưa
* Đổi mật khẩu: nhập mật khẩu cũ, mật khẩu mới, xác nhận; validate không trùng mật khẩu cũ
* Cập nhật thành công toast "Đã cập nhật thông tin"

**Thuộc tính chất lượng — Security [SEC]:**
* Yêu cầu mật khẩu hiện tại khi đổi mật khẩu — không cho phép đổi trực tiếp
* Tất cả thao tác tài khoản yêu cầu xác thực active session

---

## MODULE 2: DUYỆT & TÌM KIẾM SẢN PHẨM

### US-04 [PERF]
**Story:** Là một Khách hàng, tôi muốn tìm kiếm sản phẩm theo tên và lọc theo danh mục để tìm nhanh sản phẩm cần mua.

**Tiêu chí chấp nhận:**
* Tìm kiếm full-text theo tên, hỗ trợ tiếng Việt có dấu và không dấu
* Kết quả trả về ≤ 300ms; hiển thị gợi ý dropdown khi gõ
* Lọc theo danh mục: Chăm sóc da / Trang điểm / Nước hoa / Chăm sóc tóc
* Phân trang 20 sản phẩm/trang; hiển thị ảnh thumbnail, giá bán, badge giảm giá

**Thuộc tính chất lượng — Performance [PERF]:**
* Debounce 300ms khi gõ — không gọi API liên tục
* Kết quả tìm kiếm cache phía client (React Query / SWR) TTL 5 phút
* Pagination server-side — không load toàn bộ danh sách

---

### US-05 [USE]
**Story:** Là một Khách hàng, tôi muốn xem chi tiết sản phẩm bao gồm ảnh, mô tả, giá và đánh giá để ra quyết định mua hàng.

**Tiêu chí chấp nhận:**
* Trang chi tiết: gallery ảnh (nhiều ảnh, có thể chuyển), tên, thương hiệu, giá bán, giá gốc (nếu đang sale), mô tả, danh mục
* Hiển thị rating (sao) và số lượt đánh giá
* Nếu hết hàng (stock = 0): button "Hết hàng" disabled
* Sản phẩm liên quan (cùng danh mục) hiển thị bên dưới

**Thuộc tính chất lượng — Usability [USE]:**
* Gallery ảnh có thể zoom hoặc xem fullscreen
* Breadcrumb navigation: Trang chủ > Danh mục > Tên sản phẩm
* URL dạng `/products/{slug}` để bookmark và share được

---

### US-06 [USE]
**Story:** Là một Khách hàng, tôi muốn xem trang khuyến mãi để nhanh chóng tìm sản phẩm đang giảm giá tốt nhất.

**Tiêu chí chấp nhận:**
* Hiển thị tất cả sản phẩm có `salePrice < price`
* Hiển thị % giảm giá nổi bật trên mỗi sản phẩm
* Có thể lọc theo danh mục, sắp xếp theo % giảm giá hoặc giá

**Thuộc tính chất lượng — Usability [USE]:**
* Badge giảm giá nổi bật (màu đỏ/hồng), font đủ lớn
* Countdown timer nếu khuyến mãi có thời hạn

---

## MODULE 3: GIỎ HÀNG

### US-07 [PERF] [REL]
**Story:** Là một Khách hàng, tôi muốn thêm sản phẩm vào giỏ hàng và điều chỉnh số lượng để chuẩn bị thanh toán.

**Tiêu chí chấp nhận:**
* Thêm sản phẩm từ trang danh sách hoặc trang chi tiết
* Thêm sản phẩm đã có trong giỏ → tăng số lượng thêm 1
* Điều chỉnh số lượng bằng nút +/−; tổng tiền cập nhật real-time
* Xóa từng sản phẩm; xóa toàn bộ giỏ với xác nhận
* Giỏ hàng lưu localStorage — không mất khi reload trang hoặc đóng trình duyệt

**Thuộc tính chất lượng — Performance [PERF] + Reliability [REL]:**
* Logic tính giá hoàn toàn client-side (Zustand) — không round-trip server
* Zustand `persist` middleware: giỏ hàng khôi phục tự động khi reload
* Chưa đăng nhập vẫn có thể thêm vào giỏ — yêu cầu đăng nhập khi checkout

---

### US-08 [USE]
**Story:** Là một Khách hàng, tôi muốn xem tóm tắt đơn hàng trong giỏ hàng bao gồm tạm tính, phí vận chuyển và tổng cộng trước khi thanh toán.

**Tiêu chí chấp nhận:**
* Tóm tắt: tạm tính (subtotal), phí vận chuyển (miễn phí nếu đạt ngưỡng), tổng cộng
* Tổng tiền cập nhật ngay khi thay đổi số lượng — không cần nhấn nút tính
* Nút "Tiến hành thanh toán" nổi bật (pink-600)
* Nếu giỏ trống: hiển thị empty state + nút "Tiếp tục mua sắm"

**Thuộc tính chất lượng — Usability [USE]:**
* Font tổng tiền ≥ 18px, bold, màu pink-600
* Sticky order summary sidebar trên desktop khi scroll danh sách sản phẩm

---

## MODULE 4: THANH TOÁN

### US-09 [REL]
**Story:** Là một Khách hàng, tôi muốn đặt hàng bằng cách nhập địa chỉ giao hàng và xác nhận đơn để hoàn tất mua sắm.

**Tiêu chí chấp nhận:**
* Form thanh toán: họ tên, số điện thoại (10 số), địa chỉ giao hàng (tỉnh/thành, quận/huyện, địa chỉ chi tiết)
* Validate inline từng field khi blur — không đợi submit
* Tóm tắt đơn hàng hiển thị bên cạnh form (sản phẩm, giá, tổng)
* Sau xác nhận: chuyển trạng thái đơn sang `PENDING`, redirect về trang chi tiết đơn hàng

**Thuộc tính chất lượng — Reliability [REL]:**
* Yêu cầu đăng nhập trước khi checkout — redirect `/login?redirect=/checkout`
* Idempotency: bấm "Đặt hàng" 2 lần không tạo 2 đơn trùng
* Tồn kho kiểm tra phía backend khi đặt hàng; nếu hết hàng → thông báo rõ

---

### US-10 [USE]
**Story:** Là một Khách hàng, tôi muốn nhập mã coupon tại trang thanh toán để được giảm giá theo chương trình khuyến mãi.

**Tiêu chí chấp nhận:**
* Ô nhập mã coupon + nút "Áp dụng" tại trang checkout
* Validate coupon ≤ 300ms (server): còn hiệu lực, chưa hết lượt, đạt min_order_value
* Hiển thị lý do cụ thể nếu coupon không hợp lệ (hết hạn / hết lượt / chưa đủ điều kiện)
* Tổng tiền cập nhật ngay sau khi áp dụng thành công

**Thuộc tính chất lượng — Usability [USE]:**
* Loading spinner nhỏ trong nút "Áp dụng" khi đang validate
* Nút xóa coupon đã áp dụng (×)

---

## MODULE 5: LỊCH SỬ ĐƠN HÀNG

### US-11 [USE]
**Story:** Là một Khách hàng đã đăng nhập, tôi muốn xem danh sách đơn hàng đã đặt và trạng thái của từng đơn để theo dõi quá trình giao hàng.

**Tiêu chí chấp nhận:**
* Danh sách đơn: mã đơn, ngày đặt, tổng tiền, trạng thái, ảnh thumbnail sản phẩm
* Lọc theo trạng thái: Tất cả / Chờ xác nhận / Đang xử lý / Đang giao / Đã giao / Đã hủy
* Phân trang server-side 10 đơn/trang; sắp xếp thời gian giảm dần
* Click vào đơn → xem chi tiết

**Thuộc tính chất lượng — Usability [USE]:**
* Status badge màu sắc rõ ràng (vàng: pending, xanh: delivered, đỏ: cancelled)
* Empty state khi chưa có đơn nào

---

### US-12 [USE]
**Story:** Là một Khách hàng, tôi muốn xem chi tiết một đơn hàng bao gồm sản phẩm đã mua, địa chỉ giao hàng và tổng tiền.

**Tiêu chí chấp nhận:**
* Chi tiết đơn: mã đơn, ngày đặt, địa chỉ giao hàng, danh sách sản phẩm (ảnh + tên + SL + đơn giá), coupon áp dụng (nếu có), tổng tiền
* Trạng thái đơn hàng timeline (Đặt hàng → Xác nhận → Đang giao → Đã giao)
* Nút "Hủy đơn" nếu đơn đang `PENDING` (chưa được xử lý)

**Thuộc tính chất lượng — Usability [USE]:**
* Snapshot sản phẩm tại thời điểm đặt — không thay đổi dù sản phẩm bị sửa sau đó
* URL shareable: `/orders/{id}` nhưng yêu cầu xác thực đúng chủ đơn

---

## MODULE 6: TRANG CHỦ & ĐIỀU HƯỚNG

### US-13 [USE] [PERF]
**Story:** Là một Khách hàng, tôi muốn thấy trang chủ hấp dẫn với sản phẩm nổi bật và danh mục để bắt đầu mua sắm ngay.

**Tiêu chí chấp nhận:**
* Hero section: tagline "Khám phá vẻ đẹp của bạn", CTA "Mua ngay" + "Xem khuyến mãi"
* Danh mục nổi bật: 4 danh mục (Chăm sóc da, Trang điểm, Nước hoa, Chăm sóc tóc)
* Sale banner: "Giảm đến 50% cho hàng trăm sản phẩm"
* Sản phẩm nổi bật / bán chạy (tối đa 8 sản phẩm)

**Thuộc tính chất lượng — Usability + Performance [USE] [PERF]:**
* Trang chủ load ≤ 2 giây (LCP)
* Ảnh hero tối ưu (Next.js Image, WebP, lazy loading)
* Responsive từ 375px (mobile) đến 1440px (wide desktop)

---

### US-14 [USE]
**Story:** Là một Khách hàng, tôi muốn điều hướng dễ dàng qua Navbar (logo, menu, giỏ hàng, tài khoản) để chuyển giữa các trang nhanh chóng.

**Tiêu chí chấp nhận:**
* Navbar sticky (luôn hiển thị khi scroll)
* Desktop: Logo | Links (Trang chủ, Sản phẩm, Khuyến mãi, Liên hệ) | Tìm kiếm | Giỏ hàng (với badge số lượng) | Đăng nhập/Tài khoản
* Mobile: Logo | Giỏ hàng | Hamburger menu (Sheet)
* Badge giỏ hàng cập nhật real-time khi thêm sản phẩm
* Khi đã đăng nhập: thay nút "Đăng nhập" bằng avatar/tên + dropdown (Tài khoản, Đơn hàng, Đăng xuất)

**Thuộc tính chất lượng — Usability [USE]:**
* Active state cho link đang active
* Giỏ hàng accessible từ mọi trang (không cần vào `/cart` để biết số lượng)

---

## TỔNG KẾT USER STORIES

| Mã US | Tên | QA | Module |
|-------|-----|----|----|
| US-01 | Đăng nhập | SEC | Auth |
| US-02 | Đăng ký tài khoản | USE | Auth |
| US-03 | Quản lý tài khoản | SEC | Auth |
| US-04 | Tìm kiếm & lọc sản phẩm | PERF | Catalog |
| US-05 | Chi tiết sản phẩm | USE | Catalog |
| US-06 | Trang khuyến mãi | USE | Catalog |
| US-07 | Giỏ hàng | PERF + REL | Cart |
| US-08 | Tóm tắt đơn hàng | USE | Cart |
| US-09 | Thanh toán & đặt hàng | REL | Checkout |
| US-10 | Áp dụng mã coupon | USE | Checkout |
| US-11 | Lịch sử đơn hàng | USE | Orders |
| US-12 | Chi tiết đơn hàng | USE | Orders |
| US-13 | Trang chủ | USE + PERF | Home |
| US-14 | Điều hướng (Navbar) | USE | Layout |

**QA attributes:** SEC (Security), USE (Usability), PERF (Performance), REL (Reliability)
