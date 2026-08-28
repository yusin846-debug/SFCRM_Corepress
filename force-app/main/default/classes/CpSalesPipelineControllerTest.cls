@IsTest
private class CpSalesPipelineControllerTest {
  private static final String COMPANY = '시나리오 테스트 기업';
  private static final String EMAIL = 'buyer@scenario.example.com';
  private static final String EQUIPMENT = 'CP7100+';

  @TestSetup
  static void setupData() {
    Account account = TestDataFactory.createAccount(COMPANY, true);
    TestDataFactory.createContact(account.Id, EMAIL, true);
    TestDataFactory.createCatalogLead(COMPANY, EMAIL, EQUIPMENT, true);
  }

  @IsTest
  static void shouldCreateRfpAndAdvanceExactLead_WhenPortalRfpSubmitted() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead lead = [SELECT Id FROM Lead WHERE Company = :COMPANY LIMIT 1];

    Test.startTest();
    Id rfpId = CpSalesPipelineController.submitRfp(
      buildSubmission(account.Id, contact.Id, lead.Id)
    );
    Test.stopTest();

    Lead updatedLead = [
      SELECT Status, RFP_Title__c, RFP_Source__c, Requested_Delivery_Date__c
      FROM Lead
      WHERE Id = :lead.Id
    ];
    CorePress_RFP__c rfp = [
      SELECT Account__c, Contact__c, Lead__c, Status__c, Interested_Equipment__c
      FROM CorePress_RFP__c
      WHERE Id = :rfpId
    ];
    Assert.areEqual(
      'RFP접수',
      updatedLead.Status,
      'The selected Lead should advance to RFP received'
    );
    Assert.areEqual(
      '제2공장 CP7100+ 도입 RFP',
      updatedLead.RFP_Title__c,
      'RFP title should be copied to the Lead'
    );
    Assert.areEqual(
      '포털',
      updatedLead.RFP_Source__c,
      'Portal intake should be recorded'
    );
    Assert.areEqual(
      account.Id,
      rfp.Account__c,
      'RFP must stay scoped to the customer Account'
    );
    Assert.areEqual(
      contact.Id,
      rfp.Contact__c,
      'RFP must retain the submitting Contact'
    );
    Assert.areEqual(
      lead.Id,
      rfp.Lead__c,
      'RFP must link the explicitly selected Lead'
    );
    Assert.areEqual(
      EQUIPMENT,
      rfp.Interested_Equipment__c,
      'Exact equipment should be retained'
    );
    Assert.areEqual(
      1,
      [
        SELECT COUNT()
        FROM CorePress_RFP_Event__c
        WHERE RFP__c = :rfpId AND Event_Type__c = 'RFP접수'
      ],
      'RFP receipt should create one public event'
    );
  }

  @IsTest
  static void shouldRejectRfp_WhenLeadBelongsToAnotherCompany() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead otherLead = TestDataFactory.createCatalogLead(
      '다른 기업',
      EMAIL,
      EQUIPMENT,
      true
    );
    CpSalesPipelineController.RfpSubmission submission = buildSubmission(
      account.Id,
      contact.Id,
      otherLead.Id
    );

    Test.startTest();
    try {
      CpSalesPipelineController.submitRfp(submission);
      Assert.fail('Cross-account Lead selection must be rejected');
    } catch (AuraHandledException expected) {
      Assert.isNotNull(
        expected.getMessage(),
        'The customer should receive a safe error'
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void shouldConvertOnceToNewInstallation_WhenShortlistedTwice() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead lead = [SELECT Id FROM Lead WHERE Company = :COMPANY LIMIT 1];
    Id rfpId = CpSalesPipelineController.submitRfp(
      buildSubmission(account.Id, contact.Id, lead.Id)
    );

    Test.startTest();
    Id firstOpportunityId = CpSalesPipelineController.selectShortlist(
      rfpId,
      account.Id,
      contact.Id
    );
    Id secondOpportunityId = CpSalesPipelineController.selectShortlist(
      rfpId,
      account.Id,
      contact.Id
    );
    Test.stopTest();

    Opportunity opportunity = [
      SELECT
        AccountId,
        Name,
        RFP_Number__c,
        Owner.Username,
        RecordType.DeveloperName,
        Type,
        StageName
      FROM Opportunity
      WHERE Id = :firstOpportunityId
    ];
    Assert.areEqual(
      firstOpportunityId,
      secondOpportunityId,
      'Repeated shortlist clicks must return the same Opportunity'
    );
    Assert.areEqual(
      '제2공장 CP7100+ 도입 RFP',
      opportunity.Name,
      'Opportunity name should match the RFP title so sales can find it'
    );
    Assert.isNotNull(
      opportunity.RFP_Number__c,
      'Opportunity should carry the RFP number for cross-reference'
    );
    Assert.areEqual(
      account.Id,
      opportunity.AccountId,
      'Converted Opportunity must use the existing Account'
    );
    Assert.areEqual(
      'New_Installation',
      opportunity.RecordType.DeveloperName,
      'Scenario must use the new-installation Record Type'
    );
    Assert.areEqual(
      'New Business',
      opportunity.Type,
      'Scenario must be classified as new business'
    );
    Assert.areEqual(
      '숏리스트 선정',
      opportunity.StageName,
      'Initial stage must match the new-installation sales process'
    );
    Assert.areEqual(
      1,
      [
        SELECT COUNT()
        FROM CorePress_RFP_Event__c
        WHERE RFP__c = :rfpId AND Event_Type__c = '숏리스트 선정'
      ],
      'Idempotent selection must create one shortlist event'
    );
  }

  @IsTest
  static void shouldAdvanceSameOpportunity_WhenRfqSubmittedAfterShortlist() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead lead = [SELECT Id FROM Lead WHERE Company = :COMPANY LIMIT 1];
    Id rfpId = CpSalesPipelineController.submitRfp(
      buildSubmission(account.Id, contact.Id, lead.Id)
    );
    Id opportunityId = CpSalesPipelineController.selectShortlist(
      rfpId,
      account.Id,
      contact.Id
    );

    Test.startTest();
    Id updatedOpportunityId = CpSalesPipelineController.submitRfq(
      rfpId,
      contact.Id,
      'CP7100+ RFQ',
      Date.today().addDays(45),
      '결제조건 30/40/30'
    );
    Test.stopTest();

    Opportunity opportunity = [
      SELECT Name, StageName, Description
      FROM Opportunity
      WHERE Id = :updatedOpportunityId
    ];
    Assert.areEqual(
      opportunityId,
      updatedOpportunityId,
      'RFQ must update the shortlist Opportunity instead of creating another'
    );
    Assert.areEqual(
      'RFQ 접수',
      opportunity.StageName,
      'RFQ submission must advance the existing Opportunity'
    );
    Assert.areEqual(
      'CP7100+ RFQ',
      opportunity.Name,
      'Customer RFQ title should be retained'
    );
  }

  @IsTest
  static void shouldRecordProposalDownloadAndReturnTimeline() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead lead = [SELECT Id FROM Lead WHERE Company = :COMPANY LIMIT 1];
    Id rfpId = CpSalesPipelineController.submitRfp(
      buildSubmission(account.Id, contact.Id, lead.Id)
    );

    Test.startTest();
    CpSalesPipelineController.recordProposalDownload(rfpId, contact.Id);
    List<CpSalesPipelineController.TimelineEntry> timeline = CpSalesPipelineController.getTimeline(
      rfpId
    );
    Test.stopTest();

    Assert.areEqual(
      2,
      timeline.size(),
      'Timeline should include receipt and proposal download'
    );
    Assert.areEqual(
      '제안서 다운로드',
      timeline[1].eventType,
      'Download should be visible as an actual customer event'
    );
  }

  @IsTest
  static void shouldAttachOriginalAndFlagEmailSource_WhenEmailRfpSubmitted() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead lead = [SELECT Id FROM Lead WHERE Company = :COMPANY LIMIT 1];

    CpSalesPipelineController.RfpSubmission submission = buildSubmission(
      account.Id,
      contact.Id,
      lead.Id
    );
    submission.source = '이메일';
    submission.fileName = 'rfp-원본.txt';
    submission.fileBase64 = EncodingUtil.base64Encode(
      Blob.valueOf('이메일로 전달한 RFP 원본')
    );

    Test.startTest();
    Id rfpId = CpSalesPipelineController.submitRfp(submission);
    Test.stopTest();

    CorePress_RFP__c rfp = [
      SELECT Source__c
      FROM CorePress_RFP__c
      WHERE Id = :rfpId
    ];
    Assert.areEqual(
      '이메일',
      rfp.Source__c,
      'Email intake source should be recorded on the RFP'
    );
    Assert.areEqual(
      1,
      [
        SELECT COUNT()
        FROM ContentDocumentLink
        WHERE LinkedEntityId = :rfpId
      ],
      'The uploaded original file should be linked to the RFP'
    );
  }

  @IsTest
  static void shouldReturnJourneyRfqsForAccount() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead lead = [SELECT Id FROM Lead WHERE Company = :COMPANY LIMIT 1];
    Id rfpId = CpSalesPipelineController.submitRfp(
      buildSubmission(account.Id, contact.Id, lead.Id)
    );
    CpSalesPipelineController.selectShortlist(rfpId, account.Id, contact.Id);
    CpSalesPipelineController.submitRfq(
      rfpId,
      contact.Id,
      'CP7100+ RFQ',
      Date.today().addDays(40),
      ''
    );

    Test.startTest();
    List<CpSalesPipelineController.RfqSummary> rfqs = CpSalesPipelineController.getRfqsForAccount(
      account.Id
    );
    Test.stopTest();

    Assert.areEqual(1, rfqs.size(), 'One journey RFQ expected');
    Assert.areEqual('CP7100+ RFQ', rfqs[0].name);
    Assert.isNotNull(rfqs[0].rfpNumber, 'RFQ row should carry the RFP number');
    Assert.areEqual('RFQ 접수', rfqs[0].stage);
    Assert.areEqual(
      0,
      CpSalesPipelineController.getRfqsForAccount(null).size(),
      'Null accountId returns empty'
    );
  }

  @IsTest
  static void shouldRecordRevisionRequestAsVisibleEvent() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead lead = [SELECT Id FROM Lead WHERE Company = :COMPANY LIMIT 1];
    Id rfpId = CpSalesPipelineController.submitRfp(
      buildSubmission(account.Id, contact.Id, lead.Id)
    );

    Test.startTest();
    CpSalesPipelineController.requestProposalRevision(
      rfpId,
      contact.Id,
      '납기를 2주 앞당겨 주세요.'
    );
    Test.stopTest();

    List<CorePress_RFP_Event__c> events = [
      SELECT Detail__c, Visible_To_Customer__c
      FROM CorePress_RFP_Event__c
      WHERE RFP__c = :rfpId AND Event_Type__c = '제안서 수정요청'
    ];
    Assert.areEqual(1, events.size(), 'One revision-request event expected');
    Assert.isTrue(
      events[0].Visible_To_Customer__c,
      'Revision request must be visible on the customer timeline'
    );
    Assert.isTrue(
      events[0].Detail__c.contains('2주'),
      'Customer message should be kept on the event'
    );
  }

  @IsTest
  static void shouldRejectBlankRevisionRequest() {
    Account account = [SELECT Id FROM Account WHERE Name = :COMPANY LIMIT 1];
    Contact contact = [
      SELECT Id
      FROM Contact
      WHERE AccountId = :account.Id
      LIMIT 1
    ];
    Lead lead = [SELECT Id FROM Lead WHERE Company = :COMPANY LIMIT 1];
    Id rfpId = CpSalesPipelineController.submitRfp(
      buildSubmission(account.Id, contact.Id, lead.Id)
    );

    Test.startTest();
    try {
      CpSalesPipelineController.requestProposalRevision(
        rfpId,
        contact.Id,
        '  '
      );
      Assert.fail('Blank revision text must be rejected');
    } catch (AuraHandledException expected) {
      Assert.isNotNull(expected.getMessage());
    }
    Test.stopTest();
  }

  @IsTest
  static void shouldReturnOnlyCatalogLeads() {
    Lead serviceLead = TestDataFactory.createCatalogLead(
      COMPANY,
      EMAIL,
      EQUIPMENT,
      false
    );
    serviceLead.LeadSource = '서비스 요청';
    Database.DMLOptions options = new Database.DMLOptions();
    options.DuplicateRuleHeader.allowSave = true;
    Database.insert(serviceLead, options, AccessLevel.SYSTEM_MODE);

    Test.startTest();
    List<CpSalesPipelineController.LeadSummary> leads = CpSalesPipelineController.getLeadsForAccount(
      COMPANY
    );
    Test.stopTest();

    Assert.areEqual(
      1,
      leads.size(),
      'Only the 카탈로그 문의 Lead should be offered for RFP linkage'
    );
  }

  private static CpSalesPipelineController.RfpSubmission buildSubmission(
    Id accountId,
    Id contactId,
    Id leadId
  ) {
    CpSalesPipelineController.RfpSubmission submission = new CpSalesPipelineController.RfpSubmission();
    submission.accountId = accountId;
    submission.contactId = contactId;
    submission.leadId = leadId;
    submission.title = '제2공장 CP7100+ 도입 RFP';
    submission.equipment = EQUIPMENT;
    submission.introductionType = '신규 도입';
    submission.requestedDeliveryDate = Date.today().addDays(90);
    submission.specifications = '토출압력 7.5 barG, 대유량 오일프리';
    submission.source = '포털';
    return submission;
  }
}
