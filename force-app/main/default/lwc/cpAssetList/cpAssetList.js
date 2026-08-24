import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
import USER_ID from "@salesforce/user/Id";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import ASSET_ID from "@salesforce/schema/Asset.Id";
import ASSET_NAME from "@salesforce/schema/Asset.Name";
import ASSET_SERIAL from "@salesforce/schema/Asset.SerialNumber";
import ASSET_STATUS from "@salesforce/schema/Asset.Status";
import ASSET_INSTALL_DATE from "@salesforce/schema/Asset.InstallDate";
import ASSET_CITY from "@salesforce/schema/Asset.City";
import ASSET_STREET from "@salesforce/schema/Asset.Street";
import ASSET_PRODUCT_NAME from "@salesforce/schema/Asset.Product2.Name";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import cp100 from "@salesforce/resourceUrl/CorePressCP100";
import cp2100 from "@salesforce/resourceUrl/CorePressCP2100";
import cp7100 from "@salesforce/resourceUrl/CorePressCP7100";
import locationIcon from "@salesforce/resourceUrl/CorePressLocationIcon";
import operatingIcon from "@salesforce/resourceUrl/CorePressSummaryOperatingIcon";
import warningIcon from "@salesforce/resourceUrl/CorePressSummaryWarningIcon";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";
import registeredIcon from "@salesforce/resourceUrl/CorePressRegisteredIcon";
import searchIcon from "@salesforce/resourceUrl/CorePressSearchIcon";
import gridIconActive from "@salesforce/resourceUrl/CorePressGridIconActive";
import gridIconInactive from "@salesforce/resourceUrl/CorePressGridIconInactive";
import listIconActive from "@salesforce/resourceUrl/CorePressListIconActive";
import listIconInactive from "@salesforce/resourceUrl/CorePressListIconInactive";

const ASSET_FIELDS = [
  ASSET_ID,
  ASSET_NAME,
  ASSET_SERIAL,
  ASSET_STATUS,
  ASSET_INSTALL_DATE,
  ASSET_CITY,
  ASSET_STREET,
  ASSET_PRODUCT_NAME,
];

export default class CpAssetList extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceUrl = "service-request";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
  @api detailUrl = "asset-detail";
  logoUrl = logo;
  locationIconUrl = locationIcon;
  logoutIconUrl = logoutIcon;
  registeredIconUrl = registeredIcon;
  summaryOperatingIconUrl = operatingIcon;
  summaryWarningIconUrl = warningIcon;
  searchIconUrl = searchIcon;
  searchTerm = "";
  activeFilter = "전체";
  pendingFilter = "";
  isFiltering = false;
  filterTimer;
  viewMode = "grid";
  currentPage = 1;
  pageSize = 6;
  assets = [];
  isPreview = true;
  isLoading = true;
  loadError = "";

  @wire(getRecord, { recordId: USER_ID, fields: [USER_CONTACT_ID] })
  userRecord;

  get contactId() {
    return getFieldValue(this.userRecord.data, USER_CONTACT_ID);
  }

  @wire(getRecord, { recordId: "$contactId", fields: [CONTACT_ACCOUNT_ID] })
  contactRecord;

  get accountId() {
    return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID);
  }

  @wire(getRelatedListRecords, {
    parentRecordId: "$accountId",
    relatedListId: "Assets",
    fields: ASSET_FIELDS,
    sortBy: ["Asset.InstallDate"],
    pageSize: 199,
  })
  wiredAssets({ data, error }) {
    if (data) {
      this.assets = data.records.map((record) => this.mapAsset(record));
      this.isPreview = false;
      this.isLoading = false;
      this.loadError = "";
      return;
    }
    if (error) {
      this.assets = [];
      this.isPreview = false;
      this.isLoading = false;
      this.loadError = "설비 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  renderedCallback() {
    if (this.isLoading && this.userRecord.data && !this.contactId) {
      this.isLoading = false;
    }
  }

  mapAsset(record) {
    const model = getFieldValue(record, ASSET_PRODUCT_NAME) || "모델 미등록";
    const sourceStatus = getFieldValue(record, ASSET_STATUS) || "Registered";
    const isRunning = sourceStatus === "Installed" || sourceStatus === "Registered";
    const isObsolete = sourceStatus === "Obsolete";
    const city = getFieldValue(record, ASSET_CITY);
    const street = getFieldValue(record, ASSET_STREET);
    const id = getFieldValue(record, ASSET_ID);
    let displayStatus = "운전 중";
    let statusClass = "status running";
    let statusIcon = operatingIcon;
    if (isObsolete) {
      displayStatus = "교체 필요";
      statusClass = "status attention";
      statusIcon = warningIcon;
    } else if (!isRunning) {
      displayStatus = "점검 필요";
      statusClass = "status attention";
      statusIcon = warningIcon;
    }
    return {
      id,
      model,
      name: getFieldValue(record, ASSET_NAME) || "설비명 미등록",
      serial: getFieldValue(record, ASSET_SERIAL) || "시리얼 미등록",
      location: [city, street].filter(Boolean).join(" ") || "설치 위치 미등록",
      status: displayStatus,
      sourceStatus,
      statusClass,
      statusIcon,
      imageUrl: this.resolveImage(model),
      installDate: this.formatDate(getFieldValue(record, ASSET_INSTALL_DATE)),
      detailUrl: `${this.detailUrl}?recordId=${id}`,
    };
  }

  resolveImage(model) {
    const normalized = model.trim().toUpperCase();
    if (normalized === "CP7100+" || normalized.startsWith("CP7100")) return cp7100;
    if (normalized === "CP2100" || normalized.startsWith("CP21")) return cp2100;
    if (normalized === "CP100 PRO" || normalized === "CP100") return cp100;
    return cp7100;
  }

  formatDate(value) {
    if (!value) return "미등록";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(`${value}T00:00:00`)).replaceAll(". ", ".").replace(/\.$/, "");
  }

  get filteredAssets() {
    const term = this.searchTerm.trim().toLowerCase();
    return this.assets.filter((asset) => {
      const matchesFilter =
        this.activeFilter === "전체" ||
        (this.activeFilter === "운전 중" && asset.status === "운전 중") ||
        (this.activeFilter === "이상" && asset.status !== "운전 중");
      const matchesTerm =
        !term ||
        `${asset.name} ${asset.serial} ${asset.model}`
          .toLowerCase()
          .includes(term);
      return matchesFilter && matchesTerm;
    });
  }

  get showPreviewNotice() {
    return !this.isLoading && this.isPreview;
  }
  get showSkeleton() {
    return this.isLoading;
  }
  get showEmpty() {
    return !this.isLoading && !this.loadError && this.filteredAssets.length === 0;
  }
  get skeletonRows() {
    return [1, 2, 3];
  }

  get resultsLabel() {
    return `총 ${this.filteredAssets.length}건`;
  }
  get totalAssetCount() {
    return this.assets.length;
  }
  get runningAssetCount() {
    return this.assets.filter((asset) => asset.status === "운전 중").length;
  }
  get attentionAssetCount() {
    return this.assets.filter((asset) => asset.status !== "운전 중").length;
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredAssets.length / this.pageSize));
  }
  get paginatedAssets() {
    const safePage = Math.min(this.currentPage, this.totalPages);
    const start = (safePage - 1) * this.pageSize;
    return this.filteredAssets.slice(start, start + this.pageSize);
  }
  get gridClass() {
    const viewClass = this.viewMode === "grid" ? "asset-grid" : "asset-grid list-view";
    return this.isFiltering ? `${viewClass} is-filtering` : viewClass;
  }
  get selectedFilter() {
    return this.pendingFilter || this.activeFilter;
  }
  get isGridView() {
    return this.viewMode === "grid";
  }
  get isListView() {
    return this.viewMode === "list";
  }
  get currentGridIconUrl() {
    return this.isGridView ? gridIconActive : gridIconInactive;
  }
  get currentListIconUrl() {
    return this.isListView ? listIconActive : listIconInactive;
  }
  get allFilterClass() {
    return this.selectedFilter === "전체" ? "filter active" : "filter";
  }
  get runningFilterClass() {
    return this.selectedFilter === "운전 중" ? "filter active" : "filter";
  }
  get attentionFilterClass() {
    return this.selectedFilter === "이상" ? "filter active" : "filter";
  }
  get gridButtonClass() {
    return this.viewMode === "grid" ? "view-button active" : "view-button";
  }
  get listButtonClass() {
    return this.viewMode === "list" ? "view-button active" : "view-button";
  }

  handleSearch(event) {
    this.searchTerm = event.target.value;
    this.currentPage = 1;
  }
  handlePageChange(event) {
    const requestedPage = Number.parseInt(event.target.value, 10);
    this.currentPage = Number.isFinite(requestedPage)
      ? Math.min(Math.max(requestedPage, 1), this.totalPages)
      : 1;
    event.target.value = this.currentPage;
  }
  showAll() {
    this.applyFilter("전체");
  }
  showRunning() {
    this.applyFilter("운전 중");
  }
  showAttention() {
    this.applyFilter("이상");
  }
  applyFilter(filter) {
    window.clearTimeout(this.filterTimer);
    this.pendingFilter = filter;
    this.isFiltering = true;
    this.filterTimer = window.setTimeout(() => {
      this.activeFilter = filter;
      this.currentPage = 1;
      this.pendingFilter = "";
      window.requestAnimationFrame(() => {
        this.isFiltering = false;
      });
    }, 140);
  }
  showGrid() {
    this.viewMode = "grid";
  }
  showList() {
    this.viewMode = "list";
  }
  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
  disconnectedCallback() {
    window.clearTimeout(this.filterTimer);
  }
}