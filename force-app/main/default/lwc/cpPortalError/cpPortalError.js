import { LightningElement, api } from "lwc";
import logo from "@salesforce/resourceUrl/CorePressHeaderLogo";

export default class CpPortalError extends LightningElement {
  @api homeUrl = "portal-home";
  logoUrl = logo;

  handleBack() {
    window.history.back();
  }
}
