@IsTest
private class CpSalesPipelineControllerTest {
    @TestSetup
    static void setup() {
        Account acct = new Account(Name = '대한케미컬 테스트', ShippingStreet = '테스트로 1');
        insert acct;
        Contact ct = new Contact(LastName = '김재혁', AccountId = acct.Id, Email = 'jaehyuk.test@daehan-corepress-poc.com');
        insert ct;
    }

    @IsTest
    static void submitRfpCreatesRecordAndEvent() {
        Account acct = [SELECT Id, Name FROM Account WHERE Name = '대한케미컬 테스트'];
        Contact ct = [SELECT Id FROM Contact WHERE AccountId = :acct.Id LIMIT 1];

        CpSalesPipelineController.RfpSubmission sub = new CpSalesPipelineController.RfpSubmission();
        sub.accountId = acct.Id;
        sub.contactId = ct.Id;
        sub.title = 'CP7100+ 테스트 RFP';
        sub.equipment = 'CP7100+';
        sub.introductionType = '신규도입';
        sub.source = '포털';

        Test.startTest();
        Id rfpId = CpSalesPipelineController.submitRfp(sub);
        Test.stopTest();

        System.assertNotEquals(null, rfpId);
        CorePress_RFP__c rfp = [SELECT Title__c, Status__c, Source__c, Proposal_Key__c FROM CorePress_RFP__c WHERE Id = :rfpId];
        System.assertEquals('RFP접수', rfp.Status__c);
        System.assertEquals('포털', rfp.Source__c);
        System.assertNotEquals(null, rfp.Proposal_Key__c);

        List<CorePress_RFP_Event__c> events = [SELECT Event_Type__c, Detail__c FROM CorePress_RFP_Event__c WHERE RFP__c = :rfpId];
        System.assertEquals(1, events.size());
        System.assertEquals('RFP접수', events[0].Event_Type__c);
    }

    @IsTest
    static void submitRfpThrowsWhenTitleBlank() {
        Account acct = [SELECT Id FROM Account WHERE Name = '대한케미컬 테스트'];
        Contact ct = [SELECT Id FROM Contact WHERE AccountId = :acct.Id LIMIT 1];

        CpSalesPipelineController.RfpSubmission sub = new CpSalesPipelineController.RfpSubmission();
        sub.accountId = acct.Id;
        sub.contactId = ct.Id;
        sub.title = '';
        sub.equipment = 'CP7100+';

        try {
            CpSalesPipelineController.submitRfp(sub);
            System.assert(false, 'Expected AuraHandledException');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('제목'));
        }
    }

    @IsTest
    static void selectShortlistCreatesOpportunity() {
        Account acct = [SELECT Id, Name FROM Account WHERE Name = '대한케미컬 테스트'];
        Contact ct = [SELECT Id FROM Contact WHERE AccountId = :acct.Id LIMIT 1];

        CorePress_RFP__c rfp = new CorePress_RFP__c(
            Account__c = acct.Id,
            Contact__c = ct.Id,
            Title__c = 'CP7100+ 신규요청',
            Interested_Equipment__c = 'CP7100+',
            Introduction_Type__c = '신규도입',
            Source__c = '포털',
            Status__c = 'RFP접수',
            Submitted_At__c = Datetime.now()
        );
        insert rfp;

        Test.startTest();
        Id oppId = CpSalesPipelineController.selectShortlist(rfp.Id, acct.Id, ct.Id);
        Test.stopTest();

        System.assertNotEquals(null, oppId);
        Opportunity opp = [SELECT StageName, AccountId FROM Opportunity WHERE Id = :oppId];
        System.assertEquals('숏리스트 선정', opp.StageName);
        System.assertEquals(acct.Id, opp.AccountId);

        CorePress_RFP__c updated = [SELECT Status__c, Opportunity__c FROM CorePress_RFP__c WHERE Id = :rfp.Id];
        System.assertEquals('숏리스트 선정', updated.Status__c);
        System.assertEquals(oppId, updated.Opportunity__c);
    }

    @IsTest
    static void selectShortlistThrowsWhenAlreadySelected() {
        Account acct = [SELECT Id FROM Account WHERE Name = '대한케미컬 테스트'];
        Contact ct = [SELECT Id FROM Contact WHERE AccountId = :acct.Id LIMIT 1];

        Opportunity opp = new Opportunity(Name = '기존 견적', AccountId = acct.Id, StageName = '숏리스트 선정', CloseDate = Date.today().addDays(30));
        insert opp;

        CorePress_RFP__c rfp = new CorePress_RFP__c(
            Account__c = acct.Id, Contact__c = ct.Id, Title__c = '테스트',
            Interested_Equipment__c = 'CP7100+', Source__c = '포털',
            Status__c = '숏리스트 선정', Submitted_At__c = Datetime.now(),
            Opportunity__c = opp.Id
        );
        insert rfp;

        try {
            CpSalesPipelineController.selectShortlist(rfp.Id, acct.Id, ct.Id);
            System.assert(false, 'Expected AuraHandledException');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('이미'));
        }
    }

    @IsTest
    static void submitRfqAdvancesOpportunity() {
        Account acct = [SELECT Id FROM Account WHERE Name = '대한케미컬 테스트'];
        Contact ct = [SELECT Id FROM Contact WHERE AccountId = :acct.Id LIMIT 1];

        Opportunity opp = new Opportunity(Name = '테스트 견적', AccountId = acct.Id, StageName = '숏리스트 선정', CloseDate = Date.today().addDays(30));
        insert opp;

        CorePress_RFP__c rfp = new CorePress_RFP__c(
            Account__c = acct.Id, Contact__c = ct.Id, Title__c = '테스트',
            Interested_Equipment__c = 'CP7100+', Source__c = '포털',
            Status__c = '숏리스트 선정', Submitted_At__c = Datetime.now(),
            Opportunity__c = opp.Id
        );
        insert rfp;

        Test.startTest();
        Id result = CpSalesPipelineController.submitRfq(rfp.Id, ct.Id, 'RFQ 테스트 제목', String.valueOf(Date.today().addDays(60)), '결제 조건: NET30');
        Test.stopTest();

        System.assertEquals(opp.Id, result);
        Opportunity updated = [SELECT StageName, Name, Description FROM Opportunity WHERE Id = :opp.Id];
        System.assertEquals('RFQ 접수', updated.StageName);
        System.assertEquals('RFQ 테스트 제목', updated.Name);
    }

    @IsTest
    static void recordProposalDownloadCreatesEvent() {
        Account acct = [SELECT Id FROM Account WHERE Name = '대한케미컬 테스트'];
        Contact ct = [SELECT Id FROM Contact WHERE AccountId = :acct.Id LIMIT 1];

        CorePress_RFP__c rfp = new CorePress_RFP__c(
            Account__c = acct.Id, Contact__c = ct.Id, Title__c = '다운로드 테스트',
            Interested_Equipment__c = 'CP7100+', Source__c = '포털',
            Status__c = 'RFP접수', Submitted_At__c = Datetime.now()
        );
        insert rfp;

        Test.startTest();
        CpSalesPipelineController.recordProposalDownload(rfp.Id, ct.Id);
        Test.stopTest();

        List<CorePress_RFP_Event__c> events = [SELECT Event_Type__c FROM CorePress_RFP_Event__c WHERE RFP__c = :rfp.Id AND Event_Type__c = '제안서 다운로드'];
        System.assertEquals(1, events.size());
    }

    @IsTest
    static void getRfpsForAccountReturnsSummaries() {
        Account acct = [SELECT Id FROM Account WHERE Name = '대한케미컬 테스트'];
        Contact ct = [SELECT Id FROM Contact WHERE AccountId = :acct.Id LIMIT 1];

        CorePress_RFP__c rfp = new CorePress_RFP__c(
            Account__c = acct.Id, Contact__c = ct.Id, Title__c = '조회 테스트 RFP',
            Interested_Equipment__c = 'CP7100+', Source__c = '포털',
            Status__c = 'RFP접수', Submitted_At__c = Datetime.now(),
            Proposal_Key__c = 'CP7100_PLUS'
        );
        insert rfp;

        Test.startTest();
        List<CpSalesPipelineController.RfpSummary> results = CpSalesPipelineController.getRfpsForAccount(acct.Id);
        Test.stopTest();

        System.assertEquals(1, results.size());
        System.assertEquals('조회 테스트 RFP', results[0].title);
        System.assertEquals(true, results[0].hasProposal);
        System.assertEquals(false, results[0].shortlistComplete);
    }

    @IsTest
    static void getTimelineReturnsEvents() {
        Account acct = [SELECT Id FROM Account WHERE Name = '대한케미컬 테스트'];
        Contact ct = [SELECT Id FROM Contact WHERE AccountId = :acct.Id LIMIT 1];

        CorePress_RFP__c rfp = new CorePress_RFP__c(
            Account__c = acct.Id, Contact__c = ct.Id, Title__c = '타임라인 테스트',
            Interested_Equipment__c = 'CP7100+', Source__c = '포털',
            Status__c = 'RFP접수', Submitted_At__c = Datetime.now()
        );
        insert rfp;

        insert new CorePress_RFP_Event__c(
            RFP__c = rfp.Id, Event_Type__c = 'RFP접수',
            Detail__c = 'RFP접수 처리 완료', Occurred_At__c = Datetime.now(),
            Visible_To_Customer__c = true
        );

        Test.startTest();
        List<CpSalesPipelineController.TimelineEntry> entries = CpSalesPipelineController.getTimeline(rfp.Id);
        Test.stopTest();

        System.assertEquals(1, entries.size());
        System.assertEquals('RFP접수', entries[0].eventType);
    }

    @IsTest
    static void getLeadsForAccountReturnsLeads() {
        insert new Lead(
            Company = '대한케미컬 테스트', LastName = '김재혁',
            Email = 'jaehyuk.test@daehan-corepress-poc.com',
            LeadSource = '카탈로그 문의', Privacy_Consent__c = true, Status = '신규 문의'
        );

        Test.startTest();
        List<CpSalesPipelineController.LeadSummary> leads = CpSalesPipelineController.getLeadsForAccount('대한케미컬 테스트');
        Test.stopTest();

        System.assert(!leads.isEmpty());
        System.assertEquals('대한케미컬 테스트', leads[0].company);
    }

    @IsTest
    static void advancesOpenLeadWithMatchingCompany() {
        insert new Lead(Company = '대한케미컬 테스트', LastName = '김재혁', Email = 'jaehyuk.test@daehan-corepress-poc.com', LeadSource = '카탈로그 문의', Privacy_Consent__c = true, Status = '신규 문의');

        Test.startTest();
        Boolean result = CpSalesPipelineController.syncLeadOnRfpSubmit('대한케미컬 테스트');
        Test.stopTest();

        System.assertEquals(true, result);
        Lead updated = [SELECT Status FROM Lead WHERE Company = '대한케미컬 테스트' AND IsConverted = false LIMIT 1];
        System.assertEquals('RFP접수', updated.Status);
    }

    @IsTest
    static void returnsFalseWhenNoMatchingLead() {
        Test.startTest();
        Boolean result = CpSalesPipelineController.syncLeadOnRfpSubmit('존재하지 않는 회사');
        Test.stopTest();

        System.assertEquals(false, result);
    }

    @IsTest
    static void returnsFalseWhenAccountNameBlank() {
        Test.startTest();
        Boolean result = CpSalesPipelineController.syncLeadOnRfpSubmit('');
        Test.stopTest();

        System.assertEquals(false, result);
    }

    @IsTest
    static void reassignOpportunityOwnerReturnsFalseForNullId() {
        Test.startTest();
        Boolean result = CpSalesPipelineController.reassignOpportunityOwner(null);
        Test.stopTest();

        System.assertEquals(false, result);
    }

    @IsTest
    static void getRfpsReturnsEmptyForNull() {
        Test.startTest();
        List<CpSalesPipelineController.RfpSummary> results = CpSalesPipelineController.getRfpsForAccount(null);
        Test.stopTest();

        System.assertEquals(0, results.size());
    }

    @IsTest
    static void getTimelineReturnsEmptyForNull() {
        Test.startTest();
        List<CpSalesPipelineController.TimelineEntry> entries = CpSalesPipelineController.getTimeline(null);
        Test.stopTest();

        System.assertEquals(0, entries.size());
    }

    @IsTest
    static void getLeadsReturnsEmptyForBlank() {
        Test.startTest();
        List<CpSalesPipelineController.LeadSummary> leads = CpSalesPipelineController.getLeadsForAccount('');
        Test.stopTest();

        System.assertEquals(0, leads.size());
    }
}
