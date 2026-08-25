/**
 * Drives the sales pipeline from portal activity in two ordered stages:
 * (1) submit an RFP → the customer's Lead is advanced to the RFP-received
 * stage, no Opportunity yet; (2) submit an RFQ → the Lead is converted to
 * an Opportunity attached to the customer's existing Account and Contact.
 *
 * Runs without sharing because it touches Lead/Opportunity records the portal
 * user has no direct access to. Never returns raw Lead/Opportunity data on
 * mutation paths — read paths return only the wrapper types below.
 */
public without sharing class CpSalesPipelineController {
    private static final String RFP_SUBMITTED_STATUS = 'RFP접수';
    private static final String DEFAULT_LEAD_STATUS = '신규 문의';
    private static final String RFQ_OPPORTUNITY_STAGE = 'Proposal/Quote';
    private static final String LEAD_SOURCE_PORTAL = '포털 RFP';
    private static final String DEFAULT_LAST_NAME = '미입력';
    private static final String SALES_OWNER_USERNAME = 'saleskim@corepress.demo';

    /**
     * Advances (or creates) the customer's Lead to `RFP접수`. No Opportunity
     * is created at this stage — that happens on RFQ conversion. Idempotent:
     * a Lead already past `신규 문의` is left alone.
     *
     * @param accountName Name of the submitting customer's Account (Lead.Company).
     * @param contactId Submitting user's Contact Id, used to seed a new Lead if none matches.
     * @return Id of the affected Lead.
     */
    @AuraEnabled
    public static Id advanceLeadForRfp(String accountName, Id contactId) {
        Lead lead = findOrCreateLead(accountName, contactId);
        if (lead.Status == DEFAULT_LEAD_STATUS) {
            lead.Status = RFP_SUBMITTED_STATUS;
            Id salesOwnerId = getSalesOwnerId();
            if (salesOwnerId != null) {
                lead.OwnerId = salesOwnerId;
            }
            Database.update(lead, AccessLevel.SYSTEM_MODE);
        }
        return lead.Id;
    }

    /**
     * Converts the customer's Lead into an Opportunity, attached to the given
     * Account and Contact so a portal user never ends up with duplicate
     * customer records. If no Lead matches yet, one is created at RFP접수
     * first so every Opportunity has a Lead trail behind it. On success, the
     * resulting Opportunity is stamped with Proposal/Quote stage, the RFQ
     * title/description, and reassigned to the sales team lead backup owner.
     *
     * @param accountName Customer's Account name (Lead.Company).
     * @param accountId Existing Account to attach the converted Lead to.
     * @param contactId Existing Contact to attach the converted Lead to.
     * @param rfqTitle Opportunity name to apply after conversion.
     * @param closeDate Opportunity close date.
     * @param description Opportunity description (payment terms etc).
     * @return Id of the created Opportunity.
     */
    @AuraEnabled
    public static Id convertLeadForRfq(
        String accountName,
        Id accountId,
        Id contactId,
        String rfqTitle,
        Date closeDate,
        String description
    ) {
        if (accountId == null || contactId == null) {
            throw new AuraHandledException('고객 계정 정보가 없어 RFQ를 접수할 수 없습니다.');
        }
        if (String.isBlank(rfqTitle)) {
            throw new AuraHandledException('RFQ 요청 제목을 입력해 주세요.');
        }

        Lead lead = findOrCreateLead(accountName, contactId);
        if (lead.Status == DEFAULT_LEAD_STATUS) {
            lead.Status = RFP_SUBMITTED_STATUS;
            Database.update(lead, AccessLevel.SYSTEM_MODE);
        }

        Database.LeadConvert lc = new Database.LeadConvert();
        lc.setLeadId(lead.Id);
        lc.setConvertedStatus(getConvertedStatusLabel());
        lc.setAccountId(accountId);
        lc.setContactId(contactId);
        lc.setOpportunityName(rfqTitle);
        Database.LeadConvertResult result = Database.convertLead(lc);
        if (!result.isSuccess()) {
            throw new AuraHandledException('Lead 변환에 실패했습니다: ' + result.getErrors()[0].getMessage());
        }

        Opportunity opp = new Opportunity(
            Id = result.getOpportunityId(),
            StageName = RFQ_OPPORTUNITY_STAGE,
            CloseDate = closeDate == null ? Date.today().addDays(30) : closeDate,
            Description = description
        );
        Id salesOwnerId = getSalesOwnerId();
        if (salesOwnerId != null) {
            opp.OwnerId = salesOwnerId;
        }
        Database.update(opp, AccessLevel.SYSTEM_MODE);

        return opp.Id;
    }

    /**
     * Returns Leads (converted or not) whose Company matches the customer's
     * Account name, ordered newest first. Powers the "내 RFP 현황" tab, which
     * shows the pre-conversion side of the sales pipeline.
     */
    @AuraEnabled(cacheable=true)
    public static List<LeadSummary> getLeadsForAccount(String accountName) {
        List<LeadSummary> result = new List<LeadSummary>();
        if (String.isBlank(accountName)) {
            return result;
        }
        for (Lead lead : [
            SELECT Id, Name, Company, Status, Product_Interest__c, Description, LeadSource, CreatedDate, IsConverted, ConvertedOpportunityId
            FROM Lead
            WHERE Company = :accountName.trim()
            ORDER BY CreatedDate DESC
            LIMIT 50
        ]) {
            result.add(new LeadSummary(lead));
        }
        return result;
    }

    private static Lead findOrCreateLead(String accountName, Id contactId) {
        String cleanName = String.isBlank(accountName) ? '' : accountName.trim();
        if (String.isBlank(cleanName)) {
            throw new AuraHandledException('고객사 이름이 없어 Lead를 조회할 수 없습니다.');
        }
        List<Lead> matches = [
            SELECT Id, Status, OwnerId
            FROM Lead
            WHERE IsConverted = false AND Company = :cleanName
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        if (!matches.isEmpty()) {
            return matches[0];
        }

        Lead newLead = new Lead(
            Company = cleanName,
            LeadSource = LEAD_SOURCE_PORTAL,
            Status = DEFAULT_LEAD_STATUS,
            Privacy_Consent__c = true
        );
        if (contactId != null) {
            List<Contact> contacts = [SELECT LastName, FirstName, Email, Phone FROM Contact WHERE Id = :contactId LIMIT 1];
            if (!contacts.isEmpty()) {
                Contact c = contacts[0];
                newLead.LastName = String.isBlank(c.LastName) ? DEFAULT_LAST_NAME : c.LastName;
                newLead.FirstName = c.FirstName;
                newLead.Email = c.Email;
                newLead.Phone = c.Phone;
            } else {
                newLead.LastName = DEFAULT_LAST_NAME;
            }
        } else {
            newLead.LastName = DEFAULT_LAST_NAME;
        }
        Id salesOwnerId = getSalesOwnerId();
        if (salesOwnerId != null) {
            newLead.OwnerId = salesOwnerId;
        }
        Database.DMLOptions dml = new Database.DMLOptions();
        dml.DuplicateRuleHeader.AllowSave = true;
        Database.SaveResult saveResult = Database.insert(newLead, dml);
        if (!saveResult.isSuccess()) {
            throw new AuraHandledException('Lead 생성에 실패했습니다: ' + saveResult.getErrors()[0].getMessage());
        }
        return newLead;
    }

    private static String getConvertedStatusLabel() {
        // Database.convertLead.setConvertedStatus() takes the LeadStatus.ApiName, not the
        // localized MasterLabel — verified in this org (MasterLabel '숏리스트 선정' has
        // ApiName 'Converted' and only 'Converted' is accepted). We prefer that specific
        // status per the SAL pipeline design, and fall back to any IsConverted status.
        List<LeadStatus> preferred = [SELECT ApiName FROM LeadStatus WHERE IsConverted = true AND MasterLabel = '숏리스트 선정' LIMIT 1];
        if (!preferred.isEmpty()) {
            return preferred[0].ApiName;
        }
        List<LeadStatus> fallback = [SELECT ApiName FROM LeadStatus WHERE IsConverted = true ORDER BY SortOrder ASC NULLS LAST LIMIT 1];
        if (!fallback.isEmpty()) {
            return fallback[0].ApiName;
        }
        throw new AuraHandledException('전환 완료 상태로 지정된 Lead Status가 없습니다. 관리자에게 문의해 주세요.');
    }

    private static Id getSalesOwnerId() {
        List<User> owners = [SELECT Id FROM User WHERE Username = :SALES_OWNER_USERNAME AND IsActive = true LIMIT 1];
        return owners.isEmpty() ? null : owners[0].Id;
    }

    /**
     * Portal-facing view of a single Lead for the RFP status tab.
     */
    public class LeadSummary {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String company;
        @AuraEnabled public String status;
        @AuraEnabled public String productInterest;
        @AuraEnabled public String description;
        @AuraEnabled public String leadSource;
        @AuraEnabled public Datetime createdDate;
        @AuraEnabled public Boolean isConverted;
        @AuraEnabled public Id convertedOpportunityId;

        public LeadSummary(Lead lead) {
            this.id = lead.Id;
            this.name = lead.Name;
            this.company = lead.Company;
            this.status = lead.Status;
            this.productInterest = lead.Product_Interest__c;
            this.description = lead.Description;
            this.leadSource = lead.LeadSource;
            this.createdDate = lead.CreatedDate;
            this.isConverted = lead.IsConverted;
            this.convertedOpportunityId = lead.ConvertedOpportunityId;
        }
    }
}
