import { LightningElement, api } from 'lwc';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

export default class CpServiceRequest extends LightningElement {
    @api homeUrl = '/';
    @api assetListUrl = '/asset-list';
    headerLogoUrl = headerLogo;
    isSubmitted = false;
    selectedFileLabel = '선택된 파일 없음';

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
    }
}
