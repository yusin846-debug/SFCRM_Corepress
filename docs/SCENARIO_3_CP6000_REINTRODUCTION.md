# 시나리오 3 — CP6000 재도입 (노후 설비 like-for-like 교체)

작성일: 2026-08-25
대상 org: `trail-org`
관련 문서: `docs/PRT_SCOPE_AND_SCENARIOS.md`, `CONTEXT.md`

이 문서는 대한케미컬 안산 1공장의 **CP6000 #2** 노후화를 CorePress 현장 엔지니어가 데이터로 먼저 감지하고, 같은 모델(CP6000)로 재판매까지 이어지는 과정을 각 액터의 액션 단위로 정의한다. 신규 커스텀 필드는 만들지 않는다 — 전부 org에 이미 있는 필드로 굴린다.

---

## 1. 상황 요약

- 안산 1공장: CP6000 두 대 (#1 정상 · #2 노후)
- CP6000 #2: 누적 가동 ~48,000h, 진동 rms 상승 트렌드, 오일 필터 교체 주기 단축, 보증 만료
- 감지 주체: **CorePress 현장 엔지니어** (원격 모니터링 + 정례 방문)
- 목표: 같은 모델 CP6000 신규 유닛으로 재판매 → 부품·오퍼레이터 표준화 유지

---

## 2. 등장 인물

| 페르소나   | 소속 · 역할                | 조직       | Salesforce 로그인                                        | 데모 시연 여부    |
| ---------- | -------------------------- | ---------- | -------------------------------------------------------- | ----------------- |
| **박정비** | 현장 서비스 엔지니어       | CorePress  | (org 신규 예정 — 미생성)                                 | 백엔드 액션만     |
| **김영업** | 영업사원 · Lead/Opp 소유자 | CorePress  | `saleskim@corepress.demo` (내부 유저)                    | 백엔드 액션만     |
| **김설비** | 설비관리팀 팀장            | 대한케미컬 | `kim.seolbi@daehan-corepress-poc.com` / `CorePress2026!` | **포털에서 시연** |

> 박정비는 아직 org에 유저가 없음 — 시연에서는 김영업 계정으로 '엔지니어 액션'을 대리 시연하거나, 스크립트만 낭독하고 데이터는 미리 세팅해도 됨.

---

## 3. 전제 데이터 (시나리오 시작 전 org 상태)

| Object   | 레코드                        | 필드 값                                                                                                                                                                                                                   |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account  | 대한케미컬                    | (기존)                                                                                                                                                                                                                    |
| Asset    | CP6000 #2 (안산 1공장)        | `Status = Installed`, `Total_Runtime_Hours__c ≈ 48,000`, `Runtime_As_Of__c = 최근일`, `Warranty_Determination__c = 만료`, `Next_Overhaul_Hours__c ≈ 0`, `Replacement_Candidate__c = false` (스크립트 진행 중 true로 바뀜) |
| Case     | 최근 6개월 진동·오일 관련 3건 | `Warranty_Determination__c` 기록                                                                                                                                                                                          |
| Product2 | CP6000 (PricebookEntry 세팅)  | 재도입용 견적 라인 아이템으로 사용                                                                                                                                                                                        |

---

## 4. Phase별 액션

### Phase 1 · 사전 감지 및 진단 기록 — 박정비

| #   | 액션                                                     | Salesforce 오브젝트 · 필드                                                                                                           |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1 | 원격 모니터링 알림 검토 (진동 rms 상승) · 정례 현장 방문 | —                                                                                                                                    |
| 1.2 | Case 생성 (진단 목적)                                    | Case: Type=`설비 진단`, AssetId=CP6000 #2, OwnerId=박정비, Status=`Diagnosing`                                                       |
| 1.3 | 진단 기록                                                | Case.`Work_Performed__c`, `Warranty_Determination__c=만료`, `Parts_Used__c`(필터·오일), `Determination_Basis__c`(진동 스펙트럼 요약) |
| 1.4 | 진단 리포트 첨부 (진동 스펙트럼 PDF, 오일 분석 리포트)   | ContentDocumentLink → Case                                                                                                           |
| 1.5 | **Asset 필드 업데이트 (핵심 트리거)**                    | Asset.`Replacement_Candidate__c = true`, `Expected_Replacement_Date__c = +60일`, `Smart_Care_Stage__c = 교체 검토`                   |

> 엔지니어는 여기서 멈춘다. Opp는 만들지 않는다 — 상업 조건은 영업 소관.

---

### Phase 2 · 자동 핸드오프 — Salesforce Flow

| #   | 액션                                                   | 오브젝트 · 필드                                                                                                                                                             |
| --- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Trigger: `Asset.Replacement_Candidate__c` false → true | (Record-Triggered Flow)                                                                                                                                                     |
| 2.2 | Account.Sales Owner 조회 (김영업)                      | User (SalesOwnerId 참조)                                                                                                                                                    |
| 2.3 | Task 자동 생성                                         | Task: Subject=`설비 교체 제안 검토 — {Asset.Name}`, OwnerId=김영업, WhatId=Asset, ActivityDate=+3일                                                                         |
| 2.4 | **드래프트 Opportunity 자동 생성**                     | Opportunity: Name=`{Account.Name} 설비 교체 — {Asset.Name}`, AccountId=Account, OwnerId=김영업, StageName=`발굴`, CloseDate=+90일, `Replacement_Target_Asset__c` = Asset.Id |
| 2.5 | 김영업에게 Chatter/이메일 알림                         | —                                                                                                                                                                           |

> Opportunity.`Replacement_Target_Asset__c`(교체 대상 설비) 필드로 옛 Asset과 신규 딜을 명확히 연결. Phase 6에서 이 링크가 자산 정리에 재사용됨.

---

### Phase 3 · 상업 검토 & 고객 접촉 — 김영업

| #   | 액션                                               | 오브젝트 · 필드                                                                  |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| 3.1 | Task 확인 → Opp에서 Related Asset 진단 데이터 검토 | —                                                                                |
| 3.2 | 박정비와 사전 콜 (기술 리스크·다운타임 원가 정리)  | Chatter/Log a Call                                                               |
| 3.3 | 김설비에게 전화 → 방문 미팅 요청                   | Log a Call → Contact(김설비)                                                     |
| 3.4 | Opportunity 진행                                   | Opportunity.StageName `발굴 → 자격 검증`, `Requested_Delivery_Date__c` 임시 세팅 |
| 3.5 | OpportunityContactRole에 김설비 추가               | OpportunityContactRole                                                           |

---

### Phase 4 · 조인트 현장 미팅 — 김영업 + 박정비 + 김설비

**박정비 (기술)**

- 진단 데이터 프레젠 (진동 트렌드, 오일 상태, 잔여 수명)
- 미교체 시 다운타임 원가 시뮬레이션
- **재도입 권장 근거**: (1) 정비팀이 CP6000 SOP 숙지 (재교육 0) (2) #1과 부품·오일 공용 (MRO SKU 단순) (3) 최근 3년 CP6000 라인 안정성 데이터 확보

**김영업 (상업)**

- CP6000 신규 유닛 + 설치·시운전 + 5년 서비스 계약 번들 제시
- 반복 구매 고객 할인 반영
- 옵션: 옛 #2 트레이드인 크레딧

| #   | 액션                         | 오브젝트 · 필드                                                                                                             |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Opportunity 진행             | Opportunity.StageName `자격 검증 → 제안`, `Installation_Window__c` 세팅                                                     |
| 4.2 | Quote 생성 (Opp에서)         | Quote: Name=`대한케미컬 CP6000 재도입`, OpportunityId=Opp                                                                   |
| 4.3 | QuoteLineItem 추가           | QLI: (1) CP6000 본체 (Product2=CP6000, PricebookEntry) (2) 설치·시운전 (3) 5년 서비스 계약 (4) 트레이드인 크레딧 (마이너스) |
| 4.4 | Quote를 포털 견적함으로 발송 | Quote.Status=`Presented`                                                                                                    |

---

### Phase 5 · 고객 승인 — 김설비 (포털)

| #   | 액션                                                   | 오브젝트 · 필드                            |
| --- | ------------------------------------------------------ | ------------------------------------------ |
| 5.1 | 포털 로그인 → **견적** 탭 진입                         | —                                          |
| 5.2 | 신규 Quote 클릭 → QuoteLineItem 검토                   | —                                          |
| 5.3 | **[승인] 버튼 클릭** (기존 서비스 승인 액션과 동일 UX) | Quote.Status=`Accepted`, ApprovedAt 스탬프 |
| 5.4 | 김영업에게 알림                                        | —                                          |

> 승인 UX는 이미 개발된 Case 승인(`Approval_Status__c` 승인/반려) 패턴을 Quote에 확장 재사용.

---

### Phase 6 · 클로징 & 자산 정리 — 김영업 + 박정비

| #   | 액션                             | 오브젝트 · 필드                                                                                                        |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Opportunity Closed Won           | Opportunity.StageName=`Closed Won`                                                                                     |
| 6.2 | 자동: 설치 Case 생성             | Case: Type=`설치`, OwnerId=설치팀, AccountId=Account                                                                   |
| 6.3 | (설치 완료 후) 기존 Asset Retire | Asset(CP6000 #2): Status=`Obsolete`, UsageEndDate=오늘                                                                 |
| 6.4 | 새 CP6000 Asset 생성             | Asset(CP6000 #3): Status=`Installed`, InstallDate=오늘, `Replaced_Asset__c` = CP6000 #2.Id, `Total_Runtime_Hours__c=0` |

> 새 자산이 옛 자산을 어떻게 대체했는지 `Replaced_Asset__c`로 추적 → 나중에 이 계정의 자산 라이프사이클 리포팅에 사용.

---

## 5. 역할 원칙 (왜 이렇게 나눴는가)

1. **엔지니어는 Opp를 직접 만들지 않는다** — 상업 판단(가격·할인·계약 조건)은 영업 소관. 엔지니어 역할은 데이터·리스크 판단.
2. **Flow가 초기 Opp 초안을 자동 생성한다** — 엔지니어의 감지가 파이프라인에 즉시 반영 (slippage 방지). 영업이 무엇을 검토해야 하는지 명확한 Task로 뜬다.
3. **Asset ↔ Opportunity ↔ 새 Asset 링크가 끊기지 않는다** — Opp.`Replacement_Target_Asset__c` (앞) + Asset.`Replaced_Asset__c` (뒤) 두 필드로 자산 라이프사이클 추적 완결.
4. **고객 승인은 포털에서 완결** — 이메일-첨부-왕복 없이 승인 스탬프가 Salesforce에 바로 기록.

---

## 6. 발표 스크립트 (데모 낭독용)

**김영업 화면**

> "Task 알림이 자동으로 들어와 있습니다. Opportunity를 열어보면, CorePress 현장 엔지니어 박정비 님이 안산 1공장 CP6000 #2 자산 데이터를 근거로 교체가 필요하다고 판단했고, 시스템이 즉시 대한케미컬 계정에 신규 Opportunity 초안을 자동 생성했습니다. 교체 대상 설비 필드로 옛 자산이 명확히 링크되어 있습니다."
>
> "저는 이 딜을 자격 검증 단계로 옮기고, 김설비 팀장님께 방문 요청을 드리겠습니다. 미팅에서는 박정비 엔지니어와 함께 진단 데이터를 공유하고, CP6000 신규 유닛을 재도입하는 제안을 드릴 겁니다. 업그레이드가 아닌 같은 모델을 권장하는 이유는, 대한케미컬 정비팀이 이미 CP6000 운영 노하우를 갖고 있고, #1과 부품·오일이 공용이라 재고 관리가 단순하기 때문입니다."

**김설비 화면 (포털)**

> "김설비 팀장님이 포털에 로그인하시면 견적함에 CorePress에서 보낸 CP6000 재도입 견적이 도착해 있습니다. 라인아이템에는 신규 CP6000 유닛, 설치·시운전, 5년 서비스 계약, 그리고 옛 #2 트레이드인 크레딧까지 반영돼 있습니다. 승인 버튼을 누르시면 견적 상태가 즉시 Accepted로 바뀌고, CorePress 영업에게 자동 알림이 갑니다."

**김영업 후속 처리**

> "승인 확인 후 Opportunity를 Closed Won으로 마감하고, 설치 Case가 자동으로 만들어집니다. 설치 완료 후 옛 CP6000 #2 자산은 Obsolete로 정리되고, 새 CP6000 #3 자산이 등록되면서 대체 설비 필드로 옛 자산과 링크됩니다. 자산 라이프사이클 전 과정이 하나의 궤적으로 남습니다."

---

## 7. 사용 필드 참고표 (모두 기존 — 신규 개발 없음)

**Asset**

| 필드 API                                                                                           | 라벨                  | 시나리오 사용처                         |
| -------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------- |
| `Total_Runtime_Hours__c`                                                                           | 누적 가동시간         | 판단 근거                               |
| `Runtime_As_Of__c`                                                                                 | 가동시간 기준일       | 신뢰도                                  |
| `Next_Overhaul_Hours__c`                                                                           | 다음 오버홀까지(시간) | 임박도                                  |
| `Replacement_Candidate__c`                                                                         | 교체 검토 대상        | **Phase 1.5 트리거 필드**               |
| `Expected_Replacement_Date__c`                                                                     | 예상 교체 시점        | 영업 파이프라인 close date 근거         |
| `Smart_Care_Stage__c`                                                                              | 정비 단계             | UI 상태 표시                            |
| `Replaced_Asset__c`                                                                                | 대체 설비             | Phase 6 — 새 자산이 옛 자산을 대체 링크 |
| `Last_Failure_Cause__c` · `Last_Overhaul_Date__c` · `Maintenance_Count__c` · `Maintenance_Cost__c` | —                     | Phase 4 미팅 프레젠 소스                |

**Opportunity**

| 필드 API                      | 라벨           | 시나리오 사용처                                     |
| ----------------------------- | -------------- | --------------------------------------------------- |
| `Replacement_Target_Asset__c` | 교체 대상 설비 | **Phase 2.4 — Opp가 어느 옛 자산 교체 딜인지 링크** |
| `Requested_Delivery_Date__c`  | 희망 납기      | Phase 3.4                                           |
| `Installation_Window__c`      | 설치 가능 기간 | Phase 4.1                                           |
| `Performance_Guarantee__c`    | 성능 보증 기준 | 계약 조건                                           |

**Case**

| 필드 API                                 | 라벨           | 시나리오 사용처  |
| ---------------------------------------- | -------------- | ---------------- |
| `Warranty_Determination__c`              | 무상·유상 판정 | Phase 1.3 (만료) |
| `Work_Performed__c`                      | 조치 내역      | Phase 1.3        |
| `Determination_Basis__c`                 | 판정 근거      | Phase 1.3        |
| `Parts_Used__c`                          | 사용 부품      | Phase 1.3        |
| `Engineer_Name__c` · `Engineer_Phone__c` | 담당 엔지니어  | 박정비 정보      |

---

## 8. 개발 필요 항목 (범위 밖 — 참고)

이 시나리오를 실제로 시연하려면 아래 세 가지가 필요하다 (필드는 다 있음).

1. **Record-Triggered Flow** (Asset 오브젝트): `Replacement_Candidate__c` false→true 시 Task + 드래프트 Opportunity 자동 생성. → **자동화 팀 소유** (다른 팀).
2. **박정비 유저 생성** (선택): 시연에서 엔지니어 액션을 대리 계정으로 처리할지, 실제 계정으로 시연할지 결정 필요.
3. **Quote 포털 승인 UX**: 이미 서비스 승인용으로 개발된 패턴(`Approval_Status__c` 승인/반려) 재사용. → **PRT 팀 소유** (필요 시 추가 개발).

Flow와 유저 생성은 데모 준비 단계에서 결정 필요.
