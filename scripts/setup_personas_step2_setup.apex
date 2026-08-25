// Setup DML batch: deactivate old kiminstalls, create new 김 설비 portal User,
// assign all portal permission sets, and grant 김영업 the sales owner permset.

// 1. Deactivate the internal 김 설비 (kiminstalls@corpress.com)
update new User(Id = '005gK000078usn3QAA', IsActive = false);
System.debug('Deactivated internal 김 설비 (kiminstalls)');

// 2. Create the new portal User for 김 설비 (linked to Contact 003gK0000118FTpQAM)
Id contactId = '003gK0000118FTpQAM';
Id customerPortalLoginProfileId = '00egK00000C6Yp7QAF'; // Customer Community Plus Login User (same as 김재혁)

User kimSeolbi = new User(
    ContactId = contactId,
    Username = 'kim.seolbi@daehan-corepress-poc.com',
    Email = 'kim.seolbi@daehan-corepress-poc.com',
    FirstName = '설비',
    LastName = '김',
    Alias = 'kseolbi',
    CommunityNickname = 'kim_seolbi',
    TimeZoneSidKey = 'Asia/Seoul',
    LocaleSidKey = 'ko_KR',
    EmailEncodingKey = 'UTF-8',
    LanguageLocaleKey = 'ko',
    ProfileId = customerPortalLoginProfileId,
    IsActive = true
);
insert kimSeolbi;
System.debug('NEW_PORTAL_USER_ID=' + kimSeolbi.Id);

// 3. Set password (data + demo convenience)
System.setPassword(kimSeolbi.Id, 'CorePress2026!');

// 4. Grant portal permission sets to the new user
List<String> portalPermsets = new List<String>{
    'CorePress_PRT_Customer_Login',
    'CorePress_Opportunity_Portal_Access',
    'CorePress_Service_Detail_Access',
    'CorePress_Quote_Portal_Access'
};
Map<String, Id> permsetIdByName = new Map<String, Id>();
for (PermissionSet ps : [SELECT Id, Name FROM PermissionSet WHERE Name IN :portalPermsets]) {
    permsetIdByName.put(ps.Name, ps.Id);
}
List<PermissionSetAssignment> assigns = new List<PermissionSetAssignment>();
for (String name : portalPermsets) {
    Id psetId = permsetIdByName.get(name);
    if (psetId != null) {
        assigns.add(new PermissionSetAssignment(AssigneeId = kimSeolbi.Id, PermissionSetId = psetId));
    } else {
        System.debug('WARNING: permset not found: ' + name);
    }
}
insert assigns;
System.debug('Assigned ' + assigns.size() + ' portal permsets to 김 설비');

// 5. Grant Sales Owner permset to 김영업 (saleskim)
Id saleskimId = [SELECT Id FROM User WHERE Username = 'saleskim@corepress.demo' AND IsActive = true LIMIT 1].Id;
PermissionSet salesOwnerPset = [SELECT Id FROM PermissionSet WHERE Name = 'CorePress_Sales_Owner' LIMIT 1];
List<PermissionSetAssignment> existing = [SELECT Id FROM PermissionSetAssignment WHERE AssigneeId = :saleskimId AND PermissionSetId = :salesOwnerPset.Id];
if (existing.isEmpty()) {
    insert new PermissionSetAssignment(AssigneeId = saleskimId, PermissionSetId = salesOwnerPset.Id);
    System.debug('Assigned CorePress_Sales_Owner permset to 김영업');
} else {
    System.debug('김영업 already has CorePress_Sales_Owner permset');
}
