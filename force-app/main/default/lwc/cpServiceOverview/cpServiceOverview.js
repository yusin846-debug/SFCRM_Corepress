import { LightningElement, api } from "lwc";
import headerLogo from "@salesforce/resourceUrl/CorePressHeaderLogo";
import mockup from "@salesforce/resourceUrl/CorePressServiceMockup";

export default class CpServiceOverview extends LightningElement {
  @api homeUrl = "/corepress";
  @api productsUrl = "products";
  @api noticesUrl = "notices";
  @api aboutUrl = "about";
  @api inquiryUrl = "/corepress";
  logoUrl = headerLogo;
  mockupUrl = mockup;

  get inquiryHref() {
    return `${this.inquiryUrl}?inquiry=%EC%84%9C%EB%B9%84%EC%8A%A4#products`;
  }
}
