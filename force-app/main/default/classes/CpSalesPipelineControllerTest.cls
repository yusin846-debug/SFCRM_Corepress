@IsTest
private class CpSalesPipelineControllerTest {

    private static Contact insertContact(Account acct) {
        Contact c = new Contact(
            AccountId = acct.Id,
            LastName = '김재혁',
            FirstName = '테스트',
            Email = 'jaehyuk.test@daehan-corepress-poc.com',
            Phone = '010-0000-0000'
        );
        insert c;
        return c;
    }

    private static Account insertAccount(String name) {
        Account a = new Account(Name = name, ShippingStreet = '테스트로 1');
        insert a;
        return a;
    }

    @IsTest
    static void advanceLeadForRfpAdvancesExistingLead() {
        insert new Lead(Company = '대한케미컬 테스트', LastName = '김재혁', Email = 'jaehyuk@test.com', LeadSource = '포털 RFP', Privacy_Consent__c = true, Status = '신규 문의');

        Test.startTest();
        Id leadId = CpSalesPipelineController.advanceLeadForRfp('대한케미컬 테스트', null);
        Test.stopTest();

        Lead updated = [SELECT Status FROM Lead WHERE Id = :leadId];
        System.assertEquals('RFP접수', updated.Status, 'Existing Lead should advance to RFP접수');
    }

    @IsTest
    static void advanceLeadForRfpCreatesLeadWhenNoneMatches() {
        Account acct = insertAccount('신규 고객사');
        Contact c = insertContact(acct);

        Test.startTest();
        Id leadId = CpSalesPipelineController.advanceLeadForRfp('신규 고객사', c.Id);
        Test.stopTest();

        Lead created = [SELECT Company, Status, LastName, Email FROM Lead WHERE Id = :leadId];
        System.assertEquals('신규 고객사', created.Company);
        System.assertEquals('RFP접수', created.Status, 'A newly-created Lead should immediately move to RFP접수');
        System.assertEquals('김재혁', created.LastName);
        System.assertEquals('jaehyuk.test@daehan-corepress-poc.com', created.Email);
    }

    @IsTest
    static void advanceLeadForRfpIsIdempotentPastFirstStage() {
        insert new Lead(Company = '이미 진행 중', LastName = '테스트', Email = 'test@test.com', LeadSource = '포털 RFP', Privacy_Consent__c = true, Status = '제안 진행');

        Test.startTest();
        Id leadId = CpSalesPipelineController.advanceLeadForRfp('이미 진행 중', null);
        Test.stopTest();

        Lead unchanged = [SELECT Status FROM Lead WHERE Id = :leadId];
        System.assertEquals('제안 진행', unchanged.Status, 'Later-stage Leads must not be downgraded to RFP접수');
    }

    @IsTest
    static void convertLeadForRfqConvertsExistingLeadToOpportunity() {
        Account acct = insertAccount('컨버전 테스트 계정');
        Contact c = insertContact(acct);
        Lead lead = new Lead(Company = '컨버전 테스트 계정', LastName = '김재혁', Email = 'convert@test.com', LeadSource = '포털 RFP', Privacy_Consent__c = true, Status = 'RFP접수');
        insert lead;

        Test.startTest();
        Id oppId = CpSalesPipelineController.convertLeadForRfq(
            '컨버전 테스트 계정',
            acct.Id,
            c.Id,
            '테스트 RFQ 견적 요청',
            Date.today().addDays(45),
            '결제 조건: 30/40/30'
        );
        Test.stopTest();

        Opportunity created = [SELECT Name, AccountId, StageName, Description FROM Opportunity WHERE Id = :oppId];
        System.assertEquals('테스트 RFQ 견적 요청', created.Name);
        System.assertEquals(acct.Id, created.AccountId, 'Opportunity must attach to the existing Account, not a new one');
        System.assertEquals('Proposal/Quote', created.StageName);
        System.assertEquals('결제 조건: 30/40/30', created.Description);

        Lead converted = [SELECT IsConverted, ConvertedAccountId, ConvertedContactId FROM Lead WHERE Id = :lead.Id];
        System.assertEquals(true, converted.IsConverted);
        System.assertEquals(acct.Id, converted.ConvertedAccountId, 'Lead conversion must attach to the existing Account');
        System.assertEquals(c.Id, converted.ConvertedContactId, 'Lead conversion must attach to the existing Contact');
    }

    @IsTest
    static void convertLeadForRfqCreatesLeadThenConvertsWhenNoneMatches() {
        Account acct = insertAccount('신규 RFQ 고객');
        Contact c = insertContact(acct);

        Test.startTest();
        Id oppId = CpSalesPipelineController.convertLeadForRfq(
            '신규 RFQ 고객',
            acct.Id,
            c.Id,
            'RFQ 신규 요청',
            Date.today().addDays(30),
            null
        );
        Test.stopTest();

        Opportunity opp = [SELECT AccountId, StageName FROM Opportunity WHERE Id = :oppId];
        System.assertEquals(acct.Id, opp.AccountId);
        System.assertEquals('Proposal/Quote', opp.StageName);

        Lead created = [SELECT IsConverted FROM Lead WHERE Company = '신규 RFQ 고객'];
        System.assertEquals(true, created.IsConverted, 'A synthesized Lead must end up converted');
    }

    @IsTest
    static void convertLeadForRfqRejectsMissingRequiredInputs() {
        Account acct = insertAccount('입력 검증 계정');
        Contact c = insertContact(acct);

        Test.startTest();
        try {
            CpSalesPipelineController.convertLeadForRfq('입력 검증 계정', null, c.Id, 'RFQ 제목', Date.today(), null);
            System.assert(false, 'Missing accountId should throw');
        } catch (AuraHandledException expected) {
            // expected
        }
        try {
            CpSalesPipelineController.convertLeadForRfq('입력 검증 계정', acct.Id, c.Id, '', Date.today(), null);
            System.assert(false, 'Blank rfqTitle should throw');
        } catch (AuraHandledException expected) {
            // expected
        }
        Test.stopTest();
    }

    @IsTest
    static void getLeadsForAccountReturnsLeadsForCompany() {
        insert new Lead(Company = '조회 대상 회사', LastName = 'A', Email = 'a@test.com', LeadSource = '포털 RFP', Privacy_Consent__c = true, Status = 'RFP접수');
        insert new Lead(Company = '조회 대상 회사', LastName = 'B', Email = 'b@test.com', LeadSource = '포털 RFP', Privacy_Consent__c = true, Status = '신규 문의');
        insert new Lead(Company = '다른 회사', LastName = 'C', Email = 'c@test.com', LeadSource = '포털 RFP', Privacy_Consent__c = true, Status = '신규 문의');

        Test.startTest();
        List<CpSalesPipelineController.LeadSummary> leads = CpSalesPipelineController.getLeadsForAccount('조회 대상 회사');
        Test.stopTest();

        System.assertEquals(2, leads.size(), 'Should return only Leads whose Company matches');
        for (CpSalesPipelineController.LeadSummary summary : leads) {
            System.assertEquals('조회 대상 회사', summary.company);
        }
    }

    @IsTest
    static void getLeadsForAccountReturnsEmptyForBlankName() {
        Test.startTest();
        List<CpSalesPipelineController.LeadSummary> leads = CpSalesPipelineController.getLeadsForAccount('');
        Test.stopTest();

        System.assertEquals(0, leads.size(), 'Blank account name should short-circuit to empty list');
    }
}
