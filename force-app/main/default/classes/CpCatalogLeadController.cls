/**
 * Creates Lead records from the public catalog inquiry form on the CorePress
 * portal landing page. Runs without sharing so the unauthenticated Guest User
 * can create a Lead through this method only, without gaining direct read or
 * edit access to the Lead object.
 */
public without sharing class CpCatalogLeadController {
  private static final String LEAD_SOURCE = '카탈로그 문의';
  private static final String DEFAULT_LAST_NAME = '미입력';
  private static final String DEFAULT_PRODUCT_INTEREST = '압축기';
  private static final String SALES_OWNER_USERNAME = 'saleskim@corepress.demo';
  private static final String MARKETING_CONSENT_SOURCE = '공개 랜딩';
  private static final String NEW_REQUEST_SUFFIX = ' 신규요청';
  // Product_Interest__c is a restricted picklist keyed to Product2.Family, not to
  // individual model names, so only these exact values may be written to it.
  private static final Set<String> VALID_PRODUCT_INTERESTS = new Set<String>{
    '압축기',
    '드라이어',
    '필터·부품',
    '서비스'
  };

  /**
   * Creates a Lead from a catalog inquiry submitted on the public landing page.
   *
   * @param inquiry Catalog inquiry captured from the portal form.
   * @return Id of the created Lead.
   * @throws AuraHandledException When required contact details are missing or the insert fails.
   * @example
   * Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
   */
  @AuraEnabled
  public static Id submitCatalogInquiry(CatalogInquiry inquiry) {
    if (inquiry == null) {
      throw new AuraHandledException('문의 정보가 전달되지 않았습니다.');
    }
    if (String.isBlank(inquiry.company)) {
      throw new AuraHandledException('회사명을 입력해 주세요.');
    }
    if (String.isBlank(inquiry.email)) {
      throw new AuraHandledException('이메일을 입력해 주세요.');
    }
    if (inquiry.consent != true) {
      throw new AuraHandledException('개인정보 수집·이용에 동의해 주세요.');
    }

    Lead lead = new Lead(
      Company = inquiry.company.trim(),
      LastName = String.isBlank(inquiry.name)
        ? DEFAULT_LAST_NAME
        : inquiry.name.trim(),
      Title = buildLeadTitle(inquiry.product),
      Email = inquiry.email.trim(),
      Phone = String.isBlank(inquiry.phone) ? null : inquiry.phone.trim(),
      LeadSource = LEAD_SOURCE,
      Product_Interest__c = resolveProductInterest(inquiry.productFamily),
      Interested_Equipment__c = normalizeEquipment(inquiry.product),
      Privacy_Consent__c = true,
      Marketing_Consent__c = inquiry.marketingConsent == true,
      Marketing_Consent_At__c = inquiry.marketingConsent == true
        ? System.now()
        : null,
      Marketing_Consent_Source__c = inquiry.marketingConsent == true
        ? MARKETING_CONSENT_SOURCE
        : null,
      Description = buildDescription(inquiry)
    );
    Id salesOwnerId = getSalesOwnerId();
    if (salesOwnerId != null) {
      lead.OwnerId = salesOwnerId;
    }

    try {
      Database.DMLOptions options = new Database.DMLOptions();
      options.DuplicateRuleHeader.allowSave = true;
      Database.insert(lead, options, AccessLevel.SYSTEM_MODE);
    } catch (DmlException error) {
      throw new AuraHandledException(
        '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      );
    }
    return lead.Id;
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

  private static String resolveProductInterest(String productFamily) {
    String normalized = String.isBlank(productFamily)
      ? ''
      : productFamily.trim();
    return VALID_PRODUCT_INTERESTS.contains(normalized)
      ? normalized
      : DEFAULT_PRODUCT_INTEREST;
  }

  private static String normalizeEquipment(String product) {
    return String.isBlank(product) ? '전체 제품' : product.trim();
  }

  private static String buildLeadTitle(String product) {
    return normalizeEquipment(product) + NEW_REQUEST_SUFFIX;
  }

  private static String buildDescription(CatalogInquiry inquiry) {
    List<String> lines = new List<String>{ '[포털 카탈로그 문의]' };
    if (String.isNotBlank(inquiry.product)) {
      lines.add('관심 제품: ' + inquiry.product.trim());
    }
    if (String.isNotBlank(inquiry.message)) {
      lines.add('문의 내용: ' + inquiry.message.trim());
    }
    return String.join(lines, '\n');
  }

  /**
   * Data container for a catalog inquiry submitted from the portal landing page.
   */
  public class CatalogInquiry {
    @AuraEnabled
    public String company { get; set; }
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String email { get; set; }
    @AuraEnabled
    public String phone { get; set; }
    @AuraEnabled
    public String product { get; set; }
    @AuraEnabled
    public String productFamily { get; set; }
    @AuraEnabled
    public String message { get; set; }
    @AuraEnabled
    public Boolean consent { get; set; }
    @AuraEnabled
    public Boolean marketingConsent { get; set; }
  }
}
