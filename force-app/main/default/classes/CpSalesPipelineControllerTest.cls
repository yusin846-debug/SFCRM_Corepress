@IsTest
private class CpSalesPipelineControllerTest {
    @IsTest
    static void advancesOpenLeadWithMatchingCompany() {
        insert new Lead(Company = '대한케미컬 테스트', LastName = '김재혁', Email = 'jaehyuk.test@daehan-corepress-poc.com', LeadSource = '카탈로그 문의', Privacy_Consent__c = true, Status = '신규 문의');

        Test.startTest();
        Boolean result = CpSalesPipelineController.syncLeadOnRfpSubmit('대한케미컬 테스트');
        Test.stopTest();

        System.assertEquals(true, result, 'A matching open Lead should be synced');
        Lead updated = [SELECT Status FROM Lead WHERE Company = '대한케미컬 테스트'];
        System.assertEquals('제안 진행', updated.Status, 'Lead should advance to the Working stage');
    }

    @IsTest
    static void returnsFalseWhenNoMatchingLead() {
        Test.startTest();
        Boolean result = CpSalesPipelineController.syncLeadOnRfpSubmit('존재하지 않는 회사');
        Test.stopTest();

        System.assertEquals(false, result, 'No Lead should be found or updated');
    }

    @IsTest
    static void returnsFalseWhenAccountNameBlank() {
        Test.startTest();
        Boolean result = CpSalesPipelineController.syncLeadOnRfpSubmit('');
        Test.stopTest();

        System.assertEquals(false, result, 'Blank account name should be a no-op');
    }

    @IsTest
    static void reassignsOpportunityOwnerWhenBackupUserExists() {
        List<User> owners = [SELECT Id FROM User WHERE Username = 'test.teamlead.backup@corepress.demo' AND IsActive = true LIMIT 1];
        if (owners.isEmpty()) {
            return; // Org-specific demo user not present in this environment; nothing to assert.
        }
        Account acct = new Account(Name = 'CpSalesPipeline 테스트 계정', ShippingStreet = '테스트로 1');
        insert acct;
        Opportunity opp = new Opportunity(Name = '테스트 기회', AccountId = acct.Id, StageName = 'Qualification', CloseDate = Date.today().addDays(30));
        insert opp;

        Test.startTest();
        Boolean result = CpSalesPipelineController.reassignOpportunityOwner(opp.Id);
        Test.stopTest();

        Assert.areEqual(true, result, 'Ownership reassignment should succeed');
        Opportunity updated = [SELECT OwnerId FROM Opportunity WHERE Id = :opp.Id];
        Assert.areEqual(owners[0].Id, updated.OwnerId, 'Opportunity should be owned by the sales team lead backup account');
    }

    @IsTest
    static void reassignOpportunityOwnerReturnsFalseForNullId() {
        Test.startTest();
        Boolean result = CpSalesPipelineController.reassignOpportunityOwner(null);
        Test.stopTest();

        System.assertEquals(false, result, 'Null Opportunity Id should be a no-op');
    }

    @IsTest
    static void isIdempotentWhenLeadAlreadyAdvanced() {
        insert new Lead(Company = '이미 진행 중', LastName = '테스트', Email = 'already.working@daehan-corepress-poc.com', LeadSource = '카탈로그 문의', Privacy_Consent__c = true, Status = '제안 진행');

        Test.startTest();
        Boolean result = CpSalesPipelineController.syncLeadOnRfpSubmit('이미 진행 중');
        Test.stopTest();

        System.assertEquals(true, result, 'Lead already at the Working stage should still report success');
        Lead unchanged = [SELECT Status FROM Lead WHERE Company = '이미 진행 중'];
        System.assertEquals('제안 진행', unchanged.Status, 'Status should remain unchanged, not re-written');
    }
}
