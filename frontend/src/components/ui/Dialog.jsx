import { useEffect } from "react";
import { X } from "@phosphor-icons/react";

export default function Dialog({ open, onClose, title, description, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "rgba(5, 12, 20, 0.56)",
        zIndex: 80,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        style={{
          width: "min(480px, 100%)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: 28,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h3 id="dialog-title" style={{ fontSize: 20 }}>
              {title}
            </h3>
            {description ? (
              <p style={{ marginTop: 6, fontSize: 13.5, color: "var(--text-muted)" }}>{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="btn-icon"
            style={{ background: "var(--surface-2)", border: "none", flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ marginTop: 20 }}>{children}</div>
      </div>
    </div>
  );
}
