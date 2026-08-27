public without sharing class CpSalesPipelineController {
    private static final String WORKING_STATUS = 'RFP접수';
    private static final String SHORTLIST_STATUS = '숏리스트 선정';
    private static final String RFQ_STATUS = 'RFQ 접수';
    private static final String SALES_OWNER_USERNAME = 'test.teamlead.backup@corepress.demo';

    @AuraEnabled
    public static Id submitRfp(RfpSubmission submission) {
        if (submission == null) {
            throw new AuraHandledException('RFP 정보가 전달되지 않았습니다.');
        }
        if (submission.accountId == null || submission.contactId == null) {
            throw new AuraHandledException('고객 계정 및 담당자 정보가 필요합니다.');
        }
        if (String.isBlank(submission.title)) {
            throw new AuraHandledException('RFP 제목을 입력해 주세요.');
        }
        if (String.isBlank(submission.equipment)) {
            throw new AuraHandledException('관심 장비를 입력해 주세요.');
        }

        CorePress_RFP__c rfp = new CorePress_RFP__c(
            Account__c = submission.accountId,
            Contact__c = submission.contactId,
            Title__c = submission.title.trim(),
            Interested_Equipment__c = submission.equipment.trim(),
            Introduction_Type__c = String.isBlank(submission.introductionType) ? null : submission.introductionType.trim(),
            Requested_Delivery_Date__c = parseDate(submission.requestedDeliveryDate),
            Specifications__c = String.isBlank(submission.specifications) ? null : submission.specifications.trim(),
            Source__c = String.isBlank(submission.source) ? '포털' : submission.source.trim(),
            Status__c = WORKING_STATUS,
            Submitted_At__c = Datetime.now(),
            Proposal_Key__c = resolveProposalKey(submission.equipment)
        );

        try {
            Database.insert(rfp, AccessLevel.SYSTEM_MODE);
        } catch (DmlException e) {
            throw new AuraHandledException('RFP 접수 중 오류가 발생했습니다.');
        }

        createEvent(rfp.Id, WORKING_STATUS, WORKING_STATUS + ' 처리 완료', null);
        syncLead(submission.leadId, submission.accountId);
        return rfp.Id;
    }

    @AuraEnabled
    public static Id selectShortlist(Id rfpId, Id accountId, Id contactId) {
        if (rfpId == null) {
            throw new AuraHandledException('RFP 정보가 필요합니다.');
        }

        List<CorePress_RFP__c> rfps = [
            SELECT Id, Title__c, Interested_Equipment__c, Introduction_Type__c, Opportunity__c, Account__c
            FROM CorePress_RFP__c
            WHERE Id = :rfpId
            LIMIT 1
        ];
        if (rfps.isEmpty()) {
            throw new AuraHandledException('RFP를 찾을 수 없습니다.');
        }

        CorePress_RFP__c rfp = rfps[0];
        if (rfp.Opportunity__c != null) {
            throw new AuraHandledException('이미 숏리스트가 선정된 RFP입니다.');
        }

        String acctName = '';
        List<Account> accts = [SELECT Name FROM Account WHERE Id = :accountId LIMIT 1];
        if (!accts.isEmpty()) {
            acctName = accts[0].Name;
        }

        String introLabel = String.isNotBlank(rfp.Introduction_Type__c) ? rfp.Introduction_Type__c : '신규 도입';
        String oppName = (acctName + ' ' + rfp.Interested_Equipment__c + ' ' + introLabel + ' 견적').trim();

        Id rtId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('New_Installation')?.getRecordTypeId();

        Opportunity opp = new Opportunity(
            Name = oppName,
            AccountId = accountId,
            StageName = SHORTLIST_STATUS,
            CloseDate = Date.today().addDays(30),
            Type = 'New Business'
        );
        if (rtId != null) {
            opp.RecordTypeId = rtId;
        }

        try {
            Database.insert(opp, AccessLevel.SYSTEM_MODE);
        } catch (DmlException e) {
            throw new AuraHandledException('Opportunity 생성 중 오류가 발생했습니다.');
        }

        rfp.Opportunity__c = opp.Id;
        rfp.Status__c = SHORTLIST_STATUS;
        try {
            Database.update(rfp, AccessLevel.SYSTEM_MODE);
        } catch (DmlException e) {
            throw new AuraHandledException('RFP 상태 업데이트 중 오류가 발생했습니다.');
        }

        createEvent(rfpId, SHORTLIST_STATUS, SHORTLIST_STATUS + ' 처리 완료', opp.Id);
        reassignOpportunityOwner(opp.Id);
        return opp.Id;
    }

    @AuraEnabled
    public static Id submitRfq(Id rfpId, Id contactId, String title, String requestedDeliveryDate, String description) {
        if (rfpId == null) {
            throw new AuraHandledException('RFP 정보가 필요합니다.');
        }

        List<CorePress_RFP__c> rfps = [
            SELECT Id, Opportunity__c, Status__c
            FROM CorePress_RFP__c
            WHERE Id = :rfpId
            LIMIT 1
        ];
        if (rfps.isEmpty()) {
            throw new AuraHandledException('RFP를 찾을 수 없습니다.');
        }

        CorePress_RFP__c rfp = rfps[0];
        if (rfp.Opportunity__c == null) {
            throw new AuraHandledException('숏리스트가 선정되지 않은 RFP입니다.');
        }

        Opportunity opp = new Opportunity(Id = rfp.Opportunity__c);
        opp.StageName = RFQ_STATUS;
        if (String.isNotBlank(title)) {
            opp.Name = title.trim();
        }
        Date parsedDate = parseDate(requestedDeliveryDate);
        if (parsedDate != null) {
            opp.CloseDate = parsedDate;
        }
        if (String.isNotBlank(description)) {
            opp.Description = description.trim();
        }

        try {
            Database.update(opp, AccessLevel.SYSTEM_MODE);
        } catch (DmlException e) {
            throw new AuraHandledException('RFQ 접수 중 오류가 발생했습니다.');
        }

        rfp.Status__c = RFQ_STATUS;
        try {
            Database.update(rfp, AccessLevel.SYSTEM_MODE);
        } catch (DmlException ignored) {
        }

        createEvent(rfpId, RFQ_STATUS, RFQ_STATUS + ' 처리 완료', rfp.Opportunity__c);
        return rfp.Opportunity__c;
    }

    @AuraEnabled
    public static void recordProposalDownload(Id rfpId, Id contactId) {
        if (rfpId == null) {
            return;
        }
        createEvent(rfpId, '제안서 다운로드', '제안서 다운로드 처리 완료', null);
    }

    @AuraEnabled(cacheable=true)
    public static List<RfpSummary> getRfpsForAccount(Id accountId) {
        if (accountId == null) {
            return new List<RfpSummary>();
        }

        List<CorePress_RFP__c> rfps = [
            SELECT Id, Title__c, Submitted_At__c, Status__c, Opportunity__c, Proposal_Key__c
            FROM CorePress_RFP__c
            WHERE Account__c = :accountId
            ORDER BY Submitted_At__c DESC
        ];
        if (rfps.isEmpty()) {
            return new List<RfpSummary>();
        }

        Set<Id> rfpIds = new Set<Id>();
        for (CorePress_RFP__c rfp : rfps) {
            rfpIds.add(rfp.Id);
        }

        Map<Id, ContentDocumentLink> proposalByRfp = new Map<Id, ContentDocumentLink>();
        for (ContentDocumentLink cdl : [
            SELECT LinkedEntityId, ContentDocumentId, ContentDocument.Title, ContentDocument.CreatedDate
            FROM ContentDocumentLink
            WHERE LinkedEntityId IN :rfpIds
            ORDER BY ContentDocument.CreatedDate DESC
        ]) {
            if (!proposalByRfp.containsKey(cdl.LinkedEntityId)) {
                proposalByRfp.put(cdl.LinkedEntityId, cdl);
            }
        }

        List<RfpSummary> summaries = new List<RfpSummary>();
        for (CorePress_RFP__c rfp : rfps) {
            RfpSummary s = new RfpSummary();
            s.id = rfp.Id;
            s.title = rfp.Title__c;
            s.submittedAt = rfp.Submitted_At__c;
            s.shortlistComplete = rfp.Opportunity__c != null;

            ContentDocumentLink cdl = proposalByRfp.get(rfp.Id);
            if (cdl != null) {
                s.hasProposal = true;
                s.proposalContentDocumentId = cdl.ContentDocumentId;
                s.proposalTitle = cdl.ContentDocument.Title;
                s.proposalUploadedAt = cdl.ContentDocument.CreatedDate;
            } else {
                s.hasProposal = String.isNotBlank(rfp.Proposal_Key__c);
            }
            summaries.add(s);
        }
        return summaries;
    }

    @AuraEnabled(cacheable=true)
    public static List<TimelineEntry> getTimeline(Id rfpId) {
        if (rfpId == null) {
            return new List<TimelineEntry>();
        }

        List<TimelineEntry> entries = new List<TimelineEntry>();
        for (CorePress_RFP_Event__c evt : [
            SELECT Event_Type__c, Detail__c, Occurred_At__c
            FROM CorePress_RFP_Event__c
            WHERE RFP__c = :rfpId AND Visible_To_Customer__c = true
            ORDER BY Occurred_At__c ASC
        ]) {
            TimelineEntry entry = new TimelineEntry();
            entry.eventType = evt.Event_Type__c;
            entry.detail = evt.Detail__c;
            entry.occurredAt = evt.Occurred_At__c;
            entries.add(entry);
        }
        return entries;
    }

    @AuraEnabled(cacheable=true)
    public static List<LeadSummary> getLeadsForAccount(String accountName) {
        if (String.isBlank(accountName)) {
            return new List<LeadSummary>();
        }

        List<LeadSummary> summaries = new List<LeadSummary>();
        for (Lead l : [
            SELECT Id, Name, Company, Status, Product_Interest__c, Existing_Equipment__c,
                   Description, LeadSource, CreatedDate, IsConverted, ConvertedOpportunityId
            FROM Lead
            WHERE Company = :accountName.trim()
            ORDER BY CreatedDate DESC
        ]) {
            LeadSummary s = new LeadSummary();
            s.id = l.Id;
            s.name = l.Name;
            s.company = l.Company;
            s.status = l.Status;
            s.productInterest = l.Product_Interest__c;
            s.equipment = l.Existing_Equipment__c;
            s.description = l.Description;
            s.leadSource = l.LeadSource;
            s.createdDate = l.CreatedDate;
            s.isConverted = l.IsConverted;
            s.convertedOpportunityId = l.ConvertedOpportunityId;
            summaries.add(s);
        }
        return summaries;
    }

    @AuraEnabled
    public static Boolean syncLeadOnRfpSubmit(String accountName) {
        if (String.isBlank(accountName)) {
            return false;
        }

        List<Lead> matches = [
            SELECT Id, Status, OwnerId
            FROM Lead
            WHERE IsConverted = false AND Company = :accountName.trim()
            LIMIT 1
        ];
        if (matches.isEmpty()) {
            return false;
        }

        Id salesOwnerId = getSalesOwnerId();
        Lead match = matches[0];
        Boolean needsUpdate = match.Status != WORKING_STATUS || (salesOwnerId != null && match.OwnerId != salesOwnerId);
        if (!needsUpdate) {
            return true;
        }
        match.Status = WORKING_STATUS;
        if (salesOwnerId != null) {
            match.OwnerId = salesOwnerId;
        }
        try {
            Database.update(match, AccessLevel.SYSTEM_MODE);
        } catch (DmlException error) {
            return false;
        }
        return true;
    }

    @AuraEnabled
    public static Boolean reassignOpportunityOwner(Id opportunityId) {
        if (opportunityId == null) {
            return false;
        }
        Id salesOwnerId = getSalesOwnerId();
        if (salesOwnerId == null) {
            return false;
        }
        try {
            Database.update(new Opportunity(Id = opportunityId, OwnerId = salesOwnerId), AccessLevel.SYSTEM_MODE);
        } catch (DmlException error) {
            return false;
        }
        return true;
    }

    private static void syncLead(String leadId, Id accountId) {
        if (String.isNotBlank(leadId)) {
            try {
                Id parsedId = Id.valueOf(leadId);
                List<Lead> leads = [SELECT Id, Status, OwnerId FROM Lead WHERE Id = :parsedId AND IsConverted = false LIMIT 1];
                if (!leads.isEmpty()) {
                    Lead l = leads[0];
                    Id salesOwnerId = getSalesOwnerId();
                    l.Status = WORKING_STATUS;
                    if (salesOwnerId != null) {
                        l.OwnerId = salesOwnerId;
                    }
                    Database.update(l, AccessLevel.SYSTEM_MODE);
                }
            } catch (Exception ignored) {
            }
        } else if (accountId != null) {
            List<Account> accts = [SELECT Name FROM Account WHERE Id = :accountId LIMIT 1];
            if (!accts.isEmpty()) {
                syncLeadOnRfpSubmit(accts[0].Name);
            }
        }
    }

    private static void createEvent(Id rfpId, String eventType, String detail, Id opportunityId) {
        CorePress_RFP_Event__c evt = new CorePress_RFP_Event__c(
            RFP__c = rfpId,
            Event_Type__c = eventType,
            Detail__c = detail,
            Occurred_At__c = Datetime.now(),
            Visible_To_Customer__c = true
        );
        if (opportunityId != null) {
            evt.Opportunity__c = opportunityId;
        }
        try {
            Database.insert(evt, AccessLevel.SYSTEM_MODE);
        } catch (DmlException ignored) {
        }
    }

    private static Date parseDate(String dateStr) {
        if (String.isBlank(dateStr)) {
            return null;
        }
        try {
            return Date.valueOf(dateStr);
        } catch (Exception e) {
            return null;
        }
    }

    private static String resolveProposalKey(String equipment) {
        if (String.isBlank(equipment)) {
            return null;
        }
        return equipment.trim().toUpperCase().replace('+', '_PLUS').replaceAll('[^A-Z0-9_]', '_');
    }

    private static Id getSalesOwnerId() {
        List<User> owners = [SELECT Id FROM User WHERE Username = :SALES_OWNER_USERNAME AND IsActive = true LIMIT 1];
        return owners.isEmpty() ? null : owners[0].Id;
    }

    public class RfpSubmission {
        @AuraEnabled public Id accountId { get; set; }
        @AuraEnabled public Id contactId { get; set; }
        @AuraEnabled public String leadId { get; set; }
        @AuraEnabled public String title { get; set; }
        @AuraEnabled public String equipment { get; set; }
        @AuraEnabled public String introductionType { get; set; }
        @AuraEnabled public String requestedDeliveryDate { get; set; }
        @AuraEnabled public String specifications { get; set; }
        @AuraEnabled public String source { get; set; }
    }

    public class RfpSummary {
        @AuraEnabled public Id id { get; set; }
        @AuraEnabled public String title { get; set; }
        @AuraEnabled public Datetime submittedAt { get; set; }
        @AuraEnabled public Boolean shortlistComplete { get; set; }
        @AuraEnabled public Boolean hasProposal { get; set; }
        @AuraEnabled public Id proposalContentDocumentId { get; set; }
        @AuraEnabled public String proposalTitle { get; set; }
        @AuraEnabled public Datetime proposalUploadedAt { get; set; }
    }

    public class TimelineEntry {
        @AuraEnabled public String eventType { get; set; }
        @AuraEnabled public String detail { get; set; }
        @AuraEnabled public Datetime occurredAt { get; set; }
    }

    public class LeadSummary {
        @AuraEnabled public Id id { get; set; }
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public String company { get; set; }
        @AuraEnabled public String status { get; set; }
        @AuraEnabled public String productInterest { get; set; }
        @AuraEnabled public String equipment { get; set; }
        @AuraEnabled public String description { get; set; }
        @AuraEnabled public String leadSource { get; set; }
        @AuraEnabled public Datetime createdDate { get; set; }
        @AuraEnabled public Boolean isConverted { get; set; }
        @AuraEnabled public Id convertedOpportunityId { get; set; }
    }
}
