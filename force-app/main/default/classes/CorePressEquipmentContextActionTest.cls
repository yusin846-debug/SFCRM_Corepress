@IsTest
private class CorePressEquipmentContextActionTest {
  @TestSetup
  static void setupTestData() {
    Account accountRecord = TestDataFactory.createAccount(
      '장비 조회 테스트 고객사',
      true
    );
    TestDataFactory.createContact(
      accountRecord.Id,
      'equipment@example.com',
      true
    );
    Product2 productRecord = TestDataFactory.createEquipmentProduct(
      'CP TEST 9000',
      'CPTEST9000-PKG',
      true
    );
    TestDataFactory.createAsset(
      accountRecord.Id,
      productRecord.Id,
      'SN-DEMO-9000',
      true
    );
    Product2 serviceRecord = new Product2(
      Name = 'CP TEST 9000 현장 유지보수 서비스',
      ProductCode = 'CPTEST9000-AM02',
      Family = '서비스',
      Description = '연간 계약 현장 유지보수',
      IsActive = true
    );
    insert serviceRecord;
  }

  @IsTest
  static void shouldReturnProductAndScopedAssetWhenModelMatches() {
    Contact contactRecord = [
      SELECT Id
      FROM Contact
      WHERE Email = 'equipment@example.com'
      LIMIT 1
    ];
    CorePressEquipmentContextAction.Request requestItem = new CorePressEquipmentContextAction.Request();
    requestItem.contactId = contactRecord.Id;
    requestItem.modelName = 'cp test 9000';

    Test.startTest();
    List<CorePressEquipmentContextAction.Response> responses = CorePressEquipmentContextAction.execute(
      new List<CorePressEquipmentContextAction.Request>{ requestItem }
    );
    Test.stopTest();

    Assert.areEqual(
      1,
      responses.size(),
      'One request should produce one response.'
    );
    Assert.isTrue(
      responses[0].isSuccess,
      'The lookup should complete successfully.'
    );
    Assert.isTrue(
      responses[0].productSummary.contains('CP TEST 9000'),
      'Product facts should identify the model.'
    );
    Assert.isTrue(
      responses[0].assetSummary.contains('SN-DEMO-9000'),
      'Asset facts should include the scoped serial number.'
    );
    Assert.isTrue(
      responses[0].serviceSummary.contains('CPTEST9000-AM02'),
      'Related service Product should be returned.'
    );
  }

  @IsTest
  static void shouldReturnNotFoundMessagesWhenModelDoesNotExist() {
    Contact contactRecord = [
      SELECT Id
      FROM Contact
      WHERE Email = 'equipment@example.com'
      LIMIT 1
    ];
    CorePressEquipmentContextAction.Request requestItem = new CorePressEquipmentContextAction.Request();
    requestItem.contactId = contactRecord.Id;
    requestItem.modelName = 'NOT-A-MODEL';

    Test.startTest();
    List<CorePressEquipmentContextAction.Response> responses = CorePressEquipmentContextAction.execute(
      new List<CorePressEquipmentContextAction.Request>{ requestItem }
    );
    Test.stopTest();

    Assert.isTrue(
      responses[0].isSuccess,
      'A not-found result is still a successful lookup.'
    );
    Assert.isTrue(
      responses[0].productSummary.contains('찾지 못했습니다'),
      'Missing model should be explicit.'
    );
    Assert.isTrue(
      responses[0].assetSummary.contains('찾지 못했습니다'),
      'Missing customer model should be explicit.'
    );
  }

  @IsTest
  static void shouldReturnEmptyListWhenRequestsAreEmpty() {
    Test.startTest();
    List<CorePressEquipmentContextAction.Response> responses = CorePressEquipmentContextAction.execute(
      new List<CorePressEquipmentContextAction.Request>()
    );
    Test.stopTest();

    Assert.areEqual(
      0,
      responses.size(),
      'Empty input should return an empty output.'
    );
  }

  @IsTest
  static void shouldRemainBulkifiedWhenCalledWithTwoHundredFiftyOneRequests() {
    Contact contactRecord = [
      SELECT Id
      FROM Contact
      WHERE Email = 'equipment@example.com'
      LIMIT 1
    ];
    List<CorePressEquipmentContextAction.Request> requests = new List<CorePressEquipmentContextAction.Request>();
    for (Integer indexValue = 0; indexValue < 251; indexValue++) {
      CorePressEquipmentContextAction.Request requestItem = new CorePressEquipmentContextAction.Request();
      requestItem.contactId = contactRecord.Id;
      requestItem.modelName = 'CPTEST9000-PKG';
      requests.add(requestItem);
    }

    Test.startTest();
    List<CorePressEquipmentContextAction.Response> responses = CorePressEquipmentContextAction.execute(
      requests
    );
    Test.stopTest();

    Assert.areEqual(
      251,
      responses.size(),
      'Every bulk request should receive a response.'
    );
    Assert.isTrue(
      responses[250].isSuccess,
      'The final response should also succeed.'
    );
  }
}
