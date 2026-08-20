@IsTest
private class CpPortalFileControllerTest {
    @TestSetup
    static void setupData() {
        Account account = new Account(
            Name = 'CorePress Test Customer',
            ShippingStreet = '테스트로 1',
            ShippingCity = '서울',
            ShippingPostalCode = '04524',
            ShippingCountry = '대한민국'
        );
        insert account;
        Case request = new Case(AccountId = account.Id, Subject = '파일 첨부 테스트', Status = '신규접수', Origin = '포털', Requested_Urgency__c = '보통');
        insert request;
    }

    @IsTest
    static void uploadsFileToCase() {
        Case request = [SELECT Id FROM Case LIMIT 1];
        Test.startTest();
        Id versionId = CpPortalFileController.uploadFile(request.Id, '현장사진.png', EncodingUtil.base64Encode(Blob.valueOf('test image')));
        Test.stopTest();
        ContentVersion version = [SELECT Title, FirstPublishLocationId FROM ContentVersion WHERE Id = :versionId];
        System.assertEquals('현장사진', version.Title);
        System.assertEquals(request.Id, version.FirstPublishLocationId);
    }

    @IsTest
    static void rejectsMissingInput() {
        try {
            CpPortalFileController.uploadFile(null, null, null);
            System.assert(false, '예외가 발생해야 합니다.');
        } catch (AuraHandledException expected) {
            System.assertNotEquals(null, expected);
        }
    }
}