// Phase 2 / B-1 — 대한케미컬 제1공장 CP6000 2호기 데모 데이터 보강.
// 2호기는 보증 만료(유상)로 이미 "교체 필요"지만, 영업팀 알림 + 서비스 이력을 붙여
// 설비 상세페이지 서사를 명확히 한다. (Expected_Replacement_Date__c 는 수식이라 손대지 않음.)

Id accountId = '001gK00001O8wTxQAJ'; // 대한케미컬
Id assetId = '02igK000002g7n7QAA'; // 제1공장 CP6000 2호기

Asset two = [SELECT Id, Sales_Alert_Status__c FROM Asset WHERE Id = :assetId];
two.Sales_Alert_Status__c = 'Alerted';
try {
  two.put('Sales_Alert_Sent_At__c', System.now().addDays(-9));
} catch (Exception e) {
  System.debug('Sales_Alert_Sent_At__c not writable: ' + e.getMessage());
}
update two;

List<Case> existing = [
  SELECT Id FROM Case
  WHERE AssetId = :assetId AND Subject LIKE 'CP6000 2호기%'
];
if (!existing.isEmpty()) {
  delete existing;
}

Case c1 = new Case(
  AccountId = accountId,
  AssetId = assetId,
  Subject = 'CP6000 2호기 냉각계통 정기 점검',
  Description = '정기 점검 요청 — 냉각수 라인 및 열교환기 상태 확인.',
  Status = '완료',
  Priority = '보통',
  Origin = '포털',
  Engineer_Name__c = '이정비',
  Work_Performed__c = '냉각수 라인 세정, 열교환기 차압 점검 완료. 이상 없음.'
);
Case c2 = new Case(
  AccountId = accountId,
  AssetId = assetId,
  Subject = 'CP6000 2호기 야간 운전 중 이상 진동 신고',
  Description = '야간 무인 운전 중 진동 경보. 현장 점검 요청.',
  Status = '완료',
  Priority = '긴급',
  Origin = '전화',
  Engineer_Name__c = '박현장',
  Work_Performed__c = '메인 베어링 유격 점검. 임시 조치 후 교체 부품 견적 안내. 보증 만료 건으로 유상 처리.'
);
insert new List<Case>{ c1, c2 };

System.debug('done: alerted 2호기 + 2 cases');
for (CpAssetHealthController.AssetHealth h : CpAssetHealthController.getHealthForAccount(accountId)) {
  Asset a = [SELECT Name FROM Asset WHERE Id = :h.assetId];
  System.debug(h.bandLabel + ' | ' + a.Name + ' | ' + String.join(h.reasons, ' / '));
}
