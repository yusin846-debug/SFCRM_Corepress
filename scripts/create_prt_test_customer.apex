String accountName = '대한케미컬_PRT 통합테스트';
String username = 'corepress.prt.20260819.yusin@test.corepress.example';

List<User> existingUsers = [SELECT Id FROM User WHERE Username = :username LIMIT 1];
if (!existingUsers.isEmpty()) {
    System.debug('EXISTING_USER_ID=' + existingUsers[0].Id);
} else {
    Account account = new Account(
        Name = accountName,
        OwnerId = '005gK00006qGvA9QAK',
        ShippingStreet = '전라남도 여수시 산업로 100',
        ShippingCity = '여수시',
        ShippingState = '전라남도',
        ShippingPostalCode = '59631',
        ShippingCountry = '대한민국',
        Phone = '061-000-0000'
    );
    insert account;

    Contact contact = new Contact(
        AccountId = account.Id,
        FirstName = '김',
        LastName = '유신',
        Email = 'yusin846@gmail.com',
        Phone = '010-0000-0000',
        Title = '설비 담당자'
    );
    insert contact;

    Product2 product = [SELECT Id FROM Product2 WHERE ProductCode = 'test CP5100-PRO' LIMIT 1];
    Asset asset = new Asset(
        AccountId = account.Id,
        ContactId = contact.Id,
        Product2Id = product.Id,
        Name = '대한케미컬 터보압축기 #PRT-01',
        SerialNumber = 'DHC-PRT-2026-001',
        Status = 'Registered',
        InstallDate = Date.newInstance(2024, 6, 15),
        Street = '제2공장 유틸리티동 A구역',
        City = '여수시',
        Runtime_As_Of__c = Date.today(),
        Total_Runtime_Hours__c = 15240
    );
    insert asset;

    User portalUser = new User(
        Username = username,
        Email = 'yusin846@gmail.com',
        FirstName = '김',
        LastName = '유신',
        Alias = 'dhcprt',
        CommunityNickname = 'dhc_prt_yusin_20260819',
        ContactId = contact.Id,
        ProfileId = '00egK00000C6YoNQAV',
        TimeZoneSidKey = 'Asia/Seoul',
        LocaleSidKey = 'ko_KR',
        EmailEncodingKey = 'UTF-8',
        LanguageLocaleKey = 'ko',
        IsActive = true
    );
    insert portalUser;

    System.debug('ACCOUNT_ID=' + account.Id);
    System.debug('CONTACT_ID=' + contact.Id);
    System.debug('ASSET_ID=' + asset.Id);
    System.debug('USER_ID=' + portalUser.Id);
    System.debug('USERNAME=' + username);
}
