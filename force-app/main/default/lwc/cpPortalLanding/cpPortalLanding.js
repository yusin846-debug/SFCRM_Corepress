import { LightningElement, api } from 'lwc';
import coverImage from '@salesforce/resourceUrl/CorePressBrochureCover';
import lineupImage from '@salesforce/resourceUrl/CorePressProductLineup';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';

export default class CpPortalLanding extends LightningElement {
    @api heroTitle = '공정을 멈추지 않는 서비스';
    @api heroDescription =
        '설치부터 보증, 현장 서비스까지\n압축기의 전체 수명주기를 한곳에서 관리합니다.';
    @api loginUrl = 'login';

    coverImageUrl = coverImage;
    lineupImageUrl = lineupImage;
    headerLogoUrl = headerLogo;
}
