import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
import USER_ID from "@salesforce/user/Id";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_NAME from "@salesforce/schema/Contact.Name";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import ACCOUNT_NAME from "@salesforce/schema/Account.Name";
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

const ASSETS = [
  {
    id: "1",
    model: "CP7100+",
    name: "터보압축기 #1",
    serial: "CP-2024-0847",
    location: "여수 제2공장 A동",
    status: "운전 중",
    statusClass: "status running",
    statusIcon: operatingIcon,
    imageUrl: cp7100,
    installDate: "2024.06.15",
  },
  {
    id: "2",
    model: "CP2100",
    name: "압축기 #2",
    serial: "CP-2024-0632",
    location: "울산 공장 B동",
    status: "운전 중",
    statusClass: "status running",
    statusIcon: operatingIcon,
    imageUrl: cp2100,
    installDate: "2024.03.28",
  },
  {
    id: "3",
    model: "CP100 Pro",
    name: "압축기 #3",
    serial: "CP-2024-0519",
    location: "대산 공장 C동",
    status: "운전 중",
    statusClass: "status running",
    statusIcon: operatingIcon,
    imageUrl: cp100,
    installDate: "2024.02.10",
  },
  {
    id: "4",
    model: "CP2100",
    name: "압축기 #4",
    serial: "CP-2024-0398",
    location: "여수 제1공장 D동",
    status: "운전 중",
    statusClass: "status running",
    statusIcon: operatingIcon,
    imageUrl: cp2100,
    installDate: "2024.01.18",
  },
  {
    id: "5",
    model: "CP7100+",
    name: "압축기 #5",
    serial: "CP-2024-0281",
    location: "울산 공장 E동",
    status: "점검 필요",
    statusClass: "status attention",
    statusIcon: warningIcon,
    imageUrl: cp7100,
    installDate: "2023.11.30",
  },
];

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
  assets = ASSETS;
  isPreview = true;
  isLoading = true;
  loadError = "";

  @wire(getRecord, { recordId: USER_ID, fields: [USER_CONTACT_ID] })
  userRecord;

  get contactId() {
    return getFieldValue(this.userRecord.data, USER_CONTACT_ID);
  }

  @wire(getRecord, { recordId: "$contactId", fields: [CONTACT_NAME, CONTACT_ACCOUNT_ID] })
  contactRecord;

  get contactName() {
    return getFieldValue(this.contactRecord.data, CONTACT_NAME);
  }

  get accountId() {
    return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID);
  }

  @wire(getRecord, { recordId: "$accountId", fields: [ACCOUNT_NAME] })
  accountRecord;

  get accountName() {
    return getFieldValue(this.accountRecord.data, ACCOUNT_NAME);
  }

  get headerLabel() {
    const real = [this.accountName, this.contactName].filter(Boolean).join(" · ");
    return real || "대한케미컬 · 김유신";
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
    const city = getFieldValue(record, ASSET_CITY);
    const street = getFieldValue(record, ASSET_STREET);
    const id = getFieldValue(record, ASSET_ID);
    return {
      id,
      model,
      name: getFieldValue(record, ASSET_NAME) || "설비명 미등록",
      serial: getFieldValue(record, ASSET_SERIAL) || "시리얼 미등록",
      location: [city, street].filter(Boolean).join(" ") || "설치 위치 미등록",
      status: isRunning ? "운전 중" : "점검 필요",
      sourceStatus,
      statusClass: isRunning ? "status running" : "status attention",
      statusIcon: isRunning ? operatingIcon : warningIcon,
      imageUrl: this.resolveImage(model),
      installDate: this.formatDate(getFieldValue(record, ASSET_INSTALL_DATE)),
      detailUrl: `${this.detailUrl}?recordId=${id}`,
    };
  }

  resolveImage(model) {
    const normalized = model.trim().toUpperCase();
    if (normalized === "CP7100+") return cp7100;
    if (normalized === "CP2100") return cp2100;
    return cp100;
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
        this.activeFilter === "전체" || asset.status === this.activeFilter;
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
    return this.assets.filter((asset) => asset.status === "점검 필요").length;
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
    return this.selectedFilter === "점검 필요" ? "filter active" : "filter";
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
    this.applyFilter("점검 필요");
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