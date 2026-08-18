import { LightningElement, api } from 'lwc';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

export default class CpServiceRequest extends LightningElement {
    @api homeUrl = '/';
    @api assetListUrl = '/asset-list';
    headerLogoUrl = headerLogo;
    isSubmitted = false;
    selectedFileLabel = '선택된 파일 없음';
    recommendationText = '공정 영향을 선택하면 시급도를 추천합니다.';

    handleImpactChange(event) {
        const recommendations = {
            normal: { urgency: '낮음', label: '정상 운전 상태를 기준으로 낮음을 추천했습니다.' },
            limited: { urgency: '보통', label: '제한 운전 상태를 기준으로 보통을 추천했습니다.' },
            stopped: { urgency: '긴급', label: '설비 정지 상태를 기준으로 긴급을 추천했습니다.' }
        };
        const recommendation = recommendations[event.target.value];
        const urgencyField = this.template.querySelector('select[name="urgency"]');
        urgencyField.value = recommendation.urgency;
        this.recommendationText = recommendation.label;
    }

    handleUrgencyChange(event) {
        if (event.target.value) {
            this.recommendationText = '추천값을 직접 변경할 수 있습니다.';
        }
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
        this.recommendationText = '공정 영향을 선택하면 시급도를 추천합니다.';
    }
}
