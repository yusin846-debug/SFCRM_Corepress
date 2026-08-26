public without sharing class PortalScenarioSeeder {
  public static void run() {
    Id daehan = '001gK00001O8wTxQAJ', hanbit = '001gK00001NQZsPQAX';
    Id kimDoip = '003gK00000zpUs9QAE', kimDohyun = '003gK000010AxJFQA0';
    Id hanbitOpp = [
      SELECT Id
      FROM Opportunity
      WHERE Name = '한빛석유화학 CP7100+ 신규 도입 견적'
      LIMIT 1
    ]
    .Id;
    if (
      [
        SELECT COUNT()
        FROM CorePress_RFP__c
        WHERE Account__c = :daehan AND Interested_Equipment__c = 'CP7100+'
      ] == 0
    ) {
      insert new CorePress_RFP__c(
        Account__c = daehan,
        Contact__c = kimDoip,
        Interested_Equipment__c = 'CP7100+',
        Introduction_Type__c = '신규도입',
        Source__c = '고객 포털',
        Status__c = 'RFP접수',
        Submitted_At__c = System.now().addDays(-3),
        Title__c = 'CP7100+ 신규요청',
        Proposal_Key__c = 'CP7100_PLUS',
        Requested_Delivery_Date__c = Date.today().addDays(90),
        Specifications__c = '제2공장 증설용 Oil-free 압축기 신규 도입'
      );
    }
    List<CorePress_RFP__c> rows = [
      SELECT Id
      FROM CorePress_RFP__c
      WHERE Account__c = :hanbit AND Interested_Equipment__c = 'CP7100+'
      LIMIT 1
    ];
    CorePress_RFP__c rfp;
    if (rows.isEmpty()) {
      rfp = new CorePress_RFP__c(
        Account__c = hanbit,
        Contact__c = kimDohyun,
        Interested_Equipment__c = 'CP7100+',
        Introduction_Type__c = '신규도입',
        Source__c = '고객 포털',
        Status__c = '도입 완료',
        Submitted_At__c = System.now().addDays(-90),
        Title__c = 'CP7100+ 신규요청',
        Proposal_Key__c = 'CP7100_PLUS',
        Opportunity__c = hanbitOpp,
        Requested_Delivery_Date__c = Date.today().addDays(-40),
        Specifications__c = '대산공장 생산라인 증설용 신규 도입'
      );
      insert rfp;
    } else {
      rfp = rows[0];
      update new CorePress_RFP__c(
        Id = rfp.Id,
        Status__c = '도입 완료',
        Opportunity__c = hanbitOpp,
        Proposal_Key__c = 'CP7100_PLUS'
      );
    }
    if (
      [SELECT COUNT() FROM CorePress_RFP_Event__c WHERE RFP__c = :rfp.Id] == 0
    ) {
      List<CorePress_RFP_Event__c> events = new List<CorePress_RFP_Event__c>();
      List<String> types = new List<String>{
        'RFP접수',
        '제안서 다운로드',
        '숏리스트 선정',
        'RFQ 접수',
        '견적 제출',
        '계약 체결',
        '도입 완료'
      };
      Integer day = -90;
      for (String typeName : types) {
        events.add(
          new CorePress_RFP_Event__c(
            RFP__c = rfp.Id,
            Opportunity__c = hanbitOpp,
            Contact__c = kimDohyun,
            Event_Type__c = typeName,
            Detail__c = typeName + ' 처리 완료',
            Occurred_At__c = System.now().addDays(day),
            Visible_To_Customer__c = true
          )
        );
        day += 10;
      }
      Database.insert(events, AccessLevel.SYSTEM_MODE);
    }
  }
}
