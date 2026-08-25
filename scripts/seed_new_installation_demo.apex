Savepoint demoSavepoint = Database.setSavepoint();
try {
    Account demoAccount = [SELECT Id FROM Account WHERE Name = '대한케미컬_PRT 통합테스트' LIMIT 1];
    Contact demoContact = [SELECT Id, FirstName, LastName FROM Contact WHERE Email = 'kim.jaehyuk@daehan-corepress-poc.com' LIMIT 1];
    demoContact.FirstName = null;
    demoContact.LastName = '김도입';
    update demoContact;

    List<User> demoUsers = [SELECT Id, FirstName, LastName FROM User WHERE ContactId = :demoContact.Id LIMIT 1];
    if (!demoUsers.isEmpty()) {
        demoUsers[0].FirstName = null;
        demoUsers[0].LastName = '김도입';
        update demoUsers[0];
    }

    Id newInstallationRecordTypeId = [SELECT Id FROM RecordType WHERE SObjectType = 'Opportunity' AND DeveloperName = 'New_Installation' LIMIT 1].Id;
    Id salesOwnerId = [SELECT Id FROM User WHERE Username = 'saleskim@corepress.demo' AND IsActive = true LIMIT 1].Id;
    Pricebook2 standardPricebook = [SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1];
    Map<String, Product2> productsByName = new Map<String, Product2>();
    for (Product2 product : [SELECT Id, Name, ProductCode FROM Product2 WHERE Name IN ('CP6000', 'CP7100+') AND IsActive = true]) {
        productsByName.put(product.Name, product);
    }
    Product2 cp6000 = productsByName.get('CP6000');
    Product2 cp7100 = productsByName.get('CP7100+');
    System.assert(cp6000 != null && cp7100 != null, 'CP6000 또는 CP7100+ 제품을 찾을 수 없습니다.');

    Map<Id, PricebookEntry> entriesByProduct = new Map<Id, PricebookEntry>();
    for (PricebookEntry entry : [SELECT Id, Product2Id, UnitPrice FROM PricebookEntry WHERE Pricebook2Id = :standardPricebook.Id AND Product2Id IN :new Set<Id>{cp6000.Id, cp7100.Id} AND IsActive = true]) {
        entriesByProduct.put(entry.Product2Id, entry);
    }
    if (!entriesByProduct.containsKey(cp6000.Id)) {
        PricebookEntry entry = new PricebookEntry(Pricebook2Id = standardPricebook.Id, Product2Id = cp6000.Id, UnitPrice = 780000000, IsActive = true);
        insert entry; entriesByProduct.put(cp6000.Id, entry);
    }
    if (!entriesByProduct.containsKey(cp7100.Id)) {
        PricebookEntry entry = new PricebookEntry(Pricebook2Id = standardPricebook.Id, Product2Id = cp7100.Id, UnitPrice = Decimal.valueOf('2323650000'), IsActive = true);
        insert entry; entriesByProduct.put(cp7100.Id, entry);
    }

    List<Map<String, Object>> seeds = new List<Map<String, Object>>{
        new Map<String, Object>{'opportunityName' => '안산 1공장 CP6000 #1 기존 도입', 'quoteName' => 'CP6000 #1 기존 도입 견적', 'product' => cp6000, 'amount' => Decimal.valueOf('780000000'), 'stage' => 'Closed Won', 'status' => 'Accepted'},
        new Map<String, Object>{'opportunityName' => '안산 1공장 CP6000 #2 기존 도입', 'quoteName' => 'CP6000 #2 기존 도입 견적', 'product' => cp6000, 'amount' => Decimal.valueOf('820000000'), 'stage' => 'Closed Won', 'status' => 'Accepted'},
        new Map<String, Object>{'opportunityName' => '제2공장 CP7100+ 신규 도입', 'quoteName' => 'CP7100+ 신규 도입 견적', 'product' => cp7100, 'amount' => Decimal.valueOf('2323650000'), 'stage' => '견적 제출', 'status' => 'Presented'}
    };
    for (Map<String, Object> seed : seeds) {
        String opportunityName = (String)seed.get('opportunityName');
        List<Opportunity> opportunities = [SELECT Id FROM Opportunity WHERE AccountId = :demoAccount.Id AND Name = :opportunityName LIMIT 1];
        Opportunity opportunity;
        if (opportunities.isEmpty()) {
            opportunity = new Opportunity(Name = opportunityName, AccountId = demoAccount.Id, OwnerId = salesOwnerId,
                RecordTypeId = newInstallationRecordTypeId, Type = 'New Business', StageName = (String)seed.get('stage'),
                CloseDate = Date.today().addDays((String)seed.get('stage') == 'Closed Won' ? -365 : 60),
                Amount = (Decimal)seed.get('amount'), Pricebook2Id = standardPricebook.Id);
            insert opportunity;
        } else opportunity = opportunities[0];

        String quoteName = (String)seed.get('quoteName');
        List<Quote> quotes = [SELECT Id FROM Quote WHERE OpportunityId = :opportunity.Id AND Name = :quoteName LIMIT 1];
        if (quotes.isEmpty()) {
            Quote quote = new Quote(Name = quoteName, OpportunityId = opportunity.Id, Pricebook2Id = standardPricebook.Id,
                Status = (String)seed.get('status'), ExpirationDate = Date.today().addDays(60));
            insert quote;
            Product2 product = (Product2)seed.get('product');
            insert new QuoteLineItem(QuoteId = quote.Id, PricebookEntryId = entriesByProduct.get(product.Id).Id,
                Quantity = 1, UnitPrice = (Decimal)seed.get('amount'), Description = opportunityName);
        }
    }
    System.debug('CorePress demo quote seed completed for Account ' + demoAccount.Id);
} catch (Exception error) {
    Database.rollback(demoSavepoint);
    throw error;
}
