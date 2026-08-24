import { LightningElement, api } from "lwc";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";

const NOTICES = [
  {
    id: "N-2026-014",
    category: "warranty",
    categoryLabel: "보증만료",
    title: "귀사 CP6000 #2 (SN DHC-2018-CP6000-02) 보증기간 만료 예정",
    date: "2026.08.20",
    summary: "안산 1공장 B동 CP6000 #2의 보증기간이 2026-09-30 만료됩니다. 예방정비 계약 갱신 또는 교체 검토를 권장드립니다.",
    body: "설치일 2018-03-15 기준 8년차에 접어드는 설비로, 최근 진동·소음 이상 판정 이력이 확인되었습니다. 담당 영업사원(영업팀장대리)이 별도로 연락드릴 예정이며, 포털 내 RFP·RFQ 탭에서 교체 견적을 직접 요청하실 수 있습니다."
  },
  {
    id: "N-2026-013",
    category: "warranty",
    categoryLabel: "보증만료",
    title: "CorePress 예방정비 서비스 계약 갱신 안내",
    date: "2026.08.15",
    summary: "기존 유지보수 계약 만료가 임박한 고객사 대상 계약 갱신 옵션 안내입니다.",
    body: "CP6000/CP6100 Pro/CP7100+ 계열 설비 보유 고객사께 유지보수·주기정비·부품공급 3종 결합 상품(토탈솔루션)을 5% 할인가로 제공합니다. 유효기한: 2026-09-30."
  },
  {
    id: "N-2026-012",
    category: "notice",
    categoryLabel: "공지",
    title: "안산 1공장 정기점검 일정 안내 (2026년 3분기)",
    date: "2026.08.10",
    summary: "안산 1공장 CP6000 시리즈 정기점검 방문 스케줄을 안내드립니다.",
    body: "2026년 9월 3주차(9/14~9/20) 중 담당 엔지니어가 현장 방문 예정입니다. 방문 희망 일시가 있으시면 서비스 요청 등록 후 비고에 기재해 주세요."
  },
  {
    id: "N-2026-011",
    category: "notice",
    categoryLabel: "공지",
    title: "CorePress 고객 포털 개편 안내",
    date: "2026.08.01",
    summary: "고객 셀프서비스 포털의 RFP·RFQ 접수 흐름과 견적 조회 화면이 개편되었습니다.",
    body: "RFP 접수는 이제 담당 영업사원에게 자동 전달되며, 승인된 견적은 견적 조회 탭에서 PDF로 즉시 확인하실 수 있습니다. 카탈로그 문의는 랜딩 페이지 하단에서 접수 가능합니다."
  },
  {
    id: "N-2026-010",
    category: "tech",
    categoryLabel: "기술자료",
    title: "CP7100+ 신제품 도입 백서 (터보압축기 차세대 라인)",
    date: "2026.07.28",
    summary: "고유량 터보압축기 CP7100+의 도입 효과와 인수 성능 시험 기준을 담은 기술자료입니다.",
    body: "동급 대비 25% 향상된 토출 풍량, 통합 원격 모니터링, ISO 8573-1 Class 0 오일프리 등급. 제2공장 증설 등 대용량 공기 수요 대응에 적합합니다. 상세 스펙과 도입 사례는 담당 영업사원에게 요청해 주세요."
  },
  {
    id: "N-2026-009",
    category: "tech",
    categoryLabel: "기술자료",
    title: "터보압축기 노후 교체 판단 기준 (Runtime·Overhaul 사이클)",
    date: "2026.07.20",
    summary: "CorePress 터보압축기의 오버홀 주기와 교체 판정 기준을 정리한 기술 가이드입니다.",
    body: "누적 운전시간 60,000시간 초과, 3회 이상 진동 이상 리포트, 오일 필터 및 O-Ring 부품 3세대 이상 교체 이력이 있는 설비는 교체 검토 대상입니다. 고객 포털의 보유 설비 상세 화면에서 각 설비의 누적 운전시간과 이력을 확인하실 수 있습니다."
  }
];

const CATEGORY_ORDER = ["all", "notice", "warranty", "tech"];
const CATEGORY_LABELS = {
  all: "전체",
  notice: "공지",
  warranty: "보증만료",
  tech: "기술자료"
};

export default class CpPortalNotices extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceUrl = "service-request";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
  logoUrl = headerLogo;
  logoutIconUrl = logoutIcon;
  activeCategory = "all";
  expandedId = "";

  get filteredNotices() {
    const items = this.activeCategory === "all"
      ? NOTICES
      : NOTICES.filter((n) => n.category === this.activeCategory);
    return items.map((n) => ({
      ...n,
      isExpanded: n.id === this.expandedId,
      itemClass: n.id === this.expandedId ? "notice open" : "notice",
      badgeClass: `badge ${n.category}`
    }));
  }

  get categoryTabs() {
    return CATEGORY_ORDER.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      count: key === "all" ? NOTICES.length : NOTICES.filter((n) => n.category === key).length,
      tabClass: this.activeCategory === key ? "tab active" : "tab"
    }));
  }

  get hasResults() {
    return this.filteredNotices.length > 0;
  }

  selectCategory(event) {
    this.activeCategory = event.currentTarget.dataset.key;
    this.expandedId = "";
  }

  toggleNotice(event) {
    const id = event.currentTarget.dataset.id;
    this.expandedId = this.expandedId === id ? "" : id;
  }

  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
