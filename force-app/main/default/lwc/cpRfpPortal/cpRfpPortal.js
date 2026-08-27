import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue, createRecord } from 'lightning/uiRecordApi';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import USER_ID from '@salesforce/user/Id';
import USER_NAME from '@salesforce/schema/User.Name';
import USER_EMAIL from '@salesforce/schema/User.Email';
import USER_CONTACT_ID from '@salesforce/schema/User.ContactId';
import CONTACT_NAME from '@salesforce/schema/Contact.Name';
import CONTACT_ACCOUNT_ID from '@salesforce/schema/Contact.AccountId';
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunity';
import OPPORTUNITY_NAME from '@salesforce/schema/Opportunity.Name';
import OPPORTUNITY_ACCOUNT_ID from '@salesforce/schema/Opportunity.AccountId';
import OPPORTUNITY_TYPE from '@salesforce/schema/Opportunity.Type';
import OPPORTUNITY_STAGE from '@salesforce/schema/Opportunity.StageName';
import OPPORTUNITY_CLOSE_DATE from '@salesforce/schema/Opportunity.CloseDate';
import OPPORTUNITY_DESCRIPTION from '@salesforce/schema/Opportunity.Description';
import syncLeadOnRfpSubmit from '@salesforce/apex/CpSalesPipelineController.syncLeadOnRfpSubmit';
import reassignOpportunityOwner from '@salesforce/apex/CpSalesPipelineController.reassignOpportunityOwner';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

const OPPORTUNITY_LIST_FIELDS = [
    'Opportunity.Id',
    'Opportunity.Name',
    'Opportunity.Type',
    'Opportunity.StageName',
    'Opportunity.CloseDate',
    'Opportunity.Description',
    'Opportunity.IsClosed'
];
const RFP_STAGES = ['RFP 검토중', '���체 제안', '숏리스트 선정'];
const RFQ_STAGES = ['RFQ 접수', '사양 협상', '견적 제출', '계약 검토', '경제성 검토', '예산 승인 대기', 'Closed Won', 'Closed Lost'];
const RFP_TYPE_MAP = {
    '신규 설비 도입': '신규 도입',
    '노후화 장비 교체': '설비 교체',
    '기타': 'Services'
};

export default class CpRfpPortal extends LightningElement {
    @api homeUrl = 'portal-home';
    @api assetListUrl = 'asset-list';
    @api serviceUrl = 'service-request';
    @api quoteUrl = 'quotes';
    headerLogoUrl = headerLogo;
    activeTab = 'issue';
    entryMode = 'portal';
    rfqEntryMode = 'portal';
    fileLabel = '선택된 파일 없음';
    rfqFileLabel = '선택된 파일 없음';
    showProductChange = false;
    isSubmittingRfp = false;
    isSubmittingRfq = false;
    rfpSubmitError = '';
    rfqSubmitError = '';
    openOpportunities = [];
    pipelineOpportunities = [];
    selectedRfpId = '';
    selectedRfqId = '';

    get showIssue() { return this.activeTab === 'issue'; }
    get showStatus() { return this.activeTab === 'status'; }
    get showRfq() { return this.activeTab === 'rfq'; }
    get showRfqStatus() { return this.activeTab === 'rfq-status'; }
    get issueTabClass() { return this.activeTab === 'issue' ? 'active' : ''; }
    get statusTabClass() { return this.activeTab === 'status' ? 'active' : ''; }
    get rfqTabClass() { return this.activeTab === 'rfq' ? 'active' : ''; }
    get rfqStatusTabClass() { return this.activeTab === 'rfq-status' ? 'active' : ''; }
    get isPortalMode() { return this.entryMode === 'portal'; }
    get isEmailMode() { return this.entryMode === 'email'; }
    get portalModeClass() { return `mode-option ${this.isPortalMode ? 'selected' : ''}`; }
    get emailModeClass() { return `mode-option ${this.isEmailMode ? 'selected' : ''}`; }
    get rfpLayoutClass() { return this.isEmailMode ? 'layout email-layout' : 'layout'; }
    get rfpSubmitLabel() { return this.isEmailMode ? '이메일 RFP 등록' : 'RFP 제출'; }
    get isRfqPortalMode() { return this.rfqEntryMode === 'portal'; }
    get isRfqEmailMode() { return this.rfqEntryMode === 'email'; }
    get rfqPortalModeClass() { return `mode-option ${this.isRfqPortalMode ? 'selected' : ''}`; }
    get rfqEmailModeClass() { return `mode-option ${this.isRfqEmailMode ? 'selected' : ''}`; }
    get rfqLayoutClass() { return this.isRfqEmailMode ? 'layout email-layout' : 'layout'; }
    get rfqSubmitLabel() { return this.isRfqEmailMode ? '이메일 RFQ 등록' : 'RFQ 제출'; }

    @wire(getRecord, { recordId: USER_ID, fields: [USER_NAME, USER_EMAIL, USER_CONTACT_ID] })
    currentUser;
    get customerName() { return getFieldValue(this.currentUser.data, USER_NAME) || '로그인 고객'; }
    get customerEmail() { return getFieldValue(this.currentUser.data, USER_EMAIL) || '계정 이메일 확인 중'; }
    get contactId() { return getFieldValue(this.currentUser.data, USER_CONTACT_ID); }

    @wire(getRecord, { recordId: '$contactId', fields: [CONTACT_NAME, CONTACT_ACCOUNT_ID] })
    contactRecord;
    get contactName() { return getFieldValue(this.contactRecord.data, CONTACT_NAME); }
    get accountId() { return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID); }
    get hasCustomerContext() { return Boolean(this.contactId && this.accountId); }
    get headerLabel() {
        const real = [this.accountName, this.contactName].filter(Boolean).join(' · ');
        return real || '대한케미컬 · 김유신';
    }

    @wire(getRecord, { recordId: '$accountId', fields: [ACCOUNT_NAME] })
    accountRecord;
    get accountName() { return getFieldValue(this.accountRecord.data, ACCOUNT_NAME) || ''; }

    @wire(getRelatedListRecords, {
        parentRecordId: '$accountId',
        relatedListId: 'Opportunities',
        fields: OPPORTUNITY_LIST_FIELDS,
        sortBy: ['-Opportunity.CloseDate'],
        pageSize: 199
    })
    wiredOpportunities({ data }) {
        this.pipelineOpportunities = data
            ? data.records.map((record) => ({
                  id: record.fields.Id?.value || record.id,
                  name: record.fields.Name?.value || '제목 미등록',
                  type: record.fields.Type?.value || '',
                  stage: record.fields.StageName?.value || '',
                  closeDate: this.formatDate(record.fields.CloseDate?.value),
                  description: record.fields.Description?.value || '설명이 등록되지 않았습니다.',
                  isClosed: Boolean(record.fields.IsClosed?.value)
              }))
            : [];
        this.openOpportunities = this.pipelineOpportunities.map((opp) => ({
            name: opp.name.trim().toLowerCase(),
            isClosed: opp.isClosed
        }));
    }

    formatDate(value) {
        if (!value) return '미정';
        return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
            .format(new Date(`${value}T00:00:00`))
            .replace(/\. /g, '.')
            .replace(/\.$/, '');
    }

    hasDuplicateOpen(title) {
        const normalized = title.trim().toLowerCase();
        return this.openOpportunities.some((opp) => !opp.isClosed && opp.name === normalized);
    }

    get rfpRequests() { return this.pipelineOpportunities.filter((opp) => RFP_STAGES.includes(opp.stage)); }
    get rfqRequests() { return this.pipelineOpportunities.filter((opp) => RFQ_STAGES.includes(opp.stage)); }
    get hasRfpRequests() { return this.rfpRequests.length > 0; }
    get hasRfqRequests() { return this.rfqRequests.length > 0; }
    get rfpRequestCount() { return this.rfpRequests.length; }
    get rfqRequestCount() { return this.rfqRequests.length; }

    get selectedRfp() {
        return this.rfpRequests.find((opp) => opp.id === this.selectedRfpId) || this.rfpRequests[0];
    }
    get selectedRfq() {
        return this.rfqRequests.find((opp) => opp.id === this.selectedRfqId) || this.rfqRequests[0];
    }
    get rfpRequestRows() {
        return this.rfpRequests.map((opp) => ({ ...opp, rowClass: opp.id === this.selectedRfp?.id ? 'request selected' : 'request' }));
    }
    get rfqRequestRows() {
        return this.rfqRequests.map((opp) => ({ ...opp, rowClass: opp.id === this.selectedRfq?.id ? 'request selected' : 'request' }));
    }

    selectRfpRequest(event) { this.selectedRfpId = event.currentTarget.dataset.id; }
    selectRfqRequest(event) { this.selectedRfqId = event.currentTarget.dataset.id; }

    @wire(getRelatedListRecords, {
        parentRecordId: '$selectedRfp.id',
        relatedListId: 'ContentDocumentLinks',
        fields: ['ContentDocumentLink.ContentDocumentId', 'ContentDocumentLink.ContentDocument.Title'],
        pageSize: 1
    })
    wiredRfpProposal({ data }) {
        const link = data?.records?.[0];
        this.rfpProposalUrl = link ? `/sfc/servlet.shepherd/document/download/${link.fields.ContentDocumentId?.value}` : '';
    }
    rfpProposalUrl = '';
    get hasRfpProposal() { return Boolean(this.rfpProposalUrl); }

    selectTab(e) { this.activeTab = e.currentTarget.dataset.tab; }
    goToRfq() { this.activeTab = 'rfq'; }
    changeEntryMode(e) { this.entryMode = e.target.value; this.fileLabel = '선택된 파일 없음'; }
    changeRfqEntryMode(e) { this.rfqEntryMode = e.target.value; this.rfqFileLabel = '선택된 파일 없음'; }
    toggleProductChange() { this.showProductChange = !this.showProductChange; }
    handleFile(e) { this.fileLabel = e.target.files[0]?.name || '선택된 파일 없음'; }
    handleRfqFile(e) { this.rfqFileLabel = e.target.files[0]?.name || '선택된 파일 없음'; }

    validate(form) {
        return [...form.querySelectorAll('input[required],textarea[required],select[required]')].reduce((ok, f) => {
            f.reportValidity();
            return ok && f.checkValidity();
        }, true);
    }

    fieldValue(form, name) {
        return form.querySelector(`[name="${name}"]`)?.value?.trim() || '';
    }

    defaultCloseDate() {
        const date = new Date();
        date.setDate(date.getDate() + 90);
        return date.toISOString().slice(0, 10);
    }

    async submitRfp(e) {
        e.preventDefault();
        this.rfpSubmitError = '';
        const form = e.currentTarget;
        if (!this.validate(form)) return;
        if (!this.isPortalMode) { this.activeTab = 'status'; return; }
        if (!this.hasCustomerContext) {
            this.rfpSubmitError = '고객 계정 연결 정보가 없어 접수할 수 없습니다. 관리자에게 Contact 연결을 요청해 주세요.';
            return;
        }
        const title = this.fieldValue(form, 'rfpTitle');
        if (this.hasDuplicateOpen(title)) {
            this.rfpSubmitError = '이미 동일한 제목으로 접수된 요청이 있습니다. 제목을 다시 확인해 주세요.';
            return;
        }
        this.isSubmittingRfp = true;
        try {
            const opportunity = await createRecord({
                apiName: OPPORTUNITY_OBJECT.objectApiName,
                fields: {
                    [OPPORTUNITY_NAME.fieldApiName]: title,
                    [OPPORTUNITY_ACCOUNT_ID.fieldApiName]: this.accountId,
                    [OPPORTUNITY_TYPE.fieldApiName]: RFP_TYPE_MAP[this.fieldValue(form, 'rfpType')] || 'Services',
                    [OPPORTUNITY_STAGE.fieldApiName]: 'RFP 검토중',
                    [OPPORTUNITY_CLOSE_DATE.fieldApiName]: this.fieldValue(form, 'rfpCloseDate'),
                    [OPPORTUNITY_DESCRIPTION.fieldApiName]: this.fieldValue(form, 'rfpPurpose')
                }
            });
            this.activeTab = 'status';
            try {
                await syncLeadOnRfpSubmit({ accountName: this.accountName });
                await reassignOpportunityOwner({ opportunityId: opportunity.id });
            } catch (syncError) {
                // Sales pipeline sync is best-effort; the RFP itself is already accepted.
            }
        } catch (error) {
            this.rfpSubmitError = error?.body?.message || error?.message || 'RFP 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        } finally {
            this.isSubmittingRfp = false;
        }
    }

    async submitRfq(e) {
        e.preventDefault();
        this.rfqSubmitError = '';
        const form = e.currentTarget;
        if (!this.validate(form)) return;
        if (!this.isRfqPortalMode) { this.activeTab = 'rfq-status'; return; }
        if (!this.hasCustomerContext) {
            this.rfqSubmitError = '고객 계정 연결 정보가 없어 접수할 수 없습니다. 관리자에게 Contact 연결을 요청해 주세요.';
            return;
        }
        const title = this.fieldValue(form, 'rfqTitle');
        if (this.hasDuplicateOpen(title)) {
            this.rfqSubmitError = '이미 동일한 제목으로 접수된 요청이 있습니다. 제목을 다시 확인해 주세요.';
            return;
        }
        const paymentTerms = this.fieldValue(form, 'rfqPaymentTerms');
        const description = paymentTerms ? `결제 조건: ${paymentTerms}` : '';
        this.isSubmittingRfq = true;
        try {
            const opportunity = await createRecord({
                apiName: OPPORTUNITY_OBJECT.objectApiName,
                fields: {
                    [OPPORTUNITY_NAME.fieldApiName]: title,
                    [OPPORTUNITY_ACCOUNT_ID.fieldApiName]: this.accountId,
                    [OPPORTUNITY_STAGE.fieldApiName]: 'RFQ 접수',
                    [OPPORTUNITY_CLOSE_DATE.fieldApiName]: this.fieldValue(form, 'rfqCloseDate') || this.defaultCloseDate(),
                    [OPPORTUNITY_DESCRIPTION.fieldApiName]: description
                }
            });
            this.activeTab = 'rfq-status';
            try {
                await reassignOpportunityOwner({ opportunityId: opportunity.id });
            } catch (syncError) {
                // Sales pipeline sync is best-effort; the RFQ itself is already accepted.
            }
        } catch (error) {
            this.rfqSubmitError = error?.body?.message || error?.message || 'RFQ 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        } finally {
            this.isSubmittingRfq = false;
        }
    }
}
