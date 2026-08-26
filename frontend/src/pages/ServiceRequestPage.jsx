import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UploadSimple, CheckCircle, Wrench } from "@phosphor-icons/react";
import AppShell from "../components/layout/AppShell.jsx";
import { Field, Input, Textarea, Select } from "../components/ui/Field.jsx";
import Button from "../components/ui/Button.jsx";
import Tag from "../components/ui/Tag.jsx";
import StepProgress from "../components/ui/StepProgress.jsx";
import EquipmentTile from "../components/ui/EquipmentTile.jsx";
import { equipmentList, findEquipment } from "../data/mock.js";

const SYMPTOMS = ["이상 진동/소음", "토출압 저하", "쿨링 이슈", "오일 누유", "기타"];
const URGENCY = [
  { value: "긴급", desc: "설비 정지" },
  { value: "보통", desc: "가동 중 이상" },
  { value: "낮음", desc: "예방 점검" },
];

export default function ServiceRequestPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselected = params.get("equipmentId");
  const [equipmentId, setEquipmentId] = useState(preselected ?? equipmentList[0]?.id ?? "");
  const [urgency, setUrgency] = useState("보통");
  const [submitted, setSubmitted] = useState(null);
  const equipment = findEquipment(equipmentId);

  function handleSubmit(e) {
    e.preventDefault();
    const caseNumber = `CS-2026-${String(Math.floor(1000 + Math.random() * 8999)).slice(0, 4)}`;
    setSubmitted(caseNumber);
  }

  if (submitted) {
    return (
      <AppShell>
        <div className="card" style={{ maxWidth: 560, marginInline: "auto", textAlign: "center", padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <CheckCircle size={44} weight="fill" color="var(--teal-500)" />
          <h1 style={{ fontSize: 22 }}>접수번호 {submitted}가 발급되었습니다</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
            담당 엔지니어 배정 결과는 등록하신 이메일로 안내드립니다.
          </p>
          <div style={{ width: "100%", padding: "20px 8px" }}>
            <StepProgress steps={["요청 접수", "배정 완료", "진행중", "종료"]} activeIndex={0} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate(`/portal/equipment/${equipmentId}`)}>
              설비 상세로
            </Button>
            <Button variant="primary" onClick={() => navigate("/portal")}>
              홈으로
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div>
        <h1 style={{ fontSize: 24 }}>서비스 요청 등록</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>
          설비 이상 증상을 접수하면 담당 엔지니어가 배정됩니다.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <form className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }} onSubmit={handleSubmit}>
          <Field label="대상 설비" required>
            <Select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} required>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nickname} · {eq.model} ({eq.location})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="증상 유형" required>
            <Select required defaultValue={SYMPTOMS[0]}>
              {SYMPTOMS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="상세 내용" required hint="발생 시점, 빈도, 이전 조치 내역 등을 구체적으로 적어주시면 진단이 빨라집니다.">
            <Textarea rows={4} required placeholder="예: 2단 로터 주변에서 80Hz 대역 이상 진동이 오전부터 발생" />
          </Field>

          <div className="field">
            <label>첨부 파일</label>
            <div
              style={{
                border: "1.5px dashed var(--border-strong)",
                borderRadius: "var(--radius-md)",
                padding: "22px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 12.5,
              }}
            >
              <UploadSimple size={20} style={{ marginInline: "auto", marginBottom: 8, color: "var(--text-faint)" }} />
              파일을 드래그하거나 선택해 첨부하세요 (진동 데이터, 현장 사진 등, 최대 25MB)
            </div>
          </div>

          <div className="field">
            <label>긴급도 *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {URGENCY.map((u) => {
                const active = urgency === u.value;
                return (
                  <button
                    type="button"
                    key={u.value}
                    onClick={() => setUrgency(u.value)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: active ? "1.5px solid var(--teal-500)" : "1.5px solid var(--border-strong)",
                      background: active ? "var(--accent-soft)" : "var(--surface)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: active ? "var(--accent-strong)" : "var(--text)" }}>
                      {u.value}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{u.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Button type="submit" variant="primary" icon={<Wrench size={16} weight="bold" />}>
              서비스 요청 제출
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              취소
            </Button>
          </div>
        </form>

        <aside className="card" style={{ display: "flex", flexDirection: "column", gap: 12, alignSelf: "start" }}>
          <h3 style={{ fontSize: 13, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            대상 설비
          </h3>
          {equipment ? (
            <>
              <EquipmentTile model={equipment.model} size={112} />
              <div>
                <div style={{ fontWeight: 700 }}>{equipment.nickname}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{equipment.id}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{equipment.location}</div>
              </div>
              <Tag variant={equipment.status === "가동중" ? "accent" : "neutral"}>{equipment.status}</Tag>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>설비를 선택해 주세요.</p>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
