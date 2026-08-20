import { LightningElement, api, wire } from "lwc";
import { createRecord, getFieldValue, getRecord } from "lightning/uiRecordApi";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
import USER_ID from "@salesforce/user/Id";
import CASE_OBJECT from "@salesforce/schema/Case";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import CASE_ACCOUNT_ID from "@salesforce/schema/Case.AccountId";
import CASE_CONTACT_ID from "@salesforce/schema/Case.ContactId";
import CASE_ASSET_ID from "@salesforce/schema/Case.AssetId";
import CASE_SUBJECT from "@salesforce/schema/Case.Subject";
import CASE_DESCRIPTION from "@salesforce/schema/Case.Description";
import CASE_TYPE from "@salesforce/schema/Case.Type";
import CASE_URGENCY from "@salesforce/schema/Case.Requested_Urgency__c";
import CASE_ORIGIN from "@salesforce/schema/Case.Origin";
import CASE_STATUS from "@salesforce/schema/Case.Status";
import uploadFile from "@salesforce/apex/CpPortalFileController.uploadFile";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";

const ASSET_FIELDS = ["Asset.Id", "Asset.Name", "Asset.SerialNumber", "Asset.Product2.Name"];

export default class CpServiceRequest extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
  headerLogoUrl = headerLogo;
  isSubmitted = false;
  isSubmitting = false;
  selectedFileLabel = "선택된 파일 없음";
  selectedUrgency = "";
  selectedAssetId = "";
  recommendationText = "공정 영향에 따라 시급도가 함께 지정됩니다.";
  showUrgencyOverride = false;
  files = [];
  assets = [];
  caseId;
  submitError = "";

  @wire(getRecord, { recordId: USER_ID, fields: [USER_CONTACT_ID] }) userRecord;
  get contactId() { return getFieldValue(this.userRecord.data, USER_CONTACT_ID); }
  @wire(getRecord, { recordId: "$contactId", fields: [CONTACT_ACCOUNT_ID] }) contactRecord;
  get accountId() { return getFieldValue(this.contactRecord.data, CONTACT_ACCOUNT_ID); }

  @wire(getRelatedListRecords, { parentRecordId: "$accountId", relatedListId: "Assets", fields: ASSET_FIELDS, pageSize: 199 })
  wiredAssets({ data, error }) {
    if (data) {
      this.assets = data.records.map((record) => ({
        id: record.id,
        label: [record.fields.Name?.value, record.fields.Product2?.value?.fields?.Name?.value, record.fields.SerialNumber?.value].filter(Boolean).join(" · ")
      }));
      this.applyAssetFromUrl();
    } else if (error) {
      this.submitError = "보유 설비를 불러오지 못했습니다. 페이지를 새로고침해 주세요.";
    }
  }

  connectedCallback() { this.applyAssetFromUrl(); }
  applyAssetFromUrl() {
    try {
      const assetId = new URL(window.location.href).searchParams.get("assetId");
      if (assetId && (!this.assets.length || this.assets.some((asset) => asset.id === assetId))) this.selectedAssetId = assetId;
    } catch (error) { this.selectedAssetId = ""; }
  }
  get hasCustomerContext() { return Boolean(this.contactId && this.accountId); }
  get contextNotice() { return this.userRecord.data && !this.contactId ? "현재 사용자는 고객 Contact에 연결되어 있지 않아 실제 접수가 제한됩니다." : ""; }
  get overrideIndicator() { return this.showUrgencyOverride ? "−" : "+"; }

  handleAssetChange(event) { this.selectedAssetId = event.target.value; }
  handleImpactChange(event) {
    const recommendations = { normal: { urgency: "낮음", label: "정상 운전 상태를 기준으로 낮음을 추천했습니다." }, limited: { urgency: "보통", label: "제한 운전 상태를 기준으로 보통을 추천했습니다." }, stopped: { urgency: "긴급", label: "설비 정지 상태를 기준으로 긴급을 추천했습니다." } };
    const recommendation = recommendations[event.target.value];
    this.selectedUrgency = recommendation.urgency;
    this.recommendationText = recommendation.label;
  }
  handleUrgencyChange(event) { this.selectedUrgency = event.target.value; this.recommendationText = `희망 시급도: ${event.target.value}으로 직접 조정했습니다.`; }
  toggleUrgencyOverride() { this.showUrgencyOverride = !this.showUrgencyOverride; }
  handleFileChange(event) {
    const files = [...event.target.files];
    if (files.length > 5 || files.some((file) => file.size > 2 * 1024 * 1024)) {
      event.target.value = null; this.files = []; this.selectedFileLabel = "선택된 파일 없음";
      this.submitError = "파일은 최대 5개, 파일당 2MB 이하로 첨부해 주세요."; return;
    }
    this.submitError = ""; this.files = files;
    this.selectedFileLabel = files.length === 0 ? "선택된 파일 없음" : files.length === 1 ? files[0].name : `${files[0].name} 외 ${files.length - 1}개`;
  }

  async handleSubmit(event) {
    event.preventDefault(); this.submitError = "";
    const fields = [...this.template.querySelectorAll("select[required], input[required], textarea[required]")];
    const isValid = fields.reduce((valid, field) => { field.reportValidity(); return valid && field.checkValidity(); }, true);
    if (!isValid) return;
    if (!this.hasCustomerContext) { this.submitError = "고객 계정 연결 정보가 없어 접수할 수 없습니다. 관리자에게 Contact 연결을 요청해 주세요."; return; }
    if (!this.selectedUrgency) { this.submitError = "공정 영향 및 희망 시급도를 선택해 주세요."; return; }
    this.isSubmitting = true;
    try {
      const subject = this.template.querySelector('[name="subject"]').value;
      const description = this.template.querySelector('[name="description"]').value;
      const type = this.template.querySelector('[name="type"]').value;
      const record = await createRecord({ apiName: CASE_OBJECT.objectApiName, fields: {
        [CASE_ACCOUNT_ID.fieldApiName]: this.accountId,
        [CASE_CONTACT_ID.fieldApiName]: this.contactId,
        [CASE_ASSET_ID.fieldApiName]: this.selectedAssetId,
        [CASE_SUBJECT.fieldApiName]: subject,
        [CASE_DESCRIPTION.fieldApiName]: description,
        [CASE_TYPE.fieldApiName]: type,
        [CASE_URGENCY.fieldApiName]: this.selectedUrgency,
        [CASE_ORIGIN.fieldApiName]: "포털",
        [CASE_STATUS.fieldApiName]: "신규접수"
      }});
      this.caseId = record.id;
      for (const file of this.files) {
        const base64Data = await this.readFile(file);
        await uploadFile({ recordId: this.caseId, fileName: file.name, base64Data });
      }
      this.isSubmitted = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      this.submitError = error?.body?.message || error?.message || "서비스 요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    } finally { this.isSubmitting = false; }
  }
  readFile(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); }); }
  handleCancel() { window.history.back(); }
  resetForm() { window.location.reload(); }
}