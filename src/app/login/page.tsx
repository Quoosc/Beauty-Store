"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, ROLE_REDIRECT } from "@/stores/auth.store";
import { toast } from "sonner";
import { Eye, EyeOff, Building2, Store, CreditCard, Warehouse } from "lucide-react";
import { CelaLogo } from "@/components/ui/cela-logo";

const DEMO_ACCOUNTS = [
  {
    role: "ADMIN" as const,
    username: "admin",
    password: "Admin@123",
    description: "Toàn quyền hệ thống",
    labelVi: "Quản trị viên",
    Icon: Building2,
  },
  {
    role: "BRANCH_MANAGER" as const,
    username: "manager",
    password: "Manager@123",
    description: "Quản lý chi nhánh",
    labelVi: "Quản lý CN",
    Icon: Store,
  },
  {
    role: "CASHIER" as const,
    username: "cashier",
    password: "Cashier@123",
    description: "Thu ngân & POS",
    labelVi: "Thu ngân",
    Icon: CreditCard,
  },
  {
    role: "WAREHOUSE_STAFF" as const,
    username: "warehouse",
    password: "Warehouse@123",
    description: "Kho & nhập hàng",
    labelVi: "Nhân viên kho",
    Icon: Warehouse,
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(username, password);
      setFailedAttempts(0);
      toast.success("Dang nhap thanh cong!");
      if (user.forceChangePassword) {
        router.push("/force-change-password");
      } else {
        router.push(ROLE_REDIRECT[user.role]);
      }
    } catch (err: unknown) {
      const status =
        (err as { response?: { status?: number } })?.response?.status ?? 0;
      const backendMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "";

      if (status === 423 || backendMessage.toLowerCase().includes("lock")) {
        setError("Tài khoản bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.");
        return;
      }

      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      const remaining = Math.max(0, 5 - nextAttempts);
      setError(
        remaining > 0
          ? `Sai tên đăng nhập hoặc mật khẩu. Còn ${remaining} lần thử.`
          : "Sai tên đăng nhập hoặc mật khẩu."
      );
    }
  };

  const handleDemoClick = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setError("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* LEFT — editorial poster */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(160deg, #ead4d7 0%, #f3e3e5 40%, #c9a87a 120%)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: 48,
        }}
        className="hidden lg:flex"
      >
        {/* Large decorative C */}
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 80,
            fontFamily: "var(--cela-display)",
            fontSize: 240,
            fontStyle: "italic",
            color: "rgba(60,46,42,0.06)",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          C
        </div>

        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            right: -60,
            bottom: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), transparent 60%)",
            border: "1px solid rgba(255,255,255,0.55)",
          }}
        />

        {/* Top: Logo */}
        <CelaLogo size={40} color="var(--cela-espresso)" accent="var(--cela-rose-deep)" />

        {/* Center: editorial headline */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--cela-rose-deep)",
              marginBottom: 16,
            }}
          >
            Édition · Printemps 2026
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--cela-display)",
              fontSize: 62,
              lineHeight: 1.06,
              fontWeight: 500,
              color: "var(--cela-espresso)",
              letterSpacing: "-0.02em",
              maxWidth: 480,
            }}
          >
            Vẻ đẹp{" "}
            <span style={{ fontStyle: "italic", color: "var(--cela-rose-deep)" }}>
              được nâng niu
            </span>
            <br />
            trong từng chi tiết.
          </h1>
          <p
            style={{
              marginTop: 22,
              maxWidth: 420,
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--cela-cocoa)",
            }}
          >
            Hệ thống quản trị dành cho chuỗi cửa hàng mỹ phẩm. Đăng nhập để tiếp tục với hành trình của bạn.
          </p>

          {/* Demo accounts */}
          <div style={{ marginTop: 40 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                marginBottom: 12,
              }}
            >
              Tài khoản demo
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.Icon;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleDemoClick(account)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.45)",
                      border: "1px solid rgba(255,255,255,0.6)",
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 140ms",
                      backdropFilter: "blur(4px)",
                    }}
                    className="hover:bg-white/60"
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(60,46,42,0.08)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: 15, height: 15, color: "var(--cela-espresso)" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--cela-espresso)",
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        {account.labelVi}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--cela-cocoa)",
                          margin: 0,
                          fontFamily: "var(--cela-mono)",
                          marginTop: 2,
                        }}
                      >
                        {account.username}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: city tags */}
        <div
          style={{
            display: "flex",
            gap: 24,
            fontSize: 11,
            color: "var(--cela-cocoa)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span>Sài Gòn</span>
          <span>Hà Nội</span>
          <span>Đà Nẵng</span>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--cela-paper)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 56px",
        }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <CelaLogo size={32} />
        </div>

        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--cela-cocoa)",
            marginBottom: 8,
          }}
        >
          Welcome back
        </p>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--cela-display)",
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            marginBottom: 6,
            color: "var(--cela-espresso)",
          }}
        >
          Đăng nhập{" "}
          <span style={{ fontStyle: "italic", color: "var(--cela-rose)" }}>tài khoản</span>
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--cela-cocoa)",
            marginBottom: 32,
          }}
        >
          Chọn vai trò sau khi xác thực thành công.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Username */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                marginBottom: 8,
              }}
            >
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${error ? "var(--cela-danger)" : "var(--cela-mist)"}`,
                background: "var(--cela-paper)",
                fontSize: 14,
                fontFamily: "var(--cela-sans)",
                color: "var(--cela-espresso)",
                outline: "none",
                transition: "border-color 160ms",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--cela-rose)"; e.target.style.boxShadow = "0 0 0 3px rgba(183,110,121,0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = error ? "var(--cela-danger)" : "var(--cela-mist)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                marginBottom: 8,
              }}
            >
              Mật khẩu
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                style={{
                  width: "100%",
                  padding: "10px 44px 10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${error ? "var(--cela-danger)" : "var(--cela-mist)"}`,
                  background: "var(--cela-paper)",
                  fontSize: 14,
                  fontFamily: "var(--cela-sans)",
                  color: "var(--cela-espresso)",
                  outline: "none",
                  transition: "border-color 160ms",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--cela-rose)"; e.target.style.boxShadow = "0 0 0 3px rgba(183,110,121,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = error ? "var(--cela-danger)" : "var(--cela-mist)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "var(--cela-stone)",
                  display: "flex",
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                background: "rgba(176,72,72,0.08)",
                border: "1px solid rgba(176,72,72,0.2)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--cela-danger)",
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Quick-fill demo buttons (compact grid) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.Icon;
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleDemoClick(account)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    background: "var(--cela-ivory)",
                    border: "1px solid var(--cela-mist)",
                    borderLeft: "3px solid var(--cela-rose)",
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 140ms",
                  }}
                  className="hover:bg-cela-cream"
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: "rgba(183,110,121,0.1)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: 13, height: 13, color: "var(--cela-rose)" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "var(--cela-espresso)",
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {account.labelVi}
                    </p>
                    <p
                      style={{
                        fontSize: 10.5,
                        color: "var(--cela-stone)",
                        margin: 0,
                        fontFamily: "var(--cela-mono)",
                        marginTop: 1,
                      }}
                    >
                      {account.username}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 10,
              border: 0,
              background: "var(--cela-espresso)",
              color: "#fdf8f3",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--cela-sans)",
              letterSpacing: "0.04em",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.65 : 1,
              transition: "background 160ms",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            className="hover:bg-cela-espresso/90"
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                <span>Đang đăng nhập…</span>
              </>
            ) : (
              "Tiếp tục →"
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid var(--cela-fog)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--cela-stone)",
              marginBottom: 10,
            }}
          >
            Vai trò khả dụng
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <span
                key={a.role}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: "var(--cela-cream)",
                  color: "var(--cela-espresso)",
                }}
              >
                {a.labelVi}
              </span>
            ))}
          </div>
        </div>

        <p
          style={{
            fontSize: 11,
            color: "var(--cela-stone-soft)",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Hỗ trợ kỹ thuật:{" "}
          <span style={{ fontFamily: "var(--cela-mono)", color: "var(--cela-cocoa)" }}>
            1900 6363
          </span>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
