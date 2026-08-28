import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
import getHealthForAccount from "@salesforce/apex/CpAssetHealthController.getHealthForAccount";
import USER_ID from "@salesforce/user/Id";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import CONTACT_ACCOUNT_NAME from "@salesforce/schema/Contact.Account.Name";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import cp100 from "@salesforce/resourceUrl/CorePressCP100";
import cp2100 from "@salesforce/resourceUrl/CorePressCP2100";
import cp7100 from "@salesforce/resourceUrl/CorePressCP7100";
import { resolveProductImage } from "c/cpProductImages";
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
  "Asset.Id",
  "Asset.Name",
  "Asset.SerialNumber",
  "Asset.Status",
  "Asset.InstallDate",
  "Asset.City",
  "Asset.Street",
  "Asset.Product2.Name"
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

  @wire(getRecord, {
    recordId: "$contactId",
    fields: [CONTACT_ACCOUNT_ID, CONTACT_ACCOUNT_NAME]
  })
  contactRecord;

  get accountId() {
    return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID);
  }
  get accountName() {
    return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_NAME) || "";
  }

  assetRecords = [];
  healthByAsset = {};

  @wire(getRelatedListRecords, {
    parentRecordId: "$accountId",
    relatedListId: "Assets",
    fields: ASSET_FIELDS,
    sortBy: ["Asset.InstallDate"],
    pageSize: 199
  })
  wiredAssets({ data, error }) {
    if (data) {
      this.assetRecords = data.records;
      this.rebuildAssets();
      this.isPreview = false;
      this.isLoading = false;
      this.loadError = "";
      return;
    }
    if (error) {
      this.assetRecords = [];
      this.assets = [];
      this.isPreview = false;
      this.isLoading = false;
      this.loadError =
        "설비 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  @wire(getHealthForAccount, { accountId: "$accountId" })
  wiredHealth({ data }) {
    if (data) {
      this.healthByAsset = data.reduce((map, item) => {
        map[item.assetId] = item;
        return map;
      }, {});
      this.rebuildAssets();
    }
  }

  rebuildAssets() {
    this.assets = this.assetRecords.map((record) => this.mapAsset(record));
  }

  renderedCallback() {
    if (this.isLoading && this.userRecord.data && !this.contactId) {
      this.isLoading = false;
    }
  }

  mapAsset(record) {
    const assetName = record.fields.Name?.value || "설비명 미등록";
    const model =
      record.fields.Product2?.value?.fields?.Name?.value ||
      this.modelFromName(assetName);
    const sourceStatus = record.fields.Status?.value || "Registered";
    const city = record.fields.City?.value;
    const street = record.fields.Street?.value;
    const id = record.fields.Id?.value || record.id;

    const health = this.healthByAsset[id];
    const band = health?.band || "HEALTHY";
    const isAttention = band === "REPLACE" || band === "INSPECT";
    let displayStatus = health?.bandLabel || "양호";
    let statusClass = "status running";
    let statusIcon = operatingIcon;
    if (isAttention) {
      statusClass = "status attention";
      statusIcon = warningIcon;
    } else if (band === "WATCH") {
      statusClass = "status watch";
      statusIcon = warningIcon;
    } else if (band === "NO_DATA") {
      displayStatus = "데이터 확인 중";
      statusClass = "status muted";
    }
    return {
      id,
      model,
      name: assetName,
      serial: record.fields.SerialNumber?.value || "시리얼 미등록",
      location: [city, street].filter(Boolean).join(" ") || "설치 위치 미등록",
      status: displayStatus,
      sourceStatus,
      isAttention,
      statusClass,
      statusIcon,
      imageUrl: this.resolveImage(model),
      installDate: this.formatDate(record.fields.InstallDate?.value),
      detailUrl: `${this.detailUrl}?recordId=${id}`
    };
  }

  modelFromName(name) {
    return (
      (name || "").match(/(?:CP\d+(?:\s+Pro|\+)?|CD7000)/i)?.[0] ||
      "모델 미등록"
    );
  }

  resolveImage(model) {
    const resolved = resolveProductImage(model, "압축기");
    if (resolved.type === "image") return resolved.src;
    // Legacy fallback (shouldn't hit — resolver always returns an image for CP*)
    const normalized = (model || "").trim().toUpperCase();
    if (normalized === "CP7100+" || normalized.startsWith("CP7100"))
      return cp7100;
    if (normalized === "CP2100" || normalized.startsWith("CP21")) return cp2100;
    if (normalized === "CP100 PRO" || normalized === "CP100") return cp100;
    return cp7100;
  }

  formatDate(value) {
    if (!value) return "미등록";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .format(new Date(`${value}T00:00:00`))
      .replaceAll(". ", ".")
      .replace(/\.$/, "");
  }

  get filteredAssets() {
    const term = this.searchTerm.trim().toLowerCase();
    return this.assets.filter((asset) => {
      const matchesFilter =
        this.activeFilter === "전체" ||
        (this.activeFilter === "운전 중" && !asset.isAttention) ||
        (this.activeFilter === "이상" && asset.isAttention);
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
    return (
      !this.isLoading && !this.loadError && this.filteredAssets.length === 0
    );
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
    return this.assets.filter((asset) => !asset.isAttention).length;
  }
  get attentionAssetCount() {
    return this.assets.filter((asset) => asset.isAttention).length;
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
    const viewClass =
      this.viewMode === "grid" ? "asset-grid" : "asset-grid list-view";
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
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.filterTimer = window.setTimeout(() => {
      this.activeFilter = filter;
      this.currentPage = 1;
      this.pendingFilter = "";
      // eslint-disable-next-line @lwc/lwc/no-async-operation
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
