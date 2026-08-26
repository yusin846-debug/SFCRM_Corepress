Id daehan = '001gK00001O8wTxQAJ';
Id hanbit = '001gK00001NQZsPQAX';
Id kimDoip = '003gK00000zpUs9QAE';
Id kimDohyun = '003gK000010AxJFQA0';
Id cp6000 = '01tgK00000DxVrdQAF';
Id cp7100Pro = '01tgK00000DxVrZQAV';
Id cp7100Plus = '01tgK00000DxVrfQAF';
Id cd7000 = '01tgK00000DxVv8QAF';
Id pb = '01sgK000008FM8UQAW';
Id newInstallRt = '012gK000005iLViQAM';

update new Account(Id=daehan, OwnerId='005gK00006qGvA9QAK');
update new Contact(Id=kimDoip, AccountId=daehan);

List<Asset> dhAssets = [SELECT Id,Name FROM Asset WHERE AccountId=:daehan ORDER BY Name];
dhAssets[0].Product2Id=cp6000; dhAssets[0].SerialNumber='DHC-2019-CP6000-01'; dhAssets[0].Status='Installed'; dhAssets[0].InstallDate=Date.newInstance(2019,5,1); dhAssets[0].City='안산시'; dhAssets[0].Street='제1공장 유틸리티동 A동';
dhAssets[1].Product2Id=cp6000; dhAssets[1].SerialNumber='DHC-2018-CP6000-02'; dhAssets[1].Status='Installed'; dhAssets[1].InstallDate=Date.newInstance(2018,3,15); dhAssets[1].City='안산시'; dhAssets[1].Street='제1공장 유틸리티동 B동';
update dhAssets;

List<Asset> hbAssets = [SELECT Id,Name,Product2Id FROM Asset WHERE AccountId=:hanbit ORDER BY Name];
for (Asset a: hbAssets) {
  a.City='서산시'; a.Status='Installed';
  if (a.Product2Id==cp7100Pro) a.Street='대산공장 압축기동';
  if (a.Product2Id==cd7000) a.Street='대산공장 드라이어동';
}
update hbAssets;
List<Asset> plusAssets=[SELECT Id FROM Asset WHERE AccountId=:hanbit AND Product2Id=:cp7100Plus LIMIT 1];
Asset hbPlus;
if (plusAssets.isEmpty()) { hbPlus=new Asset(Name='한빛석유화학 대산공장 CP7100+ #1',AccountId=hanbit,ContactId=kimDohyun,Product2Id=cp7100Plus,SerialNumber='HBP-CP71P-2026-003',Status='Installed',InstallDate=Date.newInstance(2026,7,15),City='서산시',Street='대산공장 신규 압축기동',Runtime_As_Of__c=Date.today(),Total_Runtime_Hours__c=720); insert hbPlus; }
else hbPlus=plusAssets[0];

List<AssetWarranty> warrantyUpdates=new List<AssetWarranty>();
for (Asset a: dhAssets) {
  List<AssetWarranty> rows=[SELECT Id FROM AssetWarranty WHERE AssetId=:a.Id LIMIT 1];
  AssetWarranty w=rows.isEmpty()?new AssetWarranty(AssetId=a.Id):rows[0];
  w.StartDate=a.Id==dhAssets[0].Id?Date.newInstance(2019,5,1):Date.newInstance(2018,3,15); w.EndDate=w.StartDate.addYears(2); w.WarrantyType='Standard'; w.IsTransferable=false; warrantyUpdates.add(w);
}
for (Asset a: [SELECT Id,Product2Id,InstallDate FROM Asset WHERE AccountId=:hanbit]) {
  List<AssetWarranty> rows=[SELECT Id FROM AssetWarranty WHERE AssetId=:a.Id LIMIT 1];
  AssetWarranty w=rows.isEmpty()?new AssetWarranty(AssetId=a.Id):rows[0];
  w.StartDate=a.InstallDate; w.EndDate=(a.Product2Id==cd7000?Date.newInstance(2025,4,2):a.InstallDate.addYears(3)); w.WarrantyType='Standard'; w.IsTransferable=false; warrantyUpdates.add(w);
}
upsert warrantyUpdates;

List<Case> casesToInsert=new List<Case>();
Map<Id,List<String>> subjectsByAccount=new Map<Id,List<String>>{
 daehan=>new List<String>{'CP6000 1호기 정기점검 완료','CP6000 1호기 오일 계통 점검 진행','CP6000 2호기 유상 수리 승인 요청','CP6000 2호기 진동·소음 긴급 점검'},
 hanbit=>new List<String>{'CP7100 Pro 정기점검 완료','CD7000 드레인 계통 점검 진행','CD7000 소모품 교체 승인 요청','CP7100+ 초기 운전 점검 요청'}
};
for (Id acct: subjectsByAccount.keySet()) {
  List<Asset> assets=[SELECT Id FROM Asset WHERE AccountId=:acct ORDER BY InstallDate]; Integer i=0;
  for (String subject: subjectsByAccount.get(acct)) {
    if ([SELECT COUNT() FROM Case WHERE AccountId=:acct AND Subject=:subject]==0) {
      String status=i==0?'완료':i==1?'진행중':i==2?'대기 중':'신규접수';
      casesToInsert.add(new Case(AccountId=acct,AssetId=assets[Math.mod(i,assets.size())].Id,ContactId=acct==daehan?kimDoip:kimDohyun,Subject=subject,Status=status,Origin='포털',Type=i==3?'소음·진동':'기타',Priority=i==3?'긴급':'보통',Description='고객 포털 시나리오 서비스 이력',Engineer_Name__c=i==3?null:'이정비',Scheduled_Visit__c=System.now().addDays(i-1),Warranty_Determination__c=i==2?'유상':'무상',Approval_Status__c=i==2?'승인 대기':'미요청',Quoted_Amount__c=i==2?1850000:null));
    } i++;
  }
}
insert casesToInsert;

Map<Id,Id> pbeByProduct=new Map<Id,Id>(); for (PricebookEntry p:[SELECT Id,Product2Id FROM PricebookEntry WHERE Pricebook2Id=:pb AND Product2Id IN :new Set<Id>{cp6000,cp7100Pro,cp7100Plus,cd7000} AND IsActive=true]) pbeByProduct.put(p.Product2Id,p.Id);
List<Object> quoteSpecs=new List<Object>();
List<Map<String,Object>> specs=new List<Map<String,Object>>{
 new Map<String,Object>{'a'=>daehan,'n'=>'대한케미컬 CP6000 1호기 도입 견적','p'=>cp6000,'v'=>780000000}, new Map<String,Object>{'a'=>daehan,'n'=>'대한케미컬 CP6000 2호기 도입 견적','p'=>cp6000,'v'=>820000000},
 new Map<String,Object>{'a'=>hanbit,'n'=>'한빛석유화학 CP7100 Pro 도입 견적','p'=>cp7100Pro,'v'=>1480000000}, new Map<String,Object>{'a'=>hanbit,'n'=>'한빛석유화학 CD7000 도입 견적','p'=>cd7000,'v'=>420000000},
 new Map<String,Object>{'a'=>hanbit,'n'=>'한빛석유화학 CP7100+ 신규 도입 견적','p'=>cp7100Plus,'v'=>2323650000.0}
};
Opportunity hbNewOpp;
for(Map<String,Object> s:specs){ String n=(String)s.get('n'); List<Quote> q=[SELECT Id,OpportunityId FROM Quote WHERE Name=:n LIMIT 1]; if(q.isEmpty()){ Opportunity o=new Opportunity(Name=n,AccountId=(Id)s.get('a'),StageName='Closed Won',CloseDate=Date.today().addDays(-30),RecordTypeId=newInstallRt,Type='New Business',Pricebook2Id=pb); insert o; Quote nq=new Quote(Name=n,OpportunityId=o.Id,Pricebook2Id=pb,Status='Accepted',ExpirationDate=Date.today().addDays(30)); insert nq; insert new QuoteLineItem(QuoteId=nq.Id,PricebookEntryId=pbeByProduct.get((Id)s.get('p')),Quantity=1,UnitPrice=(Decimal)s.get('v'),Description='설비 공급·설치·시운전 포함'); if((Id)s.get('a')==hanbit && (Id)s.get('p')==cp7100Plus) hbNewOpp=o; } else if((Id)s.get('a')==hanbit && (Id)s.get('p')==cp7100Plus) hbNewOpp=[SELECT Id FROM Opportunity WHERE Id=:q[0].OpportunityId]; }
