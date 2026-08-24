import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import USER_CONTACT_ID from '@salesforce/schema/User.ContactId';
import CONTACT_NAME from '@salesforce/schema/Contact.Name';
import CONTACT_ACCOUNT_ID from '@salesforce/schema/Contact.AccountId';
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

const QUOTES = [
  {
    id: 'QT-2026-0089',
    title: '제2공장 증설 압축기 도입',
    createdDate: '2026.08.01',
    expiryDate: '2026.09.01',
    status: '확인 필요',
    state: 'pending',
    validityLabel: 'D-13',
    subtotal: '₩2,850,000,000',
    tax: '₩285,000,000',
    total: '₩2,850,000,000',
    totalWithTax: '₩3,135,000,000',
    items: [
      { name: 'CP7100+ 본체', description: '고유량 터보압축기, 통합 제어 포함', quantity: '2대', warranty: '24개월', amount: '₩2,400,000,000' },
      { name: '시운전 비용', description: '설치 확인 및 인수 성능 시험', quantity: '1식', warranty: '-', amount: '₩150,000,000' },
      { name: '설치 공사비', description: '기초, 배관 및 전기 인터페이스 공사', quantity: '1식', warranty: '-', amount: '₩300,000,000' }
    ]
  },
  {
    id: 'QT-2026-0045',
    title: '제1공장 노후 설비 교체',
    createdDate: '2026.06.15',
    expiryDate: '2026.07.15',
    status: '수락 완료',
    state: 'accepted',
    validityLabel: '수락 완료',
    subtotal: '₩1,200,000,000',
    tax: '₩120,000,000',
    total: '₩1,200,000,000',
    totalWithTax: '₩1,320,000,000',
    items: [
      { name: 'CP2100 본체', description: '컴팩트 저유량 압축기', quantity: '1대', warranty: '24개월', amount: '₩980,000,000' },
      { name: '설치 및 시운전', description: '기존 설비 철거 별도', quantity: '1식', warranty: '-', amount: '₩220,000,000' }
    ]
  }
];

export default class CpQuoteList extends LightningElement {
  @api homeUrl = 'portal-home';
  @api assetListUrl = 'asset-list';
  @api serviceUrl = 'service-request';
  @api rfpUrl = 'rfp-rfq';
  @api quoteUrl = 'quotes';
  headerLogoUrl = headerLogo;
  quotes = QUOTES;
  activeFilter = 'all';
  selectedId = QUOTES[0].id;
  isTransitioning = false;
  downloadMessage = '';
  transitionTimer;

  @wire(getRecord, { recordId: USER_ID, fields: [USER_CONTACT_ID] })
  userRecord;
  get contactId() { return getFieldValue(this.userRecord.data, USER_CONTACT_ID); }

  @wire(getRecord, { recordId: '$contactId', fields: [CONTACT_NAME, CONTACT_ACCOUNT_ID] })
  contactRecord;
  get contactName() { return getFieldValue(this.contactRecord.data, CONTACT_NAME); }
  get accountId() { return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID); }

  @wire(getRecord, { recordId: '$accountId', fields: [ACCOUNT_NAME] })
  accountRecord;
  get accountName() { return getFieldValue(this.accountRecord.data, ACCOUNT_NAME); }

  get headerLabel() {
    const real = [this.accountName, this.contactName].filter(Boolean).join(' · ');
    return real || '대한케미컬 · 김유신';
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
  get selectedQuote() {
    const quote = this.quotes.find((item) => item.id === this.selectedId);
    return quote ? { ...quote, statusClass: `status ${quote.state}`, validityClass: quote.state === 'pending' ? 'deadline' : '' } : null;
  }
  get listClass() { return `list-body ${this.isTransitioning ? 'is-changing' : ''}`; }
  get allFilterClass() { return this.filterClass('all'); }
  get pendingFilterClass() { return this.filterClass('pending'); }
  get acceptedFilterClass() { return this.filterClass('accepted'); }

  filterClass(filter) { return this.activeFilter === filter ? 'active' : ''; }
  changeFilter(event) {
    const nextFilter = event.currentTarget.dataset.filter;
    if (nextFilter === this.activeFilter) return;
    this.isTransitioning = true;
    window.clearTimeout(this.transitionTimer);
    this.transitionTimer = window.setTimeout(() => {
      this.activeFilter = nextFilter;
      const visible = this.quotes.filter((quote) => nextFilter === 'all' || quote.state === nextFilter);
      if (!visible.some((quote) => quote.id === this.selectedId)) this.selectedId = visible[0]?.id;
      this.isTransitioning = false;
    }, 140);
  }
  selectQuote(event) {
    this.selectedId = event.currentTarget.dataset.id;
    this.downloadMessage = '';
  }
  downloadQuote() {
    this.downloadMessage = '현재는 화면 확인용 예시입니다. 실제 PDF는 견적 파일 연동 후 다운로드됩니다.';
  }
  handleLogout() {
    window.location.assign('/secur/logout.jsp');
  }
}