import { LightningElement, api } from 'lwc';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

export default class CpServiceRequest extends LightningElement {
    @api homeUrl = '/';
    @api assetListUrl = '/asset-list';
    headerLogoUrl = headerLogo;
    isSubmitted = false;

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
    }
}
