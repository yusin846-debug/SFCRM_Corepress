import { NavLink, useNavigate } from "react-router-dom";
import { Bell, SignOut } from "@phosphor-icons/react";
import Logo from "./Logo.jsx";
import { currentAccount } from "../../data/mock.js";

const TABS = [
  { to: "/portal", label: "홈", end: true },
  { to: "/portal/equipment", label: "보유 장비" },
  { to: "/portal/service-request", label: "서비스 요청" },
];

export default function AppTopNav() {
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="container" style={{ height: 64, display: "flex", alignItems: "center", gap: 28 }}>
        <a href="/portal" aria-label="CorePress 포털 홈">
          <Logo dark={false} size={22} />
        </a>

        <nav aria-label="포털 메뉴" style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }} className="hidden md:flex">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              style={({ isActive }) => ({
                fontSize: 14,
                fontWeight: 700,
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                color: isActive ? "var(--navy-900)" : "var(--text-muted)",
                background: isActive ? "var(--surface-2)" : "transparent",
              })}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            aria-label="알림"
            className="btn-icon"
            style={{ background: "var(--surface-2)", border: "none", position: "relative" }}
          >
            <Bell size={17} />
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--danger)",
              }}
            />
          </button>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }} className="hidden sm:flex">
            <span style={{ fontSize: 13, fontWeight: 700 }}>{currentAccount.companyName}</span>
            <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
              {currentAccount.contactName} · {currentAccount.contactTitle}
            </span>
          </div>
          <button
            type="button"
            aria-label="로그아웃"
            className="btn-icon"
            style={{ background: "transparent", border: "1px solid var(--border-strong)" }}
            onClick={() => navigate("/")}
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
