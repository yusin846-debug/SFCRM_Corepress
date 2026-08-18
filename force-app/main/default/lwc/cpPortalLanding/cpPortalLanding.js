import { LightningElement, api } from 'lwc';
import coverImage from '@salesforce/resourceUrl/CorePressBrochureCover';
import lineupImage from '@salesforce/resourceUrl/CorePressProductLineup';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

export default class CpPortalLanding extends LightningElement {
    @api heroTitle = '공정을 멈추지 않는 서비스';
    @api heroDescription =
        '설치부터 보증, 현장 서비스까지\n압축기 생애주기를 하나의 흐름으로 관리합니다.';
    @api loginUrl = 'login';

    coverImageUrl = coverImage;
    lineupImageUrl = lineupImage;
    headerLogoUrl = headerLogo;
}
