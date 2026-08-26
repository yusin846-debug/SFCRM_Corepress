import { useNavigate } from "react-router-dom";
import { Wrench, ClockCountdown, FileText, Receipt, WarningCircle, Info, ArrowRight } from "@phosphor-icons/react";
import AppShell from "../components/layout/AppShell.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import Tag from "../components/ui/Tag.jsx";
import Button from "../components/ui/Button.jsx";
import { currentAccount, equipmentList, serviceRequests, notifications } from "../data/mock.js";

const STATUS_VARIANT = {
  "배정 완료": "accent",
  종료: "neutral",
  접수: "warning",
};

const NOTIF_ICON = {
  warning: <WarningCircle size={16} weight="fill" color="var(--warning)" />,
  danger: <WarningCircle size={16} weight="fill" color="var(--danger)" />,
  accent: <Info size={16} weight="fill" color="var(--accent-strong)" />,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const activeCount = equipmentList.filter((e) => e.status === "가동중").length;
  const openRequests = serviceRequests.filter((r) => r.status !== "종료").length;

  return (
    <AppShell>
      <div>
        <h1 style={{ fontSize: 26 }}>{currentAccount.companyName}님, 안녕하세요</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>2026년 8월 18일 기준 설비 현황입니다.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={`보유 장비 (가동중 ${activeCount})`} value={equipmentList.length} icon={<Wrench size={18} weight="bold" />} tone="accent" />
        <StatTile label="진행 중 서비스 요청" value={openRequests} icon={<ClockCountdown size={18} weight="bold" />} />
        <StatTile label="RFP · RFQ 진행" value={1} icon={<FileText size={18} weight="bold" />} />
        <StatTile label="확인 대기 견적" value={1} icon={<Receipt size={18} weight="bold" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
            <h2 style={{ fontSize: 16 }}>최근 서비스 요청</h2>
            <Button variant="ghost" size="sm" icon={<ArrowRight size={14} weight="bold" />} iconPosition="right" onClick={() => navigate("/portal/equipment")}>
              전체 보기
            </Button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>접수번호</th>
                  <th>설비</th>
                  <th>증상</th>
                  <th>접수일</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {serviceRequests.map((req) => {
                  const equipment = equipmentList.find((e) => e.id === req.equipmentId);
                  return (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 700 }}>{req.id}</td>
                      <td>{equipment?.nickname ?? req.equipmentId}</td>
                      <td>{req.symptom}</td>
                      <td style={{ color: "var(--text-muted)" }}>{req.filedOn}</td>
                      <td>
                        <Tag variant={STATUS_VARIANT[req.status] ?? "neutral"}>{req.status}</Tag>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 4, padding: 0 }}>
          <h2 style={{ fontSize: 16, padding: "16px 20px 4px" }}>알림</h2>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{ display: "flex", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 13 }}
            >
              {NOTIF_ICON[n.tone]}
              <span style={{ color: "var(--text)" }}>{n.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 16 }}>보유 장비 요약</h2>
          <Button variant="ghost" size="sm" icon={<ArrowRight size={14} weight="bold" />} iconPosition="right" onClick={() => navigate("/portal/equipment")}>
            전체 보기
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {equipmentList.slice(0, 4).map((eq) => (
            <button
              key={eq.id}
              type="button"
              onClick={() => navigate(`/portal/equipment/${eq.id}`)}
              className="card"
              style={{ textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
            >
              <Tag variant={eq.status === "가동중" ? "accent" : "neutral"}>{eq.status}</Tag>
              <div style={{ fontWeight: 700 }}>{eq.nickname}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                {eq.model} · {eq.location}
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
