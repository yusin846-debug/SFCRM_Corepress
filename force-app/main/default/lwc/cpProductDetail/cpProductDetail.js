import { LightningElement, api, wire } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import getProductDetail from "@salesforce/apex/CpProductCatalogController.getProductDetail";
import { resolveProductImage } from "c/cpProductImages";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";

const MARKETING_COPY = {
  compressor: {
    tagline: "CorePress 고효율 터보압축기 라인업",
    highlights: [
      { icon: "⚙", label: "인수 성능 시험", value: "ISO 8573-1 Class 0 오일프리 등급 대응" },
      { icon: "📶", label: "원격 모니터링", value: "통합 컨트롤러 및 IoT 진동 센서 옵션" },
      { icon: "🛠", label: "예방정비", value: "주기정비·유지보수·부품공급 3종 결합 계약 가능" }
    ],
    story: "제철·석유화학·반도체 등 24시간 연속 운전 라인에 검증된 고유량 터보압축기입니다. 신규 도입은 물론, 노후 설비 교체 시에도 기존 배관·전기 인터페이스와의 호환성을 사전 검토하여 시공 기간을 최소화합니다."
  },
  dryer: {
    tagline: "CorePress 흡착식·냉동식 에어드라이어",
    highlights: [
      { icon: "❄", label: "제습 성능", value: "PDP -40°C 이하 안정 유지" },
      { icon: "♻", label: "에너지 절감", value: "가변 부하 대응, 히트리스 재생 모드 지원" },
      { icon: "🔧", label: "유지보수", value: "프리·애프터 필터, 스위칭 밸브 키트 표준화" }
    ],
    story: "터보압축기와 함께 도입 시 시스템 전체 응축수 트러블을 근본적으로 억제합니다. 흡착식 라인은 반도체·의약품 등 초고청정 공정에, 냉동식은 일반 산업용 공기 공급에 적합합니다."
  }
};

export default class CpProductDetail extends LightningElement {
  @api homeUrl = "/corepress";
  @api productsUrl = "products";
  @api inquiryUrl = "/corepress";
  logoUrl = headerLogo;
  recordId;
  product;
  isLoading = true;
  loadError = "";

  @wire(CurrentPageReference)
  setPageReference(pageReference) {
    const state = pageReference?.state || {};
    this.recordId = state.recordId || state.c__recordId || this.readRecordId();
  }

  readRecordId() {
    try {
      return new URL(window.location.href).searchParams.get("recordId");
    } catch (error) {
      return null;
    }
  }

  @wire(getProductDetail, { productId: "$recordId" })
  wiredDetail({ data, error }) {
    if (data) {
      this.product = data;
      this.isLoading = false;
      this.loadError = "";
    } else if (error) {
      this.product = undefined;
      this.isLoading = false;
      this.loadError = "제품 상세 정보를 불러오지 못했습니다. 목록에서 다시 선택해 주세요.";
    } else if (data === null) {
      this.product = undefined;
      this.isLoading = false;
      this.loadError = "요청하신 제품을 찾을 수 없습니다.";
    }
  }

  get hasProduct() {
    return Boolean(this.product);
  }
  get familyKey() {
    return this.product?.family === "드라이어" ? "dryer" : "compressor";
  }
  get marketing() {
    return MARKETING_COPY[this.familyKey];
  }
  get imageInfo() {
    return resolveProductImage(this.product?.name, this.product?.family);
  }
  get hasRealImage() {
    return this.imageInfo.type === "image";
  }
  get imageSrc() {
    return this.imageInfo.src;
  }
  get placeholderClass() {
    return this.familyKey === "dryer" ? "hero-placeholder dryer" : "hero-placeholder compressor";
  }
  get priceLabel() {
    if (!this.product || this.product.standardPrice == null) return "가격 문의";
    return `₩${new Intl.NumberFormat("ko-KR").format(this.product.standardPrice)}`;
  }
  get expectedLifeLabel() {
    return this.product?.expectedLifeYears != null ? `${this.product.expectedLifeYears}년` : "-";
  }
  get overhaulLabel() {
    return this.product?.overhaulIntervalHours != null
      ? `${new Intl.NumberFormat("ko-KR").format(this.product.overhaulIntervalHours)}시간`
      : "-";
  }
  get consumableLabel() {
    if (this.product?.isConsumable == null) return "-";
    return this.product.isConsumable ? "예 (소모품)" : "아니오 (본체 설비)";
  }
  get inquiryHref() {
    if (!this.product) return this.inquiryUrl;
    const q = encodeURIComponent(this.product.name);
    return `${this.inquiryUrl}?inquiry=${q}#products`;
  }
  get description() {
    return this.product?.description || "상세 설명이 등록되지 않았습니다. 담당 영업사원에게 문의해 주세요.";
  }
}
