import { LightningElement, api } from 'lwc';
import coverImage from '@salesforce/resourceUrl/CorePressBrochureCover';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';
import cp100Image from '@salesforce/resourceUrl/CorePressCP100';
import cp2100Image from '@salesforce/resourceUrl/CorePressCP2100';
import cp7100Image from '@salesforce/resourceUrl/CorePressCP7100';
import growthMap from '@salesforce/resourceUrl/CorePressGrowthMap';
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
    growthMapUrl = growthMap;
    healthIconUrl = healthIcon;
    supportIconUrl = supportIcon;
    maintenanceIconUrl = maintenanceIcon;
    portalUserIconUrl = portalUserIcon;
    isCatalogModalOpen = false;
    isCatalogSubmitted = false;
    productRotation;
    productTransition;
    isProductChanging = false;
    products = [
        {
            id: 'cp100',
            name: 'CP100 Pro',
            category: 'HIGH EFFICIENCY',
            description: '안정적인 효율과 운용 편의성을 갖춘 표준형 압축기입니다.',
            imageUrl: cp100Image,
            imageAlt: 'CP100 Pro 고효율 압축기',
        },
        {
            id: 'cp2100',
            name: 'CP2100',
            category: 'COMPACT · LOW FLOW',
            description: '공간 제약이 있는 저유량 공정에 적합한 컴팩트 모델입니다.',
            imageUrl: cp2100Image,
            imageAlt: 'CP2100 컴팩트 압축기',
        },
        {
            id: 'cp7100',
            name: 'CP7100+',
            category: 'HIGH FLOW',
            description: '대유량 생산 공정의 연속 운전에 최적화된 고성능 모델입니다.',
            imageUrl: cp7100Image,
            imageAlt: 'CP7100+ 대유량 터보 압축기'
        }
    ];
    selectedProductId = 'cp100';

    connectedCallback() {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.productRotation = window.setInterval(() => this.showNextProduct(), 6000);
        }
    }

    disconnectedCallback() {
        window.clearInterval(this.productRotation);
        window.clearTimeout(this.productTransition);
    }

    get selectedProduct() {
        return this.products.find((product) => product.id === this.selectedProductId) || this.products[0];
    }

    get productTabs() {
        return this.products.map((product) => ({
            ...product,
            tabClass: product.id === this.selectedProductId ? 'product-tab active' : 'product-tab',
            ariaSelected: product.id === this.selectedProductId ? 'true' : 'false'
        }));
    }

    get productDisplayClass() {
        return this.isProductChanging ? 'product-display changing' : 'product-display';
    }

    selectProduct(event) {
        this.changeProduct(event.currentTarget.dataset.product);
        this.restartProductRotation();
    }

    showNextProduct() {
        const currentIndex = this.products.findIndex((product) => product.id === this.selectedProductId);
        this.changeProduct(this.products[(currentIndex + 1) % this.products.length].id);
    }

    changeProduct(productId) {
        if (productId === this.selectedProductId || this.isProductChanging) return;
        this.isProductChanging = true;
        window.clearTimeout(this.productTransition);
        this.productTransition = window.setTimeout(() => {
            this.selectedProductId = productId;
            this.isProductChanging = false;
        }, 420);
    }

    restartProductRotation() {
        window.clearInterval(this.productRotation);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.productRotation = window.setInterval(() => this.showNextProduct(), 6000);
        }
    }

    get hasCatalogUrl() {
        return Boolean(this.resolvedCatalogUrl);
    }

    get resolvedCatalogUrl() {
        return this.catalogUrl || productBrochure;
    }

    openCatalogModal() {
        this.isCatalogSubmitted = false;
        this.isCatalogModalOpen = true;
        window.requestAnimationFrame(() => {
            this.template.querySelector('.first-field')?.focus();
        });
    }

    closeCatalogModal() {
        this.isCatalogModalOpen = false;
        this.isCatalogSubmitted = false;
    }

    handleBackdropClick(event) {
        if (event.target === event.currentTarget) this.closeCatalogModal();
    }

    handleModalKeydown(event) {
        if (event.key === 'Escape') this.closeCatalogModal();
    }

    submitCatalogInquiry(event) {
        event.preventDefault();
        const fields = [...this.template.querySelectorAll('.catalog-modal input, .catalog-modal select, .catalog-modal textarea')];
        const isValid = fields.reduce((valid, field) => {
            field.reportValidity();
            return valid && field.checkValidity();
        }, true);
        if (isValid) this.isCatalogSubmitted = true;
    }
}
