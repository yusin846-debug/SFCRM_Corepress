/**
 * Provides Product2 facts and customer-scoped Asset context to Agentforce.
 */
// PMD totals simple guard branches across this invocable; each method remains below complexity 9.
@SuppressWarnings('PMD.CyclomaticComplexity')
public with sharing class CorePressEquipmentContextAction {
  private static final Integer PRODUCT_QUERY_LIMIT = 500;
  private static final Integer ASSET_QUERY_LIMIT = 500;

  /**
   * Looks up a model and the requesting contact's account-owned Assets.
   * @param requests Agentforce inputs.
   * @return One customer-scoped response per input.
   */
  @InvocableMethod(
    label='Get CorePress Equipment Context'
    description='Gets authoritative Product and customer-owned Asset facts before searching equipment documents.'
    category='CorePress Support'
  )
  public static List<Response> execute(List<Request> requests) {
    if (requests == null || requests.isEmpty()) {
      return new List<Response>();
    }

    Set<Id> contactIds = collectContactIds(requests);
    Map<Id, Contact> contactsById = contactIds.isEmpty()
      ? new Map<Id, Contact>()
      : new Map<Id, Contact>(
          [
            SELECT Id, AccountId
            FROM Contact
            WHERE Id IN :contactIds
            WITH USER_MODE
          ]
        );

    Set<Id> accountIds = collectAccountIds(contactsById.values());
    LookupContext lookupContext = new LookupContext();
    lookupContext.contactsById = contactsById;
    lookupContext.products = [
      SELECT
        Id,
        Name,
        ProductCode,
        Family,
        Description,
        Expected_Life_Years__c,
        Overhaul_Interval_Hours__c
      FROM Product2
      WHERE IsActive = TRUE
      WITH USER_MODE
      ORDER BY Name
      LIMIT :PRODUCT_QUERY_LIMIT
    ];

    List<Asset> customerAssets = accountIds.isEmpty()
      ? new List<Asset>()
      : [
          SELECT
            Id,
            Name,
            SerialNumber,
            Status,
            AccountId,
            Product2Id,
            Product2.Name,
            Product2.ProductCode
          FROM Asset
          WHERE AccountId IN :accountIds
          WITH USER_MODE
          ORDER BY Name
          LIMIT :ASSET_QUERY_LIMIT
        ];

    lookupContext.assetsByAccountId = groupAssetsByAccount(customerAssets);
    List<Response> responses = new List<Response>();
    for (Request requestItem : requests) {
      responses.add(buildResponse(requestItem, lookupContext));
    }
    return responses;
  }

  private static Set<Id> collectContactIds(List<Request> requests) {
    Set<Id> contactIds = new Set<Id>();
    for (Request requestItem : requests) {
      Id contactId = requestItem == null
        ? null
        : parseId(requestItem.contactId);
      if (contactId != null) {
        contactIds.add(contactId);
      }
    }
    return contactIds;
  }

  private static Set<Id> collectAccountIds(List<Contact> contacts) {
    Set<Id> accountIds = new Set<Id>();
    for (Contact contactRecord : contacts) {
      if (contactRecord.AccountId != null) {
        accountIds.add(contactRecord.AccountId);
      }
    }
    return accountIds;
  }

  private static Map<Id, List<Asset>> groupAssetsByAccount(List<Asset> assets) {
    Map<Id, List<Asset>> grouped = new Map<Id, List<Asset>>();
    for (Asset assetRecord : assets) {
      if (!grouped.containsKey(assetRecord.AccountId)) {
        grouped.put(assetRecord.AccountId, new List<Asset>());
      }
      grouped.get(assetRecord.AccountId).add(assetRecord);
    }
    return grouped;
  }

  private static Response buildResponse(
    Request requestItem,
    LookupContext lookupContext
  ) {
    Response response = new Response();
    if (requestItem == null) {
      return response.fail('요청 정보가 없습니다.', 'INVALID_INPUT');
    }

    try {
      Product2 matchedProduct = findProduct(
        lookupContext.products,
        requestItem.modelName
      );
      response.productId = matchedProduct == null
        ? ''
        : String.valueOf(matchedProduct.Id);
      response.productSummary = matchedProduct == null
        ? '일치하는 장비 모델을 Product에서 찾지 못했습니다.'
        : formatProduct(matchedProduct);
      response.serviceSummary = matchedProduct == null
        ? '일치하는 장비 모델이 없어 관련 서비스를 조회하지 않았습니다.'
        : formatServices(lookupContext.products, matchedProduct);

      Contact contactRecord = lookupContext.contactsById.get(
        parseId(requestItem.contactId)
      );
      if (contactRecord == null || contactRecord.AccountId == null) {
        response.assetSummary = '고객 Contact 또는 Account를 확인할 수 없어 보유 장비를 조회하지 않았습니다.';
      } else {
        response.assetSummary = formatAssets(
          lookupContext.assetsByAccountId.get(contactRecord.AccountId),
          requestItem.modelName
        );
      }
      response.isSuccess = true;
      response.errorMessage = '';
      response.errorType = '';
      return response;
    } catch (Exception exceptionRecord) {
      return response.fail(
        '장비 정보를 조회하지 못했습니다.',
        exceptionRecord.getTypeName()
      );
    }
  }

  private static Product2 findProduct(
    List<Product2> products,
    String requestedModel
  ) {
    String normalizedRequest = normalize(requestedModel);
    if (String.isBlank(normalizedRequest)) {
      return null;
    }
    for (Product2 productRecord : products) {
      if (
        normalize(productRecord.Name) == normalizedRequest ||
        normalize(productRecord.ProductCode) == normalizedRequest
      ) {
        return productRecord;
      }
    }
    return null;
  }

  private static String formatProduct(Product2 productRecord) {
    List<String> facts = new List<String>{
      '모델=' + productRecord.Name,
      'ProductCode=' + productRecord.ProductCode,
      '제품군=' + productRecord.Family,
      '설명=' + productRecord.Description
    };
    if (productRecord.Expected_Life_Years__c != null) {
      facts.add('예상수명=' + productRecord.Expected_Life_Years__c + '년');
    }
    if (productRecord.Overhaul_Interval_Hours__c != null) {
      facts.add(
        '오버홀주기=' + productRecord.Overhaul_Interval_Hours__c + '시간'
      );
    }
    return String.join(facts, ' | ');
  }

  private static String formatAssets(
    List<Asset> assets,
    String requestedModel
  ) {
    if (assets == null || assets.isEmpty()) {
      return '고객 Account에서 보유 장비를 찾지 못했습니다.';
    }
    String normalizedRequest = normalize(requestedModel);
    List<String> summaries = new List<String>();
    for (Asset assetRecord : assets) {
      if (
        !String.isBlank(normalizedRequest) &&
        normalize(assetRecord.Product2?.Name) != normalizedRequest &&
        normalize(assetRecord.Product2?.ProductCode) != normalizedRequest
      ) {
        continue;
      }
      summaries.add(
        'Asset=' +
          assetRecord.Name +
          ', 모델=' +
          assetRecord.Product2?.Name +
          ', ProductCode=' +
          assetRecord.Product2?.ProductCode +
          ', 시리얼=' +
          assetRecord.SerialNumber +
          ', 상태=' +
          assetRecord.Status
      );
    }
    return summaries.isEmpty()
      ? '요청 모델과 일치하는 고객 보유 장비를 찾지 못했습니다.'
      : String.join(summaries, '\n');
  }

  private static String formatServices(
    List<Product2> products,
    Product2 equipment
  ) {
    String modelKey = normalize(equipment.Name);
    List<String> services = new List<String>();
    for (Product2 productRecord : products) {
      if (
        productRecord.Family == '서비스' &&
        normalize(productRecord.Name).startsWith(modelKey)
      ) {
        services.add(
          '서비스=' +
            productRecord.Name +
            ', ProductCode=' +
            productRecord.ProductCode +
            ', 설명=' +
            productRecord.Description
        );
      }
    }
    return services.isEmpty()
      ? '해당 장비 모델과 연결된 서비스 Product를 찾지 못했습니다.'
      : String.join(services, '\n');
  }

  private static String normalize(String value) {
    return String.isBlank(value)
      ? ''
      : value.replaceAll('[^A-Za-z0-9가-힣]', '').toUpperCase();
  }

  private static Id parseId(String value) {
    if (String.isBlank(value)) {
      return null;
    }
    try {
      return Id.valueOf(value);
    } catch (StringException exceptionRecord) {
      return null;
    }
  }

  private class LookupContext {
    private Map<Id, Contact> contactsById;
    private List<Product2> products;
    private Map<Id, List<Asset>> assetsByAccountId;
  }

  /** Agentforce input. */
  public class Request {
    @InvocableVariable(
      label='Contact Id'
      description='Current messaging end-user Contact Id'
      required=false
    )
    public String contactId;

    @InvocableVariable(
      label='Model Name'
      description='Equipment model name or Product Code from the customer request'
      required=false
    )
    public String modelName;
  }

  /** Agentforce output. */
  public class Response {
    @InvocableVariable(
      label='Success'
      description='Whether the lookup completed'
    )
    public Boolean isSuccess;
    @InvocableVariable(label='Product Id' description='Matched Product2 Id')
    public String productId;
    @InvocableVariable(
      label='Product Summary'
      description='Authoritative Product2 facts'
    )
    public String productSummary;
    @InvocableVariable(
      label='Asset Summary'
      description='Customer account-scoped Asset facts'
    )
    public String assetSummary;
    @InvocableVariable(
      label='Service Summary'
      description='Authoritative related service Product facts'
    )
    public String serviceSummary;
    @InvocableVariable(
      label='Error Message'
      description='Sanitized error details'
    )
    public String errorMessage;
    @InvocableVariable(
      label='Error Type'
      description='Exception type if the lookup failed'
    )
    public String errorType;

    private Response fail(String message, String typeName) {
      isSuccess = false;
      errorMessage = message;
      errorType = typeName;
      productSummary = '';
      assetSummary = '';
      serviceSummary = '';
      return this;
    }
  }
}
