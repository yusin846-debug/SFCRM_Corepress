import { LightningElement, api } from "lwc";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import cp7100 from "@salesforce/resourceUrl/CorePressCP7100Detail";
import blueprint from "@salesforce/resourceUrl/CorePressCP7100Blueprint";
import locationIcon from "@salesforce/resourceUrl/CorePressLocationIcon";
import operatingIcon from "@salesforce/resourceUrl/CorePressSummaryOperatingIcon";
import logoutIcon from "@salesforce/resourceUrl/CorePressLogoutWhiteIcon";

export default class CpAssetDetail extends LightningElement {
  @api homeUrl = "portal-home";
  @api assetListUrl = "asset-list";
  @api serviceListUrl = "service-requests";
  @api serviceRequestUrl = "service-request-new";
  logoUrl = logo;
  cp7100Url = cp7100;
  blueprintUrl = blueprint;
  locationIconUrl = locationIcon;
  operatingIconUrl = operatingIcon;
  logoutIconUrl = logoutIcon;

  handleLogout() {
    const returnUrl = encodeURIComponent("/corepressvforcesite/s/");
    window.location.assign(`/secur/logout.jsp?retUrl=${returnUrl}`);
  }
}
