import { LightningElement, api } from "lwc";
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

export default class CpPortalHome extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceUrl = "service-request";
  @api rfpUrl = "rfp-rfq";
  @api quoteUrl = "quotes";
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

  handleLogout() {
    const returnUrl = encodeURIComponent("/corepress/s/login");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}