"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  BarChart2,
  Star,
} from "lucide-react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { reportService } from "@/services/report.service";
import type { DashboardData } from "@/types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  trend?: number;
  accent?: "rose" | "champagne" | "espresso" | "success";
}

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  accent = "rose",
}: KPICardProps) {
  const accentColors = {
    rose: "var(--cela-rose)",
    champagne: "var(--cela-champagne)",
    espresso: "var(--cela-espresso)",
    success: "var(--cela-success)",
  };
  const accentBgs = {
    rose: "rgba(183,110,121,0.1)",
    champagne: "rgba(201,168,122,0.14)",
    espresso: "rgba(60,46,42,0.08)",
    success: "rgba(107,142,106,0.12)",
  };
  const color = accentColors[accent];
  const bg = accentBgs[accent];

  return (
    <div
      style={{
        background: "var(--cela-paper)",
        border: "1px solid var(--cela-mist)",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "var(--cela-shadow-soft)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--cela-cocoa)",
            margin: 0,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: bg,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
      </div>
      <p
        style={{
          fontFamily: "var(--cela-display)",
          fontSize: 28,
          fontWeight: 600,
          color: "var(--cela-espresso)",
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      {(trend !== undefined || sub) && (
        <p
          style={{
            fontSize: 12,
            marginTop: 8,
            margin: "8px 0 0",
            display: "flex",
            alignItems: "center",
            gap: 4,
            color:
              trend !== undefined
                ? trend >= 0
                  ? "var(--cela-success)"
                  : "var(--cela-danger)"
                : "var(--cela-stone)",
          }}
        >
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp style={{ width: 13, height: 13 }} />
              ) : (
                <TrendingDown style={{ width: 13, height: 13 }} />
              )}
              <span>{Math.abs(trend)}% so với hôm qua</span>
            </>
          )}
          {sub && !trend && (
            <span style={{ color: "var(--cela-stone)" }}>{sub}</span>
          )}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportService
      .getDashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setIsLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("vi-VN", { dateStyle: "full" });

  return (
    <ERPLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                margin: "0 0 4px",
              }}
            >
              Tổng quan
            </p>
            <h1
              style={{
                fontFamily: "var(--cela-display)",
                fontSize: 28,
                fontWeight: 500,
                color: "var(--cela-espresso)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Dashboard{" "}
              <span style={{ fontStyle: "italic", color: "var(--cela-rose)" }}>
                hệ thống
              </span>
            </h1>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--cela-stone)",
              fontFamily: "var(--cela-mono)",
            }}
          >
            {today}
          </p>
        </div>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "64px 0",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "2px solid var(--cela-mist)",
                borderTopColor: "var(--cela-rose)",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 16,
              }}
            >
              <KPICard
                label="Doanh thu hôm nay"
                value={formatVND(dashboard?.totalRevenue ?? 0)}
                accent="rose"
                icon={DollarSign}
                trend={dashboard?.revenueGrowth}
              />
              <KPICard
                label="Số đơn hàng"
                value={String(dashboard?.totalOrders ?? 0)}
                accent="espresso"
                icon={ShoppingBag}
              />
              <KPICard
                label="Giá trị đơn TB"
                value={formatVND(dashboard?.averageOrderValue ?? 0)}
                accent="champagne"
                icon={BarChart2}
              />
              <KPICard
                label="Tăng trưởng"
                value={`${dashboard?.revenueGrowth ?? 0}%`}
                accent="success"
                icon={TrendingUp}
                trend={dashboard?.revenueGrowth}
              />
            </div>

            {/* Middle row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: 16,
              }}
            >
              {/* Top products */}
              <div
                style={{
                  background: "var(--cela-paper)",
                  border: "1px solid var(--cela-mist)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  boxShadow: "var(--cela-shadow-soft)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <Star
                    style={{
                      width: 15,
                      height: 15,
                      color: "var(--cela-champagne)",
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: "var(--cela-display)",
                      fontSize: 18,
                      fontWeight: 500,
                      color: "var(--cela-espresso)",
                      margin: 0,
                    }}
                  >
                    Sản phẩm bán chạy
                  </h3>
                </div>
                {dashboard?.topProducts?.length ? (
                  <ol
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {dashboard.topProducts.slice(0, 5).map((p, i) => (
                      <li
                        key={p.productId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          paddingTop: i > 0 ? 10 : 0,
                          borderTop:
                            i > 0 ? "1px solid var(--cela-fog)" : "none",
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              i === 0
                                ? "rgba(201,168,122,0.18)"
                                : "var(--cela-fog)",
                            color:
                              i === 0
                                ? "var(--cela-gold)"
                                : "var(--cela-stone)",
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--cela-espresso)",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.productName}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--cela-stone)",
                              margin: "2px 0 0",
                              fontFamily: "var(--cela-mono)",
                            }}
                          >
                            {p.soldQty} đã bán
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--cela-stone)",
                      margin: 0,
                    }}
                  >
                    Chưa có dữ liệu
                  </p>
                )}
              </div>

              {/* Revenue chart placeholder */}
              <div
                style={{
                  background: "var(--cela-paper)",
                  border: "1px solid var(--cela-mist)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  boxShadow: "var(--cela-shadow-soft)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--cela-display)",
                    fontSize: 18,
                    fontWeight: 500,
                    color: "var(--cela-espresso)",
                    margin: "0 0 16px",
                  }}
                >
                  Doanh thu{" "}
                  <span
                    style={{ fontStyle: "italic", color: "var(--cela-rose)" }}
                  >
                    7 ngày qua
                  </span>
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 160,
                    background: "var(--cela-ivory)",
                    borderRadius: 10,
                    color: "var(--cela-stone)",
                    fontSize: 13,
                    fontFamily: "var(--cela-mono)",
                  }}
                >
                  Biểu đồ doanh thu (cần Recharts)
                </div>
              </div>
            </div>

            {/* Alerts panel */}
            <div
              style={{
                background: "var(--cela-paper)",
                border: "1px solid var(--cela-mist)",
                borderRadius: 16,
                padding: "20px 24px",
                boxShadow: "var(--cela-shadow-soft)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--cela-display)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--cela-espresso)",
                  margin: "0 0 12px",
                }}
              >
                Cảnh báo hệ thống
              </h3>
              <p
                style={{ fontSize: 13, color: "var(--cela-stone)", margin: 0 }}
              >
                Không có cảnh báo nào.
              </p>
            </div>
          </>
        )}
      </div>
    </ERPLayout>
  );
}
