import { LightningElement, api, wire } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
import ASSET_NAME from "@salesforce/schema/Asset.Name";
import ASSET_SERIAL from "@salesforce/schema/Asset.SerialNumber";
import ASSET_STATUS from "@salesforce/schema/Asset.Status";
import ASSET_INSTALL_DATE from "@salesforce/schema/Asset.InstallDate";
import ASSET_CITY from "@salesforce/schema/Asset.City";
import ASSET_STREET from "@salesforce/schema/Asset.Street";
import ASSET_PRODUCT_NAME from "@salesforce/schema/Asset.Product2.Name";
import ASSET_RUNTIME from "@salesforce/schema/Asset.Total_Runtime_Hours__c";
import ASSET_RUNTIME_DATE from "@salesforce/schema/Asset.Runtime_As_Of__c";
import ASSET_OVERHAUL from "@salesforce/schema/Asset.Next_Overhaul_Hours__c";
import ASSET_SMART_CARE from "@salesforce/schema/Asset.Smart_Care_Stage__c";
import ASSET_REPLACEMENT_DATE from "@salesforce/schema/Asset.Expected_Replacement_Date__c";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import cp7100 from "@salesforce/resourceUrl/CorePressCP7100Detail";
import cp2100 from "@salesforce/resourceUrl/CorePressCP2100";
import cp100 from "@salesforce/resourceUrl/CorePressCP100";
import blueprint from "@salesforce/resourceUrl/CorePressCP7100Blueprint";
import locationIcon from "@salesforce/resourceUrl/CorePressLocationIcon";
import operatingIcon from "@salesforce/resourceUrl/CorePressSummaryOperatingIcon";
import warningIcon from "@salesforce/resourceUrl/CorePressSummaryWarningIcon";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";

const ASSET_FIELDS = [ASSET_NAME, ASSET_SERIAL, ASSET_STATUS, ASSET_INSTALL_DATE, ASSET_CITY, ASSET_STREET, ASSET_PRODUCT_NAME, ASSET_RUNTIME, ASSET_RUNTIME_DATE, ASSET_OVERHAUL, ASSET_SMART_CARE, ASSET_REPLACEMENT_DATE];
const CASE_FIELDS = ["Case.CaseNumber", "Case.Subject", "Case.Status", "Case.CreatedDate", "Case.ClosedDate", "Case.Engineer_Name__c"];
const WARRANTY_FIELDS = ["AssetWarranty.StartDate", "AssetWarranty.EndDate", "AssetWarranty.PartsCovered", "AssetWarranty.LaborCovered", "AssetWarranty.ExpensesCovered"];

export default class CpAssetDetail extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceListUrl = "service-list";
  @api serviceRequestUrl = "service-request";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
  recordId;
  logoUrl = logo;
  blueprintUrl = blueprint;
  locationIconUrl = locationIcon;
  logoutIconUrl = logoutIcon;
  assetRecord;
  cases = [];
  warrantyRecord;
  loadError = "";

  @wire(CurrentPageReference)
  setPageReference(pageReference) {
    const state = pageReference?.state || {};
    this.recordId = state.recordId || state.c__recordId || this.readRecordId();
  }

  readRecordId() {
    try { return new URL(window.location.href).searchParams.get("recordId"); }
    catch (error) { return null; }
  }

  @wire(getRecord, { recordId: "$recordId", fields: ASSET_FIELDS })
  wiredAsset({ data, error }) {
    if (data) { this.assetRecord = data; this.loadError = ""; }
    else if (error) { this.assetRecord = undefined; this.loadError = "설비 정보를 불러오지 못했습니다. 목록에서 설비를 다시 선택해 주세요."; }
  }

  @wire(getRelatedListRecords, { parentRecordId: "$recordId", relatedListId: "Cases", fields: CASE_FIELDS, sortBy: ["-Case.CreatedDate"], pageSize: 3 })
  wiredCases({ data }) {
    this.cases = data ? data.records.map((record) => ({
      id: record.id,
      number: record.fields.CaseNumber?.value || "-",
      subject: record.fields.Subject?.value || "내용 미등록",
      date: this.formatDateTime(record.fields.ClosedDate?.value || record.fields.CreatedDate?.value),
      status: record.fields.Status?.value === "신규접수" ? "접수" : (record.fields.Status?.value || "상태 미등록"),
      engineer: record.fields.Engineer_Name__c?.value || "배정 전"
    })) : [];
  }

  @wire(getRelatedListRecords, { parentRecordId: "$recordId", relatedListId: "WarrantyAssets", fields: WARRANTY_FIELDS, sortBy: ["-AssetWarranty.EndDate"], pageSize: 1 })
  wiredWarranty({ data }) { this.warrantyRecord = data?.records?.[0]; }

  get model() { return getFieldValue(this.assetRecord, ASSET_PRODUCT_NAME) || "모델 미등록"; }
  get heroImageUrl() {
    const normalized = this.model.trim().toUpperCase();
    if (normalized === "CP7100+") return cp7100;
    if (normalized === "CP2100") return cp2100;
    return cp100;
  }
  get assetName() { return getFieldValue(this.assetRecord, ASSET_NAME) || "설비명 미등록"; }
  get serial() { return getFieldValue(this.assetRecord, ASSET_SERIAL) || "일련번호 미등록"; }
  get location() { return [getFieldValue(this.assetRecord, ASSET_CITY), getFieldValue(this.assetRecord, ASSET_STREET)].filter(Boolean).join(" ") || "설치 위치 미등록"; }
  get status() {
    const value = getFieldValue(this.assetRecord, ASSET_STATUS);
    if (value === "Installed" || value === "Registered") return "운전 중";
    if (value === "Obsolete") return "폐기";
    return value || "상태 미등록";
  }
  get statusIconUrl() { return this.status === "운전 중" ? operatingIcon : warningIcon; }
  get installDate() { return this.formatDate(getFieldValue(this.assetRecord, ASSET_INSTALL_DATE)); }
  get runtime() { const value = getFieldValue(this.assetRecord, ASSET_RUNTIME); return value == null ? "미등록" : `${new Intl.NumberFormat("ko-KR").format(value)} hr`; }
  get runtimeDate() { return this.formatDate(getFieldValue(this.assetRecord, ASSET_RUNTIME_DATE)); }
  get overhaulHours() { const value = getFieldValue(this.assetRecord, ASSET_OVERHAUL); return value == null ? "미등록" : `${new Intl.NumberFormat("ko-KR").format(value)} hr`; }
  get smartCare() { return getFieldValue(this.assetRecord, ASSET_SMART_CARE) || "미등록"; }
  get replacementDate() { return this.formatDate(getFieldValue(this.assetRecord, ASSET_REPLACEMENT_DATE)); }
  get serviceRequestHref() { return this.recordId ? `${this.serviceRequestUrl}?assetId=${this.recordId}` : this.serviceRequestUrl; }
  get serviceHistoryHref() { return this.recordId ? `${this.serviceListUrl}?assetId=${this.recordId}` : this.serviceListUrl; }
  get hasCases() { return this.cases.length > 0; }
  get isPreview() { return !this.recordId; }
  get warrantyStart() { return this.formatDate(this.warrantyRecord?.fields?.StartDate?.value); }
  get warrantyEnd() { return this.formatDate(this.warrantyRecord?.fields?.EndDate?.value); }
  get warrantyParts() { return this.formatPercent(this.warrantyRecord?.fields?.PartsCovered?.value); }
  get warrantyLabor() { return this.formatPercent(this.warrantyRecord?.fields?.LaborCovered?.value); }
  get warrantyExpenses() { return this.formatPercent(this.warrantyRecord?.fields?.ExpensesCovered?.value); }
  get warrantyRemaining() {
    const end = this.warrantyRecord?.fields?.EndDate?.value;
    if (!end) return "보증 정보 미등록";
    const days = Math.ceil((new Date(`${end}T23:59:59`) - new Date()) / 86400000);
    return days >= 0 ? `D-${days}` : "보증 만료";
  }
  get warrantyProgressStyle() {
    const start = this.warrantyRecord?.fields?.StartDate?.value;
    const end = this.warrantyRecord?.fields?.EndDate?.value;
    if (!start || !end) return "left: 0%;";
    const total = new Date(end) - new Date(start);
    const elapsed = new Date() - new Date(start);
    const percent = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
    return `left: ${percent.toFixed(1)}%;`;
  }
  formatPercent(value) { return value == null ? "미등록" : `${value}%`; }
  formatDate(value) {
    if (!value) return "미등록";
    return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${value}T00:00:00`)).replace(/\. /g, ".").replace(/\.$/, "");
  }
  formatDateTime(value) {
    if (!value) return "미등록";
    return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)).replace(/\. /g, ".").replace(/\.$/, "");
  }
  handleLogout() { const returnUrl = encodeURIComponent("/corepress/s/login"); window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`); }
}