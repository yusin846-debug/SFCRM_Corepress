// 원래 요청의 이연 항목 ① — "쓰레기만 삭제".
// QC 중 생긴 명백한 쓰레기 Opp/Quote/RFP 만 제거한다. 진짜처럼 보이는 과거
// 영업 데이터(Closed Won/Lost 등)는 보존. 삼양중공업(테스트 계정) 저널 debris
// 포함. 데모 계정 대한케미컬의 정상 이력은 건드리지 않는다.

// 확인된 쓰레기만: 삼양 QC 키보드 입력 'ㅈㄹ' + 대한케미컬 'CP7100  RFQ Test'.
List<Opportunity> junkOpps = [
  SELECT Id, Name
  FROM Opportunity
  WHERE Name = 'ㅈㄹ' OR Name LIKE 'CP7100%RFQ Test'
];
Set<Id> oppIds = new Map<Id, Opportunity>(junkOpps).keySet();
System.debug('junk opps: ' + junkOpps);

// 연결 RFP 저널 + 이벤트
List<CorePress_RFP__c> junkRfps = [
  SELECT Id, Name, Title__c
  FROM CorePress_RFP__c
  WHERE
    Opportunity__c IN :oppIds
    OR Name IN ('RFP-0016', 'RFP-0034')
];
Set<Id> rfpIds = new Map<Id, CorePress_RFP__c>(junkRfps).keySet();
System.debug('junk rfps: ' + junkRfps);

List<CorePress_RFP_Event__c> events = [
  SELECT Id FROM CorePress_RFP_Event__c WHERE RFP__c IN :rfpIds
];
List<Quote> quotes = [
  SELECT Id, Name FROM Quote WHERE OpportunityId IN :oppIds
];
System.debug('quotes: ' + quotes);

if (!events.isEmpty()) {
  delete events;
}
if (!junkRfps.isEmpty()) {
  delete junkRfps;
}
if (!quotes.isEmpty()) {
  delete quotes;
}
if (!junkOpps.isEmpty()) {
  delete junkOpps;
}
System.debug(
  'deleted: ' +
    junkOpps.size() +
    ' opps, ' +
    quotes.size() +
    ' quotes, ' +
    junkRfps.size() +
    ' rfps, ' +
    events.size() +
    ' events'
);
