import { Gauge } from "@phosphor-icons/react";

/**
 * Stylised "rating plate" tile used wherever we'd otherwise need a per-asset
 * product photo. We don't have real photography of a specific customer's
 * physical unit, so this reads honestly as a UI illustration (echoing the
 * metal nameplate every real compressor ships with) instead of faking a photo.
 */
export default function EquipmentTile({ model, size = 88 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "var(--radius-md)",
        background: "linear-gradient(155deg, var(--navy-800) 0%, var(--navy-950) 100%)",
        border: "1px solid var(--navy-700)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        color: "var(--teal-300)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)",
        }}
      />
      <Gauge size={size * 0.34} weight="light" style={{ position: "relative" }} />
      <span
        style={{
          position: "relative",
          fontSize: size * 0.12,
          fontWeight: 800,
          letterSpacing: "0.02em",
          color: "#fff",
        }}
      >
        {model}
      </span>
    </div>
  );
}
