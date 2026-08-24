// Seed a fresh unconverted Lead so the RFP → RFQ → convert demo can start
// from the catalog-inquiry state.
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
    Description = '[포털 카탈로그 문의]\n관심 제품: CP7100+\n문의 내용: 제2공장 증설을 위해 압축기 카탈로그 요청드립니다.'
);
Database.DMLOptions dml = new Database.DMLOptions();
dml.DuplicateRuleHeader.AllowSave = true;
List<User> owners = [SELECT Id FROM User WHERE Username = 'test.teamlead.backup@corepress.demo' AND IsActive = true LIMIT 1];
if (!owners.isEmpty()) {
    demo.OwnerId = owners[0].Id;
}
Database.insert(demo, dml);
System.debug('Seeded fresh demo Lead: ' + demo.Id);
