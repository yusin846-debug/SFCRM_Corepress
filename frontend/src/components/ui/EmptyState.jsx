export default function EmptyState({ icon, title, body, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 6,
        padding: "56px 24px",
        color: "var(--text-muted)",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "var(--radius-pill)",
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-faint)",
          marginBottom: 6,
        }}
      >
        {icon}
      </div>
      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 320 }}>{body}</div>
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  );
}
