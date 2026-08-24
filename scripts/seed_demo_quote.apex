Quote q = new Quote(
    Name = '제2공장 증설 CP7100+ 견적서',
    OpportunityId = '006gK00000N47gnQAB',
    Pricebook2Id = '01sgK000008FM8UQAW',
    Status = 'Presented',
    ExpirationDate = Date.today().addDays(30)
);
insert q;

insert new List<QuoteLineItem>{
    new QuoteLineItem(
        QuoteId = q.Id,
        Product2Id = '01tgK00000DxVrfQAF',
        PricebookEntryId = '01ugK0000052KzDQAU',
        Quantity = 1,
        UnitPrice = 2213000000.00,
        Description = '고유량 터보압축기, 통합 제어 포함'
    ),
    new QuoteLineItem(
        QuoteId = q.Id,
        Product2Id = '01tgK00000DxVsYQAV',
        PricebookEntryId = '01ugK0000052L06QAE',
        Quantity = 1,
        UnitPrice = 110650000.00,
        Description = '설치 확인 및 인수 성능 시험 포함 유지보수'
    )
};

System.debug('Seeded Quote Id: ' + q.Id);
