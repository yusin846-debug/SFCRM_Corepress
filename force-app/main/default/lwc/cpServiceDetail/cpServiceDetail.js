import { LightningElement, api } from 'lwc';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

export default class CpServiceDetail extends LightningElement {
    @api homeUrl = '/';
    @api assetListUrl = '/asset-list';
    @api requestListUrl = '/service-request';
    headerLogoUrl = headerLogo;
    steps = [
        { number: '01', label: '신규접수', date: '08.10', className: 'step complete' },
        { number: '02', label: '판정완료', date: '08.10', className: 'step complete' },
        { number: '03', label: '배정완료', date: '08.11', className: 'step complete' },
        { number: '04', label: '진행중', date: '현재 단계', className: 'step current' },
        { number: '05', label: '완료', date: '', className: 'step' }
    ];
}
