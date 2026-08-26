// 프로토타입용 목 데이터. 실제 Salesforce Asset/Case/Warranty 필드 계약이 확정되면
// 이 파일 대신 Apex/REST 연동으로 교체한다 (EXPERIENCE_CLOUD_공동개발_계획.md 데이터 계약 참고).

export const currentAccount = {
  companyName: "일신정밀공업",
  contactName: "김도윤",
  contactTitle: "설비관리팀 과장"
};

export const productLines = [
  {
    id: "cp100-pro",
    name: "CP100 Pro",
    tagline: "소형 라인용 스크류 컴프레서",
    flow: "3,000 m³/hr",
    pressure: "4.5 bar A",
    stages: "2단",
    power: "250 kW"
  },
  {
    id: "cp-series",
    name: "CP Series",
    tagline: "표준 공정용 범용 라인업",
    flow: "6,500 m³/hr",
    pressure: "6.0 bar A",
    stages: "2단",
    power: "550 kW"
  },
  {
    id: "cp2100",
    name: "CP2100",
    tagline: "중대형 공정 대응 모델",
    flow: "9,000 m³/hr",
    pressure: "7.0 bar A",
    stages: "3단",
    power: "850 kW"
  },
  {
    id: "cp7100-plus",
    name: "CP7100+",
    tagline: "대형 플랜트 전용 최상위 모델",
    flow: "12,000 m³/hr",
    pressure: "7.5 bar A",
    stages: "3단",
    power: "1,200 kW"
  }
];

export const equipmentList = [
  {
    id: "CP-2024-0847",
    nickname: "터보압축기 #1",
    model: "CP7100+",
    location: "제2공장 A동",
    installedOn: "2024-06-15",
    warrantyEndsOn: "2026-11-16",
    smartCareTier: "S2",
    status: "가동중",
    runHours: 15240,
    ratedFlow: "12,000 m³/hr",
    ratedPressure: "7.5 bar A",
    ratedPower: "1,200 kW",
    coolingMethod: "수랭"
  },
  {
    id: "CP-2022-0312",
    nickname: "터보압축기 #2",
    model: "CP2100",
    location: "제1공장 B동",
    installedOn: "2022-03-02",
    warrantyEndsOn: "2025-02-01",
    smartCareTier: "S1",
    status: "가동중",
    runHours: 28110,
    ratedFlow: "9,000 m³/hr",
    ratedPressure: "7.0 bar A",
    ratedPower: "850 kW",
    coolingMethod: "공랭"
  },
  {
    id: "CP-2023-0561",
    nickname: "스케줄러 압축기",
    model: "CP100 Pro",
    location: "제2공장 A동",
    installedOn: "2023-11-20",
    warrantyEndsOn: "2025-11-19",
    smartCareTier: "S2",
    status: "가동중",
    runHours: 9860,
    ratedFlow: "3,000 m³/hr",
    ratedPressure: "4.5 bar A",
    ratedPower: "250 kW",
    coolingMethod: "공랭"
  },
  {
    id: "CP-2021-0445",
    nickname: "압축기 #3",
    model: "CP Series",
    location: "제1공장 C동",
    installedOn: "2021-09-08",
    warrantyEndsOn: "2024-09-07",
    smartCareTier: "S3",
    status: "가동중",
    runHours: 33520,
    ratedFlow: "6,500 m³/hr",
    ratedPressure: "6.0 bar A",
    ratedPower: "550 kW",
    coolingMethod: "수랭"
  },
  {
    id: "CP-2019-0089",
    nickname: "구형 압축기",
    model: "CPA-500",
    location: "제1공장 A동",
    installedOn: "2019-04-11",
    warrantyEndsOn: "2021-04-10",
    smartCareTier: null,
    status: "휴지",
    runHours: 41870,
    ratedFlow: "4,000 m³/hr",
    ratedPressure: "5.5 bar A",
    ratedPower: "400 kW",
    coolingMethod: "공랭"
  }
];

export const serviceRequests = [
  {
    id: "CS-2026-0147",
    equipmentId: "CP-2024-0847",
    symptom: "이상 진동/소음",
    filedOn: "2026-08-10",
    status: "배정 완료",
    urgency: "긴급",
    engineer: "이현수 책임엔지니어",
    visitAt: "2026-08-12 14:00"
  },
  {
    id: "CS-2026-0098",
    equipmentId: "CP-2024-0847",
    symptom: "토출압 저하",
    filedOn: "2026-06-20",
    status: "종료",
    urgency: "보통",
    engineer: "박서준 선임엔지니어",
    visitAt: "2026-06-22 10:30"
  },
  {
    id: "CS-2025-0312",
    equipmentId: "CP-2022-0312",
    symptom: "쿨링팬 이슈",
    filedOn: "2025-12-03",
    status: "종료",
    urgency: "낮음",
    engineer: "박서준 선임엔지니어",
    visitAt: "2025-12-05 09:00"
  }
];

export const notifications = [
  {
    id: "n1",
    tone: "warning",
    text: "CP7100+ (터보압축기 #1) 보증이 90일 후 만료됩니다."
  },
  {
    id: "n2",
    tone: "accent",
    text: "견적 QT-2026-0089 확인이 필요합니다."
  },
  {
    id: "n3",
    tone: "danger",
    text: "CPA-500 (구형 압축기) 누적 가동시간이 정비 임계치를 초과했습니다."
  }
];

export function findEquipment(id) {
  return equipmentList.find((item) => item.id === id);
}

export function requestsFor(equipmentId) {
  return serviceRequests.filter((item) => item.equipmentId === equipmentId);
}
