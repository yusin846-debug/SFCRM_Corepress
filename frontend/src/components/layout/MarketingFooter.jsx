import Logo from "./Logo.jsx";

export default function MarketingFooter() {
  return (
    <footer style={{ background: "var(--navy-950)", color: "var(--text-on-dark-muted)" }}>
      <div
        className="container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 24,
          paddingBlock: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
          <Logo size={22} />
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            산업용 에어컴프레서 제조와 애프터서비스를 함께 책임지는 CorePress 고객 포털입니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap", fontSize: 13 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#ffffff" }}>제품</span>
            <a href="#">CP100 Pro</a>
            <a href="#">CP2100</a>
            <a href="#">CP7100+</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#ffffff" }}>고객지원</span>
            <a href="#">서비스 요청</a>
            <a href="#">보증 정책</a>
            <a href="#">문의하기</a>
          </div>
        </div>
      </div>
      <div className="container" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingBlock: 16, fontSize: 12 }}>
        CorePress Industrial Co., Ltd. · 개인정보처리방침
      </div>
    </footer>
  );
}
