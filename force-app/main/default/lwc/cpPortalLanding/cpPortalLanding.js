import { LightningElement, api } from 'lwc';
import submitCatalogInquiry from '@salesforce/apex/CpCatalogLeadController.submitCatalogInquiry';
import coverImage from '@salesforce/resourceUrl/CorePressBrochureCover';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';
import cp100Image from '@salesforce/resourceUrl/CorePressCP100';
import cp2100Image from '@salesforce/resourceUrl/CorePressCP2100';
import cp7100Image from '@salesforce/resourceUrl/CorePressCP7100';
import healthIcon from '@salesforce/resourceUrl/CorePressHealthIcon';
import supportIcon from '@salesforce/resourceUrl/CorePressSupportIcon';
import maintenanceIcon from '@salesforce/resourceUrl/CorePressMaintenanceIcon';
import portalUserIcon from '@salesforce/resourceUrl/CorePressPortalUserIcon';
import productBrochure from '@salesforce/resourceUrl/CorePressProductBrochure';

export default class CpPortalLanding extends LightningElement {
    @api heroTitle = '공정을 멈추지 않는 서비스';
    @api heroDescription =
        '설치부터 보증, 현장 서비스까지\n압축기의 전체 수명주기를 한곳에서 관리합니다.';
    @api loginUrl = 'login';
    @api catalogUrl;

    coverImageUrl = coverImage;
    headerLogoUrl = headerLogo;
    cp100ImageUrl = cp100Image;
    cp2100ImageUrl = cp2100Image;
    cp7100ImageUrl = cp7100Image;
    healthIconUrl = healthIcon;
    supportIconUrl = supportIcon;
    maintenanceIconUrl = maintenanceIcon;
    portalUserIconUrl = portalUserIcon;
    isCatalogModalOpen = false;
    isCatalogSubmitted = false;
    isSubmittingCatalog = false;
    catalogError = '';

    get hasCatalogUrl() {
        return Boolean(this.resolvedCatalogUrl);
    }

    get resolvedCatalogUrl() {
        return this.catalogUrl || productBrochure;
    }

    openCatalogModal() {
        this.isCatalogSubmitted = false;
        this.catalogError = '';
        this.isCatalogModalOpen = true;
        window.requestAnimationFrame(() => {
            this.template.querySelector('.first-field')?.focus();
        });
    }

    closeCatalogModal() {
        this.isCatalogModalOpen = false;
        this.isCatalogSubmitted = false;
        this.catalogError = '';
    }

    handleBackdropClick(event) {
        if (event.target === event.currentTarget) this.closeCatalogModal();
    }

    handleModalKeydown(event) {
        if (event.key === 'Escape') this.closeCatalogModal();
    }

    async submitCatalogInquiry(event) {
        event.preventDefault();
        this.catalogError = '';
        const fields = [...this.template.querySelectorAll('.catalog-modal input, .catalog-modal select, .catalog-modal textarea')];
        const isValid = fields.reduce((valid, field) => {
            field.reportValidity();
            return valid && field.checkValidity();
        }, true);
        if (!isValid) return;

        this.isSubmittingCatalog = true;
        try {
            await submitCatalogInquiry({ inquiry: this.collectInquiry() });
            this.isCatalogSubmitted = true;
        } catch (error) {
            this.catalogError =
                error?.body?.message ||
                '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        } finally {
            this.isSubmittingCatalog = false;
        }
    }

    collectInquiry() {
        const value = (name) =>
            this.template.querySelector(`.catalog-modal [name="${name}"]`)?.value?.trim() || '';
        return {
            company: value('company'),
            name: value('name'),
            email: value('email'),
            phone: value('phone'),
            product: value('product'),
            message: value('message'),
            consent: Boolean(this.template.querySelector('.catalog-modal [name="consent"]')?.checked)
        };
    }
}