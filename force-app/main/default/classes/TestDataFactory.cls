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
  /** @param name Product name. @param code Product code. @param insertRecord Whether to insert. @return Product2. */
  public static Product2 createEquipmentProduct(
    String name,
    String code,
    Boolean insertRecord
  ) {
    Product2 record = new Product2(
      Name = name,
      ProductCode = code,
      Family = '압축기',
      Description = name + ' 테스트 장비 설명',
      IsActive = true,
      Expected_Life_Years__c = 10,
      Overhaul_Interval_Hours__c = 12000
    );
    if (insertRecord)
      insert record;
    return record;
  }
  /** @param accountId Owner Account. @param productId Product2. @param serialNumber Serial. @param insertRecord Whether to insert. @return Asset. */
  public static Asset createAsset(
    Id accountId,
    Id productId,
    String serialNumber,
    Boolean insertRecord
  ) {
    Asset record = new Asset(
      Name = '테스트 보유 장비 ' + serialNumber,
      AccountId = accountId,
      Product2Id = productId,
      SerialNumber = serialNumber,
      Status = 'Installed',
      Runtime_As_Of__c = Date.today(),
      Total_Runtime_Hours__c = 1000
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
