// Reset demo data to a clean starting state after the smoke test.
// 1. Delete the smoke-test Opportunity (converted from Lead)
// 2. Delete the (now converted) 박신규 Lead
// 3. Re-seed a fresh unconverted 박신규 Lead so the RFP/RFQ demo starts clean
// 4. Reassign the newly seeded Lead to 김영업 as owner

Database.DeleteResult oppDel = Database.delete(new Opportunity(Id = '006gK00000NG9EHQA1'), false);
System.debug('Smoke Opp delete: ' + oppDel.isSuccess());

Database.DeleteResult leadDel = Database.delete(new Lead(Id = '00QgK00000QqPY6UAN'), false);
System.debug('Old converted 박신규 Lead delete: ' + leadDel.isSuccess());

Id salesOwnerId = [SELECT Id FROM User WHERE Username = 'saleskim@corepress.demo' AND IsActive = true LIMIT 1].Id;

Lead demo = new Lead(
    Company = '대한케미컬_PRT 통합테스트',
    LastName = '박신규',
    FirstName = '설비',
    Email = 'sinkyu.park@daehan-corepress-poc.com',
    Phone = '010-5555-1234',
    LeadSource = '카탈로그 문의',
    Product_Interest__c = '압축기',
    Privacy_Consent__c = true,
    Status = '신규 문의',
    OwnerId = salesOwnerId,
    Description = '[포털 카탈로그 문의]\n관심 제품: CP7100+\n문의 내용: 제2공장 증설을 위해 압축기 카탈로그 요청드립니다.'
);
Database.DMLOptions dml = new Database.DMLOptions();
dml.DuplicateRuleHeader.AllowSave = true;
Database.insert(demo, dml);
System.debug('Reseeded fresh Lead assigned to 김영업: ' + demo.Id);
