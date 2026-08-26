// Probe: what does Database.convertLead actually accept as convertedStatus?
Long t = Datetime.now().getTime();
Lead probe = new Lead(Company = 'Probe Co ' + t, LastName = 'ProbeLastName', Email = 'probe' + t + '@example.com', LeadSource = '포털 RFP', Privacy_Consent__c = true, Status = '신규 문의');
Database.DMLOptions dml = new Database.DMLOptions();
dml.DuplicateRuleHeader.AllowSave = true;
Database.insert(probe, dml);
System.debug('Probe Lead Id: ' + probe.Id);

for (LeadStatus s : [SELECT MasterLabel, IsConverted, ApiName FROM LeadStatus WHERE IsConverted = true]) {
    System.debug('Candidate MasterLabel: |' + s.MasterLabel + '| ApiName: |' + s.ApiName + '|');
}

for (String candidate : new List<String>{ 'Approved', '숏리스트 선정', 'Closed - Converted', 'Converted' }) {
    Long tt = Datetime.now().getTime();
    Lead fresh = new Lead(Company = 'ProbeAgain ' + tt + candidate, LastName = 'ProbeLastName', Email = 'p' + tt + '@example.com', LeadSource = '포털 RFP', Privacy_Consent__c = true, Status = '신규 문의');
    Database.insert(fresh, dml);
    try {
        Database.LeadConvert lc = new Database.LeadConvert();
        lc.setLeadId(fresh.Id);
        lc.setConvertedStatus(candidate);
        lc.setDoNotCreateOpportunity(true);
        Database.LeadConvertResult r = Database.convertLead(lc, false);
        System.debug('setConvertedStatus(' + candidate + ') → success=' + r.isSuccess() + ', errors=' + r.getErrors());
    } catch (Exception e) {
        System.debug('setConvertedStatus(' + candidate + ') → THREW: ' + e.getMessage());
    }
}
