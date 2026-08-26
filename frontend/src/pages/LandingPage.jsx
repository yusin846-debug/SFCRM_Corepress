import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Gauge,
  ChartLineUp,
  Headset,
  Wrench,
  ShieldCheck,
  Download,
  CheckCircle,
} from "@phosphor-icons/react";
import MarketingHeader from "../components/layout/MarketingHeader.jsx";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import Button from "../components/ui/Button.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import { Field, Input } from "../components/ui/Field.jsx";
import { productLines } from "../data/mock.js";

// Real, on-topic industrial photography (Unsplash), not per-asset product shots.
// Used as atmospheric backdrops behind gradient overlays and model labels,
// not presented as literal photos of specific CorePress SKUs.
const HERO_IMAGE = "https://images.unsplash.com/photo-1757573538081-c469f75cdd7a?fm=jpg&q=70&w=1000&auto=format&fit=crop";
const LINE_IMAGE = {
  "cp100-pro": "https://images.unsplash.com/photo-1655165312002-9d781ad4046e?fm=jpg&q=70&w=480&auto=format&fit=crop",
  "cp-series": "https://images.unsplash.com/photo-1637296001304-4a098990b084?fm=jpg&q=70&w=480&auto=format&fit=crop",
  cp2100: "https://images.unsplash.com/photo-1563456019498-843e11bdaae0?fm=jpg&q=70&w=480&auto=format&fit=crop",
  "cp7100-plus": "https://images.unsplash.com/photo-1759064776046-45b988af4b6d?fm=jpg&q=70&w=480&auto=format&fit=crop",
};

const CAPABILITIES = [
  {
    icon: <Gauge size={22} weight="bold" />,
    title: "자산 상태 모니터링",
    body: "설치된 압축기의 실시간 가동 데이터를 하나의 화면에서 확인합니다.",
  },
  {
    icon: <ChartLineUp size={22} weight="bold" />,
    title: "예지보전 인텔리전스",
    body: "누적 가동시간과 이상 징후를 분석해 정비 시점을 먼저 제안합니다.",
  },
  {
    icon: <Headset size={22} weight="bold" />,
    title: "24시간 원격 지원",
    body: "현장 엔지니어 배정 전 원격으로 1차 진단을 진행합니다.",
  },
  {
    icon: <Wrench size={22} weight="bold" />,
    title: "생애주기 서비스",
    body: "설치부터 세대교체까지 설비 하나의 전체 이력을 관리합니다.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleCatalogSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  function closeCatalog() {
    setCatalogOpen(false);
    setSubmitted(false);
  }

  return (
    <div>
      <MarketingHeader />

      {/* Hero: asymmetric split, dark navy chrome, single navy->teal theme */}
      <section style={{ background: "var(--navy-900)", position: "relative", overflow: "hidden" }}>
        <div
          className="container grid gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
          style={{ paddingTop: 64, paddingBottom: 64, alignItems: "center" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 560 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--teal-400)" }}>
              산업용 에어컴프레서 애프터서비스 포털
            </span>
            <h1 style={{ fontSize: "clamp(32px, 4.4vw, 50px)", color: "#ffffff" }}>
              설비가 멈추기 전에,
              <br />
              <span className="text-gradient-brand">먼저 움직이는 서비스</span>
            </h1>
            <p style={{ fontSize: 16, color: "var(--text-on-dark-muted)", lineHeight: 1.65, maxWidth: "46ch" }}>
              실시간 자산 데이터와 예지보전 기술로 공정 압축기의 가동률을 지키는 CorePress 고객 포털입니다.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
              <Button variant="on-dark" icon={<ArrowRight size={16} weight="bold" />} iconPosition="right" onClick={() => navigate("/portal")}>
                포털 시작하기
              </Button>
              <Button variant="secondary-on-dark" onClick={() => setCatalogOpen(true)}>
                전문가 상담 신청
              </Button>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                aspectRatio: "4 / 5",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <img
                src={HERO_IMAGE}
                alt="산업 현장의 압축 배관 설비"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="eager"
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(200deg, rgba(5,12,20,0) 45%, rgba(5,12,20,0.55) 100%)",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                top: 20,
                right: -14,
                background: "rgba(10, 24, 38, 0.72)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "var(--radius-md)",
                padding: "10px 16px",
                color: "#fff",
                boxShadow: "var(--shadow-md)",
              }}
              className="hidden sm:block"
            >
              <div style={{ fontSize: 11, color: "var(--text-on-dark-muted)", fontWeight: 600 }}>실시간 가동률</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--teal-300)" }}>98.4%</div>
            </div>
          </div>
        </div>

        {/* proof strip, directly under hero, same dark theme */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="container grid grid-cols-1 sm:grid-cols-3" style={{ paddingBlock: 26 }}>
            {[
              ["1,240+", "관리 중인 압축기 자산"],
              ["4.1시간", "평균 현장 대응 시간"],
              ["99.2%", "연간 가동 신뢰도"],
            ].map(([value, label]) => (
              <div key={label} style={{ padding: "8px 0" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#ffffff" }}>{value}</div>
                <div style={{ fontSize: 13, color: "var(--text-on-dark-muted)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities: 2x2 bento, light content theme */}
      <section style={{ paddingBlock: 72 }}>
        <div className="container">
          <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", maxWidth: "22ch" }}>
            제조와 서비스를 함께 책임지는 4가지 방식
          </h2>
          <div className="grid gap-4 mt-10 sm:grid-cols-2">
            {CAPABILITIES.map((item, i) => (
              <div
                key={item.title}
                className="card"
                style={{
                  display: "flex",
                  gap: 16,
                  background: i === 0 ? "var(--navy-900)" : "var(--surface)",
                  color: i === 0 ? "#ffffff" : "var(--text)",
                  border: i === 0 ? "1px solid var(--navy-700)" : "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: i === 0 ? "rgba(255,255,255,0.1)" : "var(--accent-soft)",
                    color: i === 0 ? "var(--teal-300)" : "var(--accent-strong)",
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: i === 0 ? "var(--text-on-dark-muted)" : "var(--text-muted)" }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product lineup */}
      <section style={{ paddingBlock: 72, background: "var(--surface-2)" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)" }}>제품 라인업</h2>
            <Button variant="secondary" size="sm" onClick={() => setCatalogOpen(true)}>
              전체 카탈로그 요청
            </Button>
          </div>

          <div className="grid gap-4 mt-8 sm:grid-cols-2 lg:grid-cols-4">
            {productLines.map((line) => (
              <div key={line.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    aspectRatio: "4 / 3",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={LINE_IMAGE[line.id]}
                    alt={`${line.name} 라인업 이미지`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: 16 }}>{line.name}</h3>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{line.tagline}</p>
                </div>
                <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", fontSize: 11.5 }}>
                  <dt style={{ color: "var(--text-faint)" }}>정격 풍량</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{line.flow}</dd>
                  <dt style={{ color: "var(--text-faint)" }}>정격 출력</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{line.power}</dd>
                </dl>
                <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => setCatalogOpen(true)}>
                  사양서 받기
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ background: "var(--navy-900)", paddingBlock: 60 }}>
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: "clamp(22px, 2.6vw, 28px)", color: "#ffffff" }}>
              보유 설비를 CorePress 포털에 연결하세요
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-on-dark-muted)" }}>
              서비스 요청, 보증 확인, 견적 조회를 한 곳에서 처리할 수 있습니다.
            </p>
          </div>
          <Button variant="on-dark" icon={<ArrowRight size={16} weight="bold" />} iconPosition="right" onClick={() => navigate("/portal")}>
            포털 시작하기
          </Button>
        </div>
      </section>

      <MarketingFooter />

      <Dialog
        open={catalogOpen}
        onClose={closeCatalog}
        title={submitted ? "요청이 접수되었습니다" : "카탈로그 및 사양서 요청"}
        description={
          submitted
            ? undefined
            : "업무용 이메일을 남겨주시면 담당 엔지니어가 전체 제품 사양서를 보내드립니다."
        }
      >
        {submitted ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, padding: "8px 0" }}>
            <CheckCircle size={40} weight="fill" color="var(--teal-500)" />
            <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
              영업일 기준 1일 이내에 입력하신 이메일로 사양서를 발송해 드립니다.
            </p>
            <Button variant="primary" size="sm" onClick={closeCatalog}>
              확인
            </Button>
          </div>
        ) : (
          <form style={{ display: "flex", flexDirection: "column", gap: 14 }} onSubmit={handleCatalogSubmit}>
            <Field label="회사명" required>
              <Input required placeholder="예: 일신정밀공업" />
            </Field>
            <Field label="업무용 이메일" required>
              <Input type="email" required placeholder="name@company.com" />
            </Field>
            <Field label="연락처" hint="담당 엔지니어가 확인 연락을 드릴 수 있습니다.">
              <Input type="tel" placeholder="010-0000-0000" />
            </Field>
            <Button type="submit" variant="primary" style={{ marginTop: 4 }}>
              사양서 요청 제출
            </Button>
          </form>
        )}
      </Dialog>
    </div>
  );
}
