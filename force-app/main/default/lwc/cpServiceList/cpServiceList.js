import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
import { CurrentPageReference } from "lightning/navigation";
import USER_ID from "@salesforce/user/Id";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_NAME from "@salesforce/schema/Contact.Name";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import ACCOUNT_NAME from "@salesforce/schema/Account.Name";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";
import searchIcon from "@salesforce/resourceUrl/CorePressSearchIcon";

const CASE_FIELDS = [
  "Case.Id",
  "Case.CaseNumber",
  "Case.Subject",
  "Case.Status",
  "Case.Type",
  "Case.CreatedDate",
  "Case.Engineer_Name__c",
  "Case.Scheduled_Visit__c",
  "Case.Asset.Name",
];

const OPEN_STATUSES = ["신규접수", "판정완료", "배정완료", "진행중", "대기 중"];

export default class CpServiceList extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceUrl = "service-request";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
  @api detailUrl = "service-detail";
  logoUrl = logo;
  logoutIconUrl = logoutIcon;
  searchIconUrl = searchIcon;
  searchTerm = "";
  activeFilter = "전체";
  assetFilterId = "";
  currentPage = 1;
  pageSize = 10;
  requests = [];
  isPreview = true;
  isLoading = true;
  loadError = "";

  @wire(CurrentPageReference)
  setPageReference(pageReference) {
    this.assetFilterId = pageReference?.state?.assetId || this.readAssetIdFromUrl();
  }

  readAssetIdFromUrl() {
    try {
      return new URL(window.location.href).searchParams.get("assetId") || "";
    } catch (error) {
      return "";
    }
  }

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
    relatedListId: "Cases",
    fields: CASE_FIELDS,
    sortBy: ["-Case.CreatedDate"],
    pageSize: 199,
  })
  wiredCases({ data, error }) {
    if (data) {
      this.requests = data.records.map((record) => this.mapCase(record));
      this.isPreview = false;
      this.isLoading = false;
      this.loadError = "";
      return;
    }
    if (error) {
      this.requests = [];
      this.isPreview = false;
      this.isLoading = false;
      this.loadError = "서비스 요청 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  renderedCallback() {
    if (this.isLoading && this.userRecord.data && !this.contactId) {
      this.isLoading = false;
    }
  }

  mapCase(record) {
    const id = record.fields.Id?.value || record.id;
    const status = record.fields.Status?.value || "신규접수";
    return {
      id,
      number: record.fields.CaseNumber?.value || "-",
      subject: record.fields.Subject?.value || "내용 미등록",
      type: record.fields.Type?.value || "-",
      status,
      isOpen: OPEN_STATUSES.includes(status),
      statusClass: OPEN_STATUSES.includes(status) ? "badge open" : "badge done",
      assetName: record.fields.Asset?.value?.fields?.Name?.value || "설비 미지정",
      assetId: record.fields.AssetId?.value || "",
      createdDate: this.formatDateTime(record.fields.CreatedDate?.value),
      visitDate: this.formatDateTime(record.fields.Scheduled_Visit__c?.value) || "미정",
      engineer: record.fields.Engineer_Name__c?.value || "배정 전",
      detailHref: `${this.detailUrl}?recordId=${id}`,
    };
  }

  formatDateTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(new Date(value))
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  }

  get filteredRequests() {
    const term = this.searchTerm.trim().toLowerCase();
    return this.requests.filter((request) => {
      const matchesAsset = !this.assetFilterId || request.assetId === this.assetFilterId;
      const matchesFilter =
        this.activeFilter === "전체" ||
        (this.activeFilter === "진행 중" && request.isOpen) ||
        (this.activeFilter === "완료" && !request.isOpen);
      const matchesTerm =
        !term ||
        `${request.subject} ${request.number} ${request.assetName}`.toLowerCase().includes(term);
      return matchesAsset && matchesFilter && matchesTerm;
    });
  }

  get openCount() {
    return this.requests.filter((request) => request.isOpen).length;
  }
  get doneCount() {
    return this.requests.filter((request) => !request.isOpen).length;
  }
  get showPreviewNotice() {
    return !this.isLoading && this.isPreview;
  }
  get showAssetFilterNotice() {
    return Boolean(this.assetFilterId);
  }
  get resultsLabel() {
    return `총 ${this.filteredRequests.length}건`;
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredRequests.length / this.pageSize));
  }
  get paginatedRequests() {
    const safePage = Math.min(this.currentPage, this.totalPages);
    const start = (safePage - 1) * this.pageSize;
    return this.filteredRequests.slice(start, start + this.pageSize);
  }
  get hasRequests() {
    return this.filteredRequests.length > 0;
  }
  get allFilterClass() {
    return this.activeFilter === "전체" ? "filter active" : "filter";
  }
  get openFilterClass() {
    return this.activeFilter === "진행 중" ? "filter active" : "filter";
  }
  get doneFilterClass() {
    return this.activeFilter === "완료" ? "filter active" : "filter";
  }

  handleSearch(event) {
    this.searchTerm = event.target.value;
    this.currentPage = 1;
  }
  showAll() {
    this.activeFilter = "전체";
    this.currentPage = 1;
  }
  showOpen() {
    this.activeFilter = "진행 중";
    this.currentPage = 1;
  }
  showDone() {
    this.activeFilter = "완료";
    this.currentPage = 1;
  }
  clearAssetFilter() {
    this.assetFilterId = "";
  }
  handlePageChange(event) {
    const requestedPage = Number.parseInt(event.target.value, 10);
    this.currentPage = Number.isFinite(requestedPage)
      ? Math.min(Math.max(requestedPage, 1), this.totalPages)
      : 1;
    event.target.value = this.currentPage;
  }
  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
