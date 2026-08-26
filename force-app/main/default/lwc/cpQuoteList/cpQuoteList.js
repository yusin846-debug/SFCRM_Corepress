import { LightningElement, api, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import getQuotesForAccount from "@salesforce/apex/CpQuoteController.getQuotesForAccount";
import updateQuoteStatus from "@salesforce/apex/CpQuoteController.updateQuoteStatus";
import USER_ID from "@salesforce/user/Id";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import CONTACT_ACCOUNT_NAME from "@salesforce/schema/Contact.Account.Name";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";

const STATUS_LABELS = {
  Draft: "작성 중",
  "Needs Review": "검토 대기",
  "In Review": "검토 중",
  Approved: "승인됨",
  Presented: "확인 필요",
  Accepted: "수락 완료",
  Rejected: "반려됨",
  Denied: "거절됨"
};

const APPROVABLE_STATUSES = new Set(["Presented", "Needs Review", "In Review"]);

export default class CpQuoteList extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceUrl = "service-request";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
  headerLogoUrl = headerLogo;
  logoutIconUrl = logoutIcon;
  quotes = [];
  isPreview = true;
  isLoading = true;
  loadError = "";
  activeFilter = "all";
  selectedId = "";

  pendingAction = "";
  isSubmitting = false;
  actionError = "";
  actionMessage = "";

  wiredQuotesResult;

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

  @wire(getQuotesForAccount, { accountId: "$accountId" })
  wiredQuotes(result) {
    this.wiredQuotesResult = result;
    const { data, error } = result;
    if (data) {
      this.quotes = data.map((quote) => this.mapQuote(quote));
      this.isPreview = false;
      this.isLoading = false;
      this.loadError = "";
      if (!this.quotes.some((quote) => quote.id === this.selectedId)) {
        this.selectedId = this.quotes[0]?.id || "";
      }
      return;
    }
    if (error) {
      this.quotes = [];
      this.isPreview = false;
      this.isLoading = false;
      this.loadError =
        "견적 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  renderedCallback() {
    if (this.isLoading && this.userRecord.data && !this.contactId) {
      this.isLoading = false;
    }
  }

  mapQuote(quote) {
    const state =
      quote.status === "Accepted"
        ? "accepted"
        : quote.status === "Rejected" || quote.status === "Denied"
          ? "rejected"
          : "pending";
    return {
      id: quote.id,
      number: quote.quoteNumber || "-",
      title: quote.name || "제목 미등록",
      createdDate: this.formatDate(quote.createdDate),
      expiryDate: quote.expirationDate
        ? this.formatDate(quote.expirationDate)
        : "미정",
      validityLabel: this.validityLabel(quote),
      status: STATUS_LABELS[quote.status] || quote.status,
      rawStatus: quote.status,
      state,
      canAct: APPROVABLE_STATUSES.has(quote.status),
      subtotal: this.formatCurrency(quote.subtotal),
      tax: this.formatCurrency(quote.tax),
      total: this.formatCurrency(quote.grandTotal),
      totalWithTax: this.formatCurrency(quote.grandTotal),
      contentDocumentId: quote.contentDocumentId,
      items: (quote.lineItems || []).map((item, index) => ({
        key: `${quote.id}-${index}`,
        name: item.productName || "품목 미등록",
        description: item.description || "",
        quantity: item.quantity != null ? `${item.quantity}개` : "-",
        amount: this.formatCurrency(item.totalPrice)
      }))
    };
  }

  validityLabel(quote) {
    if (quote.status === "Accepted") return "수락 완료";
    if (quote.status === "Rejected" || quote.status === "Denied")
      return "반려됨";
    if (!quote.expirationDate) return "기한 미정";
    const days = Math.ceil(
      (new Date(`${quote.expirationDate}T00:00:00`) -
        new Date(new Date().toDateString())) /
        86400000
    );
    if (days < 0) return "기한 만료";
    return `D-${days}`;
  }

  formatDate(value) {
    if (!value) return "";
    const isoValue = value.length > 10 ? value : `${value}T00:00:00`;
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .format(new Date(isoValue))
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  }

  formatCurrency(value) {
    return value == null
      ? "-"
      : `₩${new Intl.NumberFormat("ko-KR").format(value)}`;
  }

  get totalCount() {
    return this.quotes.length;
  }
  get pendingCount() {
    return this.quotes.filter((quote) => quote.state === "pending").length;
  }
  get acceptedCount() {
    return this.quotes.filter((quote) => quote.state === "accepted").length;
  }
  get filteredQuotes() {
    return this.quotes
      .filter(
        (quote) =>
          this.activeFilter === "all" || quote.state === this.activeFilter
      )
      .map((quote) => ({
        ...quote,
        rowClass: `quote-row ${quote.id === this.selectedId ? "selected" : ""}`,
        statusClass: `status ${quote.state}`,
        validityClass: quote.state === "pending" ? "deadline" : ""
      }));
  }
  get filteredCount() {
    return this.filteredQuotes.length;
  }
  get hasQuotes() {
    return this.filteredQuotes.length > 0;
  }
  get hasAnyQuotes() {
    return this.totalCount > 0;
  }
  get showPreviewNotice() {
    return !this.isLoading && this.isPreview;
  }
  get selectedQuote() {
    const quote = this.quotes.find((item) => item.id === this.selectedId);
    return quote
      ? {
          ...quote,
          statusClass: `status ${quote.state}`,
          validityClass: quote.state === "pending" ? "deadline" : ""
        }
      : null;
  }
  get allFilterClass() {
    return this.filterClass("all");
  }
  get pendingFilterClass() {
    return this.filterClass("pending");
  }
  get acceptedFilterClass() {
    return this.filterClass("accepted");
  }
  get downloadUrl() {
    return this.selectedQuote?.contentDocumentId
      ? `/sfc/servlet.shepherd/document/download/${this.selectedQuote.contentDocumentId}`
      : "";
  }
  get isApproveSubmitting() {
    return this.isSubmitting && this.pendingAction === "approve";
  }
  get isRejectSubmitting() {
    return this.isSubmitting && this.pendingAction === "reject";
  }
  get approveLabel() {
    return this.isApproveSubmitting ? "승인 처리 중…" : "견적 승인";
  }
  get rejectLabel() {
    return this.isRejectSubmitting ? "반려 처리 중…" : "견적 반려";
  }

  filterClass(filter) {
    return this.activeFilter === filter ? "active" : "";
  }
  changeFilter(event) {
    const nextFilter = event.currentTarget.dataset.filter;
    if (nextFilter === this.activeFilter) return;
    this.activeFilter = nextFilter;
    const visible = this.quotes.filter(
      (quote) => nextFilter === "all" || quote.state === nextFilter
    );
    if (!visible.some((quote) => quote.id === this.selectedId))
      this.selectedId = visible[0]?.id || "";
  }
  selectQuote(event) {
    this.selectedId = event.currentTarget.dataset.id;
    this.actionError = "";
    this.actionMessage = "";
    this.pendingAction = "";
  }

  handleApprove() {
    this.confirmAction("approve");
  }
  handleReject() {
    this.confirmAction("reject");
  }

  confirmAction(action) {
    if (!this.selectedQuote || this.isSubmitting) return;
    if (this.pendingAction === action) {
      this.submitAction(action);
      return;
    }
    this.pendingAction = action;
    this.actionError = "";
    this.actionMessage =
      action === "approve"
        ? `견적 ${this.selectedQuote.number}을(를) 승인합니다. 확인하려면 [견적 승인]을 한 번 더 누르세요.`
        : `견적 ${this.selectedQuote.number}을(를) 반려합니다. 확인하려면 [견적 반려]를 한 번 더 누르세요.`;
  }

  async submitAction(action) {
    if (!this.selectedQuote || this.isSubmitting) return;
    this.isSubmitting = true;
    this.actionError = "";
    this.actionMessage = "";
    try {
      await updateQuoteStatus({ quoteId: this.selectedQuote.id, action });
      this.actionMessage =
        action === "approve"
          ? "견적이 승인되었습니다."
          : "견적이 반려되었습니다.";
      await refreshApex(this.wiredQuotesResult);
    } catch (err) {
      this.actionError =
        err?.body?.message ||
        (action === "approve"
          ? "승인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
          : "반려 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      this.isSubmitting = false;
      this.pendingAction = "";
    }
  }

  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
