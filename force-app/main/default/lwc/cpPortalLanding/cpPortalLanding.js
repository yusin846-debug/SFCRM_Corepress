import { LightningElement, api } from 'lwc';
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
    productRotation;
    products = [
        {
            id: 'cp100',
            name: 'CP100 Pro',
            category: 'HIGH EFFICIENCY',
            description: '안정적인 효율과 운용 편의성을 갖춘 표준형 압축기입니다.',
            imageUrl: cp100Image,
            imageAlt: 'CP100 Pro 고효율 압축기',
            outcomes: [
                { label: '운전 효율', value: '고효율', note: '표준 공정의 에너지 운용 최적화' },
                { label: '설치 방식', value: '일체형', note: '현장 설치와 시운전 절차 간소화' },
                { label: '서비스', value: '통합 관리', note: '설치부터 보증까지 하나의 흐름' }
            ]
        },
        {
            id: 'cp2100',
            name: 'CP2100',
            category: 'COMPACT · LOW FLOW',
            description: '공간 제약이 있는 저유량 공정에 적합한 컴팩트 모델입니다.',
            imageUrl: cp2100Image,
            imageAlt: 'CP2100 컴팩트 압축기',
            outcomes: [
                { label: '적용 공정', value: '저유량', note: '필요 유량에 맞춘 안정적인 운전' },
                { label: '공간 효율', value: '컴팩트', note: '제한된 설비 공간에 유연하게 설치' },
                { label: '유지관리', value: '간편 점검', note: '주요 부품의 정비 접근성 확보' }
            ]
        },
        {
            id: 'cp7100',
            name: 'CP7100+',
            category: 'HIGH FLOW',
            description: '대유량 생산 공정의 연속 운전에 최적화된 고성능 모델입니다.',
            imageUrl: cp7100Image,
            imageAlt: 'CP7100+ 대유량 터보 압축기',
            outcomes: [
                { label: '정격 유량', value: '39,000', unit: 'Nm³/hr', note: '대규모 생산 공정 대응' },
                { label: '토출 압력', value: '15.2', unit: 'bar A', note: '안정적인 공정 압력 유지' },
                { label: '모니터링', value: 'Smart Care S2', note: '설비 상태와 정비 시점 연결' }
            ]
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

    selectProduct(event) {
        this.selectedProductId = event.currentTarget.dataset.product;
        this.restartProductRotation();
    }

    showNextProduct() {
        const currentIndex = this.products.findIndex((product) => product.id === this.selectedProductId);
        this.selectedProductId = this.products[(currentIndex + 1) % this.products.length].id;
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
