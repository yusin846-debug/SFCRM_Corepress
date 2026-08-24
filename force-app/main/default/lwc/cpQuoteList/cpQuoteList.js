import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import getQuotesForAccount from '@salesforce/apex/CpQuoteController.getQuotesForAccount';
import USER_ID from '@salesforce/user/Id';
import USER_CONTACT_ID from '@salesforce/schema/User.ContactId';
import CONTACT_ACCOUNT_ID from '@salesforce/schema/Contact.AccountId';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';
import logoutIcon from '@salesforce/resourceUrl/CorePressLogoutWhiteIcon';

const STATUS_LABELS = {
  Draft: '작성 중',
  'Needs Review': '검토 대기',
  'In Review': '검토 중',
  Approved: '승인됨',
  Presented: '확인 필요',
  Accepted: '수락 완료',
  Rejected: '반려됨',
  Denied: '거절됨',
};

export default class CpQuoteList extends LightningElement {
  @api homeUrl = 'portal-home';
  @api assetListUrl = 'asset-list';
  @api serviceUrl = 'service-request';
  @api rfpUrl = 'rfp-rfq';
  @api quoteUrl = 'quotes';
  headerLogoUrl = headerLogo;
  logoutIconUrl = logoutIcon;
  quotes = [];
  isPreview = true;
  isLoading = true;
  loadError = '';
  activeFilter = 'all';
  selectedId = '';
  isTransitioning = false;
  transitionTimer;

  @wire(getRecord, { recordId: USER_ID, fields: [USER_CONTACT_ID] })
  userRecord;
  get contactId() { return getFieldValue(this.userRecord.data, USER_CONTACT_ID); }

  @wire(getRecord, { recordId: '$contactId', fields: [CONTACT_ACCOUNT_ID] })
  contactRecord;
  get accountId() { return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID); }

  @wire(getQuotesForAccount, { accountId: '$accountId' })
  wiredQuotes({ data, error }) {
    if (data) {
      this.quotes = data.map((quote) => this.mapQuote(quote));
      this.isPreview = false;
      this.isLoading = false;
      this.loadError = '';
      if (!this.quotes.some((quote) => quote.id === this.selectedId)) {
        this.selectedId = this.quotes[0]?.id || '';
      }
      return;
    }
    if (error) {
      this.quotes = [];
      this.isPreview = false;
      this.isLoading = false;
      this.loadError = '견적 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }
  }

  renderedCallback() {
    if (this.isLoading && this.userRecord.data && !this.contactId) {
      this.isLoading = false;
    }
  }

  mapQuote(quote) {
    const state = quote.status === 'Accepted' ? 'accepted' : 'pending';
    return {
      id: quote.id,
      number: quote.quoteNumber || '-',
      title: quote.name || '제목 미등록',
      createdDate: this.formatDate(quote.createdDate),
      expiryDate: quote.expirationDate ? this.formatDate(quote.expirationDate) : '미정',
      validityLabel: this.validityLabel(quote),
      status: STATUS_LABELS[quote.status] || quote.status,
      state,
      subtotal: this.formatCurrency(quote.subtotal),
      tax: this.formatCurrency(quote.tax),
      total: this.formatCurrency(quote.grandTotal),
      totalWithTax: this.formatCurrency(quote.grandTotal),
      contentDocumentId: quote.contentDocumentId,
      items: (quote.lineItems || []).map((item, index) => ({
        key: `${quote.id}-${index}`,
        name: item.productName || '품목 미등록',
        description: item.description || '',
        quantity: item.quantity != null ? `${item.quantity}개` : '-',
        amount: this.formatCurrency(item.totalPrice),
      })),
    };
  }

  validityLabel(quote) {
    if (quote.status === 'Accepted') return '수락 완료';
    if (!quote.expirationDate) return '기한 미정';
    const days = Math.ceil(
      (new Date(`${quote.expirationDate}T00:00:00`) - new Date(new Date().toDateString())) / 86400000
    );
    if (days < 0) return '기한 만료';
    return `D-${days}`;
  }

  formatDate(value) {
    if (!value) return '';
    const isoValue = value.length > 10 ? value : `${value}T00:00:00`;
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(new Date(isoValue))
      .replace(/\. /g, '.')
      .replace(/\.$/, '');
  }

  formatCurrency(value) {
    return value == null ? '-' : `₩${new Intl.NumberFormat('ko-KR').format(value)}`;
  }

  disconnectedCallback() {
    window.clearTimeout(this.transitionTimer);
  }

  get totalCount() { return this.quotes.length; }
  get pendingCount() { return this.quotes.filter((quote) => quote.state === 'pending').length; }
  get acceptedCount() { return this.quotes.filter((quote) => quote.state === 'accepted').length; }
  get filteredQuotes() {
    return this.quotes
      .filter((quote) => this.activeFilter === 'all' || quote.state === this.activeFilter)
      .map((quote) => ({
        ...quote,
        rowClass: `quote-row ${quote.id === this.selectedId ? 'selected' : ''}`,
        statusClass: `status ${quote.state}`,
        validityClass: quote.state === 'pending' ? 'deadline' : ''
      }));
  }
  get filteredCount() { return this.filteredQuotes.length; }
  get hasQuotes() { return this.filteredQuotes.length > 0; }
  get hasAnyQuotes() { return this.totalCount > 0; }
  get showPreviewNotice() { return !this.isLoading && this.isPreview; }
  get selectedQuote() {
    const quote = this.quotes.find((item) => item.id === this.selectedId);
    return quote ? { ...quote, statusClass: `status ${quote.state}`, validityClass: quote.state === 'pending' ? 'deadline' : '' } : null;
  }
  get listClass() { return `list-body ${this.isTransitioning ? 'is-changing' : ''}`; }
  get allFilterClass() { return this.filterClass('all'); }
  get pendingFilterClass() { return this.filterClass('pending'); }
  get acceptedFilterClass() { return this.filterClass('accepted'); }
  get downloadUrl() {
    return this.selectedQuote?.contentDocumentId
      ? `/sfc/servlet.shepherd/document/download/${this.selectedQuote.contentDocumentId}`
      : '';
  }

  filterClass(filter) { return this.activeFilter === filter ? 'active' : ''; }
  changeFilter(event) {
    const nextFilter = event.currentTarget.dataset.filter;
    if (nextFilter === this.activeFilter) return;
    this.isTransitioning = true;
    window.clearTimeout(this.transitionTimer);
    this.transitionTimer = window.setTimeout(() => {
      this.activeFilter = nextFilter;
      const visible = this.quotes.filter((quote) => nextFilter === 'all' || quote.state === nextFilter);
      if (!visible.some((quote) => quote.id === this.selectedId)) this.selectedId = visible[0]?.id || '';
      this.isTransitioning = false;
    }, 140);
  }
  selectQuote(event) {
    this.selectedId = event.currentTarget.dataset.id;
  }
  handleLogout() {
    const returnUrl = encodeURIComponent('/corepress/s/login');
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
