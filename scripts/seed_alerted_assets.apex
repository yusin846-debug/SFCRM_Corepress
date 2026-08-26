// Demo seed: mark 2 assets as Sales_Alert_Status__c = 'Alerted'
// so the portal health badge and portal-home count render even before
// 황's backend Flow lands. Idempotent — safe to re-run.
Map<String, Id> targets = new Map<String, Id>{
  '안산 1공장 CP6000 #2' => null,
  '한빛석유화학 대산공장 CP7100 Pro #1' => null
};

for (Asset a : [
  SELECT Id, Name, Sales_Alert_Status__c
  FROM Asset
  WHERE Name IN :targets.keySet()
]) {
  targets.put(a.Name, a.Id);
}

List<Asset> updates = new List<Asset>();
for (String name : targets.keySet()) {
  Id assetId = targets.get(name);
  if (assetId == null) {
    System.debug('NOT FOUND: ' + name);
    continue;
  }
  updates.add(new Asset(
    Id = assetId,
    Sales_Alert_Status__c = 'Alerted',
    Sales_Alert_Sent_At__c = System.now()
  ));
}

if (!updates.isEmpty()) {
  update updates;
  System.debug('Updated ' + updates.size() + ' assets to Alerted');
  for (Asset a : updates) {
    System.debug('  ' + a.Id + ' -> Alerted');
  }
}
