/**
 * Single source of truth for a customer Asset's health status band. The same
 * result feeds 포털 홈, 보유 설비 목록, and 설비 상세 so an asset shows one
 * consistent band everywhere. Returns a status band, never a numeric score —
 * see docs/adr/0002-asset-health-status-bands.md.
 *
 * Band rule (priority order). Note Next_Overhaul_Hours__c / Smart_Care_Stage__c /
 * Expected_Replacement_Date__c are org formula fields derived from
 * Total_Runtime_Hours__c, Product2.Overhaul_Interval_Hours__c,
 * Product2.Expected_Life_Years__c and InstallDate:
 *
 *   교체 필요 (REPLACE)  — Status=Obsolete
 *                          · Total_Runtime_Hours__c ≥ Overhaul_Interval_Hours__c × 3
 *                          · 오늘 활성 AssetWarranty 없음 (보증 만료 = 유상)
 *                          · Sales_Alert_Status__c = 'Alerted'
 *                          · Expected_Replacement_Date__c ≤ 오늘
 *   점검 필요 (INSPECT)  — Smart_Care_Stage__c ∈ {S3, S4}  (누적운전 ≥ 24,000h)
 *   관찰    (WATCH)     — Smart_Care_Stage__c = 'S2'  (누적운전 ≥ 8,000h)
 *                          · 또는 현재 오버홀 사이클 잔여 ≤ 주기 × 15%
 *   양호    (HEALTHY)   — 그 외 (S1 이하, 별다른 신호 없음)
 *   데이터 확인 중 (NO_DATA) — Total_Runtime_Hours__c 없음
 */
public with sharing class CpAssetHealthController {
  private static final Decimal REPLACE_RUNTIME_MULTIPLE = 3;
  private static final Decimal WATCH_REMAINING_RATIO = 0.15;
  @TestVisible
  private static final Set<String> INSPECT_SMART_CARE_STAGES = new Set<String>{
    'S3',
    'S4'
  };

  /** @param accountId Customer Account. @return Health band per Asset, ordered by Asset name. */
  @AuraEnabled(cacheable=true)
  public static List<AssetHealth> getHealthForAccount(Id accountId) {
    List<AssetHealth> results = new List<AssetHealth>();
    if (accountId == null) {
      return results;
    }
    for (Asset record : queryAssets('AccountId = :boundId', accountId)) {
      results.add(evaluate(record));
    }
    return results;
  }

  /** @param assetId Asset. @return Health band for the single Asset, or null. */
  @AuraEnabled(cacheable=true)
  public static AssetHealth getHealthForAsset(Id assetId) {
    if (assetId == null) {
      return null;
    }
    List<Asset> assets = queryAssets('Id = :boundId', assetId);
    return assets.isEmpty() ? null : evaluate(assets[0]);
  }

  private static List<Asset> queryAssets(String whereClause, Id boundId) {
    return Database.query(
      'SELECT Id, Status, Sales_Alert_Status__c, Sales_Alert_Sent_At__c, ' +
        'Total_Runtime_Hours__c, Next_Overhaul_Hours__c, Smart_Care_Stage__c, ' +
        'Expected_Replacement_Date__c, Product2Id, ' +
        'Product2.Overhaul_Interval_Hours__c, ' +
        '(SELECT Id, StartDate, EndDate FROM WarrantyAssets) ' +
        'FROM Asset WHERE ' +
        whereClause +
        ' ORDER BY Name'
    );
  }

  private static AssetHealth evaluate(Asset record) {
    AssetHealth health = new AssetHealth();
    health.assetId = record.Id;

    Decimal runtime = record.Total_Runtime_Hours__c;
    Decimal remaining = record.Next_Overhaul_Hours__c;
    Decimal interval = record.Product2Id == null
      ? null
      : record.Product2.Overhaul_Interval_Hours__c;

    if (runtime == null) {
      return band(
        health,
        'NO_DATA',
        '데이터 확인 중',
        'muted',
        new List<String>{ '가동시간 정보가 등록되지 않았습니다.' }
      );
    }

    Boolean hasWarrantyRecord =
      record.WarrantyAssets != null && !record.WarrantyAssets.isEmpty();
    Boolean hasActiveWarranty = false;
    Date today = Date.today();
    if (hasWarrantyRecord) {
      for (AssetWarranty warranty : record.WarrantyAssets) {
        Boolean started =
          warranty.StartDate == null ||
          warranty.StartDate <= today;
        Boolean notEnded =
          warranty.EndDate == null ||
          warranty.EndDate >= today;
        if (started && notEnded) {
          hasActiveWarranty = true;
          break;
        }
      }
    }

    List<String> reasons = new List<String>();

    // 교체 필요
    if (record.Status == 'Obsolete') {
      reasons.add('설비가 폐기 처리되었습니다.');
    }
    if (
      interval != null &&
      interval > 0 &&
      runtime >= interval * REPLACE_RUNTIME_MULTIPLE
    ) {
      reasons.add(
        '누적 운전 ' +
          fmt(runtime) +
          'h — 오버홀 주기(' +
          fmt(interval) +
          'h)의 3배를 넘었습니다.'
      );
    }
    if (hasWarrantyRecord && !hasActiveWarranty) {
      reasons.add('보증 기간이 만료되어 유상 정비 대상입니다.');
    }
    if (record.Sales_Alert_Status__c == 'Alerted') {
      reasons.add(
        record.Sales_Alert_Sent_At__c == null
          ? '영업팀 교체 알림이 발송되었습니다.'
          : '영업팀 교체 알림 발송: ' +
            record.Sales_Alert_Sent_At__c.date().format()
      );
    }
    if (
      record.Expected_Replacement_Date__c != null &&
      record.Expected_Replacement_Date__c <= today
    ) {
      reasons.add('예상 교체 시점이 지났습니다.');
    }
    if (!reasons.isEmpty()) {
      return band(health, 'REPLACE', '교체 필요', 'attention', reasons);
    }

    // 점검 필요
    if (INSPECT_SMART_CARE_STAGES.contains(record.Smart_Care_Stage__c)) {
      return band(
        health,
        'INSPECT',
        '점검 필요',
        'attention',
        new List<String>{
          '스마트케어 ' +
          record.Smart_Care_Stage__c +
          ' 단계 — 누적 운전 ' +
          fmt(runtime) +
          'h.'
        }
      );
    }

    // 관찰
    if (record.Smart_Care_Stage__c == 'S2') {
      return band(
        health,
        'WATCH',
        '관찰',
        'watch',
        new List<String>{
          '스마트케어 S2 단계 — 누적 운전 ' +
          fmt(runtime) +
          'h.'
        }
      );
    }
    if (
      interval != null &&
      interval > 0 &&
      remaining != null &&
      remaining <= interval * WATCH_REMAINING_RATIO
    ) {
      return band(
        health,
        'WATCH',
        '관찰',
        'watch',
        new List<String>{
          '다음 오버홀까지 ' +
          fmt(remaining) +
          'h 남았습니다.'
        }
      );
    }

    // 양호
    return band(
      health,
      'HEALTHY',
      '양호',
      'good',
      new List<String>{ '정상 운전 중입니다.' }
    );
  }

  private static AssetHealth band(
    AssetHealth health,
    String code,
    String label,
    String css,
    List<String> reasons
  ) {
    health.band = code;
    health.bandLabel = label;
    health.bandClass = css;
    health.reasons = reasons;
    return health;
  }

  private static String fmt(Decimal value) {
    return value == null ? '-' : value.setScale(0).format();
  }

  /** Portal-safe health band for one Asset. */
  public class AssetHealth {
    @AuraEnabled
    public Id assetId;
    /** REPLACE | INSPECT | WATCH | HEALTHY | NO_DATA */
    @AuraEnabled
    public String band;
    /** 교체 필요 | 점검 필요 | 관찰 | 양호 | 데이터 확인 중 */
    @AuraEnabled
    public String bandLabel;
    /** attention | watch | good | muted — reuse portal CSS state classes */
    @AuraEnabled
    public String bandClass;
    @AuraEnabled
    public List<String> reasons;
  }
}
