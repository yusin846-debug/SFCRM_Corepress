# CorePress PRT Salesforce 필드 매핑

작성 기준: 2026-08-19

## 원칙

- 이 문서는 고객 포털 PRT 화면과 현재 Salesforce 조직의 기존 필드를 연결하기 위한 기준이다.
- 오브젝트, 필드, API 이름, Picklist 값은 PRT 개발자가 임의로 생성하거나 변경하지 않는다.
- 조직에 없는 필드는 화면에서 저장하지 않고, 공통 데이터 구조 담당자의 확정과 배포를 기다린다.
- 조회 범위는 반드시 로그인 사용자의 Contact와 Account를 기준으로 제한한다.

## 고객 컨텍스트

| 화면 값         | Salesforce 경로             | 상태      | 비고                                       |
| --------------- | --------------------------- | --------- | ------------------------------------------ |
| 로그인 사용자명 | `User.Name`                 | 사용 가능 | 현재 RFP 화면에서 조회 중                  |
| 로그인 이메일   | `User.Email`                | 사용 가능 | 현재 RFP 화면에서 조회 중                  |
| 고객 Contact    | `User.ContactId`            | 사용 가능 | Experience Cloud 고객 사용자에서만 값 존재 |
| 고객사          | `User.Contact.AccountId`    | 사용 가능 | 포털 전체 조회 범위의 기준                 |
| 고객사명        | `User.Contact.Account.Name` | 사용 가능 | 화면 헤더 표시                             |

현재 CLI 로그인 사용자 `김 유신`은 내부 사용자이므로 `User.ContactId`가 비어 있다. 고객사별 조회와 Sharing 검증은 Contact에 연결된 Experience Cloud 테스트 사용자로 수행해야 한다.

## 화면별 매핑

### 포털 홈

| 화면 항목         | Salesforce 경로                                                                   | 상태      |
| ----------------- | --------------------------------------------------------------------------------- | --------- |
| 등록 설비 수      | `Asset` count by `AccountId`                                                      | 연결 가능 |
| 운전 중 설비      | `Asset.Status`                                                                    | 연결 가능 |
| 설비 건강도       | 산정 기준 필드 미확정                                                             | 보류      |
| 예방정비 주기     | `Asset.Next_Overhaul_Hours__c`, `Runtime_As_Of__c`                                | 연결 가능 |
| 서비스 요청 현황  | `Case.Status` count by `AccountId`                                                | 연결 가능 |
| 최근 서비스 요청  | `CaseNumber`, `Asset.Name`, `Type`, `Status`, `CreatedDate`, `Scheduled_Visit__c` | 연결 가능 |
| 공지 및 보증 안내 | `AssetWarranty.EndDate` 기반                                                      | 연결 가능 |

### 보유 설비 목록

| 화면 항목     | Salesforce 경로                | 상태                         |
| ------------- | ------------------------------ | ---------------------------- |
| 설비명        | `Asset.Name`                   | 연결 가능                    |
| 모델          | `Asset.Product2.Name`          | 연결 가능                    |
| 시리얼        | `Asset.SerialNumber`           | 연결 가능                    |
| 설치 위치     | `Asset.Address`                | 연결 가능                    |
| 설치일        | `Asset.InstallDate`            | 연결 가능                    |
| 상태          | `Asset.Status`                 | 연결 가능                    |
| Smart Care    | `Asset.Smart_Care_Stage__c`    | 연결 가능, 읽기 전용 Formula |
| 누적 가동시간 | `Asset.Total_Runtime_Hours__c` | 연결 가능                    |

포털 표시값은 조직 Picklist를 그대로 노출하지 않고 `Installed`는 `운전 중`, `Obsolete`는 `폐기`로 표시한다. 저장값 자체는 변경하지 않는다.

### 설비 상세

| 화면 항목               | Salesforce 경로                                                 | 상태              |
| ----------------------- | --------------------------------------------------------------- | ----------------- |
| 기본 설비 정보          | `Asset` 표준 필드                                               | 연결 가능         |
| 보증 시작·종료          | `AssetWarranty.StartDate`, `EndDate`                            | 연결 가능         |
| 부품·공임·출장비 커버율 | `AssetWarranty.PartsCovered`, `LaborCovered`, `ExpensesCovered` | 연결 가능         |
| 서비스 이력             | `Case` by `AssetId`                                             | 연결 가능         |
| 작업 이력               | `WorkOrder` by `AssetId`                                        | 연결 가능         |
| 정격 풍량               | `Asset.Rated_Capacity__c`                                       | 조직에 없음, 보류 |
| 정격 토출압             | `Asset.Rated_Discharge_Pressure__c`                             | 조직에 없음, 보류 |
| 정격 출력               | `Asset.Rated_Power__c`                                          | 조직에 없음, 보류 |
| 냉각 방식               | `Asset.Cooling_Type__c`                                         | 조직에 없음, 보류 |
| 패키지 유형             | `Asset.Package_Type__c`                                         | 조직에 없음, 보류 |

### 서비스 요청 등록

| 화면 입력             | Salesforce 필드                                   | 상태                              |
| --------------------- | ------------------------------------------------- | --------------------------------- |
| 고객사                | `Case.AccountId`                                  | 로그인 Account로 자동 설정        |
| 요청자                | `Case.ContactId`                                  | 로그인 Contact로 자동 설정        |
| 대상 설비             | `Case.AssetId`                                    | 연결 가능                         |
| 제목                  | `Case.Subject`                                    | 연결 가능                         |
| 증상 유형             | `Case.Type`                                       | 연결 가능, Picklist 값 확인 필요  |
| 상세 내용             | `Case.Description`                                | 연결 가능                         |
| 공정 영향·희망 시급도 | `Case.Requested_Urgency__c`                       | 연결 가능, 자동 추천 후 고객 조정 |
| 최종 우선순위         | `Case.Priority`                                   | 내부 코디네이터가 확정            |
| 접수 경로             | `Case.Origin`                                     | 조직의 `포털` 값 사용             |
| 첨부파일              | `ContentVersion.FirstPublishLocationId = Case.Id` | 연결 가능                         |

서비스 요청 등록에 필요한 핵심 커스텀 필드는 현재 조직에 존재한다. 기존 Case 생성 규칙, 필수값, Picklist 값과 자동화 Flow 확인 후 연결한다.

### 서비스 요청 상세

| 화면 항목      | Salesforce 경로                                       | 상태      |
| -------------- | ----------------------------------------------------- | --------- |
| 접수번호·상태  | `Case.CaseNumber`, `Status`                           | 연결 가능 |
| 보증 판정      | `Warranty_Determination__c`, `Determination_Basis__c` | 연결 가능 |
| 유상 사유·금액 | `Billable_Reason__c`, `Quoted_Amount__c`              | 연결 가능 |
| 승인 상태      | `Approval_Status__c`, `Approved_At__c`                | 연결 가능 |
| 방문 일정      | `Scheduled_Visit__c`                                  | 연결 가능 |
| 엔지니어       | `Engineer_Name__c`, `Engineer_Phone__c`               | 연결 가능 |
| 조치 결과      | `Work_Performed__c`, `Parts_Used__c`                  | 연결 가능 |
| 원본 일정      | `ServiceAppointment`                                  | 연결 가능 |

### RFP 발행 및 현황

| 화면 입력·표시      | Salesforce 필드                          | 상태                             |
| ------------------- | ---------------------------------------- | -------------------------------- |
| 요청 제목           | `Opportunity.Name`                       | 연결 가능                        |
| 고객사              | `Opportunity.AccountId`                  | 로그인 Account로 자동 설정       |
| 도입 형태           | `Opportunity.Type`                       | 연결 가능, Picklist 값 확인 필요 |
| 제안 단계           | `Opportunity.StageName`                  | 연결 가능, Picklist 값 확인 필요 |
| 예상 계약 완료일    | `Opportunity.CloseDate`                  | 연결 가능                        |
| 도입 목적·요구 내용 | `Opportunity.Description`                | 연결 가능                        |
| 예상 금액           | `Opportunity.Amount`                     | 연결 가능                        |
| 제안 품목           | `OpportunityLineItem`                    | 연결 가능                        |
| 원본 문서           | `ContentVersion` + `ContentDocumentLink` | 연결 가능                        |
| 교체 대상 설비      | `Replacement_Target_Asset__c`            | 조직에 없음, 보류                |

화면의 한글 단계는 조직의 기존 값을 기준으로 매핑한다. 신규 검토는 `Qualification`, 요구사항 확인은 `Discovery`, 제안 및 견적은 `Proposal/Quote`, 조건 협의는 `Negotiation`, 계약 완료는 `Closed Won`, 종료는 `Closed Lost`를 사용한다.

### RFQ 제출

| 화면 입력      | Salesforce 필드                              | 상태                            |
| -------------- | -------------------------------------------- | ------------------------------- |
| 확정 품목·수량 | `OpportunityLineItem.Product2Id`, `Quantity` | 연결 가능                       |
| 단가·합계      | `UnitPrice`, `TotalPrice`                    | 연결 가능                       |
| 희망 납기      | `Opportunity.Requested_Delivery_Date__c`     | 조직에 없음, 보류               |
| 설치 가능 기간 | `Opportunity.Installation_Window__c`         | 조직에 없음, 보류               |
| 성능 보증 기준 | `Opportunity.Performance_Guarantee__c`       | 조직에 없음, 보류               |
| 보증 조건      | `WarrantyTerm` 관련 표준 필드                | 저장 주체와 생성 시점 확정 필요 |
| 결제 조건      | `Quote.Description` 또는 계약 문서           | 팀 합의 필요                    |
| RFQ 원본       | `ContentVersion` + `ContentDocumentLink`     | 연결 가능                       |

RFQ의 세 핵심 조건 필드는 정의서에는 있지만 현재 조직에는 없다. PRT에서 대체 필드를 만들거나 다른 필드에 임의로 합쳐 저장하지 않는다.

### 견적 조회

| 화면 항목   | Salesforce 경로                         | 상태                       |
| ----------- | --------------------------------------- | -------------------------- |
| 견적번호    | `Quote.QuoteNumber`                     | 연결 가능                  |
| 견적명      | `Quote.Name`                            | 연결 가능                  |
| 등록일      | `Quote.CreatedDate`                     | 연결 가능                  |
| 상태        | `Quote.Status`                          | 연결 가능                  |
| 유효기한    | `Quote.ExpirationDate`                  | 연결 가능                  |
| 공급가액    | `Quote.Subtotal`                        | 연결 가능, 읽기 전용       |
| 세금        | `Quote.Tax`                             | 연결 가능                  |
| 총액        | `Quote.GrandTotal`                      | 연결 가능, 읽기 전용       |
| 품목        | `QuoteLineItem`                         | 연결 가능                  |
| 고객사 범위 | `Quote.Opportunity.AccountId`           | 로그인 Account와 일치 조건 |
| PDF         | Quote PDF 또는 연결된 `ContentDocument` | 실제 생성 방식 확인 필요   |

견적 화면의 `확인 필요`는 고객에게 제시된 `Presented`, `수락 완료`는 `Accepted`를 표시용 문구로 변환한다. `Draft`, `Needs Review`, `In Review`, `Approved`는 내부 처리 단계이므로 고객 포털 노출 정책을 별도로 확정한다.

## 현재 조직 Picklist 기준

| 필드                        | 활성 값                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| `Case.Type`                 | 소음·진동, 토출압 저하, 온도 상승, 드레인 이상, 누설, 기타                      |
| `Case.Requested_Urgency__c` | 긴급, 보통, 낮음                                                                |
| `Case.Origin`               | Email, 포털, Agent 대화, 전화                                                   |
| `Case.Status`               | 신규접수, 판정완료, 배정완료, 진행중, 대기 중, 완료                             |
| `Opportunity.Type`          | New Business, Add-On Business, Services, Existing Business                      |
| `Opportunity.StageName`     | Qualification, Discovery, Proposal/Quote, Negotiation, Closed Won, Closed Lost  |
| `Quote.Status`              | Draft, Needs Review, In Review, Approved, Rejected, Presented, Accepted, Denied |
| `Asset.Status`              | Purchased, Shipped, Installed, Registered, Obsolete                             |

## 현재 조직에 없는 주요 필드

다음 필드는 Object(Field) 정의서에는 있으나 2026-08-19 조직 describe에서 확인되지 않았다.

- `Asset.Replaced_Asset__c`
- `Asset.Last_Overhaul_Date__c`
- `Asset.Replacement_Candidate__c`
- `Asset.Maintenance_Count__c`
- `Asset.Maintenance_Cost__c`
- `Asset.Last_Failure_Cause__c`
- `Asset.Rated_Capacity__c`
- `Asset.Rated_Discharge_Pressure__c`
- `Asset.Rated_Power__c`
- `Asset.Cooling_Type__c`
- `Asset.Package_Type__c`
- `Opportunity.Replacement_Target_Asset__c`
- `Opportunity.Requested_Delivery_Date__c`
- `Opportunity.Installation_Window__c`
- `Opportunity.Performance_Guarantee__c`

슬래시로 여러 API 이름을 한 셀에 적은 정의서 항목과 `RecordTypeId`, `ContractId`, `Discount` 등은 단순 문자열 비교만으로 존재 여부를 판단하지 않는다. 실제 describe 및 기능 활성화 상태를 별도로 확인한다.

## 구현 순서

1. Contact에 연결된 Experience Cloud 테스트 사용자 준비
2. 고객 Account 범위의 Asset 조회
3. 보유 설비 목록과 상세 실데이터 연결
4. Case 생성 전 Picklist 및 자동화 규칙 확인
5. 서비스 요청 등록과 Files 업로드 연결
6. Case, WorkOrder, ServiceAppointment 기반 상세 조회
7. Opportunity 기반 RFP 조회·생성 연결
8. 누락된 RFQ 필드가 공통 배포된 후 RFQ 저장 연결
9. Quote와 QuoteLineItem 기반 견적 조회 연결
10. Sharing Set, FLS, CRUD 권한 검증
