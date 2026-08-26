/**
 * Read-only Quote lookups + portal approval action for the customer portal's
 * 견적 조회 (quote list) screen. getQuotesForAccount runs with sharing so a
 * logged-in customer only ever sees Quotes on Opportunities tied to their own
 * Account. updateQuoteStatus verifies ownership against the caller's Account
 * before applying an Accepted/Rejected status transition.
 */
public without sharing class CpQuoteController {
  @AuraEnabled(cacheable=true)
  public static List<QuoteSummary> getQuotesForAccount(Id accountId) {
    List<QuoteSummary> result = new List<QuoteSummary>();
    Id customerAccountId = getCurrentCustomerAccountId(accountId);
    if (accountId == null || accountId != customerAccountId) {
      return result;
    }

    Set<Id> scenarioOpportunityIds = new Set<Id>();
    for (CorePress_RFP__c journey : [
      SELECT Opportunity__c
      FROM CorePress_RFP__c
      WHERE Account__c = :customerAccountId AND Opportunity__c != NULL
    ])
      scenarioOpportunityIds.add(journey.Opportunity__c);
    for (Quote q : [
      SELECT
        Id,
        OpportunityId,
        Name,
        QuoteNumber,
        Status,
        ExpirationDate,
        Subtotal,
        Tax,
        GrandTotal,
        CreatedDate,
        (
          SELECT Product2.Name, Description, Quantity, TotalPrice
          FROM QuoteLineItems
          ORDER BY SortOrder
        ),
        (
          SELECT ContentDocumentId, ContentDocument.Title
          FROM ContentDocumentLinks
          LIMIT 1
        )
      FROM Quote
      WHERE Opportunity.AccountId = :customerAccountId
      ORDER BY CreatedDate DESC
    ]) {
      // Legacy proposal-only quotes stay hidden until they belong to a persisted RFP journey.
      if (
        isExternalCustomer() &&
        q.Status == 'Presented' &&
        !scenarioOpportunityIds.contains(q.OpportunityId)
      )
        continue;
      result.add(new QuoteSummary(q));
    }
    return result;
  }

  private static Boolean isExternalCustomer() {
    User me = [
      SELECT ContactId
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
    return me.ContactId != null;
  }

  private static Id getCurrentCustomerAccountId(Id requestedAccountId) {
    User me = [
      SELECT UserType, ContactId, Contact.AccountId
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
    if (me.ContactId == null || me.Contact.AccountId == null) {
      if (me.UserType == 'Standard')
        return requestedAccountId;
      throw new AuraHandledException('고객 계정과 연결되지 않은 사용자입니다.');
    }
    return me.Contact.AccountId;
  }

  /**
   * Approve or reject a Quote from the customer portal.
   *
   * @param quoteId Id of the target Quote.
   * @param action  'approve' -> Status='Accepted', 'reject' -> Status='Rejected'.
   * @return The new Status string.
   */
  @AuraEnabled
  public static String updateQuoteStatus(Id quoteId, String action) {
    if (quoteId == null || String.isBlank(action)) {
      throw new AuraHandledException('요청 정보가 올바르지 않습니다.');
    }
    String newStatus;
    if (action == 'approve') {
      newStatus = 'Accepted';
    } else if (action == 'reject') {
      newStatus = 'Rejected';
    } else {
      throw new AuraHandledException('지원하지 않는 요청입니다.');
    }

    // Verify the caller's Contact.Account matches the Quote's Account.
    User me = [
      SELECT ContactId, Contact.AccountId
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
    if (me.ContactId == null || me.Contact.AccountId == null) {
      throw new AuraHandledException('고객 계정과 연결되지 않은 사용자입니다.');
    }

    List<Quote> quotes = [
      SELECT Id, Status, Opportunity.AccountId
      FROM Quote
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (quotes.isEmpty()) {
      throw new AuraHandledException('견적을 찾을 수 없습니다.');
    }
    Quote q = quotes[0];
    if (q.Opportunity.AccountId != me.Contact.AccountId) {
      throw new AuraHandledException('해당 견적에 접근할 권한이 없습니다.');
    }
    if (
      q.Status == 'Accepted' ||
      q.Status == 'Rejected' ||
      q.Status == 'Denied'
    ) {
      throw new AuraHandledException('이미 처리된 견적입니다.');
    }

    q.Status = newStatus;
    Database.update(q, System.AccessLevel.SYSTEM_MODE);
    return newStatus;
  }

  public class QuoteSummary {
    @AuraEnabled
    public Id id;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String quoteNumber;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public Date expirationDate;
    @AuraEnabled
    public Decimal subtotal;
    @AuraEnabled
    public Decimal tax;
    @AuraEnabled
    public Decimal grandTotal;
    @AuraEnabled
    public Datetime createdDate;
    @AuraEnabled
    public Id contentDocumentId;
    @AuraEnabled
    public List<LineItem> lineItems;

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

  public class LineItem {
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String description;
    @AuraEnabled
    public Decimal quantity;
    @AuraEnabled
    public Decimal totalPrice;

    public LineItem(QuoteLineItem li) {
      this.productName = li.Product2.Name;
      this.description = li.Description;
      this.quantity = li.Quantity;
      this.totalPrice = li.TotalPrice;
    }
  }
}
