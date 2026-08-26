import { useNavigate } from "react-router-dom";
import { List } from "@phosphor-icons/react";
import Logo from "./Logo.jsx";
import Button from "../ui/Button.jsx";

const LINKS = ["제품", "서비스", "기술", "회사", "고객지원"];

export default function MarketingHeader() {
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--navy-900)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="container"
        style={{
          height: 68,
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}
      >
        <a href="/" aria-label="CorePress 홈">
          <Logo />
        </a>

        <nav
          aria-label="주 메뉴"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            flex: 1,
          }}
          className="hidden md:flex"
        >
          {LINKS.map((label) => (
            <a
              key={label}
              href="#"
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text-on-dark-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-on-dark-muted)")}
            >
              {label}
            </a>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-on-dark-muted)" }} className="hidden sm:inline">
            KR · EN
          </span>
          <Button variant="secondary-on-dark" size="sm" onClick={() => navigate("/portal")}>
            로그인
          </Button>
          <Button variant="on-dark" size="sm" onClick={() => navigate("/portal")}>
            포털 시작하기
          </Button>
          <button
            type="button"
            aria-label="메뉴 열기"
            className="btn-icon md:hidden"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.24)", color: "#fff" }}
          >
            <List size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
