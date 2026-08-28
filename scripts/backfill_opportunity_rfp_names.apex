// Phase 5 / E-5 — 기존 RFP 저널 Opportunity 이름·번호 백필.
// selectShortlist 이전에 만들어진 저널 Opp는 이름이 "장비 신규 도입" 또는
// QC 중 생긴 쓰레기 입력("ㅈㄹ")이라, RFP 제목으로 통일하고 RFP 번호를 각인한다.
// 저널(CorePress_RFP__c.Opportunity__c) 연결된 소수 레코드만 건드린다.

List<CorePress_RFP__c> journeys = [
  SELECT Id, Name, Title__c, Opportunity__c, Opportunity__r.Name
  FROM CorePress_RFP__c
  WHERE Opportunity__c != NULL
];

List<Opportunity> oppUpdates = new List<Opportunity>();
Set<Id> touchedOppIds = new Set<Id>();
for (CorePress_RFP__c j : journeys) {
  if (String.isBlank(j.Title__c)) {
    continue;
  }
  oppUpdates.add(
    new Opportunity(
      Id = j.Opportunity__c,
      Name = j.Title__c.trim(),
      RFP_Number__c = j.Name
    )
  );
  touchedOppIds.add(j.Opportunity__c);
  System.debug(
    'Opp ' + j.Opportunity__r.Name + ' -> ' + j.Title__c + ' [' + j.Name + ']'
  );
}
if (!oppUpdates.isEmpty()) {
  update oppUpdates;
}

// 연결 Quote 이름도 규칙(Opp.Name + ' 견적서')에 맞춘다.
List<Quote> quoteUpdates = new List<Quote>();
for (Quote q : [
  SELECT Id, Name, Opportunity.Name
  FROM Quote
  WHERE OpportunityId IN :touchedOppIds
]) {
  String expected = q.Opportunity.Name + ' 견적서';
  if (q.Name != expected) {
    quoteUpdates.add(new Quote(Id = q.Id, Name = expected));
    System.debug('Quote ' + q.Name + ' -> ' + expected);
  }
}
if (!quoteUpdates.isEmpty()) {
  update quoteUpdates;
}
System.debug(
  'done: ' + oppUpdates.size() + ' opps, ' + quoteUpdates.size() + ' quotes'
);
