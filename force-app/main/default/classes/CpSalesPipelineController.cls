/**
 * Keeps the sales pipeline in sync with portal activity from an authenticated
 * customer. Runs without sharing because it needs to look up and update Lead
 * and Opportunity records the portal user has no direct access to, but never
 * returns that record data to the caller — only whether a sync happened.
 */
public without sharing class CpSalesPipelineController {
    private static final String WORKING_STATUS = 'RFP접수';
    private static final String SALES_OWNER_USERNAME = 'test.teamlead.backup@corepress.demo';

    /**
     * When a logged-in customer submits an RFP, advances any still-open Lead
     * for the same company through the sales pipeline and hands it to the
     * sales team lead backup account for nurturing (SAL-05, SAL-08).
     *
     * @param accountName Name of the submitting customer's Account.
     * @return true if a matching open Lead was found and updated.
     */
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

    /**
     * Hands ownership of a portal-created Opportunity to the sales team lead
     * backup account, who manages the pipeline from lead nurturing through
     * Opportunity management (SAL-09).
     *
     * @param opportunityId Id of the Opportunity created from the portal.
     * @return true if ownership was assigned.
     */
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

    private static Id getSalesOwnerId() {
        List<User> owners = [SELECT Id FROM User WHERE Username = :SALES_OWNER_USERNAME AND IsActive = true LIMIT 1];
        return owners.isEmpty() ? null : owners[0].Id;
    }
}
