/** Coordinates the portal-driven new-installation journey from RFP through RFQ. */
public without sharing class CpSalesPipelineController {
  private static final String RFP_STATUS = 'RFP접수';
  private static final String SHORTLIST_STATUS = '숏리스트 선정';
  private static final String RFQ_STATUS = 'RFQ 접수';
  private static final String NEW_INSTALLATION_RECORD_TYPE = 'New_Installation';
  private static final String NEW_BUSINESS_TYPE = 'New Business';
  private static final String SALES_OWNER_USERNAME = 'saleskim@corepress.demo';
  private static final String LEAD_SOURCE_CATALOG = '카탈로그 문의';

  /** @param submission Customer RFP payload. @return Created RFP Id. */
  @AuraEnabled
  public static Id submitRfp(RfpSubmission submission) {
    validateSubmission(submission);
    Contact contact = getValidatedContact(
      submission.contactId,
      submission.accountId
    );
    Account account = [
      SELECT Id, Name
      FROM Account
      WHERE Id = :submission.accountId
      LIMIT 1
    ];
    Lead lead = [
      SELECT Id, Company, Email, Status, IsConverted, Interested_Equipment__c
      FROM Lead
      WHERE Id = :submission.leadId
      LIMIT 1
    ];
    if (lead.IsConverted || lead.Company != account.Name) {
      throw new AuraHandledException(
        '선택한 카탈로그 문의를 이 고객사의 RFP로 연결할 수 없습니다.'
      );
    }
    if (
      String.isNotBlank(lead.Email) &&
      String.isNotBlank(contact.Email) &&
      lead.Email.toLowerCase() != contact.Email.toLowerCase()
    ) {
      throw new AuraHandledException(
        '로그인 담당자와 카탈로그 문의 이메일이 일치하지 않습니다.'
      );
    }
    Datetime submittedAt = System.now();
    lead.Status = RFP_STATUS;
    lead.RFP_Title__c = submission.title.trim();
    lead.RFP_Submitted_At__c = submittedAt;
    lead.RFP_Source__c = String.isBlank(submission.source)
      ? '포털'
      : submission.source.trim();
    lead.Requested_Delivery_Date__c = submission.requestedDeliveryDate;
    lead.Interested_Equipment__c = submission.equipment.trim();
    Id salesOwnerId = getSalesOwnerId();
    if (salesOwnerId != null)
      lead.OwnerId = salesOwnerId;
    Database.update(lead, AccessLevel.SYSTEM_MODE);

    CorePress_RFP__c rfp = new CorePress_RFP__c(
      Account__c = account.Id,
      Contact__c = contact.Id,
      Lead__c = lead.Id,
      Title__c = submission.title.trim(),
      Interested_Equipment__c = submission.equipment.trim(),
      Introduction_Type__c = String.isBlank(submission.introductionType)
        ? '신규 도입'
        : submission.introductionType.trim(),
      Requested_Delivery_Date__c = submission.requestedDeliveryDate,
      Specifications__c = submission.specifications,
      Status__c = RFP_STATUS,
      Submitted_At__c = submittedAt,
      Source__c = String.isBlank(submission.source)
        ? '포털'
        : submission.source.trim()
    );
    Database.insert(rfp, AccessLevel.SYSTEM_MODE);
    attachOriginalFile(rfp.Id, submission);
    Boolean viaEmail = rfp.Source__c == '이메일';
    insertEvent(
      rfp.Id,
      null,
      contact.Id,
      RFP_STATUS,
      viaEmail
        ? '이메일로 전달한 RFP를 포털에 등록했습니다.'
        : 'RFP가 접수되었습니다.'
    );
    return rfp.Id;
  }

  private static void attachOriginalFile(Id rfpId, RfpSubmission submission) {
    if (
      submission == null ||
      String.isBlank(submission.fileName) ||
      String.isBlank(submission.fileBase64)
    )
      return;
    ContentVersion version = new ContentVersion(
      Title = submission.fileName,
      PathOnClient = submission.fileName,
      VersionData = EncodingUtil.base64Decode(submission.fileBase64),
      Origin = 'H'
    );
    Database.insert(version, AccessLevel.SYSTEM_MODE);
    Id contentDocumentId = [
      SELECT ContentDocumentId
      FROM ContentVersion
      WHERE Id = :version.Id
      LIMIT 1
    ]
    .ContentDocumentId;
    Database.insert(
      new ContentDocumentLink(
        ContentDocumentId = contentDocumentId,
        LinkedEntityId = rfpId,
        ShareType = 'V'
      ),
      AccessLevel.SYSTEM_MODE
    );
  }

  /** @param rfpId RFP whose proposal was downloaded. @param contactId Downloading Contact. */
  @AuraEnabled
  public static void recordProposalDownload(Id rfpId, Id contactId) {
    CorePress_RFP__c rfp = getRfpForContact(rfpId, contactId);
    insertEvent(
      rfp.Id,
      rfp.Opportunity__c,
      contactId,
      '제안서 다운로드',
      '기술 제안서를 다운로드했습니다.'
    );
  }

  /**
   * Customer asks CorePress to revise the proposal. Records a customer-visible
   * event only — the sales owner is assumed to be notified out of band (no email).
   *
   * @param rfpId RFP the request is about. @param contactId Requesting Contact.
   * @param message Free-text revision request from the customer.
   */
  @AuraEnabled
  public static void requestProposalRevision(
    Id rfpId,
    Id contactId,
    String message
  ) {
    CorePress_RFP__c rfp = getRfpForContact(rfpId, contactId);
    if (String.isBlank(message))
      throw new AuraHandledException('수정 요청 내용을 입력해 주세요.');
    insertEvent(
      rfp.Id,
      rfp.Opportunity__c,
      contactId,
      '제안서 수정요청',
      '제안서 수정요청이 접수되어 담당자에게 전달되었습니다.\n' + message.trim()
    );
  }

  /** @param rfpId Selected RFP. @param accountId Customer Account. @param contactId Customer Contact. @return Opportunity Id. */
  @AuraEnabled
  public static Id selectShortlist(Id rfpId, Id accountId, Id contactId) {
    getValidatedContact(contactId, accountId);
    CorePress_RFP__c rfp = [
      SELECT
        Id,
        Name,
        Account__c,
        Contact__c,
        Lead__c,
        Opportunity__c,
        Title__c,
        Interested_Equipment__c,
        Requested_Delivery_Date__c
      FROM CorePress_RFP__c
      WHERE Id = :rfpId
      LIMIT 1
      FOR UPDATE
    ];
    if (rfp.Account__c != accountId || rfp.Contact__c != contactId)
      throw new AuraHandledException(
        '이 RFP를 숏리스트로 선정할 권한이 없습니다.'
      );
    if (rfp.Opportunity__c != null)
      return rfp.Opportunity__c;

    // 김영업이 org에서 바로 찾을 수 있도록 Opportunity 이름을 RFP 제목으로 통일한다.
    String opportunityName = String.isBlank(rfp.Title__c)
      ? rfp.Interested_Equipment__c + ' 신규 도입'
      : rfp.Title__c.trim();

    Lead lead = [
      SELECT Id, IsConverted, ConvertedOpportunityId
      FROM Lead
      WHERE Id = :rfp.Lead__c
      LIMIT 1
    ];
    Id opportunityId;
    if (lead.IsConverted && lead.ConvertedOpportunityId != null) {
      opportunityId = lead.ConvertedOpportunityId;
    } else {
      Database.LeadConvert conversion = new Database.LeadConvert();
      conversion.setLeadId(lead.Id);
      conversion.setConvertedStatus(getConvertedStatusApiName());
      conversion.setAccountId(accountId);
      conversion.setContactId(contactId);
      conversion.setOpportunityName(opportunityName);
      Database.LeadConvertResult conversionResult = Database.convertLead(
        conversion,
        false
      );
      if (!conversionResult.isSuccess())
        throw new AuraHandledException('숏리스트 선정 처리에 실패했습니다.');
      opportunityId = conversionResult.getOpportunityId();
    }
    RecordType newInstallation = [
      SELECT Id
      FROM RecordType
      WHERE
        SObjectType = 'Opportunity'
        AND DeveloperName = :NEW_INSTALLATION_RECORD_TYPE
        AND IsActive = TRUE
      LIMIT 1
    ];
    Opportunity opportunity = new Opportunity(
      Id = opportunityId,
      Name = opportunityName,
      RFP_Number__c = rfp.Name,
      RecordTypeId = newInstallation.Id,
      Type = NEW_BUSINESS_TYPE,
      StageName = SHORTLIST_STATUS,
      CloseDate = rfp.Requested_Delivery_Date__c == null
        ? Date.today().addDays(90)
        : rfp.Requested_Delivery_Date__c
    );
    Id salesOwnerId = getSalesOwnerId();
    if (salesOwnerId != null)
      opportunity.OwnerId = salesOwnerId;
    Database.update(opportunity, AccessLevel.SYSTEM_MODE);
    rfp.Opportunity__c = opportunityId;
    rfp.Status__c = SHORTLIST_STATUS;
    Database.update(rfp, AccessLevel.SYSTEM_MODE);
    insertEvent(
      rfp.Id,
      opportunityId,
      contactId,
      SHORTLIST_STATUS,
      '고객이 제안서를 숏리스트로 선정했습니다.'
    );
    return opportunityId;
  }

  /** @param rfpId RFP. @param contactId Contact. @param title RFQ title. @param requestedDeliveryDate Delivery date. @param description Terms. @return Opportunity Id. */
  @AuraEnabled
  public static Id submitRfq(
    Id rfpId,
    Id contactId,
    String title,
    Date requestedDeliveryDate,
    String description
  ) {
    CorePress_RFP__c rfp = getRfpForContact(rfpId, contactId);
    if (rfp.Opportunity__c == null)
      throw new AuraHandledException('먼저 제안서를 숏리스트로 선정해 주세요.');
    Opportunity opportunity = new Opportunity(
      Id = rfp.Opportunity__c,
      Name = String.isBlank(title) ? rfp.Title__c : title.trim(),
      StageName = RFQ_STATUS,
      CloseDate = requestedDeliveryDate == null
        ? Date.today().addDays(60)
        : requestedDeliveryDate,
      Description = description
    );
    Database.update(opportunity, AccessLevel.SYSTEM_MODE);
    ensureRfqQuote(opportunity.Id, rfp.Interested_Equipment__c);
    rfp.Status__c = RFQ_STATUS;
    Database.update(rfp, AccessLevel.SYSTEM_MODE);
    insertEvent(
      rfp.Id,
      opportunity.Id,
      contactId,
      RFQ_STATUS,
      'RFQ가 접수되어 견적 검토를 시작했습니다.'
    );
    return opportunity.Id;
  }

  private static void ensureRfqQuote(Id opportunityId, String equipmentName) {
    if ([SELECT COUNT() FROM Quote WHERE OpportunityId = :opportunityId] > 0)
      return;
    Opportunity opp = [
      SELECT Id, Name, Pricebook2Id
      FROM Opportunity
      WHERE Id = :opportunityId
      LIMIT 1
    ];
    List<Pricebook2> books = [
      SELECT Id
      FROM Pricebook2
      WHERE IsStandard = TRUE
      LIMIT 1
    ];
    if (books.isEmpty())
      return;
    Pricebook2 standardBook = books[0];
    if (opp.Pricebook2Id == null) {
      opp.Pricebook2Id = standardBook.Id;
      Database.update(opp, AccessLevel.SYSTEM_MODE);
    }
    String model = String.isBlank(equipmentName)
      ? 'CP7100+'
      : equipmentName.trim();
    List<Product2> products = [
      SELECT Id, Name
      FROM Product2
      WHERE Name = :model AND IsActive = TRUE
      LIMIT 1
    ];
    if (products.isEmpty())
      return;
    List<PricebookEntry> entries = [
      SELECT Id, UnitPrice
      FROM PricebookEntry
      WHERE
        Pricebook2Id = :standardBook.Id
        AND Product2Id = :products[0].Id
        AND IsActive = TRUE
      LIMIT 1
    ];
    if (entries.isEmpty())
      return;
    Quote quote = new Quote(
      Name = opp.Name + ' 견적서',
      OpportunityId = opp.Id,
      Pricebook2Id = standardBook.Id,
      Status = 'Draft',
      ExpirationDate = Date.today().addDays(30)
    );
    Database.insert(quote, AccessLevel.SYSTEM_MODE);
    Database.insert(
      new QuoteLineItem(
        QuoteId = quote.Id,
        PricebookEntryId = entries[0].Id,
        Quantity = 1,
        UnitPrice = entries[0].UnitPrice,
        Description = model + ' 신규 도입 패키지'
      ),
      AccessLevel.SYSTEM_MODE
    );
  }

  /** @param accountId Customer Account. @return RFP rows. */
  @AuraEnabled(cacheable=true)
  public static List<RfpSummary> getRfpsForAccount(Id accountId) {
    List<RfpSummary> summaries = new List<RfpSummary>();
    if (accountId == null)
      return summaries;
    enforceCurrentUserAccount(accountId, null);
    for (CorePress_RFP__c rfp : [
      SELECT
        Id,
        Name,
        Lead__c,
        Opportunity__c,
        Title__c,
        Interested_Equipment__c,
        Status__c,
        Submitted_At__c,
        Requested_Delivery_Date__c,
        Specifications__c,
        (
          SELECT
            ContentDocumentId,
            ContentDocument.Title,
            ContentDocument.ContentModifiedDate,
            ContentDocument.LatestPublishedVersionId
          FROM ContentDocumentLinks
          ORDER BY SystemModstamp DESC
          LIMIT 1
        )
      FROM CorePress_RFP__c
      WHERE Account__c = :accountId
      ORDER BY Submitted_At__c DESC
      LIMIT 50
    ])
      summaries.add(new RfpSummary(rfp));
    return summaries;
  }

  private static final Set<String> RFQ_STAGES = new Set<String>{
    '숏리스트 선정',
    'RFQ 접수',
    '사양 협상',
    '견적 제출',
    '계약 검토',
    'Closed Won',
    'Closed Lost'
  };

  /**
   * RFQ 현황 rows — the new-installation Opportunities on this Account's RFP
   * journeys. Replaces the LWC's getRelatedListRecords call, which never
   * returned the spanning RecordType.DeveloperName so the filter always failed.
   *
   * @param accountId Customer Account. @return RFQ (Opportunity) rows.
   */
  @AuraEnabled(cacheable=true)
  public static List<RfqSummary> getRfqsForAccount(Id accountId) {
    List<RfqSummary> summaries = new List<RfqSummary>();
    if (accountId == null)
      return summaries;
    enforceCurrentUserAccount(accountId, null);
    Map<Id, String> rfpNumberByOpp = new Map<Id, String>();
    for (CorePress_RFP__c journey : [
      SELECT Name, Opportunity__c
      FROM CorePress_RFP__c
      WHERE Account__c = :accountId AND Opportunity__c != NULL
    ])
      rfpNumberByOpp.put(journey.Opportunity__c, journey.Name);
    if (rfpNumberByOpp.isEmpty())
      return summaries;
    for (Opportunity opp : [
      SELECT Id, Name, StageName, CloseDate, Description, Amount, IsClosed
      FROM Opportunity
      WHERE
        Id IN :rfpNumberByOpp.keySet()
        AND RecordType.DeveloperName = :NEW_INSTALLATION_RECORD_TYPE
        AND StageName IN :RFQ_STAGES
      ORDER BY CreatedDate DESC
    ])
      summaries.add(new RfqSummary(opp, rfpNumberByOpp.get(opp.Id)));
    return summaries;
  }

  /** @param accountName Customer company. @return Unconverted 카탈로그 문의 Leads only. */
  @AuraEnabled(cacheable=true)
  public static List<LeadSummary> getLeadsForAccount(String accountName) {
    List<LeadSummary> summaries = new List<LeadSummary>();
    if (String.isBlank(accountName))
      return summaries;
    enforceCurrentUserAccount(null, accountName);
    for (Lead lead : [
      SELECT
        Id,
        Name,
        Company,
        Email,
        Status,
        Interested_Equipment__c,
        Product_Interest__c,
        Description,
        CreatedDate
      FROM Lead
      WHERE
        Company = :accountName
        AND IsConverted = FALSE
        AND LeadSource = :LEAD_SOURCE_CATALOG
      ORDER BY CreatedDate DESC
      LIMIT 50
    ])
      summaries.add(new LeadSummary(lead));
    return summaries;
  }

  /** @param rfpId RFP. @return Customer-visible timeline. */
  @AuraEnabled(cacheable=true)
  public static List<TimelineEntry> getTimeline(Id rfpId) {
    List<TimelineEntry> entries = new List<TimelineEntry>();
    if (rfpId == null)
      return entries;
    for (CorePress_RFP_Event__c eventRecord : [
      SELECT Event_Type__c, Detail__c, Occurred_At__c
      FROM CorePress_RFP_Event__c
      WHERE RFP__c = :rfpId AND Visible_To_Customer__c = TRUE
      ORDER BY Occurred_At__c ASC
    ])
      entries.add(
        new TimelineEntry(
          eventRecord.Event_Type__c,
          eventRecord.Detail__c,
          eventRecord.Occurred_At__c
        )
      );
    CorePress_RFP__c rfp = [
      SELECT Account__c, Contact__c, Opportunity__c
      FROM CorePress_RFP__c
      WHERE Id = :rfpId
      LIMIT 1
    ];
    enforceCurrentUserContact(rfp.Contact__c, rfp.Account__c);
    if (rfp.Opportunity__c != null) {
      for (OpportunityHistory history : [
        SELECT StageName, CreatedDate
        FROM OpportunityHistory
        WHERE OpportunityId = :rfp.Opportunity__c
        ORDER BY CreatedDate ASC
      ]) {
        entries.add(
          new TimelineEntry(
            '영업 단계 변경',
            history.StageName,
            history.CreatedDate
          )
        );
      }
    }
    entries.sort();
    return entries;
  }

  private static void validateSubmission(RfpSubmission submission) {
    if (
      submission == null ||
      submission.accountId == null ||
      submission.contactId == null ||
      submission.leadId == null
    )
      throw new AuraHandledException('RFP 연결 정보가 누락되었습니다.');
    if (
      String.isBlank(submission.title) || String.isBlank(submission.equipment)
    )
      throw new AuraHandledException('RFP 제목과 관심 장비를 입력해 주세요.');
  }
  private static Contact getValidatedContact(Id contactId, Id accountId) {
    enforceCurrentUserContact(contactId, accountId);
    List<Contact> contacts = [
      SELECT Id, AccountId, Email
      FROM Contact
      WHERE Id = :contactId
      LIMIT 1
    ];
    if (contacts.isEmpty() || contacts[0].AccountId != accountId)
      throw new AuraHandledException(
        '로그인 담당자와 고객사 정보가 일치하지 않습니다.'
      );
    return contacts[0];
  }
  private static CorePress_RFP__c getRfpForContact(Id rfpId, Id contactId) {
    List<CorePress_RFP__c> requests = [
      SELECT
        Id,
        Account__c,
        Contact__c,
        Opportunity__c,
        Title__c,
        Interested_Equipment__c
      FROM CorePress_RFP__c
      WHERE Id = :rfpId
      LIMIT 1
    ];
    if (requests.isEmpty() || requests[0].Contact__c != contactId)
      throw new AuraHandledException('이 RFP에 접근할 권한이 없습니다.');
    enforceCurrentUserContact(contactId, requests[0].Account__c);
    return requests[0];
  }
  private static void enforceCurrentUserContact(Id contactId, Id accountId) {
    User currentUser = [
      SELECT UserType, ContactId, Contact.AccountId
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
    if (currentUser.ContactId == null) {
      if (currentUser.UserType != 'Standard')
        throw new AuraHandledException(
          '로그인 고객 정보를 확인할 수 없습니다.'
        );
      return;
    }
    if (
      currentUser.ContactId != contactId ||
      currentUser.Contact.AccountId != accountId
    ) {
      throw new AuraHandledException(
        '다른 고객사의 정보에는 접근할 수 없습니다.'
      );
    }
  }
  private static void enforceCurrentUserAccount(
    Id accountId,
    String accountName
  ) {
    User currentUser = [
      SELECT UserType, ContactId, Contact.AccountId, Contact.Account.Name
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
    if (currentUser.ContactId == null) {
      if (currentUser.UserType != 'Standard')
        throw new AuraHandledException(
          '로그인 고객 정보를 확인할 수 없습니다.'
        );
      return;
    }
    Boolean idMismatch =
      accountId != null &&
      currentUser.Contact.AccountId != accountId;
    Boolean nameMismatch =
      accountName != null &&
      currentUser.Contact.Account.Name != accountName;
    if (idMismatch || nameMismatch)
      throw new AuraHandledException(
        '다른 고객사의 정보에는 접근할 수 없습니다.'
      );
  }
  private static String getConvertedStatusApiName() {
    List<LeadStatus> statuses = [
      SELECT ApiName
      FROM LeadStatus
      WHERE IsConverted = TRUE
      ORDER BY SortOrder ASC
      LIMIT 1
    ];
    if (statuses.isEmpty())
      throw new AuraHandledException('전환 완료 Lead 상태가 없습니다.');
    return statuses[0].ApiName;
  }
  private static Id getSalesOwnerId() {
    List<User> owners = [
      SELECT Id
      FROM User
      WHERE Username = :SALES_OWNER_USERNAME AND IsActive = TRUE
      LIMIT 1
    ];
    return owners.isEmpty() ? null : owners[0].Id;
  }
  private static void insertEvent(
    Id rfpId,
    Id opportunityId,
    Id contactId,
    String eventType,
    String detail
  ) {
    Database.insert(
      new CorePress_RFP_Event__c(
        RFP__c = rfpId,
        Opportunity__c = opportunityId,
        Contact__c = contactId,
        Event_Type__c = eventType,
        Occurred_At__c = System.now(),
        Detail__c = detail,
        Visible_To_Customer__c = true
      ),
      AccessLevel.SYSTEM_MODE
    );
  }

  /** Portal RFP payload. */
  public class RfpSubmission {
    @AuraEnabled
    public Id accountId { get; set; }
    @AuraEnabled
    public Id contactId { get; set; }
    @AuraEnabled
    public Id leadId { get; set; }
    @AuraEnabled
    public String title { get; set; }
    @AuraEnabled
    public String equipment { get; set; }
    @AuraEnabled
    public String introductionType { get; set; }
    @AuraEnabled
    public Date requestedDeliveryDate { get; set; }
    @AuraEnabled
    public String specifications { get; set; }
    @AuraEnabled
    public String source { get; set; }
    @AuraEnabled
    public String fileName { get; set; }
    @AuraEnabled
    public String fileBase64 { get; set; }
  }
  /** Portal-safe Lead row. */
  public class LeadSummary {
    @AuraEnabled
    public Id id;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String company;
    @AuraEnabled
    public String email;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String equipment;
    @AuraEnabled
    public String productInterest;
    @AuraEnabled
    public String description;
    @AuraEnabled
    public Datetime createdDate;
    public LeadSummary(Lead lead) {
      id = lead.Id;
      name = lead.Name;
      company = lead.Company;
      email = lead.Email;
      status = lead.Status;
      equipment = lead.Interested_Equipment__c;
      productInterest = lead.Product_Interest__c;
      description = lead.Description;
      createdDate = lead.CreatedDate;
    }
  }
  /** Portal-safe RFP row. */
  public class RfpSummary {
    @AuraEnabled
    public Id id;
    @AuraEnabled
    public String numberValue;
    @AuraEnabled
    public Id leadId;
    @AuraEnabled
    public Id opportunityId;
    @AuraEnabled
    public String title;
    @AuraEnabled
    public String equipment;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public Datetime submittedAt;
    @AuraEnabled
    public Boolean shortlistComplete;
    @AuraEnabled
    public Boolean hasProposal;
    @AuraEnabled
    public Id proposalContentDocumentId;
    @AuraEnabled
    public String proposalTitle;
    @AuraEnabled
    public Datetime proposalUploadedAt;
    @AuraEnabled
    public Date requestedDeliveryDate;
    @AuraEnabled
    public String specifications;
    public RfpSummary(CorePress_RFP__c rfp) {
      id = rfp.Id;
      numberValue = rfp.Name;
      leadId = rfp.Lead__c;
      opportunityId = rfp.Opportunity__c;
      title = rfp.Title__c;
      equipment = rfp.Interested_Equipment__c;
      status = rfp.Status__c;
      submittedAt = rfp.Submitted_At__c;
      requestedDeliveryDate = rfp.Requested_Delivery_Date__c;
      specifications = rfp.Specifications__c;
      shortlistComplete = rfp.Opportunity__c != null;
      // 제안서는 CorePress 담당자가 실제 파일을 첨부했을 때만 "제출됨"으로 본다.
      hasProposal = !rfp.ContentDocumentLinks.isEmpty();
      if (hasProposal) {
        proposalContentDocumentId = rfp.ContentDocumentLinks[0]
          .ContentDocumentId;
        proposalTitle = rfp.ContentDocumentLinks[0].ContentDocument.Title;
        proposalUploadedAt = rfp.ContentDocumentLinks[0]
          .ContentDocument.ContentModifiedDate;
      }
    }
  }
  /** Portal-safe RFQ (Opportunity) row. */
  public class RfqSummary {
    @AuraEnabled
    public Id id;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String stage;
    @AuraEnabled
    public Date closeDate;
    @AuraEnabled
    public String description;
    @AuraEnabled
    public Decimal amount;
    @AuraEnabled
    public String rfpNumber;
    @AuraEnabled
    public Boolean isClosed;
    public RfqSummary(Opportunity opp, String rfpNumber) {
      id = opp.Id;
      name = opp.Name;
      stage = opp.StageName;
      closeDate = opp.CloseDate;
      description = opp.Description;
      amount = opp.Amount;
      this.rfpNumber = rfpNumber;
      isClosed = opp.IsClosed;
    }
  }
  /** Portal-safe timeline row. */
  public class TimelineEntry implements Comparable {
    @AuraEnabled
    public String eventType;
    @AuraEnabled
    public String detail;
    @AuraEnabled
    public Datetime occurredAt;
    public TimelineEntry(String eventType, String detail, Datetime occurredAt) {
      this.eventType = eventType;
      this.detail = detail;
      this.occurredAt = occurredAt;
    }
    public Integer compareTo(Object other) {
      TimelineEntry compared = (TimelineEntry) other;
      if (occurredAt == compared.occurredAt)
        return 0;
      return occurredAt < compared.occurredAt ? -1 : 1;
    }
  }
}
