@IsTest
private class CpQuoteControllerTest {
    @TestSetup
    static void setup() {
        Account acc = new Account(Name = 'Test Quote Account', ShippingStreet = '테스트로 1');
        insert acc;

        Opportunity opp = new Opportunity(
            Name = 'Test Opportunity',
            AccountId = acc.Id,
            StageName = 'Proposal/Quote',
            CloseDate = Date.today().addDays(30)
        );
        insert opp;

        Product2 product = new Product2(Name = 'Test Compressor', IsActive = true);
        insert product;

        Id standardPricebookId = Test.getStandardPricebookId();
        PricebookEntry pbe = new PricebookEntry(
            Pricebook2Id = standardPricebookId,
            Product2Id = product.Id,
            UnitPrice = 1000000,
            IsActive = true
        );
        insert pbe;

        Quote quote = new Quote(
            Name = 'Test Quote',
            OpportunityId = opp.Id,
            Pricebook2Id = standardPricebookId,
            Status = 'Presented',
            ExpirationDate = Date.today().addDays(30)
        );
        insert quote;

        insert new QuoteLineItem(
            QuoteId = quote.Id,
            Product2Id = product.Id,
            PricebookEntryId = pbe.Id,
            Quantity = 2,
            UnitPrice = 1000000
        );
    }

    @IsTest
    static void returnsQuotesWithLineItemsForAccount() {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Quote Account' LIMIT 1];

        Test.startTest();
        List<CpQuoteController.QuoteSummary> quotes = CpQuoteController.getQuotesForAccount(acc.Id);
        Test.stopTest();

        System.assertEquals(1, quotes.size(), 'Should return the one Quote on the Account\'s Opportunity');
        CpQuoteController.QuoteSummary summary = quotes[0];
        System.assertEquals('Test Quote', summary.name);
        System.assertEquals('Presented', summary.status);
        System.assertEquals(1, summary.lineItems.size(), 'Should return the line item on the Quote');
        System.assertEquals('Test Compressor', summary.lineItems[0].productName);
        System.assertEquals(2, summary.lineItems[0].quantity);
    }

    @IsTest
    static void returnsEmptyListForNullAccountId() {
        Test.startTest();
        List<CpQuoteController.QuoteSummary> quotes = CpQuoteController.getQuotesForAccount(null);
        Test.stopTest();

        System.assertEquals(0, quotes.size(), 'Null accountId should short-circuit to an empty list');
    }

    @IsTest
    static void returnsEmptyListForAccountWithNoQuotes() {
        Account other = new Account(Name = 'No Quotes Account', ShippingStreet = '테스트로 2');
        insert other;

        Test.startTest();
        List<CpQuoteController.QuoteSummary> quotes = CpQuoteController.getQuotesForAccount(other.Id);
        Test.stopTest();

        System.assertEquals(0, quotes.size(), 'Account with no Opportunity/Quote should return an empty list');
    }
}
