"use client";

import type { CSSProperties, ReactNode } from "react";

export const CELA_STATUS_STYLE: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  COMPLETED: {
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
    label: "Hoàn thành",
  },
  OPEN: {
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
    label: "Đang mở",
  },
  ACTIVE: {
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
    label: "Đang bán",
  },
  CONFIRMED: {
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
    label: "Đã xác nhận",
  },
  FULLY_RECEIVED: {
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
    label: "Nhận đủ",
  },
  APPROVED: {
    bg: "rgba(107,142,106,0.15)",
    color: "var(--cela-success)",
    label: "Đã duyệt",
  },
  PENDING: {
    bg: "rgba(201,168,122,0.20)",
    color: "var(--cela-gold)",
    label: "Chờ duyệt",
  },
  PARTIALLY_RECEIVED: {
    bg: "rgba(201,168,122,0.20)",
    color: "var(--cela-gold)",
    label: "Nhận thiếu",
  },
  SUBMITTED: {
    bg: "rgba(201,168,122,0.20)",
    color: "var(--cela-gold)",
    label: "Đã gửi",
  },
  CANCELLED: {
    bg: "rgba(183,110,121,0.15)",
    color: "var(--cela-danger)",
    label: "Đã hủy",
  },
  DISCONTINUED: {
    bg: "rgba(183,110,121,0.15)",
    color: "var(--cela-danger)",
    label: "Ngừng bán",
  },
  REJECTED: {
    bg: "rgba(183,110,121,0.15)",
    color: "var(--cela-danger)",
    label: "Từ chối",
  },
  CLOSED: {
    bg: "rgba(158,142,128,0.15)",
    color: "var(--cela-stone)",
    label: "Đã đóng",
  },
  LOCKED: {
    bg: "rgba(183,110,121,0.15)",
    color: "var(--cela-danger)",
    label: "Đã khóa",
  },
  INACTIVE: {
    bg: "rgba(158,142,128,0.15)",
    color: "var(--cela-stone)",
    label: "Không hoạt động",
  },
};

export function CelaPageHeader({
  eyebrow,
  title,
  accent,
  actions,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
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
          {eyebrow}
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
          {title}
          {accent && (
            <span style={{ fontStyle: "italic", color: "var(--cela-rose)" }}>
              {" "}
              {accent}
            </span>
          )}
        </h1>
      </div>
      {actions}
    </div>
  );
}

export function CelaCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--cela-paper)",
        border: "1px solid var(--cela-mist)",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "var(--cela-shadow-soft)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type ButtonVariant =
  | "primary"
  | "secondary"
  | "rose"
  | "danger"
  | "success"
  | "ghost";

const buttonStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--cela-espresso)",
    color: "#fff",
    border: 0,
  },
  secondary: {
    background: "var(--cela-ivory)",
    color: "var(--cela-espresso)",
    border: "1px solid var(--cela-mist)",
  },
  rose: {
    background: "var(--cela-rose)",
    color: "#fff",
    border: 0,
  },
  danger: {
    background: "var(--cela-danger)",
    color: "#fff",
    border: 0,
  },
  success: {
    background: "var(--cela-success)",
    color: "#fff",
    border: 0,
  },
  ghost: {
    background: "transparent",
    color: "var(--cela-stone)",
    border: 0,
  },
};

export function CelaButton({
  variant = "primary",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      style={{
        borderRadius: 10,
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 600,
        cursor: props.disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        opacity: props.disabled ? 0.5 : 1,
        ...buttonStyles[variant],
        ...style,
      }}
    />
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function CelaInput({ style, ...props }: InputProps) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "9px 12px",
        border: "1px solid var(--cela-mist)",
        borderRadius: 8,
        fontSize: 13,
        color: "var(--cela-espresso)",
        background: "var(--cela-ivory)",
        outline: "none",
        fontFamily: "var(--cela-body, var(--cela-sans))",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--cela-rose)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,110,121,0.12)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--cela-mist)";
        e.currentTarget.style.boxShadow = "none";
        props.onBlur?.(e);
      }}
    />
  );
}

export function CelaSelect({
  style,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: "9px 12px",
        border: "1px solid var(--cela-mist)",
        borderRadius: 8,
        fontSize: 13,
        color: "var(--cela-espresso)",
        background: "var(--cela-ivory)",
        outline: "none",
        cursor: "pointer",
        fontFamily: "var(--cela-body, var(--cela-sans))",
        ...style,
      }}
    />
  );
}

export function CelaTextArea({
  style,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        padding: "9px 12px",
        border: "1px solid var(--cela-mist)",
        borderRadius: 8,
        fontSize: 13,
        color: "var(--cela-espresso)",
        background: "var(--cela-ivory)",
        outline: "none",
        fontFamily: "var(--cela-body, var(--cela-sans))",
        resize: "vertical",
        ...style,
      }}
    />
  );
}

export function CelaStatusBadge({ status }: { status: string }) {
  const token = CELA_STATUS_STYLE[status] ?? {
    bg: "var(--cela-fog)",
    color: "var(--cela-stone)",
    label: status,
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: token.bg,
        color: token.color,
      }}
    >
      {token.label}
    </span>
  );
}

export function CelaSpinner({ padding = "48px 0" }: { padding?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding }}>
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
  );
}

export function CelaEmptyState({
  icon,
  title = "Chưa có dữ liệu",
  description,
}: {
  icon?: ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        color: "var(--cela-stone)",
      }}
    >
      {icon}
      <p style={{ fontSize: 14, fontWeight: 500, margin: icon ? "0 0 0" : 0 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: 12, marginTop: 4 }}>{description}</p>
      )}
    </div>
  );
}
