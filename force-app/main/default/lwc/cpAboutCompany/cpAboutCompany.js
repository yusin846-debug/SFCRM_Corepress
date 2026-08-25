import { LightningElement, api } from "lwc";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import cp7100 from "@salesforce/resourceUrl/CorePressCP7100PlusBody";
import partImpeller from "@salesforce/resourceUrl/CorePressPartImpeller";
import partControlPanel from "@salesforce/resourceUrl/CorePressPartControlPanel";

const PILLARS = [
  {
    key: "engineering",
    tag: "ENGINEERING",
    title: "설계 · 제조 내재화",
    body: "터보압축기 임펠러부터 컨트롤러, 유지보수 부품까지 전 공정을 국내에서 설계·제조합니다. 고객사 라인 조건에 맞춘 커스텀 사양도 표준 리드타임 안에 대응합니다.",
    icon: "⚙"
  },
  {
    key: "lifecycle",
    tag: "LIFECYCLE",
    title: "전 수명주기 파트너십",
    body: "설치·시운전 이후에도 정기 정비, 소모품 공급, 원격 모니터링, 노후 설비 교체까지 CorePress가 단일 창구로 관리합니다. 담당 영업·엔지니어·서비스 코디가 하나의 계약 아래 응대합니다.",
    icon: "🔗"
  },
  {
    key: "digital",
    tag: "DIGITAL",
    title: "고객 셀프서비스 포털",
    body: "보유 설비 현황, 서비스 요청 이력, RFP/RFQ 진행, 견적 확인을 언제든 포털에서 확인할 수 있습니다. 엔지니어 방문 없이도 상태를 실시간으로 파악합니다.",
    icon: "📊"
  }
];

const STATS = [
  { value: "12+", label: "국내 · 아시아 도입 사업장" },
  { value: "24/7", label: "원격 모니터링 · 이상 알림" },
  { value: "99.2%", label: "정기 계약 갱신율" },
  { value: "72h", label: "긴급 서비스 평균 대응 시간" }
];

const CONTACT = [
  { label: "대표전화", value: "1544-0000" },
  { label: "서비스 요청", value: "포털 → 서비스 요청 등록" },
  { label: "영업 문의", value: "sales@corepress.demo" },
  { label: "본사", value: "서울특별시 강남구 CorePress타워" }
];

export default class CpAboutCompany extends LightningElement {
  @api homeUrl = "/corepress";
  @api productsUrl = "products";
  @api servicesUrl = "services";
  @api noticesUrl = "notices";
  @api inquiryUrl = "/corepress";
  logoUrl = headerLogo;
  heroImage = cp7100;
  pillars = PILLARS;
  stats = STATS;
  contact = CONTACT;
  impellerImage = partImpeller;
  controlImage = partControlPanel;

  get inquiryHref() {
    return `${this.inquiryUrl}?inquiry=%EC%A0%84%EC%B2%B4%20%EC%A0%9C%ED%92%88#products`;
  }
}
