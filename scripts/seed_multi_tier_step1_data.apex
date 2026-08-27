// STEP 1 (non-setup DML): Seed Accounts + Contacts + Assets for 3 test
// customer tiers. Idempotent — re-runs skip existing records.
// After this completes successfully, run scripts/seed_multi_tier_step2_users.apex
// which handles Users/passwords/permission set assignments (setup DML).

// -------- Product2 lookup --------
Map<String, Id> productIdByName = new Map<String, Id>();
for (Product2 p : [
  SELECT Id, Name FROM Product2
  WHERE Name IN ('CP7100+','CP7100 Pro','CP6000','CD7000','CP5100 Pro') AND IsActive = TRUE
]) { productIdByName.put(p.Name, p.Id); }

// -------- Sales Owner lookup --------
Id salesOwnerId;
List<User> salesOwners = [SELECT Id FROM User WHERE Username = 'saleskim@corepress.demo' AND IsActive = TRUE LIMIT 1];
if (!salesOwners.isEmpty()) salesOwnerId = salesOwners[0].Id;

// -------- Local helper class --------
class AssetFactory {
  Id ownerId;
  AssetFactory(Id ownerId) { this.ownerId = ownerId; }
  Asset build(Id accountId, Id contactId, Id productId,
              String name, String city, String street,
              Date installDate, Integer runtimeHours, String status, String alertStatus) {
    Asset a = new Asset(
      AccountId = accountId, ContactId = contactId, Product2Id = productId,
      Name = name,
      SerialNumber = 'SN-' + name.replaceAll('[^A-Za-z0-9]', '').left(24),
      Status = status, InstallDate = installDate,
      City = city, Street = street,
      Runtime_As_Of__c = Date.today(),
      Total_Runtime_Hours__c = runtimeHours
    );
    if (ownerId != null) a.OwnerId = ownerId;
    if (String.isNotBlank(alertStatus)) {
      a.Sales_Alert_Status__c = alertStatus;
      a.Sales_Alert_Sent_At__c = System.now();
    }
    return a;
  }
}

// -------- Account seeds --------
Map<String, Account> accountsByName = new Map<String, Account>();
Map<String, Account> desired = new Map<String, Account>{
  '삼양중공업' => new Account(
    Name = '삼양중공업', Type = 'Customer', Industry = 'Manufacturing',
    NumberOfEmployees = 5200, AnnualRevenue = 1250000000000L,
    Phone = '031-000-1000',
    ShippingStreet = '경기도 안성시 공단로 250', ShippingCity = '안성시',
    ShippingState = '경기도', ShippingPostalCode = '17561', ShippingCountry = '대한민국'
  ),
  '정민플라스틱' => new Account(
    Name = '정민플라스틱', Type = 'Customer', Industry = 'Chemicals',
    NumberOfEmployees = 480, AnnualRevenue = 62000000000L,
    Phone = '052-000-2000',
    ShippingStreet = '울산광역시 남구 여천동 210', ShippingCity = '울산광역시',
    ShippingState = '울산', ShippingPostalCode = '44714', ShippingCountry = '대한민국'
  ),
  '성진공업' => new Account(
    Name = '성진공업', Type = 'Customer', Industry = 'Machinery',
    NumberOfEmployees = 42, AnnualRevenue = 5300000000L,
    Phone = '032-000-3000',
    ShippingStreet = '경기도 부천시 오정로 88', ShippingCity = '부천시',
    ShippingState = '경기도', ShippingPostalCode = '14481', ShippingCountry = '대한민국'
  )
};
for (Account existing : [SELECT Id, Name FROM Account WHERE Name IN :desired.keySet()]) {
  accountsByName.put(existing.Name, existing);
}
List<Account> toInsertAccounts = new List<Account>();
for (String name : desired.keySet()) {
  if (!accountsByName.containsKey(name)) {
    Account a = desired.get(name);
    if (salesOwnerId != null) a.OwnerId = salesOwnerId;
    toInsertAccounts.add(a);
  }
}
if (!toInsertAccounts.isEmpty()) {
  insert toInsertAccounts;
  for (Account a : toInsertAccounts) accountsByName.put(a.Name, a);
  System.debug('Inserted ' + toInsertAccounts.size() + ' accounts');
} else {
  System.debug('All 3 accounts already exist');
}

// -------- Contact seeds --------
Map<String, Contact> contactsByEmail = new Map<String, Contact>();
List<Contact> contactDefs = new List<Contact>{
  new Contact(AccountId = accountsByName.get('삼양중공업').Id,
              FirstName = '태호', LastName = '강',
              Email = 'kang.taeho@samyangheavy.demo',
              Phone = '010-1111-1111', Title = '설비관리 팀장'),
  new Contact(AccountId = accountsByName.get('정민플라스틱').Id,
              FirstName = '서준', LastName = '박',
              Email = 'park.seojun@jungminplastic.demo',
              Phone = '010-2222-2222', Title = '설비 과장'),
  new Contact(AccountId = accountsByName.get('성진공업').Id,
              FirstName = '소영', LastName = '정',
              Email = 'jung.soyoung@sungjin.demo',
              Phone = '010-3333-3333', Title = '대표')
};
Set<String> desiredEmails = new Set<String>();
for (Contact c : contactDefs) desiredEmails.add(c.Email);
for (Contact existing : [SELECT Id, Email FROM Contact WHERE Email IN :desiredEmails]) {
  contactsByEmail.put(existing.Email, existing);
}
List<Contact> toInsertContacts = new List<Contact>();
for (Contact c : contactDefs) {
  if (!contactsByEmail.containsKey(c.Email)) toInsertContacts.add(c);
}
if (!toInsertContacts.isEmpty()) {
  insert toInsertContacts;
  for (Contact c : toInsertContacts) contactsByEmail.put(c.Email, c);
  System.debug('Inserted ' + toInsertContacts.size() + ' contacts');
}

// -------- Asset seeds --------
// Owner must be a sales user in the portal role hierarchy (김영업) — assets
// owned by an admin above the portal role are invisible to portal users.
AssetFactory af = new AssetFactory(salesOwnerId);
Id samyangId = accountsByName.get('삼양중공업').Id;
Id jungminId = accountsByName.get('정민플라스틱').Id;
Id sungjinId = accountsByName.get('성진공업').Id;
Id kangId    = contactsByEmail.get('kang.taeho@samyangheavy.demo').Id;
Id parkId    = contactsByEmail.get('park.seojun@jungminplastic.demo').Id;
Id jungId    = contactsByEmail.get('jung.soyoung@sungjin.demo').Id;

List<Asset> assetDefs = new List<Asset>{
  // 삼양 안성 본사공장 (5)
  af.build(samyangId, kangId, productIdByName.get('CP7100+'),  '삼양중공업 안성 본사공장 CP7100+ #1',  '안성', '안성 본사공장 A-1', Date.newInstance(2026,1,15), 1200,  'Installed', null),
  af.build(samyangId, kangId, productIdByName.get('CP7100+'),  '삼양중공업 안성 본사공장 CP7100+ #2',  '안성', '안성 본사공장 A-2', Date.newInstance(2025,11,20),3800,  'Installed', null),
  af.build(samyangId, kangId, productIdByName.get('CP7100 Pro'),'삼양중공업 안성 본사공장 CP7100 Pro #1','안성', '안성 본사공장 B-1', Date.newInstance(2023,4,10), 18500, 'Installed', null),
  af.build(samyangId, kangId, productIdByName.get('CP7100 Pro'),'삼양중공업 안성 본사공장 CP7100 Pro #2','안성', '안성 본사공장 B-2', Date.newInstance(2022,8,5),  24300, 'Installed', null),
  af.build(samyangId, kangId, productIdByName.get('CD7000'),   '삼양중공업 안성 본사공장 CD7000 #1',    '안성', '안성 본사공장 C-1', Date.newInstance(2023,9,12), 15800, 'Installed', null),
  // 삼양 청주공장 (4): 노후 · Alerted · Obsolete
  af.build(samyangId, kangId, productIdByName.get('CP6000'),   '삼양중공업 청주공장 CP6000 #1',         '청주', '청주공장 라인1',    Date.newInstance(2019,3,25), 52000, 'Installed','Alerted'),
  af.build(samyangId, kangId, productIdByName.get('CP6000'),   '삼양중공업 청주공장 CP6000 #2',         '청주', '청주공장 라인2',    Date.newInstance(2018,6,15), 62000, 'Obsolete', null),
  af.build(samyangId, kangId, productIdByName.get('CD7000'),   '삼양중공업 청주공장 CD7000 #1',         '청주', '청주공장 유틸리티',  Date.newInstance(2022,10,1), 20500, 'Installed', null),
  af.build(samyangId, kangId, productIdByName.get('CP5100 Pro'),'삼양중공업 청주공장 CP5100 Pro #1',    '청주', '청주공장 보조라인',  Date.newInstance(2020,5,8),  32000, 'Installed', null),
  // 삼양 대전공장 (3): 최근 도입
  af.build(samyangId, kangId, productIdByName.get('CP7100 Pro'),'삼양중공업 대전공장 CP7100 Pro #1',    '대전', '대전공장 메인라인',  Date.newInstance(2024,6,30), 8200,  'Installed', null),
  af.build(samyangId, kangId, productIdByName.get('CD7000'),   '삼양중공업 대전공장 CD7000 #1',         '대전', '대전공장 유틸리티',  Date.newInstance(2023,11,20),13500, 'Installed', null),
  af.build(samyangId, kangId, productIdByName.get('CP5100 Pro'),'삼양중공업 대전공장 CP5100 Pro #1',    '대전', '대전공장 신설라인',  Date.newInstance(2026,5,10), 600,   'Installed', null),
  // 정민플라스틱 울산 (2)
  af.build(jungminId, parkId, productIdByName.get('CP6000'),   '정민플라스틱 울산공장 CP6000 #1',      '울산', '울산공장 A동',      Date.newInstance(2021,7,14), 28000, 'Installed', null),
  af.build(jungminId, parkId, productIdByName.get('CD7000'),   '정민플라스틱 울산공장 CD7000 #1',      '울산', '울산공장 B동',      Date.newInstance(2020,9,22), 35000, 'Installed','Alerted'),
  // 성진공업 부천 (1)
  af.build(sungjinId, jungId, productIdByName.get('CP5100 Pro'),'성진공업 부천공장 CP5100 Pro #1',      '부천', '부천공장',          Date.newInstance(2024,11,8), 5200,  'Installed', null)
};

Set<String> assetNames = new Set<String>();
for (Asset a : assetDefs) assetNames.add(a.Name);
Set<String> existingAssetNames = new Set<String>();
for (Asset e : [SELECT Name FROM Asset WHERE Name IN :assetNames]) existingAssetNames.add(e.Name);
List<Asset> toInsertAssets = new List<Asset>();
for (Asset a : assetDefs) {
  if (!existingAssetNames.contains(a.Name) && a.Product2Id != null) toInsertAssets.add(a);
}
if (!toInsertAssets.isEmpty()) {
  insert toInsertAssets;
  System.debug('Inserted ' + toInsertAssets.size() + ' assets');
} else {
  System.debug('All assets already exist');
}

System.debug('=== STEP 1 COMPLETE — now run seed_multi_tier_step2_users.apex ===');
for (String name : accountsByName.keySet()) {
  System.debug('  Account: ' + name + ' = ' + accountsByName.get(name).Id);
}
