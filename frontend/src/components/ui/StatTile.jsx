export default function StatTile({ label, value, icon, tone = "neutral" }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: "var(--radius-sm)",
          background: tone === "accent" ? "var(--accent-soft)" : "var(--surface-2)",
          color: tone === "accent" ? "var(--accent-strong)" : "var(--text-muted)",
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
