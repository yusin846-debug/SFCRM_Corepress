import { LightningElement, api } from 'lwc';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

export default class CpServiceRequest extends LightningElement {
    @api homeUrl = '/';
    @api assetListUrl = '/asset-list';
    headerLogoUrl = headerLogo;
    isSubmitted = false;
    selectedFileLabel = '선택된 파일 없음';
    selectedUrgency = '';
    recommendationText = '공정 영향에 따라 시급도가 함께 지정됩니다.';
    showUrgencyOverride = false;

    get overrideIndicator() {
        return this.showUrgencyOverride ? '−' : '+';
    }

    handleImpactChange(event) {
        const recommendations = {
            normal: { urgency: '낮음', label: '정상 운전 상태를 기준으로 낮음을 추천했습니다.' },
            limited: { urgency: '보통', label: '제한 운전 상태를 기준으로 보통을 추천했습니다.' },
            stopped: { urgency: '긴급', label: '설비 정지 상태를 기준으로 긴급을 추천했습니다.' }
        };
        const recommendation = recommendations[event.target.value];
        this.selectedUrgency = recommendation.urgency;
        this.recommendationText = recommendation.label;
    }

    handleUrgencyChange(event) {
        this.selectedUrgency = event.target.value;
        this.recommendationText = `희망 시급도: ${event.target.value}으로 직접 조정했습니다.`;
    }

    toggleUrgencyOverride() {
        this.showUrgencyOverride = !this.showUrgencyOverride;
    }

    handleFileChange(event) {
        const files = [...event.target.files];
        this.selectedFileLabel = files.length === 0
            ? '선택된 파일 없음'
            : files.length === 1
                ? files[0].name
                : `${files[0].name} 외 ${files.length - 1}개`;
    }

    handleSubmit(event) {
        event.preventDefault();
        const fields = [...this.template.querySelectorAll('select, input[required], textarea[required]')];
        const isValid = fields.reduce((valid, field) => {
            field.reportValidity();
            return valid && field.checkValidity();
        }, true);
        if (isValid) {
            this.isSubmitted = true;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    handleCancel() {
        window.history.back();
    }

    resetForm() {
        this.isSubmitted = false;
        this.selectedFileLabel = '선택된 파일 없음';
        this.selectedUrgency = '';
        this.recommendationText = '공정 영향에 따라 시급도가 함께 지정됩니다.';
        this.showUrgencyOverride = false;
    }
}
