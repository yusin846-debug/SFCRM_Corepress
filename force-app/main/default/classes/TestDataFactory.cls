/** Creates reusable CorePress test records without relying on org business data. */
@IsTest
public class TestDataFactory {
  /** @param name Account name. @param insertRecord Whether to insert. @return Account. */
  public static Account createAccount(String name, Boolean insertRecord) {
    Account record = new Account(Name = name, ShippingStreet = '테스트로 1');
    if (insertRecord)
      insert record;
    return record;
  }
  /** @param accountId Parent Account. @param email Contact email. @param insertRecord Whether to insert. @return Contact. */
  public static Contact createContact(
    Id accountId,
    String email,
    Boolean insertRecord
  ) {
    Contact record = new Contact(
      AccountId = accountId,
      LastName = '김도입',
      Email = email,
      Phone = '010-0000-0000'
    );
    if (insertRecord)
      insert record;
    return record;
  }
  /** @param company Company. @param email Email. @param equipment Model. @param insertRecord Whether to insert. @return Lead. */
  public static Lead createCatalogLead(
    String company,
    String email,
    String equipment,
    Boolean insertRecord
  ) {
    Lead record = new Lead(
      Company = company,
      LastName = '김도입',
      Email = email,
      Title = equipment + ' 신규요청',
      LeadSource = '카탈로그 문의',
      Status = '신규 문의',
      Privacy_Consent__c = true,
      Product_Interest__c = '압축기',
      Interested_Equipment__c = equipment
    );
    if (insertRecord) {
      Database.DMLOptions options = new Database.DMLOptions();
      options.DuplicateRuleHeader.allowSave = true;
      Database.insert(record, options, AccessLevel.SYSTEM_MODE);
    }
    return record;
  }
}
