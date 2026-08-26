import { Check } from "@phosphor-icons/react";

/**
 * Horizontal status stepper. `activeIndex` is the current (in-progress) step;
 * everything before it is complete, everything after is pending.
 */
export default function StepProgress({ steps, activeIndex }) {
  return (
    <div style={{ display: "flex", width: "100%" }}>
      {steps.map((step, i) => {
        const state = i < activeIndex ? "done" : i === activeIndex ? "current" : "pending";
        return (
          <div
            key={step}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              position: "relative",
              textAlign: "center",
            }}
          >
            {i > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 11,
                  right: "50%",
                  width: "100%",
                  height: 2,
                  background: state === "pending" ? "var(--border-strong)" : "var(--teal-500)",
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                background:
                  state === "done" ? "var(--teal-500)" : state === "current" ? "var(--surface)" : "var(--surface)",
                border:
                  state === "pending"
                    ? "2px solid var(--border-strong)"
                    : state === "current"
                    ? "2px solid var(--teal-500)"
                    : "2px solid var(--teal-500)",
                color: state === "done" ? "#04211d" : state === "current" ? "var(--teal-600)" : "var(--text-faint)",
              }}
            >
              {state === "done" ? <Check size={13} weight="bold" /> : i + 1}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: state === "pending" ? 500 : 700,
                color: state === "pending" ? "var(--text-faint)" : "var(--text)",
              }}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
