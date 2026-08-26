/** Simple generated monogram mark: a broken ring (echoes a pressure gauge dial) in the teal gradient. */
export default function Logo({ size = 26, withWordmark = true, dark = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="cp-logo-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8fe9db" />
            <stop offset="1" stopColor="#0b756c" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="12.5" stroke="url(#cp-logo-grad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="58 30" />
        <circle cx="16" cy="16" r="3.4" fill="url(#cp-logo-grad)" />
      </svg>
      {withWordmark && (
        <span
          style={{
            fontWeight: 800,
            fontSize: size * 0.72,
            letterSpacing: "0.01em",
            color: dark ? "#ffffff" : "var(--navy-900)",
          }}
        >
          CorePress
        </span>
      )}
    </span>
  );
}
