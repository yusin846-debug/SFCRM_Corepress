import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, CaretRight, Wrench } from "@phosphor-icons/react";
import AppShell from "../components/layout/AppShell.jsx";
import Tag from "../components/ui/Tag.jsx";
import { Input, Select } from "../components/ui/Field.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { equipmentList } from "../data/mock.js";

export default function EquipmentListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = useMemo(() => {
    return equipmentList.filter((eq) => {
      const matchesQuery =
        query.trim() === "" ||
        eq.nickname.includes(query) ||
        eq.model.toLowerCase().includes(query.toLowerCase()) ||
        eq.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "전체" || eq.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>보유 장비 목록</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>
            총 {equipmentList.length}대 (가동중 {equipmentList.filter((e) => e.status === "가동중").length}대)
          </p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <MagnifyingGlass
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }}
          />
          <Input
            style={{ paddingLeft: 34 }}
            placeholder="설비명, 모델명, 시리얼 번호 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="전체">전체 상태</option>
          <option value="가동중">가동중</option>
          <option value="휴지">휴지</option>
        </Select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Wrench size={22} />}
            title="검색 조건에 맞는 장비가 없습니다"
            body="검색어나 상태 필터를 조정해 보세요."
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>설비명</th>
                  <th>모델</th>
                  <th>설치 위치</th>
                  <th>설치일</th>
                  <th>Smart Care</th>
                  <th>상태</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((eq) => (
                  <tr
                    key={eq.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/portal/equipment/${eq.id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 700 }}>{eq.nickname}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{eq.id}</div>
                    </td>
                    <td>{eq.model}</td>
                    <td>{eq.location}</td>
                    <td style={{ color: "var(--text-muted)" }}>{eq.installedOn}</td>
                    <td>{eq.smartCareTier ? <Tag variant="neutral">{eq.smartCareTier}</Tag> : "-"}</td>
                    <td>
                      <Tag variant={eq.status === "가동중" ? "accent" : "neutral"}>{eq.status}</Tag>
                    </td>
                    <td>
                      <CaretRight size={15} color="var(--text-faint)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
