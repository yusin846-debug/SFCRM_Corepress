/**
 * Read-only Quote lookups for the customer portal's 견적 조회 (quote list)
 * screen. Runs with sharing so a logged-in customer only ever sees Quotes
 * on Opportunities tied to their own Account.
 */
public with sharing class CpQuoteController {

    /**
     * Returns every Quote on an Opportunity belonging to the given Account,
     * newest first, with its line items and (if any) an attached quote file.
     *
     * @param accountId Id of the logged-in customer's Account.
     * @return List of QuoteSummary wrappers.
     */
    @AuraEnabled(cacheable=true)
    public static List<QuoteSummary> getQuotesForAccount(Id accountId) {
        List<QuoteSummary> result = new List<QuoteSummary>();
        if (accountId == null) {
            return result;
        }

        for (Quote q : [
            SELECT Id, Name, QuoteNumber, Status, ExpirationDate, Subtotal, Tax, GrandTotal, CreatedDate,
                   (SELECT Product2.Name, Description, Quantity, TotalPrice FROM QuoteLineItems ORDER BY SortOrder),
                   (SELECT ContentDocumentId, ContentDocument.Title FROM ContentDocumentLinks LIMIT 1)
            FROM Quote
            WHERE Opportunity.AccountId = :accountId
            WITH SECURITY_ENFORCED
            ORDER BY CreatedDate DESC
        ]) {
            result.add(new QuoteSummary(q));
        }
        return result;
    }

    /**
     * Portal-facing view of a Quote and its line items.
     */
    public class QuoteSummary {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String quoteNumber;
        @AuraEnabled public String status;
        @AuraEnabled public Date expirationDate;
        @AuraEnabled public Decimal subtotal;
        @AuraEnabled public Decimal tax;
        @AuraEnabled public Decimal grandTotal;
        @AuraEnabled public Datetime createdDate;
        @AuraEnabled public Id contentDocumentId;
        @AuraEnabled public List<LineItem> lineItems;

        public QuoteSummary(Quote q) {
            this.id = q.Id;
            this.name = q.Name;
            this.quoteNumber = q.QuoteNumber;
            this.status = q.Status;
            this.expirationDate = q.ExpirationDate;
            this.subtotal = q.Subtotal;
            this.tax = q.Tax;
            this.grandTotal = q.GrandTotal;
            this.createdDate = q.CreatedDate;
            this.lineItems = new List<LineItem>();
            for (QuoteLineItem li : q.QuoteLineItems) {
                this.lineItems.add(new LineItem(li));
            }
            if (!q.ContentDocumentLinks.isEmpty()) {
                this.contentDocumentId = q.ContentDocumentLinks[0].ContentDocumentId;
            }
        }
    }

    /**
     * Portal-facing view of a single QuoteLineItem.
     */
    public class LineItem {
        @AuraEnabled public String productName;
        @AuraEnabled public String description;
        @AuraEnabled public Decimal quantity;
        @AuraEnabled public Decimal totalPrice;

        public LineItem(QuoteLineItem li) {
            this.productName = li.Product2.Name;
            this.description = li.Description;
            this.quantity = li.Quantity;
            this.totalPrice = li.TotalPrice;
        }
    }
}
