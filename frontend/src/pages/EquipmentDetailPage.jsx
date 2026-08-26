import { Fragment, useMemo, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Wrench, ClockCountdown, ShieldCheck, ArrowLeft } from "@phosphor-icons/react";
import AppShell from "../components/layout/AppShell.jsx";
import Tag from "../components/ui/Tag.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import EquipmentTile from "../components/ui/EquipmentTile.jsx";
import { findEquipment, requestsFor } from "../data/mock.js";

const TODAY = new Date("2026-08-18");

const TABS = [
  { id: "info", label: "기본정보" },
  { id: "history", label: "서비스 이력" },
  { id: "warranty", label: "보증 현황" },
];

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function EquipmentDetailPage() {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");
  const equipment = findEquipment(equipmentId);
  const history = useMemo(() => (equipment ? requestsFor(equipment.id) : []), [equipment]);

  if (!equipment) {
    return <Navigate to="/portal/equipment" replace />;
  }

  const start = new Date(equipment.installedOn);
  const end = new Date(equipment.warrantyEndsOn);
  const totalDays = daysBetween(start, end);
  const elapsedDays = Math.min(totalDays, Math.max(0, daysBetween(start, TODAY)));
  const remainingDays = daysBetween(TODAY, end);
  const warrantyActive = remainingDays > 0;
  const progressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  return (
    <AppShell>
      <button
        type="button"
        onClick={() => navigate("/portal/equipment")}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", width: "fit-content" }}
      >
        <ArrowLeft size={14} /> 보유 장비 목록
      </button>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <EquipmentTile model={equipment.model} />
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22 }}>{equipment.nickname}</h1>
              <Tag variant={equipment.status === "가동중" ? "accent" : "neutral"}>{equipment.status}</Tag>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              {equipment.model} · {equipment.id} · {equipment.location}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Wrench size={16} weight="bold" />}
          onClick={() => navigate(`/portal/service-request?equipmentId=${equipment.id}`)}
        >
          서비스 요청
        </Button>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 14px",
              fontSize: 14,
              fontWeight: 700,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: tab === t.id ? "var(--navy-900)" : "var(--text-faint)",
              borderBottom: tab === t.id ? "2px solid var(--teal-500)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h3 style={{ fontSize: 13, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
              설비 사양
            </h3>
            <SpecList
              rows={[
                ["정격 풍량", equipment.ratedFlow],
                ["정격 토출압", equipment.ratedPressure],
                ["정격 출력", equipment.ratedPower],
                ["냉각 방식", equipment.coolingMethod],
                ["누적 가동시간", `${equipment.runHours.toLocaleString()} hr`],
                ["Smart Care", equipment.smartCareTier ?? "미가입"],
              ]}
            />
          </div>
          <div className="card">
            <h3 style={{ fontSize: 13, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
              설치 정보
            </h3>
            <SpecList
              rows={[
                ["설치 위치", equipment.location],
                ["설치일", equipment.installedOn],
                ["보증 종료일", equipment.warrantyEndsOn],
                ["보증 상태", warrantyActive ? `유효 (D-${remainingDays})` : "만료"],
              ]}
            />
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card" style={{ padding: 0 }}>
          {history.length === 0 ? (
            <EmptyState icon={<ClockCountdown size={22} />} title="서비스 이력이 없습니다" body="이 설비에 대해 등록된 서비스 요청이 아직 없습니다." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>접수번호</th>
                  <th>증상</th>
                  <th>접수일</th>
                  <th>담당 엔지니어</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {history.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 700 }}>{req.id}</td>
                    <td>{req.symptom}</td>
                    <td style={{ color: "var(--text-muted)" }}>{req.filedOn}</td>
                    <td>{req.engineer}</td>
                    <td>
                      <Tag variant={req.status === "종료" ? "neutral" : "accent"}>{req.status}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "warranty" && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldCheck size={20} weight="bold" color={warrantyActive ? "var(--teal-600)" : "var(--text-faint)"} />
            <span style={{ fontWeight: 700 }}>{warrantyActive ? `보증 유효 · D-${remainingDays}` : "보증 만료"}</span>
          </div>
          <div style={{ height: 8, borderRadius: "var(--radius-pill)", background: "var(--surface-2)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: warrantyActive ? "var(--teal-500)" : "var(--text-faint)",
                borderRadius: "var(--radius-pill)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
            <span>시작 {equipment.installedOn}</span>
            <span>종료 {equipment.warrantyEndsOn}</span>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SpecList({ rows }) {
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", rowGap: 10, columnGap: 16, fontSize: 13.5, margin: 0 }}>
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
          <dd style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
