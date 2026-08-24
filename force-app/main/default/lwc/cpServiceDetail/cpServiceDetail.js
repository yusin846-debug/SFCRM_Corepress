import { LightningElement, api, wire } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import { getRecord, getFieldValue, updateRecord } from "lightning/uiRecordApi";
import USER_ID from "@salesforce/user/Id";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import CASE_ID_FIELD from "@salesforce/schema/Case.Id";
import CASE_APPROVAL_STATUS_FIELD from "@salesforce/schema/Case.Approval_Status__c";
import CASE_APPROVED_AT_FIELD from "@salesforce/schema/Case.Approved_At__c";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";

const CASE_FIELDS = [
  "Case.CaseNumber",
  "Case.Subject",
  "Case.Description",
  "Case.Status",
  "Case.Type",
  "Case.CreatedDate",
  "Case.Asset.Name",
  "Case.Asset.Product2.Name",
  "Case.Asset.SerialNumber",
  "Case.Contact.Name",
  "Case.Warranty_Determination__c",
  "Case.Determination_Basis__c",
  "Case.Billable_Reason__c",
  "Case.Quoted_Amount__c",
  "Case.Approval_Status__c",
  "Case.Approved_At__c",
  "Case.Scheduled_Visit__c",
  "Case.Engineer_Name__c",
  "Case.Engineer_Phone__c",
  "Case.Work_Performed__c",
  "Case.Parts_Used__c",
];

const STEP_ORDER = ["신규접수", "판정완료", "배정완료", "진행중", "완료"];
const WAITING_STATUS = "대기 중";

export default class CpServiceDetail extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api requestListUrl = "service-list";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
  headerLogoUrl = headerLogo;
  logoutIconUrl = logoutIcon;
  recordId;
  caseRecord;
  loadError = "";
  isSubmittingApproval = false;
  approvalActionError = "";

  @wire(getRecord, { recordId: USER_ID, fields: [USER_CONTACT_ID] })
  userRecord;
  get contactId() { return getFieldValue(this.userRecord.data, USER_CONTACT_ID); }

  @wire(getRecord, { recordId: "$contactId", fields: [CONTACT_ACCOUNT_ID] })
  contactRecord;
  get accountId() { return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID); }

  @wire(CurrentPageReference)
  setPageReference(pageReference) {
    const state = pageReference?.state || {};
    this.recordId = state.recordId || state.c__recordId || this.readRecordId();
  }

  readRecordId() {
    try {
      return new URL(window.location.href).searchParams.get("recordId");
    } catch (error) {
      return null;
    }
  }

  @wire(getRecord, { recordId: "$recordId", fields: CASE_FIELDS })
  wiredCase({ data, error }) {
    if (data) {
      this.caseRecord = data;
      this.loadError = "";
    } else if (error) {
      this.caseRecord = undefined;
      this.loadError = "서비스 요청 정보를 불러오지 못했습니다. 목록에서 요청을 다시 선택해 주세요.";
    }
  }

  get isPreview() {
    return !this.recordId;
  }
  get hasCase() {
    return Boolean(this.caseRecord);
  }
  get caseNumber() {
    return getFieldValue(this.caseRecord, "Case.CaseNumber") || "-";
  }
  get subject() {
    return getFieldValue(this.caseRecord, "Case.Subject") || "제목 미등록";
  }
  get description() {
    return getFieldValue(this.caseRecord, "Case.Description") || "상세 내용이 등록되지 않았습니다.";
  }
  get status() {
    return getFieldValue(this.caseRecord, "Case.Status") || "신규접수";
  }
  get type() {
    return getFieldValue(this.caseRecord, "Case.Type") || "미등록";
  }
  get assetName() {
    return getFieldValue(this.caseRecord, "Case.Asset.Name") || "설비 미지정";
  }
  get assetModel() {
    return getFieldValue(this.caseRecord, "Case.Asset.Product2.Name") || "";
  }
  get assetSerial() {
    return getFieldValue(this.caseRecord, "Case.Asset.SerialNumber") || "";
  }
  get assetSummary() {
    return [this.assetName, this.assetModel, this.assetSerial].filter(Boolean).join(" · ");
  }
  get contactName() {
    return getFieldValue(this.caseRecord, "Case.Contact.Name") || "-";
  }
  get createdDate() {
    return this.formatDateTime(getFieldValue(this.caseRecord, "Case.CreatedDate"));
  }

  get steps() {
    const currentIndex = this.currentStepIndex();
    return STEP_ORDER.map((label, index) => {
      let className = "step";
      if (index < currentIndex) className = "step complete";
      else if (index === currentIndex) className = "step current";
      return { number: String(index + 1).padStart(2, "0"), label, className };
    });
  }

  currentStepIndex() {
    const status = this.status;
    if (status === WAITING_STATUS) return STEP_ORDER.indexOf("진행중");
    const index = STEP_ORDER.indexOf(status);
    return index === -1 ? 0 : index;
  }

  get warrantyDetermination() {
    return getFieldValue(this.caseRecord, "Case.Warranty_Determination__c") || "판정 전";
  }
  get isWarrantyCovered() {
    return this.warrantyDetermination === "무상";
  }
  get determinationBasis() {
    return getFieldValue(this.caseRecord, "Case.Determination_Basis__c") || "판정 근거가 등록되지 않았습니다.";
  }
  get billableReason() {
    return getFieldValue(this.caseRecord, "Case.Billable_Reason__c") || "";
  }
  get quotedAmount() {
    const value = getFieldValue(this.caseRecord, "Case.Quoted_Amount__c");
    return value == null ? "" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;
  }
  get approvalStatus() {
    return getFieldValue(this.caseRecord, "Case.Approval_Status__c") || "";
  }
  get showApprovalActions() {
    return this.approvalStatus === "승인 대기";
  }
  get hasScheduledVisit() {
    return Boolean(getFieldValue(this.caseRecord, "Case.Scheduled_Visit__c"));
  }
  get visitDate() {
    const value = getFieldValue(this.caseRecord, "Case.Scheduled_Visit__c");
    return value ? this.formatDateTime(value) : "";
  }
  get engineerName() {
    return getFieldValue(this.caseRecord, "Case.Engineer_Name__c") || "배정 전";
  }
  get engineerPhone() {
    return getFieldValue(this.caseRecord, "Case.Engineer_Phone__c") || "-";
  }
  get hasWorkPerformed() {
    return Boolean(getFieldValue(this.caseRecord, "Case.Work_Performed__c"));
  }
  get workPerformed() {
    return getFieldValue(this.caseRecord, "Case.Work_Performed__c") || "";
  }
  get partsUsed() {
    return getFieldValue(this.caseRecord, "Case.Parts_Used__c") || "";
  }

  formatDateTime(value) {
    if (!value) return "미등록";
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

  async handleApprovalAction(event) {
    const decision = event.currentTarget.dataset.decision;
    this.approvalActionError = "";
    this.isSubmittingApproval = true;
    try {
      const fields = {
        [CASE_ID_FIELD.fieldApiName]: this.recordId,
        [CASE_APPROVAL_STATUS_FIELD.fieldApiName]: decision,
      };
      if (decision === "승인") {
        fields[CASE_APPROVED_AT_FIELD.fieldApiName] = new Date().toISOString();
      }
      await updateRecord({ fields });
    } catch (error) {
      this.approvalActionError = error?.body?.message || error?.message || "승인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    } finally {
      this.isSubmittingApproval = false;
    }
  }

  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
