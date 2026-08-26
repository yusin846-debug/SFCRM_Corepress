import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
import USER_ID from "@salesforce/user/Id";
import USER_CONTACT_ID from "@salesforce/schema/User.ContactId";
import CONTACT_ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import CONTACT_ACCOUNT_NAME from "@salesforce/schema/Contact.Account.Name";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import registeredIcon from "@salesforce/resourceUrl/CorePressRegisteredIcon";
import operatingIcon from "@salesforce/resourceUrl/CorePressOperatingIcon";
import warningIcon from "@salesforce/resourceUrl/CorePressWarningIcon";
import requestIcon from "@salesforce/resourceUrl/CorePressRequestIcon";
import assignedIcon from "@salesforce/resourceUrl/CorePressAssignedIcon";
import workIcon from "@salesforce/resourceUrl/CorePressWorkIcon";
import completeIcon from "@salesforce/resourceUrl/CorePressCompleteIcon";
import warrantyIcon from "@salesforce/resourceUrl/CorePressWarrantyIcon";
import infoIcon from "@salesforce/resourceUrl/CorePressInfoIcon";
import documentIcon from "@salesforce/resourceUrl/CorePressDocumentIcon";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";
import maintenanceIcon from "@salesforce/resourceUrl/CorePressMaintenanceIcon";

const ASSET_FIELDS = [
  "Asset.Id",
  "Asset.Name",
  "Asset.Status",
  "Asset.Product2.Name"
];

const CASE_FIELDS = [
  "Case.Id",
  "Case.CaseNumber",
  "Case.Subject",
  "Case.Status",
  "Case.CreatedDate"
];

const NEW_STATUSES = ["신규접수", "판정완료"];
const ASSIGNED_STATUSES = ["배정완료"];
const PROGRESS_STATUSES = ["진행중", "대기 중"];
const DONE_STATUSES = ["완료", "처리완료", "종료", "Closed"];

const STAGE_SCORE = { S1: 98, S2: 92, S3: 84, S4: 72, S5: 60 };

export default class CpPortalHome extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceUrl = "service-request";
  @api serviceListUrl = "service-list";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
  @api noticesUrl = "notices";
  logoUrl = logo;
  registeredIconUrl = registeredIcon;
  operatingIconUrl = operatingIcon;
  warningIconUrl = warningIcon;
  requestIconUrl = requestIcon;
  assignedIconUrl = assignedIcon;
  workIconUrl = workIcon;
  completeIconUrl = completeIcon;
  warrantyIconUrl = warrantyIcon;
  infoIconUrl = infoIcon;
  documentIconUrl = documentIcon;
  logoutIconUrl = logoutIcon;
  maintenanceIconUrl = maintenanceIcon;

  assets = [];
  cases = [];

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

  get pageTitle() {
    return this.accountName
      ? `${this.accountName} 설비 운영 현황`
      : "설비 운영 현황";
  }

  @wire(getRelatedListRecords, {
    parentRecordId: "$accountId",
    relatedListId: "Assets",
    fields: ASSET_FIELDS,
    sortBy: ["Asset.Name"],
    pageSize: 199
  })
  wiredAssets({ data }) {
    if (data) {
      this.assets = data.records.map((record) => this.mapAsset(record));
    }
  }

  @wire(getRelatedListRecords, {
    parentRecordId: "$accountId",
    relatedListId: "Cases",
    fields: CASE_FIELDS,
    sortBy: ["-Case.CreatedDate"],
    pageSize: 199
  })
  wiredCases({ data }) {
    if (data) {
      this.cases = data.records.map((record) => this.mapCase(record));
    }
  }

  mapAsset(record) {
    const status = record.fields.Status?.value || "Registered";
    const stage = "";
    const isRunning = status === "Installed" || status === "Registered";
    const isObsolete = status === "Obsolete";
    const score = STAGE_SCORE[stage] || (isObsolete ? 55 : isRunning ? 90 : 70);
    let label = "양호";
    let labelClass = "good";
    if (isObsolete) {
      label = "교체 필요";
      labelClass = "attention";
    } else if (score < 80) {
      label = "점검 필요";
      labelClass = "attention";
    } else if (score < 90) {
      label = "관찰";
      labelClass = "watch";
    }
    return {
      id: record.fields.Id?.value || record.id,
      name: record.fields.Name?.value || "설비명 미등록",
      model:
        record.fields.Product2?.value?.fields?.Name?.value ||
        this.modelFromName(record.fields.Name?.value),
      isRunning,
      score,
      label,
      labelClass,
      scoreStyle: `width:${score}%`,
      barClass: labelClass === "attention" ? "score-bar attention" : "score-bar"
    };
  }

  mapCase(record) {
    const status = record.fields.Status?.value || "신규접수";
    return {
      id: record.fields.Id?.value || record.id,
      number: record.fields.CaseNumber?.value || "-",
      assetName: "설비 연결",
      subject: record.fields.Subject?.value || "내용 미등록",
      status,
      badgeClass: this.badgeClass(status),
      createdDate: this.formatDateTime(record.fields.CreatedDate?.value),
      visitDate: "일정 확인"
    };
  }

  modelFromName(name) {
    return (
      (name || "").match(/(?:CP\d+(?:\s+Pro|\+)?|CD7000)/i)?.[0] ||
      "모델 미등록"
    );
  }

  badgeClass(status) {
    if (DONE_STATUSES.includes(status)) return "badge done";
    if (PROGRESS_STATUSES.includes(status)) return "badge progress";
    if (ASSIGNED_STATUSES.includes(status)) return "badge assigned";
    return "badge new";
  }

  formatDateTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
      .format(new Date(value))
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  }

  get totalAssetCount() {
    return this.assets.length;
  }
  get runningAssetCount() {
    return this.assets.filter((asset) => asset.isRunning).length;
  }
  get attentionAssetCount() {
    return this.assets.filter((asset) => !asset.isRunning).length;
  }
  get healthScore() {
    if (!this.assets.length) return 0;
    const total = this.assets.reduce((sum, asset) => sum + asset.score, 0);
    return Math.round(total / this.assets.length);
  }
  get healthLabel() {
    const score = this.healthScore;
    if (score >= 90) return "양호";
    if (score >= 80) return "관찰";
    return "점검 필요";
  }
  get healthPercent() {
    return `${this.healthScore}%`;
  }
  get ringStyle() {
    const pct = this.healthScore;
    const arc = pct < 80 ? "#c78036" : "#2eb7b0";
    return `background: conic-gradient(from -90deg, ${arc} 0%, ${arc} ${pct}%, rgba(46,196,182,0.16) ${pct}% 100%);`;
  }
  get topAssets() {
    return [...this.assets].sort((a, b) => b.score - a.score).slice(0, 5);
  }
  get hasAssets() {
    return this.assets.length > 0;
  }

  get newCaseCount() {
    return this.cases.filter((item) => NEW_STATUSES.includes(item.status))
      .length;
  }
  get assignedCaseCount() {
    return this.cases.filter((item) => ASSIGNED_STATUSES.includes(item.status))
      .length;
  }
  get progressCaseCount() {
    return this.cases.filter((item) => PROGRESS_STATUSES.includes(item.status))
      .length;
  }
  get doneCaseCount() {
    return this.cases.filter((item) => DONE_STATUSES.includes(item.status))
      .length;
  }
  get recentCases() {
    return this.cases.slice(0, 3);
  }
  get hasRecentCases() {
    return this.recentCases.length > 0;
  }

  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
