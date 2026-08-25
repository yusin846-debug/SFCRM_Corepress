import { LightningElement, api, wire } from "lwc";
import getEquipmentCatalog from "@salesforce/apex/CpProductCatalogController.getEquipmentCatalog";
import { resolveProductImage } from "c/cpProductImages";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";

const FAMILY_TABS = [
  { key: "전체", label: "전체" },
  { key: "압축기", label: "압축기" },
  { key: "드라이어", label: "드라이어" },
  { key: "필터·부품", label: "부품" }
];

export default class CpProductList extends LightningElement {
  @api homeUrl = "/corepress";
  @api detailUrl = "product-detail";
  @api inquiryUrl = "/corepress";
  logoUrl = headerLogo;
  logoutIconUrl = logoutIcon;
  activeFamily = "전체";
  isLoading = true;
  loadError = "";
  products = [];

  @wire(getEquipmentCatalog)
  wiredCatalog({ data, error }) {
    if (data) {
      this.products = data.map((p) => this.mapProduct(p));
      this.isLoading = false;
      this.loadError = "";
    } else if (error) {
      this.products = [];
      this.isLoading = false;
      this.loadError = "제품 카탈로그를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  mapProduct(p) {
    const img = resolveProductImage(p.name, p.family);
    return {
      id: p.id,
      name: p.name,
      family: p.family,
      description: p.description || "",
      priceLabel: p.standardPrice == null ? "가격 문의" : `₩${new Intl.NumberFormat("ko-KR").format(p.standardPrice)}`,
      hasRealImage: img.type === "image",
      imageSrc: img.src,
      placeholderClass: p.family === "드라이어" ? "placeholder dryer" : "placeholder compressor",
      detailHref: `${this.detailUrl}?recordId=${p.id}`
    };
  }

  get filteredProducts() {
    if (this.activeFamily === "전체") return this.products;
    return this.products.filter((p) => p.family === this.activeFamily);
  }
  get hasProducts() {
    return this.filteredProducts.length > 0;
  }
  get tabButtons() {
    return FAMILY_TABS.map((tab) => ({
      key: tab.key,
      label: tab.label,
      count: tab.key === "전체" ? this.products.length : this.products.filter((p) => p.family === tab.key).length,
      tabClass: this.activeFamily === tab.key ? "tab active" : "tab"
    }));
  }
  get resultsLabel() {
    return `총 ${this.filteredProducts.length}개 제품`;
  }
  get showSkeleton() {
    return this.isLoading;
  }
  get skeletonRows() {
    return [1, 2, 3, 4];
  }

  selectFamily(event) {
    this.activeFamily = event.currentTarget.dataset.key;
  }

  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
