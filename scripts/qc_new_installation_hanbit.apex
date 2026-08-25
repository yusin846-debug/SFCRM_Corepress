Account qcAccount = [SELECT Id, Name FROM Account WHERE Id = '001gK00001NQZsPQAX' LIMIT 1];
Contact qcContact = [SELECT Id, Email FROM Contact WHERE Id = '003gK000010AxJFQA0' LIMIT 1];
CpCatalogLeadController.CatalogInquiry inquiry = new CpCatalogLeadController.CatalogInquiry();
inquiry.company = qcAccount.Name;
inquiry.name = '김도현';
inquiry.email = qcContact.Email;
inquiry.phone = '010-0000-0000';
inquiry.product = 'CP7100+';
inquiry.productFamily = '압축기';
inquiry.message = '[QC] 한빛 신규 도입 카탈로그 문의';
inquiry.consent = true;
inquiry.marketingConsent = false;
Id qcLeadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);

{
    CpSalesPipelineController.RfpSubmission submission = new CpSalesPipelineController.RfpSubmission();
    submission.accountId = qcAccount.Id;
    submission.contactId = qcContact.Id;
    submission.leadId = qcLeadId;
    submission.title = '[QC] 한빛 CP7100+ 신규 도입 RFP';
    submission.equipment = 'CP7100+';
    submission.introductionType = '신규 도입';
    submission.requestedDeliveryDate = Date.today().addDays(120);
    submission.specifications = '[QC] 오일프리, 7.5 barG';
    submission.source = '포털 QC';

    Id rfpId = CpSalesPipelineController.submitRfp(submission);
    CpSalesPipelineController.recordProposalDownload(rfpId, qcContact.Id);
    Id opportunityId = CpSalesPipelineController.selectShortlist(rfpId, qcAccount.Id, qcContact.Id);
    Id rfqOpportunityId = CpSalesPipelineController.submitRfq(
        rfpId,
        qcContact.Id,
        '[QC] 한빛 CP7100+ RFQ',
        Date.today().addDays(90),
        '[QC] 결제조건 30/40/30'
    );
    Opportunity result = [
        SELECT AccountId, Owner.Username, RecordType.DeveloperName, Type, StageName
        FROM Opportunity
        WHERE Id = :opportunityId
    ];
    System.assertEquals(opportunityId, rfqOpportunityId);
    System.assertEquals(qcAccount.Id, result.AccountId);
    System.assertEquals('saleskim@corepress.demo', result.Owner.Username);
    System.assertEquals('New_Installation', result.RecordType.DeveloperName);
    System.assertEquals('New Business', result.Type);
    System.assertEquals('RFQ 접수', result.StageName);
    System.assert(CpSalesPipelineController.getTimeline(rfpId).size() >= 4);
    System.debug('HANBIT_QC_PASS RFP=' + rfpId + ' OPPORTUNITY=' + opportunityId);
}
