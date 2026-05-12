"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore, ROLE_REDIRECT } from "@/stores/auth.store";
import { CelaLogo } from "@/components/ui/cela-logo";
import { CelaButton, CelaInput } from "@/components/ui/cela-primitives";

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "M?t kh?u ph?i c� �t nh?t 8 k� t?";
  if (!/[A-Z]/.test(pwd)) return "Ph?i c� �t nh?t 1 ch? hoa";
  if (!/[a-z]/.test(pwd)) return "Ph?i c� �t nh?t 1 ch? thu?ng";
  if (!/[0-9]/.test(pwd)) return "Ph?i c� �t nh?t 1 ch? s?";
  return null;
}

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const errs: typeof errors = {};
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) errs.newPassword = pwdErr;
    if (newPassword !== confirmPassword)
      errs.confirmPassword = "M?t kh?u x�c nh?n kh�ng kh?p";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsLoading(true);
      await authService.changePassword("", newPassword);
      toast.success("�� d?t m?t kh?u th�nh c�ng!");
      const redirectPath = user ? ROLE_REDIRECT[user.role] : "/login";
      router.push(redirectPath);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      toast.error(message || "�?t m?t kh?u th?t b?i");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cela-ivory)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--cela-paper)",
          borderRadius: 20,
          padding: 40,
          border: "1px solid var(--cela-mist)",
          boxShadow: "var(--cela-shadow-md)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <CelaLogo size={36} showWord={false} />
        </div>

        <h1
          style={{
            fontFamily: "var(--cela-display)",
            fontSize: 26,
            fontWeight: 500,
            color: "var(--cela-espresso)",
            margin: 0,
          }}
        >
          �?t m?t kh?u m?i
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--cela-stone)",
            margin: "6px 0 0",
            lineHeight: 1.5,
          }}
        >
          ��y l� l?n dang nh?p d?u ti�n. Vui l�ng d?t m?t kh?u d? b?o m?t t�i
          kho?n.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ marginTop: 22, display: "grid", gap: 16 }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                margin: "0 0 8px",
              }}
            >
              M?t kh?u m?i
            </p>
            <div style={{ position: "relative" }}>
              <CelaInput
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={validate}
                placeholder="Nh?p m?t kh?u m?i"
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: 0,
                  background: "transparent",
                  color: "var(--cela-stone)",
                  cursor: "pointer",
                }}
              >
                {showNew ? (
                  <EyeOff style={{ width: 15, height: 15 }} />
                ) : (
                  <Eye style={{ width: 15, height: 15 }} />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--cela-danger)",
                  margin: "4px 0 0",
                }}
              >
                {errors.newPassword}
              </p>
            )}
          </div>

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                margin: "0 0 8px",
              }}
            >
              X�c nh?n m?t kh?u m?i
            </p>
            <div style={{ position: "relative" }}>
              <CelaInput
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={validate}
                placeholder="Nh?p l?i m?t kh?u m?i"
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: 0,
                  background: "transparent",
                  color: "var(--cela-stone)",
                  cursor: "pointer",
                }}
              >
                {showConfirm ? (
                  <EyeOff style={{ width: 15, height: 15 }} />
                ) : (
                  <Eye style={{ width: 15, height: 15 }} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--cela-danger)",
                  margin: "4px 0 0",
                }}
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <CelaButton
            type="submit"
            variant="primary"
            disabled={isLoading}
            style={{ width: "100%", height: 44, marginTop: 4 }}
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                �ang x? l�...
              </>
            ) : (
              "�?t m?t kh?u"
            )}
          </CelaButton>
        </form>
      </div>
    </div>
  );
}
