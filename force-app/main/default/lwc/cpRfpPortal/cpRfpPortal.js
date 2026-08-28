import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
import { refreshApex } from "@salesforce/apex";
import LightningConfirm from "lightning/confirm";
import USER_ID from "@salesforce/user/Id";
import USER_NAME from "@salesforce/schema/User.Name";
import USER_EMAIL from "@salesforce/schema/User.Email";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import ACCOUNT_NAME from "@salesforce/schema/Account.Name";
import submitRfpRequest from "@salesforce/apex/CpSalesPipelineController.submitRfp";
import submitRfqRequest from "@salesforce/apex/CpSalesPipelineController.submitRfq";
import selectShortlist from "@salesforce/apex/CpSalesPipelineController.selectShortlist";
import recordProposalDownload from "@salesforce/apex/CpSalesPipelineController.recordProposalDownload";
import getRfpsForAccount from "@salesforce/apex/CpSalesPipelineController.getRfpsForAccount";
import getTimeline from "@salesforce/apex/CpSalesPipelineController.getTimeline";
import getLeadsForAccount from "@salesforce/apex/CpSalesPipelineController.getLeadsForAccount";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";
import cp7100Proposal from "@salesforce/resourceUrl/CorePressCP7100Proposal";

const OPPORTUNITY_LIST_FIELDS = [
  "Opportunity.Id",
  "Opportunity.Name",
  "Opportunity.Type",
  "Opportunity.StageName",
  "Opportunity.CloseDate",
  "Opportunity.Description",
  "Opportunity.RecordType.DeveloperName",
  "Opportunity.IsClosed"
];
const RFQ_STAGES = [
  "숏리스트 선정",
  "RFQ 접수",
  "사양 협상",
  "견적 제출",
  "계약 검토",
  "Closed Won",
  "Closed Lost"
];

export default class CpRfpPortal extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceUrl = "service-request";
  @api quoteUrl = "quotes";
  headerLogoUrl = headerLogo;
  logoutIconUrl = logoutIcon;
  activeTab = "issue";
  entryMode = "portal";
  rfqEntryMode = "portal";
  fileLabel = "선택된 파일 없음";
  rfqFileLabel = "선택된 파일 없음";
  showProductChange = false;
  isSubmittingRfp = false;
  isSubmittingRfq = false;
  rfpSubmitError = "";
  rfqSubmitError = "";
  openOpportunities = [];
  pipelineOpportunities = [];
  leads = [];
  wiredLeadsResult;
  wiredRfpsResult;
  wiredTimelineResult;
  wiredOpportunitiesResult;
  rfpRecords = [];
  timeline = [];
  isSelectingShortlist = false;
  proposalFallbackUrl = cp7100Proposal;
  selectedRfpId = "";
  selectedRfqId = "";
  rfpEquipmentValue = "";

  get showIssue() {
    return this.activeTab === "issue";
  }
  get showStatus() {
    return this.activeTab === "status";
  }
  get showRfq() {
    return this.activeTab === "rfq";
  }
  get showRfqStatus() {
    return this.activeTab === "rfq-status";
  }
  get issueTabClass() {
    return this.activeTab === "issue" ? "active" : "";
  }
  get statusTabClass() {
    return this.activeTab === "status" ? "active" : "";
  }
  get rfqTabClass() {
    return this.activeTab === "rfq" ? "active" : "";
  }
  get rfqStatusTabClass() {
    return this.activeTab === "rfq-status" ? "active" : "";
  }
  get isPortalMode() {
    return this.entryMode === "portal";
  }
  get isEmailMode() {
    return this.entryMode === "email";
  }
  get portalModeClass() {
    return `mode-option ${this.isPortalMode ? "selected" : ""}`;
  }
  get emailModeClass() {
    return `mode-option ${this.isEmailMode ? "selected" : ""}`;
  }
  get rfpLayoutClass() {
    return this.isEmailMode ? "layout email-layout" : "layout";
  }
  get rfpSubmitLabel() {
    return this.isEmailMode ? "이메일 RFP 등록" : "RFP 제출";
  }
  get isRfqPortalMode() {
    return this.rfqEntryMode === "portal";
  }
  get isRfqEmailMode() {
    return this.rfqEntryMode === "email";
  }
  get rfqPortalModeClass() {
    return `mode-option ${this.isRfqPortalMode ? "selected" : ""}`;
  }
  get rfqEmailModeClass() {
    return `mode-option ${this.isRfqEmailMode ? "selected" : ""}`;
  }
  get rfqLayoutClass() {
    return this.isRfqEmailMode ? "layout email-layout" : "layout";
  }
  get rfqSubmitLabel() {
    return this.isRfqEmailMode ? "이메일 RFQ 등록" : "RFQ 제출";
  }

  @wire(getRecord, {
    recordId: USER_ID,
    fields: [USER_NAME, USER_EMAIL, USER_CONTACT_ID]
  })
  currentUser;
  get customerName() {
    return getFieldValue(this.currentUser.data, USER_NAME) || "로그인 고객";
  }
  get customerEmail() {
    return (
      getFieldValue(this.currentUser.data, USER_EMAIL) || "계정 이메일 확인 중"
    );
  }
  get contactId() {
    return getFieldValue(this.currentUser.data, USER_CONTACT_ID);
  }

  @wire(getRecord, { recordId: "$contactId", fields: [CONTACT_ACCOUNT_ID] })
  contactRecord;
  get accountId() {
    return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID);
  }
  get hasCustomerContext() {
    return Boolean(this.contactId && this.accountId);
  }

  @wire(getRecord, { recordId: "$accountId", fields: [ACCOUNT_NAME] })
  accountRecord;
  get accountName() {
    return getFieldValue(this.accountRecord.data, ACCOUNT_NAME) || "";
  }

  @wire(getRelatedListRecords, {
    parentRecordId: "$accountId",
    relatedListId: "Opportunities",
    fields: OPPORTUNITY_LIST_FIELDS,
    sortBy: ["-Opportunity.CloseDate"],
    pageSize: 199
  })
  wiredOpportunities(result) {
    this.wiredOpportunitiesResult = result;
    const { data } = result;
    this.pipelineOpportunities = data
      ? data.records.map((record) => ({
          id: record.fields.Id?.value || record.id,
          name: record.fields.Name?.value || "제목 미등록",
          type: record.fields.Type?.value || "",
          stage: record.fields.StageName?.value || "",
          closeDate: this.formatDate(record.fields.CloseDate?.value),
          description:
            record.fields.Description?.value || "설명이 등록되지 않았습니다.",
          recordType:
            record.fields.RecordType?.value?.fields?.DeveloperName?.value || "",
          isClosed: Boolean(record.fields.IsClosed?.value)
        }))
      : [];
    this.openOpportunities = this.pipelineOpportunities.map((opp) => ({
      name: opp.name.trim().toLowerCase(),
      isClosed: opp.isClosed
    }));
  }

  formatDate(value) {
    if (!value) return "미정";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .format(new Date(`${value}T00:00:00`))
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  }

  hasDuplicateOpen(title) {
    const normalized = title.trim().toLowerCase();
    return this.openOpportunities.some(
      (opp) => !opp.isClosed && opp.name === normalized
    );
  }

  @wire(getLeadsForAccount, { accountName: "$accountName" })
  wiredLeads(result) {
    this.wiredLeadsResult = result;
    if (result.data) {
      this.leads = result.data.map((lead) => {
        const equipment = lead.equipment || "관심 장비 미상";
        const name = lead.name || "이름 미등록";
        const created = this.formatDateTime(lead.createdDate);
        return {
          id: lead.id,
          name,
          company: lead.company || "",
          status: lead.status || "신규 문의",
          productInterest: lead.productInterest || "-",
          equipment,
          description: lead.description || "문의 내용이 등록되지 않았습니다.",
          leadSource: lead.leadSource || "",
          createdDate: created,
          optionLabel: `${equipment} · ${name} · ${created}`,
          isConverted: lead.isConverted,
          convertedOpportunityId: lead.convertedOpportunityId
        };
      });
    }
  }

  handleLeadChange(event) {
    const chosen = this.leads.find((lead) => lead.id === event.target.value);
    this.rfpEquipmentValue =
      chosen && chosen.equipment !== "관심 장비 미상" ? chosen.equipment : "";
  }

  handleEquipmentInput(event) {
    this.rfpEquipmentValue = event.target.value;
  }

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          base64: String(reader.result).split(",")[1]
        });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  @wire(getRfpsForAccount, { accountId: "$accountId" })
  wiredRfps(result) {
    this.wiredRfpsResult = result;
    this.rfpRecords = (result.data || []).map((rfp) => ({
      ...rfp,
      name: rfp.title,
      createdDate: this.formatDateTime(rfp.submittedAt),
      shortlistLabel: rfp.shortlistComplete ? "선정 완료" : "숏리스트 선정"
    }));
    if (!this.selectedRfpId && this.rfpRecords.length) {
      this.selectedRfpId = this.rfpRecords[0].id;
    }
  }

  @wire(getTimeline, { rfpId: "$selectedRfpId" })
  wiredTimeline(result) {
    this.wiredTimelineResult = result;
    this.timeline = (result.data || []).map((entry) => ({
      ...entry,
      displayDate: this.formatDateTime(entry.occurredAt)
    }));
  }

  get rfpRequests() {
    return this.rfpRecords;
  }
  get rfqRequests() {
    return this.pipelineOpportunities.filter(
      (opp) =>
        opp.recordType === "New_Installation" && RFQ_STAGES.includes(opp.stage)
    );
  }
  get hasRfpRequests() {
    return this.rfpRequests.length > 0;
  }
  get hasRfqRequests() {
    return this.rfqRequests.length > 0;
  }
  get rfpRequestCount() {
    return this.rfpRequests.length;
  }
  get rfqRequestCount() {
    return this.rfqRequests.length;
  }

  get selectedRfp() {
    return (
      this.rfpRequests.find((lead) => lead.id === this.selectedRfpId) ||
      this.rfpRequests[0]
    );
  }
  get proposalUrl() {
    const cdlId = this.selectedRfp?.proposalContentDocumentId;
    return cdlId
      ? `/sfc/servlet.shepherd/document/download/${cdlId}`
      : this.proposalFallbackUrl;
  }
  get proposalReady() {
    return Boolean(this.selectedRfp?.hasProposal);
  }
  get timelineDisplay() {
    const events = [...this.timeline];
    const hasSubmitEvent = events.some((e) => e.eventType === "제안서 제출");
    if (this.selectedRfp?.hasProposal && !hasSubmitEvent) {
      const cdlId = this.selectedRfp.proposalContentDocumentId;
      const title = this.selectedRfp.proposalTitle;
      const uploadedAt =
        this.selectedRfp.proposalUploadedAt || this.selectedRfp.submittedAt;
      events.push({
        eventType: "제안서 제출",
        detail: cdlId
          ? `${title || "제안서 파일"} 첨부 완료 — 다운로드 가능`
          : "CorePress 영업담당자가 제안서를 등록했습니다.",
        occurredAt: uploadedAt,
        displayDate: this.formatDateTime(uploadedAt)
      });
      events.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
    }
    return events;
  }
  get hasTimeline() {
    return this.timelineDisplay.length > 0;
  }
  get leadOptions() {
    return this.leads;
  }
  get hasLeadOptions() {
    return this.leadOptions.length > 0;
  }
  get shortlistDisabled() {
    return (
      this.isSelectingShortlist || Boolean(this.selectedRfp?.shortlistComplete)
    );
  }
  get selectedRfq() {
    return (
      this.rfqRequests.find((opp) => opp.id === this.selectedRfqId) ||
      this.rfqRequests[0]
    );
  }
  get rfpRequestRows() {
    return this.rfpRequests.map((lead) => ({
      ...lead,
      rowClass:
        lead.id === this.selectedRfp?.id ? "request selected" : "request"
    }));
  }
  get rfqRequestRows() {
    return this.rfqRequests.map((opp) => ({
      ...opp,
      rowClass: opp.id === this.selectedRfq?.id ? "request selected" : "request"
    }));
  }

  formatDateTime(value) {
    if (!value) return "미등록";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .format(new Date(value))
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  }

  selectRfpRequest(event) {
    this.selectedRfpId = event.currentTarget.dataset.id;
  }
  selectRfqRequest(event) {
    this.selectedRfqId = event.currentTarget.dataset.id;
  }

  selectTab(e) {
    this.activeTab = e.currentTarget.dataset.tab;
  }
  goToRfq() {
    this.activeTab = "rfq";
  }
  changeEntryMode(e) {
    this.entryMode = e.target.value;
    this.fileLabel = "선택된 파일 없음";
  }
  changeRfqEntryMode(e) {
    this.rfqEntryMode = e.target.value;
    this.rfqFileLabel = "선택된 파일 없음";
  }
  toggleProductChange() {
    this.showProductChange = !this.showProductChange;
  }
  handleFile(e) {
    this.fileLabel = e.target.files[0]?.name || "선택된 파일 없음";
  }
  handleRfqFile(e) {
    this.rfqFileLabel = e.target.files[0]?.name || "선택된 파일 없음";
  }

  validate(form) {
    return [
      ...form.querySelectorAll(
        "input[required],textarea[required],select[required]"
      )
    ].reduce((ok, f) => {
      f.reportValidity();
      return ok && f.checkValidity();
    }, true);
  }

  fieldValue(form, name) {
    return form.querySelector(`[name="${name}"]`)?.value?.trim() || "";
  }

  defaultCloseDate() {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().slice(0, 10);
  }

  async submitRfp(e) {
    e.preventDefault();
    this.rfpSubmitError = "";
    const form = e.currentTarget;
    if (!this.validate(form)) return;
    if (!this.hasCustomerContext) {
      this.rfpSubmitError =
        "고객 계정 연결 정보가 없어 접수할 수 없습니다. 관리자에게 Contact 연결을 요청해 주세요.";
      return;
    }
    const viaEmail = this.isEmailMode;
    this.isSubmittingRfp = true;
    try {
      const fileInput = form.querySelector('input[type="file"]');
      const file = fileInput?.files?.[0];
      const filePayload = file ? await this.readFileAsBase64(file) : null;
      const submission = viaEmail
        ? {
            accountId: this.accountId,
            contactId: this.contactId,
            leadId: this.fieldValue(form, "leadId"),
            title: this.fieldValue(form, "emailSubject"),
            equipment: this.rfpEquipmentValue,
            introductionType: "신규 도입",
            requestedDeliveryDate: null,
            specifications: `이메일 발송일: ${this.fieldValue(form, "emailSentDate") || "미기재"}`,
            source: "이메일"
          }
        : {
            accountId: this.accountId,
            contactId: this.contactId,
            leadId: this.fieldValue(form, "leadId"),
            title: this.fieldValue(form, "rfpTitle"),
            equipment:
              this.rfpEquipmentValue || this.fieldValue(form, "rfpEquipment"),
            introductionType: this.fieldValue(form, "rfpType"),
            requestedDeliveryDate:
              this.fieldValue(form, "rfpCloseDate") || null,
            specifications: this.fieldValue(form, "rfpPurpose"),
            source: "포털"
          };
      if (filePayload) {
        submission.fileName = filePayload.name;
        submission.fileBase64 = filePayload.base64;
      }
      await submitRfpRequest({ submission });
      await Promise.all([
        refreshApex(this.wiredLeadsResult),
        refreshApex(this.wiredRfpsResult)
      ]);
      this.rfpEquipmentValue = "";
      this.activeTab = "status";
    } catch (error) {
      this.rfpSubmitError =
        error?.body?.message ||
        error?.message ||
        "RFP 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    } finally {
      this.isSubmittingRfp = false;
    }
  }

  async submitRfq(e) {
    e.preventDefault();
    this.rfqSubmitError = "";
    const form = e.currentTarget;
    if (!this.validate(form)) return;
    if (!this.isRfqPortalMode) {
      this.activeTab = "rfq-status";
      return;
    }
    if (!this.hasCustomerContext) {
      this.rfqSubmitError =
        "고객 계정 연결 정보가 없어 접수할 수 없습니다. 관리자에게 Contact 연결을 요청해 주세요.";
      return;
    }
    const title = this.fieldValue(form, "rfqTitle");
    if (this.hasDuplicateOpen(title)) {
      this.rfqSubmitError =
        "이미 동일한 제목으로 접수된 요청이 있습니다. 제목을 다시 확인해 주세요.";
      return;
    }
    const paymentTerms = this.fieldValue(form, "rfqPaymentTerms");
    const description = paymentTerms ? `결제 조건: ${paymentTerms}` : "";
    this.isSubmittingRfq = true;
    try {
      if (!this.selectedRfpId)
        throw new Error("RFQ와 연결할 RFP를 선택해 주세요.");
      await submitRfqRequest({
        rfpId: this.selectedRfpId,
        contactId: this.contactId,
        title,
        requestedDeliveryDate:
          this.fieldValue(form, "rfqCloseDate") || this.defaultCloseDate(),
        description
      });
      await Promise.all([
        refreshApex(this.wiredRfpsResult),
        refreshApex(this.wiredOpportunitiesResult),
        refreshApex(this.wiredTimelineResult)
      ]);
      this.activeTab = "rfq-status";
    } catch (error) {
      this.rfqSubmitError =
        error?.body?.message ||
        error?.message ||
        "RFQ 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    } finally {
      this.isSubmittingRfq = false;
    }
  }

  async downloadProposal() {
    if (!this.selectedRfp) return;
    try {
      await recordProposalDownload({
        rfpId: this.selectedRfp.id,
        contactId: this.contactId
      });
      await refreshApex(this.wiredTimelineResult);
      window.open(this.proposalUrl, "_blank", "noopener");
    } catch (error) {
      this.rfpSubmitError =
        error?.body?.message || "제안서 다운로드 이력을 기록하지 못했습니다.";
    }
  }

  async handleShortlist() {
    if (!this.selectedRfp || this.selectedRfp.shortlistComplete) return;
    const confirmed = await LightningConfirm.open({
      message: "이 제안서를 숏리스트로 선정하시겠습니까?",
      label: "숏리스트 선정 확인",
      theme: "warning"
    });
    if (!confirmed) return;
    this.isSelectingShortlist = true;
    try {
      await selectShortlist({
        rfpId: this.selectedRfp.id,
        accountId: this.accountId,
        contactId: this.contactId
      });
      await Promise.all([
        refreshApex(this.wiredRfpsResult),
        refreshApex(this.wiredTimelineResult),
        refreshApex(this.wiredOpportunitiesResult)
      ]);
    } catch (error) {
      this.rfpSubmitError =
        error?.body?.message || "숏리스트 선정 중 오류가 발생했습니다.";
    } finally {
      this.isSelectingShortlist = false;
    }
  }

  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
