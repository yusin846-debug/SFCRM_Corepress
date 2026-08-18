import { LightningElement } from 'lwc';
import logo from '@salesforce/resourceUrl/CorePressHeaderLogo';
import cp7100 from '@salesforce/resourceUrl/CorePressCP7100';
import registeredIcon from '@salesforce/resourceUrl/CorePressRegisteredIcon';
import operatingIcon from '@salesforce/resourceUrl/CorePressOperatingIcon';
import warningIcon from '@salesforce/resourceUrl/CorePressWarningIcon';
import requestIcon from '@salesforce/resourceUrl/CorePressRequestIcon';
import assignedIcon from '@salesforce/resourceUrl/CorePressAssignedIcon';
import workIcon from '@salesforce/resourceUrl/CorePressWorkIcon';
import completeIcon from '@salesforce/resourceUrl/CorePressCompleteIcon';
import warrantyIcon from '@salesforce/resourceUrl/CorePressWarrantyIcon';
import infoIcon from '@salesforce/resourceUrl/CorePressInfoIcon';
import documentIcon from '@salesforce/resourceUrl/CorePressDocumentIcon';
import logoutIcon from '@salesforce/resourceUrl/CorePressLogoutIcon';
import maintenanceIcon from '@salesforce/resourceUrl/CorePressMaintenanceIcon';

export default class CpPortalHome extends LightningElement {
    logoUrl = logo;
    cp7100Url = cp7100;
    registeredIconUrl = registeredIcon;
    operatingIconUrl = operatingIcon;
    warningIconUrl = warningIcon;
    requestIconUrl = requestIcon;
    assignedIconUrl = assignedIcon;
    workIconUrl = workIcon;
    completeIconUrl = completeIcon;
    warrantyIconUrl = warrantyIcon;
    infoIconUrl = infoIcon;
    documentIconUrl = documentIcon;
    logoutIconUrl = logoutIcon;
    maintenanceIconUrl = maintenanceIcon;
}
