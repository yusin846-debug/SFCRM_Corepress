import AppTopNav from "./AppTopNav.jsx";

export default function AppShell({ children }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <AppTopNav />
      <main className="container" style={{ paddingBlock: 28, display: "flex", flexDirection: "column", gap: 24 }}>
        {children}
      </main>
    </div>
  );
}
