@IsTest
private class CpAssetHealthControllerTest {
  // Product2.Overhaul_Interval_Hours__c for the test compressor.
  private static final Integer INTERVAL = 12000;
  private static Account acc;
  private static Product2 compressor;

  @IsTest
  static void bandsCoverEveryRule() {
    setup();

    // Smart_Care_Stage__c formula: >=40000 S4, >=24000 S3, >=8000 S2, >=4000 S1, else "".
    Asset healthy = asset('건강 설비', 3000); // S1 미만, 잔여 9000
    Asset watchS2 = asset('관찰 설비', 9000); // S2
    Asset inspectS3 = asset('점검 설비', 26000); // S3
    Asset obsolete = asset('폐기 설비', 1000);
    obsolete.Status = 'Obsolete';
    Asset overRuntime = asset('운전초과 설비', 40000); // >= 12000 * 3
    Asset alerted = asset('알림 설비', 2000);
    alerted.Sales_Alert_Status__c = 'Alerted';

    insert new List<Asset>{
      healthy,
      watchS2,
      inspectS3,
      obsolete,
      overRuntime,
      alerted
    };

    // 활성 보증: 건강 설비만 유상 판정에서 확실히 제외
    insert new AssetWarranty(
      AssetId = healthy.Id,
      StartDate = Date.today().addYears(-1),
      EndDate = Date.today().addYears(2)
    );
    // 만료 보증 → 교체 필요 (유상)
    Asset warrantyLapsed = asset('보증만료 설비', 2000);
    insert warrantyLapsed;
    insert new AssetWarranty(
      AssetId = warrantyLapsed.Id,
      StartDate = Date.today().addYears(-5),
      EndDate = Date.today().addYears(-1)
    );

    Test.startTest();
    Map<Id, CpAssetHealthController.AssetHealth> byAsset = new Map<Id, CpAssetHealthController.AssetHealth>();
    for (
      CpAssetHealthController.AssetHealth h : CpAssetHealthController.getHealthForAccount(
        acc.Id
      )
    ) {
      byAsset.put(h.assetId, h);
    }
    Test.stopTest();

    System.assertEquals(
      'HEALTHY',
      byAsset.get(healthy.Id).band,
      '3000h + 활성보증'
    );
    System.assertEquals('WATCH', byAsset.get(watchS2.Id).band, 'S2');
    System.assertEquals('INSPECT', byAsset.get(inspectS3.Id).band, 'S3');
    System.assertEquals('REPLACE', byAsset.get(obsolete.Id).band, 'Obsolete');
    System.assertEquals(
      'REPLACE',
      byAsset.get(overRuntime.Id).band,
      '누적운전 >= 주기x3'
    );
    System.assertEquals('REPLACE', byAsset.get(alerted.Id).band, 'Alerted');
    System.assertEquals(
      'REPLACE',
      byAsset.get(warrantyLapsed.Id).band,
      '보증 만료'
    );

    System.assertEquals('교체 필요', byAsset.get(obsolete.Id).bandLabel);
    System.assertEquals('attention', byAsset.get(inspectS3.Id).bandClass);
    System.assert(
      !byAsset.get(overRuntime.Id).reasons.isEmpty(),
      'REPLACE 밴드는 최소 한 개의 근거를 가진다'
    );
  }

  @IsTest
  static void expectedReplacementDatePastTriggersReplace() {
    setup();
    // Expected_Replacement_Date__c = InstallDate + Expected_Life_Years__c * 12개월
    compressor.Expected_Life_Years__c = 5;
    update compressor;
    Asset aged = asset('수명초과 설비', 3000);
    aged.InstallDate = Date.today().addYears(-10);
    insert aged;

    Test.startTest();
    CpAssetHealthController.AssetHealth h = CpAssetHealthController.getHealthForAsset(
      aged.Id
    );
    Test.stopTest();

    System.assertEquals('REPLACE', h.band, '예상 교체 시점 경과');
  }

  @IsTest
  static void nullGuards() {
    setup();
    Asset one = asset('단건 설비', 3000);
    insert one;

    System.assertEquals(
      'HEALTHY',
      CpAssetHealthController.getHealthForAsset(one.Id).band
    );
    System.assertEquals(
      null,
      CpAssetHealthController.getHealthForAsset(null),
      'Null assetId returns null'
    );
    System.assertEquals(
      0,
      CpAssetHealthController.getHealthForAccount(null).size(),
      'Null accountId returns empty list'
    );
  }

  static void setup() {
    acc = new Account(
      Name = '건강도 테스트 계정',
      ShippingStreet = '테스트로 1'
    );
    insert acc;
    compressor = new Product2(
      Name = '테스트 압축기',
      IsActive = true,
      Overhaul_Interval_Hours__c = INTERVAL
    );
    insert compressor;
  }

  static Asset asset(String name, Integer runtime) {
    return new Asset(
      Name = name,
      AccountId = acc.Id,
      Product2Id = compressor.Id,
      Status = 'Installed',
      Total_Runtime_Hours__c = runtime,
      Runtime_As_Of__c = Date.today()
    );
  }
}
