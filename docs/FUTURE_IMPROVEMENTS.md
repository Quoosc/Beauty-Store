# BeautyERP — Cải tiến tương lai (Backend cần bổ sung)

> **Ngày tạo:** 2026-05-17  
> **Trạng thái:** Đây là danh sách các tính năng FE đã thiết kế UI nhưng **backend chưa có endpoint** tương ứng. Mỗi mục cần backend implement trước, sau đó FE bỏ comment `// TODO` và bật lại.

---

## 1. Lịch sử điểm Loyalty (M2) 🔴 Cao

**Tính năng:** Khách hàng xem lịch sử tích điểm / đổi điểm theo thời gian.

**Endpoint cần thêm vào `loyalty-promotion-service`:**
```
GET /api/v1/loyalty-promotion/members/{id}/points-history
  ?page=1&size=20&type=EARN|REDEEM|REFUND
  → 200: Page<PointsTransactionResponse>
```

**Response mẫu:**
```json
{
  "content": [
    {
      "id": "uuid",
      "type": "EARN",
      "points": 150,
      "orderId": "uuid",
      "description": "Tích điểm từ đơn hàng #ORD-20260517-001",
      "createdAt": "2026-05-17T10:30:00"
    }
  ],
  "totalElements": 42,
  "totalPages": 3
}
```

**FE đã làm:** Tab "Lịch sử điểm" trong màn hình thành viên loyalty đang bị ẩn (`// TODO: re-enable when BE has /points-history`). Chỉ cần bật lại sau khi BE có endpoint.

**DB:** Bảng `points_transactions` đã có dữ liệu — chỉ cần thêm controller + service layer.

---

## 2. Sửa / Vô hiệu hóa Coupon (M3) 🟡 Trung bình

**Tính năng:** Admin có thể chỉnh sửa thông tin coupon hoặc deactivate coupon trước khi hết hạn.

**Endpoints cần thêm vào `loyalty-promotion-service`:**
```
PUT  /api/v1/loyalty-promotion/coupons/{id}
  Body: { maxUsageTotal?, endDate?, isActive? }
  → 200: CouponResponse

DELETE /api/v1/loyalty-promotion/coupons/{id}
  → 200: void (soft-delete: is_active = false)
```

**Lưu ý thiết kế:**
- Không được giảm `maxUsageTotal` xuống dưới `usedCount` hiện tại.
- Deactivate coupon không hoàn tiền cho người đã dùng.
- Cần audit log cho thao tác này.

**FE đã làm:** Nút "Sửa" và "Xóa" trong bảng coupon đang bị ẩn. Service methods đã bị remove.

---

## 3. Sửa Promotion (M4) 🟡 Trung bình

**Tính năng:** Admin/Manager chỉnh sửa tên, giá trị giảm, ngày kết thúc của một promotion đang active.

**Endpoint cần thêm vào `loyalty-promotion-service`:**
```
PUT /api/v1/loyalty-promotion/promotions/{id}
  Body: { name?, discountValue?, endDate? }
  → 200: PromotionResponse
```

**Lưu ý thiết kế:**
- Không cho phép đổi `type` (PERCENTAGE ↔ FIXED_AMOUNT) sau khi tạo.
- Không cho phép đổi `branchId`.
- Validation: `discountValue` ≤ 100 nếu type PERCENTAGE.

**FE đã làm:** Nút "Sửa" trong bảng promotion đang ẩn.

---

## 4. Xem Returns theo Order (M6) 🟡 Trung bình

**Tính năng:** Từ chi tiết một đơn hàng, xem tất cả lần trả hàng liên quan.

**Endpoint cần thêm vào `order-service`:**
```
GET /api/v1/order/returns/order/{orderId}
  → 200: List<ReturnTransactionResponse>
```

**Lưu ý thiết kế:**
- `orderId` không phải `returnId` — cần tìm theo `original_order_id`.
- CASHIER chỉ xem returns của đơn trong ca của mình.
- BRANCH_MANAGER xem returns của toàn chi nhánh.

**FE đã làm:** Link "Xem trả hàng" trong màn hình chi tiết đơn đang bị ẩn.

---

## 5. ~~Cảnh báo ngưỡng điều chỉnh kho (M7)~~ ✅ ĐÃ HOÀN THÀNH

> **Ngày hoàn thành:** 2026-05-18

**Tính năng:** FE hiển thị cảnh báo cho user trước khi submit adjustment lớn: *"Điều chỉnh này vượt ngưỡng X% tồn kho và cần Branch Manager duyệt"*.

**Trạng thái:** ✅ **Đã implement đầy đủ tại `src/app/inventory/adjustments/page.tsx`.**

- Khi load trang: gọi `systemConfigService.getByKey("inventory.large_adjustment_percent")` để lấy ngưỡng thực tế từ backend.
- Khi user nhập số lượng: tính `adjustmentPercent = quantity / currentStock * 100`, so sánh với ngưỡng.
- Nếu vượt ngưỡng: hiển thị banner cảnh báo "Cần Manager duyệt" màu vàng; nhãn nút đổi thành "Gửi yêu cầu duyệt".
- Nếu không vượt ngưỡng: submit và thực thi ngay.
- Fallback: nếu API system-config lỗi, dùng ngưỡng mặc định 10%.

---

## Tóm tắt ưu tiên

| # | Tính năng | Effort BE | Effort FE | Priority |
|---|-----------|-----------|-----------|---------|
| M2 | Lịch sử điểm loyalty | Thấp (DB có sẵn) | Thấp (UI đã có) | 🔴 Cao |
| M6 | Returns theo order | Thấp | Thấp | 🟡 Trung bình |
| M3 | Sửa/xóa coupon | Trung bình | Thấp | 🟡 Trung bình |
| M4 | Sửa promotion | Trung bình | Thấp | 🟡 Trung bình |
| ~~M7~~ | ~~Warning ngưỡng adjustment~~ | ~~Không cần~~ | ~~Thấp~~ | ~~🟠 Thấp~~ ✅ |

> **Khuyến nghị bắt đầu với M2** — DB đã có đầy đủ data, BE chỉ cần expose endpoint, FE UI đã thiết kế sẵn, giá trị UX cao nhất (khách hàng xem được lịch sử điểm).
>
> **Lưu ý 2026-05-18:** M7 đã hoàn thành. Còn lại 4 mục cần backend (M2, M3, M4, M6).
