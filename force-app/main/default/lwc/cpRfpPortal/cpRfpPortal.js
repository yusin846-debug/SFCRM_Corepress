import { LightningElement, api } from 'lwc';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';
export default class CpRfpPortal extends LightningElement {
    @api homeUrl='/'; @api assetListUrl='/asset-list'; @api serviceUrl='/service-request';
    headerLogoUrl=headerLogo; activeTab='issue'; entryMode='portal'; fileLabel='선택된 파일 없음';
    get showIssue(){return this.activeTab==='issue'} get showStatus(){return this.activeTab==='status'} get showRfq(){return this.activeTab==='rfq'}
    get issueTabClass(){return this.activeTab==='issue'?'active':''} get statusTabClass(){return this.activeTab==='status'?'active':''} get rfqTabClass(){return this.activeTab==='rfq'?'active':''}
    get isPortalMode(){return this.entryMode==='portal'} get isEmailMode(){return this.entryMode==='email'}
    get portalModeClass(){return `mode-option ${this.isPortalMode?'selected':''}`} get emailModeClass(){return `mode-option ${this.isEmailMode?'selected':''}`}
    selectTab(e){this.activeTab=e.currentTarget.dataset.tab} goToRfq(){this.activeTab='rfq'}
    changeEntryMode(e){this.entryMode=e.target.value;this.fileLabel='선택된 파일 없음'}
    handleFile(e){this.fileLabel=e.target.files[0]?.name||'선택된 파일 없음'}
    validate(form){return [...form.querySelectorAll('input[required],textarea[required],select[required]')].reduce((ok,f)=>{f.reportValidity();return ok&&f.checkValidity()},true)}
    submitRfp(e){e.preventDefault();if(this.validate(e.currentTarget))this.activeTab='status'}
    submitRfq(e){e.preventDefault();if(this.validate(e.currentTarget))this.activeTab='status'}
}
