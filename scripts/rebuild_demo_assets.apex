// Rebuild demo Assets to match the "안산 1공장 CP6000 x 2" scenario.
// Also relinks the approval-demo Case (00001047) to the CP6000 that
// needs replacement, so the two demo threads become one story.
Id demoAccountId = '001gK00001MoZWrQAN';
Id demoContactId = '003gK00000zpUs9QAE';
Id cp6000ProductId = '01tgK00000DxVrdQAF';

// 1. Create the two new CP6000 Assets (안산 1공장)
Asset healthy = new Asset(
    Name = '안산 1공장 CP6000 #1',
    AccountId = demoAccountId,
    ContactId = demoContactId,
    Product2Id = cp6000ProductId,
    SerialNumber = 'DHC-2019-CP6000-01',
    InstallDate = Date.newInstance(2019, 5, 1),
    Status = 'Installed',
    City = '안산시',
    Street = '제1공장 유틸리티동 A동',
    Total_Runtime_Hours__c = 24500,
    Runtime_As_Of__c = Date.today()
);

Asset aging = new Asset(
    Name = '안산 1공장 CP6000 #2',
    AccountId = demoAccountId,
    ContactId = demoContactId,
    Product2Id = cp6000ProductId,
    SerialNumber = 'DHC-2018-CP6000-02',
    InstallDate = Date.newInstance(2018, 3, 15),
    Status = 'Obsolete',
    City = '안산시',
    Street = '제1공장 유틸리티동 B동',
    Total_Runtime_Hours__c = 63200,
    Runtime_As_Of__c = Date.today()
);

insert new List<Asset>{ healthy, aging };
System.debug('CP6000 #1 (Installed): ' + healthy.Id);
System.debug('CP6000 #2 (Obsolete/교체 필요): ' + aging.Id);

// 2. Relink Case 00001047 to CP6000 #2 (approval demo now tells the
//    replacement story)
Case approvalDemoCase = new Case(
    Id = '500gK00001HHZYXQA5',
    AssetId = aging.Id,
    Subject = '안산 1공장 CP6000 #2 진동·소음 이상 점검 요청'
);
update approvalDemoCase;
System.debug('Case 00001047 relinked to CP6000 #2');

// 3. Delete the old 여수 Asset now that no Case references it
Database.DeleteResult deleteResult = Database.delete(new Asset(Id = '02igK000002d9BxQAI'), false);
System.debug('여수 Asset delete: success=' + deleteResult.isSuccess() + (deleteResult.isSuccess() ? '' : ' errors=' + deleteResult.getErrors()));
