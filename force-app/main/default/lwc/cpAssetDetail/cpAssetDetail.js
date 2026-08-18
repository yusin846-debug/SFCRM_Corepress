import { LightningElement } from 'lwc';
import logo from '@salesforce/resourceUrl/CorePressHeaderLogo';
import cp7100 from '@salesforce/resourceUrl/CorePressCP7100';
import locationIcon from '@salesforce/resourceUrl/CorePressLocationIcon';
import operatingIcon from '@salesforce/resourceUrl/CorePressOperatingIcon';
import logoutIcon from '@salesforce/resourceUrl/CorePressLogoutIcon';

export default class CpAssetDetail extends LightningElement {
    logoUrl = logo;
    cp7100Url = cp7100;
    locationIconUrl = locationIcon;
    operatingIconUrl = operatingIcon;
    logoutIconUrl = logoutIcon;
}
