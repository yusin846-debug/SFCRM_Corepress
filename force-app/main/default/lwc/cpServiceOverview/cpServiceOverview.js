import { LightningElement, api } from "lwc";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import partHMI from "@salesforce/resourceUrl/CorePressPartHMI";
import partDiagKit from "@salesforce/resourceUrl/CorePressPartDiagKit";
import partOilFilter from "@salesforce/resourceUrl/CorePressPartOilFilter";
import partControlPanel from "@salesforce/resourceUrl/CorePressPartControlPanel";
import partSensor from "@salesforce/resourceUrl/CorePressPartSensor";

const OFFERINGS = [
  {
    key: "monitoring",
    tag: "MONITORING",
    title: "원격 모니터링",
    lead: "설비별 진동·온도·압력·오일 상태를 24시간 원격 관측",
    body: "IoT 센서 데이터를 CorePress 통합 컨트롤러가 실시간으로 수집하고, 이상 패턴 감지 시 담당 엔지니어와 고객사 설비관리팀에 자동 알림을 발송합니다. 포털에서 각 자산의 건강 상태와 예방정비 사이클을 함께 확인할 수 있습니다.",
    imageSrc: partHMI
  },
  {
    key: "maintenance",
    tag: "MAINTENANCE",
    title: "정기 유지보수",
    lead: "설비 라인 특성에 맞춘 주기정비 · 부품 교체 계약",
    body: "터보압축기·에어드라이어 기종별 권장 오버홀 주기와 소모품 교체 사이클을 표준화한 계약을 제공합니다. 유지보수 · 주기정비 · 부품 공급 · 모니터링 · 토탈솔루션 5종 상품 중 라인 규모에 맞게 선택 가능합니다.",
    imageSrc: partDiagKit
  },
  {
    key: "parts",
    tag: "PARTS",
    title: "부품 공급 & 재고",
    lead: "필터·씰·기어·베어링·센서 등 순정 부품 상시 재고",
    body: "CorePress 순정 부품(Inlet Air Filter, Gearbox Lube Oil Filter, Tilting Pad Bearing Kit, Gasket & O-Ring Kit, Vibration Sensor 등)을 국내 창고에 상시 보유합니다. 서비스 요청 접수와 동시에 필요한 부품을 자동으로 산출해 현장 방문 전 준비합니다.",
    imageSrc: partOilFilter
  },
  {
    key: "total",
    tag: "TOTAL SOLUTION",
    title: "토탈 솔루션",
    lead: "설치·시운전·정비·부품·모니터링을 하나의 계약으로",
    body: "신규 설비 도입부터 설치, 시운전, 예방정비, 부품, 원격 모니터링까지 전 수명주기를 하나의 파트너십으로 관리합니다. 담당 영업·엔지니어·서비스 코디네이터가 하나의 계약 아래에서 응대합니다.",
    imageSrc: partControlPanel
  }
];

export default class CpServiceOverview extends LightningElement {
  @api homeUrl = "/corepress";
  @api productsUrl = "products";
  @api noticesUrl = "notices";
  @api aboutUrl = "about";
  @api inquiryUrl = "/corepress";
  logoUrl = headerLogo;
  sensorImage = partSensor;
  offerings = OFFERINGS;

  get inquiryHref() {
    return `${this.inquiryUrl}?inquiry=%EC%A0%84%EC%B2%B4%20%EC%A0%9C%ED%92%88#products`;
  }
}
