interface CelaLogoProps {
  size?: number;
  color?: string;
  accent?: string;
  showWord?: boolean;
}

export function CelaLogo({
  size = 32,
  color = "var(--cela-espresso)",
  accent = "var(--cela-rose)",
  showWord = true,
}: CelaLogoProps) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
        <circle cx="20" cy="20" r="18.5" stroke={color} strokeWidth="1" fill="none" />
        <path
          d="M27 13.5 A 11 11 0 1 0 27 26.5"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        <rect
          x="26.5"
          y="18.6"
          width="2.8"
          height="2.8"
          transform="rotate(45 27.9 20)"
          fill={accent}
        />
      </svg>
      {showWord && (
        <div style={{ lineHeight: 1 }}>
          <div
            style={{
              fontFamily: "var(--cela-display)",
              fontSize: Math.round(size * 0.62),
              letterSpacing: "0.28em",
              color,
              fontWeight: 500,
            }}
          >
            CÉLA
          </div>
          <div
            style={{
              fontFamily: "var(--cela-sans)",
              fontSize: 9,
              letterSpacing: "0.32em",
              color: "var(--cela-cocoa)",
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            MAISON · BEAUTÉ
          </div>
        </div>
      )}
    </div>
  );
}
