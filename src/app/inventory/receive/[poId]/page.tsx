"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import type { PurchaseOrder, POItem } from "@/types";
import {
  CelaButton,
  CelaCard,
  CelaEmptyState,
  CelaInput,
  CelaPageHeader,
  CelaSpinner,
} from "@/components/ui/cela-primitives";
export default function ReceiveGoodsPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.poId as string;
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receivedQty, setReceivedQty] = useState<Record<string, number>>({});
  const [lotNumbers, setLotNumbers] = useState<Record<string, string>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const nextThirty = new Date(now);
  nextThirty.setDate(now.getDate() + 30);
  const thirtyDaysLater = nextThirty.toISOString().split("T")[0];
  useEffect(() => {
    purchaseOrderService
      .getById(poId)
      .then((data) => {
        if (data.status !== "CONFIRMED") {
          toast.error("Chỉ có thể nhận hàng cho PO đã xác nhận");
          router.back();
          return;
        }
        setPO(data);
        const initQty: Record<string, number> = {};
        data.items.forEach((item) => {
          initQty[item.productId] = item.orderedQty;
        });
        setReceivedQty(initQty);
      })
      .catch(() => {
        toast.error("Không tìm thấy Purchase Order");
        router.back();
      })
      .finally(() => setIsLoading(false));
  }, [poId]);
  async function handleSubmit() {
    if (!po) return;
    for (const item of po.items) {
      const qty = receivedQty[item.productId] ?? 0;
      if (qty < 0 || qty > item.orderedQty) {
        toast.error(`Số lượng nhận của ${item.productName} không hợp lệ`);
        return;
      }
      const exp = expiryDates[item.productId];
      if (exp && exp <= today) {
        toast.error(
          `Ngày hết hạn của ${item.productName} phải là ngày trong tương lai`,
        );
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const items = po.items.map((item) => ({
        productId: item.productId,
        receivedQty: receivedQty[item.productId] ?? 0,
        lotNumber: lotNumbers[item.productId] || undefined,
        expiryDate: expiryDates[item.productId] || undefined,
      }));
      await purchaseOrderService.receive(poId, items);
      toast.success("Đã nhận hàng thành công!");
      router.push("/inventory/purchase-orders");
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;
      toast.error(msg || "Nhận hàng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }
  if (isLoading) {
    return (
      <ERPLayout>
        {" "}
        <CelaSpinner />{" "}
      </ERPLayout>
    );
  }
  if (!po) {
    return (
      <ERPLayout>
        {" "}
        <CelaEmptyState title="Không tìm thấy Purchase Order" />{" "}
      </ERPLayout>
    );
  }
  const hasPartial = po.items.some(
    (item) => (receivedQty[item.productId] ?? 0) < item.orderedQty,
  );
  return (
    <ERPLayout>
      {" "}
      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {" "}
        <CelaPageHeader
          eyebrow="Kho hàng"
          title="Nhận hàng"
          actions={
            <CelaButton variant="secondary" onClick={() => router.back()}>
              {" "}
              <ArrowLeft
                style={{
                  width: 14,
                  height: 14,
                }}
              />{" "}
              Quay lại{" "}
            </CelaButton>
          }
        />{" "}
        <CelaCard>
          {" "}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {" "}
            <PackageCheck
              style={{
                width: 18,
                height: 18,
                color: "var(--cela-rose)",
              }}
            />{" "}
            <p
              style={{
                margin: 0,
                fontFamily: "var(--cela-display)",
                fontSize: 18,
                color: "var(--cela-espresso)",
              }}
            >
              {" "}
              PO #{po.id.slice(-8).toUpperCase()}{" "}
            </p>{" "}
          </div>{" "}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
              fontSize: 13,
            }}
          >
            {" "}
            <div>
              {" "}
              <p
                style={{
                  margin: "0 0 4px",
                  color: "var(--cela-stone)",
                }}
              >
                Nhà cung cấp
              </p>{" "}
              <p
                style={{
                  margin: 0,
                  color: "var(--cela-espresso)",
                  fontWeight: 600,
                }}
              >
                {po.supplier?.name}
              </p>{" "}
            </div>{" "}
            <div>
              {" "}
              <p
                style={{
                  margin: "0 0 4px",
                  color: "var(--cela-stone)",
                }}
              >
                Ngày tạo
              </p>{" "}
              <p
                style={{
                  margin: 0,
                  color: "var(--cela-espresso)",
                  fontFamily: "var(--cela-mono)",
                }}
              >
                {" "}
                {new Date(po.createdAt).toLocaleDateString("vi-VN")}{" "}
              </p>{" "}
            </div>{" "}
            <div>
              {" "}
              <p
                style={{
                  margin: "0 0 4px",
                  color: "var(--cela-stone)",
                }}
              >
                Trạng thái
              </p>{" "}
              <p
                style={{
                  margin: 0,
                  color: "var(--cela-success)",
                  fontWeight: 600,
                }}
              >
                Đã xác nhận
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </CelaCard>{" "}
        {hasPartial && (
          <div
            style={{
              background: "rgba(201,168,122,0.14)",
              border: "1px solid rgba(201,168,122,0.4)",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            {" "}
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--cela-cocoa)",
              }}
            >
              {" "}
              Nhận thiếu — Manager sẽ nhận thông báo.{" "}
            </p>{" "}
          </div>
        )}{" "}
        <CelaCard
          style={{
            padding: 0,
            overflow: "hidden",
          }}
        >
          {" "}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            {" "}
            <thead>
              {" "}
              <tr
                style={{
                  background: "var(--cela-fog)",
                  borderBottom: "1px solid var(--cela-mist)",
                }}
              >
                {" "}
                <th
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--cela-cocoa)",
                  }}
                >
                  Sản phẩm
                </th>{" "}
                <th
                  style={{
                    padding: "10px 16px",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--cela-cocoa)",
                  }}
                >
                  SL đặt
                </th>{" "}
                <th
                  style={{
                    padding: "10px 16px",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--cela-cocoa)",
                  }}
                >
                  SL nhận
                </th>{" "}
                <th
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--cela-cocoa)",
                  }}
                >
                  Số lô
                </th>{" "}
                <th
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--cela-cocoa)",
                  }}
                >
                  Hạn sử dụng
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody>
              {" "}
              {po.items.map((item: POItem) => {
                const qty = receivedQty[item.productId] ?? 0;
                const expDate = expiryDates[item.productId] ?? "";
                const expiryWarning =
                  expDate && expDate > today && expDate < thirtyDaysLater;
                return (
                  <tr
                    key={item.productId}
                    style={{
                      borderBottom: "1px solid var(--cela-fog)",
                    }}
                  >
                    {" "}
                    <td
                      style={{
                        padding: "12px 16px",
                      }}
                    >
                      {" "}
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--cela-espresso)",
                        }}
                      >
                        {item.productName}
                      </p>{" "}
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 11,
                          color: "var(--cela-stone)",
                          fontFamily: "var(--cela-mono)",
                        }}
                      >
                        {item.lotNumber ?? "-"}
                      </p>{" "}
                    </td>{" "}
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: 13,
                        color: "var(--cela-espresso)",
                        fontFamily: "var(--cela-mono)",
                      }}
                    >
                      {item.orderedQty}
                    </td>{" "}
                    <td
                      style={{
                        padding: "12px 16px",
                      }}
                    >
                      {" "}
                      <CelaInput
                        type="number"
                        value={qty}
                        onChange={(e) =>
                          setReceivedQty((prev) => ({
                            ...prev,
                            [item.productId]: Number(e.target.value),
                          }))
                        }
                        min="0"
                        max={item.orderedQty}
                        style={{
                          width: 76,
                          height: 36,
                          textAlign: "center",
                          margin: "0 auto",
                          fontFamily: "var(--cela-mono)",
                        }}
                      />{" "}
                    </td>{" "}
                    <td
                      style={{
                        padding: "12px 16px",
                      }}
                    >
                      {" "}
                      <CelaInput
                        value={lotNumbers[item.productId] ?? ""}
                        onChange={(e) =>
                          setLotNumbers((prev) => ({
                            ...prev,
                            [item.productId]: e.target.value,
                          }))
                        }
                        placeholder="LOT-001"
                        style={{
                          height: 36,
                        }}
                      />{" "}
                    </td>{" "}
                    <td
                      style={{
                        padding: "12px 16px",
                      }}
                    >
                      {" "}
                      <CelaInput
                        type="date"
                        value={expDate}
                        onChange={(e) =>
                          setExpiryDates((prev) => ({
                            ...prev,
                            [item.productId]: e.target.value,
                          }))
                        }
                        min={today}
                        style={{
                          height: 36,
                        }}
                      />{" "}
                      {expiryWarning && (
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            color: "var(--cela-gold)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {" "}
                          <AlertTriangle
                            style={{
                              width: 11,
                              height: 11,
                            }}
                          />{" "}
                          Gần hết hạn{" "}
                        </p>
                      )}{" "}
                    </td>{" "}
                  </tr>
                );
              })}{" "}
            </tbody>{" "}
          </table>{" "}
        </CelaCard>{" "}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {" "}
          <CelaButton variant="secondary" onClick={() => router.back()}>
            Hủy
          </CelaButton>{" "}
          <CelaButton
            variant="rose"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {" "}
            {isSubmitting ? "Đang xử lý..." : "Xác nhận nhận hàng"}{" "}
          </CelaButton>{" "}
        </div>{" "}
      </div>{" "}
    </ERPLayout>
  );
}
