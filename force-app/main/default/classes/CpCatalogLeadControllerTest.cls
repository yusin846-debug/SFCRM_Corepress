@IsTest
private class CpCatalogLeadControllerTest {
    private static CpCatalogLeadController.CatalogInquiry buildInquiry() {
        CpCatalogLeadController.CatalogInquiry inquiry = new CpCatalogLeadController.CatalogInquiry();
        inquiry.company = '대한케미컬';
        inquiry.name = '김유신';
        inquiry.email = 'buyer@daehan.example.com';
        inquiry.phone = '02-1234-5678';
        inquiry.product = 'CP7100+';
        inquiry.message = '제2공장 압축기 카탈로그 요청합니다.';
        inquiry.consent = true;
        return inquiry;
    }

    @IsTest
    static void shouldCreateLead_WhenValidInquiry() {
        CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();

        Test.startTest();
        Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
        Test.stopTest();

        Lead lead = [
            SELECT Company, LastName, Email, Phone, LeadSource, Product_Interest__c, Privacy_Consent__c, Description
            FROM Lead
            WHERE Id = :leadId
        ];
        Assert.isTrue(lead.Privacy_Consent__c, 'Consent flag should be recorded on the Lead');
        Assert.areEqual('대한케미컬', lead.Company, 'Company should map from the form');
        Assert.areEqual('김유신', lead.LastName, 'Name should map to LastName');
        Assert.areEqual('buyer@daehan.example.com', lead.Email, 'Email should map from the form');
        Assert.areEqual('02-1234-5678', lead.Phone, 'Phone should map from the form');
        Assert.areEqual('카탈로그 문의', lead.LeadSource, 'Lead source should be tagged');
        Assert.areEqual('압축기', lead.Product_Interest__c, 'Product interest should default to compressor line');
        Assert.isTrue(lead.Description.contains('CP7100+'), 'Description should retain selected product model');
        Assert.isTrue(lead.Description.contains('제2공장'), 'Description should retain the message');
    }

    @IsTest
    static void shouldDefaultLastName_WhenNameBlank() {
        CpCatalogLeadController.CatalogInquiry inquiry = buildInquiry();
        inquiry.name = '   ';

        Test.startTest();
        Id leadId = CpCatalogLeadController.submitCatalogInquiry(inquiry);
        Test.stopTest();

        Lead lead = [SELECT LastName FROM Lead WHERE Id = :leadId];
        Assert.areEqual('미입력', lead.LastName, 'Blank name should fall back to placeholder');
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
