@IsTest
private class CpCatalogLeadControllerTest {
  private static CpCatalogLeadController.CatalogInquiry buildInquiry() {
    CpCatalogLeadController.CatalogInquiry inquiry = new CpCatalogLeadController.CatalogInquiry();
    inquiry.company = '대한케미컬';
    inquiry.name = '김유신';
    inquiry.email = 'buyer@daehan.example.com';
    inquiry.phone = '02-1234-5678';
    inquiry.product = 'CP7100+';
    inquiry.productFamily = '압축기';
    inquiry.message = '제2공장 압축기 카탈로그 요청합니다.';
    inquiry.consent = true;
    inquiry.marketingConsent = true;
    return inquiry;
  }

  @IsTest
  static void shouldCreateLead_WhenValidInquiry() {
    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();

    Test.startTest();
    Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
    Test.stopTest();

    Lead lead = [
      SELECT
        Company,
        LastName,
        Title,
        Email,
        Phone,
        LeadSource,
        Product_Interest__c,
        Privacy_Consent__c,
        Marketing_Consent__c,
        Marketing_Consent_At__c,
        Marketing_Consent_Source__c,
        Interested_Equipment__c,
        Description
      FROM Lead
      WHERE Id = :leadId
    ];
    Assert.isTrue(
      lead.Privacy_Consent__c,
      'Consent flag should be recorded on the Lead'
    );
    Assert.areEqual(
      '대한케미컬',
      lead.Company,
      'Company should map from the form'
    );
    Assert.areEqual('김유신', lead.LastName, 'Name should map to LastName');
    Assert.areEqual(
      'CP7100+ 신규요청',
      lead.Title,
      'Lead title should describe the interested equipment and new request'
    );
    Assert.areEqual(
      'buyer@daehan.example.com',
      lead.Email,
      'Email should map from the form'
    );
    Assert.areEqual(
      '02-1234-5678',
      lead.Phone,
      'Phone should map from the form'
    );
    Assert.areEqual(
      '카탈로그 문의',
      lead.LeadSource,
      'Lead source should be tagged'
    );
    Assert.areEqual(
      '압축기',
      lead.Product_Interest__c,
      'Product interest should record the selected product family'
    );
    Assert.areEqual(
      'CP7100+',
      lead.Interested_Equipment__c,
      'Exact equipment model should be retained'
    );
    Assert.isTrue(
      lead.Marketing_Consent__c,
      'Optional marketing consent should be retained'
    );
    Assert.isNotNull(
      lead.Marketing_Consent_At__c,
      'Consent timestamp should be recorded when agreed'
    );
    Assert.areEqual(
      '공개 랜딩',
      lead.Marketing_Consent_Source__c,
      'Consent source should identify the landing page'
    );
    Assert.isTrue(
      lead.Description.contains('CP7100+'),
      'Description should retain selected product model'
    );
    Assert.isTrue(
      lead.Description.contains('제2공장'),
      'Description should retain the message'
    );
  }

  @IsTest
  static void shouldCreateLeadWithoutMarketingConsent_WhenOptionalConsentUnchecked() {
    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();
    inquiry.marketingConsent = false;

    Test.startTest();
    Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
    Test.stopTest();

    Lead lead = [
      SELECT
        Marketing_Consent__c,
        Marketing_Consent_At__c,
        Marketing_Consent_Source__c
      FROM Lead
      WHERE Id = :leadId
    ];
    Assert.isFalse(
      lead.Marketing_Consent__c,
      'Marketing consent must remain optional'
    );
    Assert.isNull(
      lead.Marketing_Consent_At__c,
      'No consent timestamp should be stored when unchecked'
    );
    Assert.isNull(
      lead.Marketing_Consent_Source__c,
      'No consent source should be stored when unchecked'
    );
  }

  @IsTest
  static void shouldAssignSalesOwner_WhenSalesUserExists() {
    List<User> owners = [
      SELECT Id
      FROM User
      WHERE Username = 'saleskim@corepress.demo' AND IsActive = TRUE
      LIMIT 1
    ];
    if (owners.isEmpty()) {
      return; // Org-specific demo user not present in this environment; nothing to assert.
    }

    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();

    Test.startTest();
    Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
    Test.stopTest();

    Lead lead = [SELECT OwnerId FROM Lead WHERE Id = :leadId];
    Assert.areEqual(
      owners[0].Id,
      lead.OwnerId,
      'New Lead should be owned by the 김영업 sales rep'
    );
  }

  @IsTest
  static void shouldDefaultLastName_WhenNameBlank() {
    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();
    inquiry.name = '   ';

    Test.startTest();
    Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
    Test.stopTest();

    Lead lead = [SELECT LastName FROM Lead WHERE Id = :leadId];
    Assert.areEqual(
      '미입력',
      lead.LastName,
      'Blank name should fall back to placeholder'
    );
  }

  @IsTest
  static void shouldDefaultProductInterest_WhenProductFamilyBlank() {
    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();
    inquiry.product = '전체 제품';
    inquiry.productFamily = '';

    Test.startTest();
    Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
    Test.stopTest();

    Lead lead = [SELECT Product_Interest__c FROM Lead WHERE Id = :leadId];
    Assert.areEqual(
      '압축기',
      lead.Product_Interest__c,
      'Blank/unrecognized family should fall back to a valid picklist value'
    );
  }

  @IsTest
  static void shouldRejectUnknownProductFamily() {
    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();
    inquiry.productFamily = '해킹시도';

    Test.startTest();
    Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
    Test.stopTest();

    Lead lead = [SELECT Product_Interest__c FROM Lead WHERE Id = :leadId];
    Assert.areEqual(
      '압축기',
      lead.Product_Interest__c,
      'Values outside the restricted picklist should fall back to a valid default'
    );
  }

  @IsTest
  static void shouldThrow_WhenInquiryNull() {
    Test.startTest();
    try {
      CpCatalogLeadController.submitCatalogInquiry(null);
      Assert.fail('Expected AuraHandledException for null inquiry');
    } catch (AuraHandledException error) {
      Assert.isNotNull(error.getMessage(), 'Exception should carry a message');
    }
    Test.stopTest();
  }

  @IsTest
  static void shouldThrow_WhenCompanyBlank() {
    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();
    inquiry.company = '';

    Test.startTest();
    try {
      CpCatalogLeadController.submitCatalogInquiry(inquiry);
      Assert.fail('Expected AuraHandledException for blank company');
    } catch (AuraHandledException error) {
      Assert.isNotNull(error.getMessage(), 'Exception should carry a message');
    }
    Test.stopTest();
  }

  @IsTest
  static void shouldThrow_WhenConsentMissing() {
    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();
    inquiry.consent = false;

    Test.startTest();
    try {
      CpCatalogLeadController.submitCatalogInquiry(inquiry);
      Assert.fail('Expected AuraHandledException when consent not given');
    } catch (AuraHandledException error) {
      Assert.isNotNull(error.getMessage(), 'Exception should carry a message');
    }
    Test.stopTest();
  }

  @IsTest
  static void shouldThrow_WhenEmailBlank() {
    CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();
    inquiry.email = null;

    Test.startTest();
    try {
      CpCatalogLeadController.submitCatalogInquiry(inquiry);
      Assert.fail('Expected AuraHandledException for blank email');
    } catch (AuraHandledException error) {
      Assert.isNotNull(error.getMessage(), 'Exception should carry a message');
    }
    Test.stopTest();
  }
}
