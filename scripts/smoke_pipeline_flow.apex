// Smoke test: run the full pipeline for the demo customer end to end.
Account acct = [SELECT Id, Name FROM Account WHERE Id = '001gK00001MoZWrQAN' LIMIT 1];
Contact c = [SELECT Id FROM Contact WHERE AccountId = :acct.Id AND LastName = '김재혁' LIMIT 1];
System.debug('Demo Account: ' + acct.Name + ' (' + acct.Id + ')');
System.debug('Demo Contact Id: ' + c.Id);

// Step 1: RFP submit — advance Lead only
Id leadId = CpSalesPipelineController.advanceLeadForRfp(acct.Name, c.Id);
Lead leadAfterRfp = [SELECT Company, Status, LastName, Email FROM Lead WHERE Id = :leadId];
System.debug('After advanceLeadForRfp: Lead ' + leadAfterRfp.Id + ' Company=' + leadAfterRfp.Company + ' Status=' + leadAfterRfp.Status + ' LastName=' + leadAfterRfp.LastName + ' Email=' + leadAfterRfp.Email);

// Step 2: RFQ submit — convert to Opportunity
Id oppId = CpSalesPipelineController.convertLeadForRfq(
    acct.Name,
    acct.Id,
    c.Id,
    '스모크 테스트 RFQ ' + Datetime.now().getTime(),
    Date.today().addDays(60),
    '결제 조건: 스모크 테스트'
);
Opportunity oppAfterRfq = [SELECT Name, StageName, AccountId, Description FROM Opportunity WHERE Id = :oppId];
Lead leadAfterConvert = [SELECT IsConverted, Status, ConvertedAccountId, ConvertedContactId, ConvertedOpportunityId FROM Lead WHERE Id = :leadId];

System.debug('After convertLeadForRfq: Opp=' + oppAfterRfq.Name + ' Stage=' + oppAfterRfq.StageName + ' AccountId=' + oppAfterRfq.AccountId + ' (expected ' + acct.Id + ')');
System.debug('Lead now: IsConverted=' + leadAfterConvert.IsConverted + ' Status=' + leadAfterConvert.Status + ' ConvertedAccount=' + leadAfterConvert.ConvertedAccountId + ' ConvertedContact=' + leadAfterConvert.ConvertedContactId + ' ConvertedOpp=' + leadAfterConvert.ConvertedOpportunityId);
