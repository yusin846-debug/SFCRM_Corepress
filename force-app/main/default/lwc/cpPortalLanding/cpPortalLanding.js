import { LightningElement, api } from 'lwc';
import coverImage from '@salesforce/resourceUrl/CorePressBrochureCover';
import lineupImage from '@salesforce/resourceUrl/CorePressProductLineup';

export default class CpPortalLanding extends LightningElement {
    @api heroTitle = '공정을 멈추지 않는 서비스';
    @api heroDescription =
        '설비 정보부터 서비스 요청까지, CorePress 고객 포털에서 한 번에 연결합니다.';
    @api loginUrl = 'login';

    coverImageUrl = coverImage;
    lineupImageUrl = lineupImage;
}
