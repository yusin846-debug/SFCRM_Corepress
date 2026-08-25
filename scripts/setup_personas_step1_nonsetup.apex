// Non-setup DML batch: Contact create + Lead/Opportunity owner reassignment.
// The corresponding setup DML (User deactivate/create, PermissionSetAssignment)
// runs in step 2 to avoid MIXED_DML_OPERATION.

// 1. Create Contact 김 설비 on 대한케미컬 Account
Contact kimSeolbi = new Contact(
    AccountId = '001gK00001MoZWrQAN',
    LastName = '김',
    FirstName = '설비',
    Email = 'kim.seolbi@daehan-corepress-poc.com',
    Phone = '010-0000-0002',
    Title = '설비관리팀 팀장'
);
insert kimSeolbi;
System.debug('CONTACT_ID=' + kimSeolbi.Id);

// 2. Reassign existing Lead/Opportunity from admin backup owner → 김영업
Id oldOwnerId = '005gK00006yWYk5QAG'; // test.teamlead.backup (System Administrator)
Id newOwnerId = [SELECT Id FROM User WHERE Username = 'saleskim@corepress.demo' AND IsActive = true LIMIT 1].Id;

List<Lead> orphanLeads = [SELECT Id, Name, OwnerId FROM Lead WHERE OwnerId = :oldOwnerId AND IsConverted = false];
for (Lead l : orphanLeads) {
    l.OwnerId = newOwnerId;
}
if (!orphanLeads.isEmpty()) {
    update orphanLeads;
    System.debug('Reassigned ' + orphanLeads.size() + ' Leads to 김영업');
}

List<Opportunity> orphanOpps = [SELECT Id, Name, OwnerId FROM Opportunity WHERE OwnerId = :oldOwnerId];
for (Opportunity o : orphanOpps) {
    o.OwnerId = newOwnerId;
}
if (!orphanOpps.isEmpty()) {
    update orphanOpps;
    System.debug('Reassigned ' + orphanOpps.size() + ' Opportunities to 김영업');
}
