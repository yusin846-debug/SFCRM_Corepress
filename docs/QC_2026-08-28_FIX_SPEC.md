# QC 수정 스펙 — 2026-08-28 (삼양중공업 계정 QC 기반)

작성일: 2026-08-28
대상 org: `trail-org` / 사이트 `CorePress Customer Portal` (`/corepress`)
근거: 2026-08-28 세션에서 사용자가 삼양중공업 계정으로 진행한 QC + grilling 3라운드로 확정한 결정.
관련: `CONTEXT.md`, `docs/adr/0002-asset-health-status-bands.md`, `docs/SESSION_HANDOFF_2026-08-27_portal_multi_fixes.md`

> **범위 주의**: 데모 영상은 **대한케미컬** 계정으로만 진행한다. 삼양중공업은 테스트 전용이므로
> 삼양 데이터가 "교체 필요"로 다수 뜨는 것은 허용된다 (시드 재튜닝 안 함).

---

## 0. 작업 순서 (Q1)

1. **A. 설비 건강도 모델 + 권한 + 사진** — 모든 로그인에서 즉시 보임, 최우선
2. **B. 데모 데이터 보강 + 포털 조회 범위 필터**
3. **C. RFP 접수 폼**
4. **D. 제안서 라이프사이클**
5. **E. Opportunity/RFQ 네이밍 + 리스트뷰**
6. **F. RFQ 폼 + RFQ 현황**

Parked: AI 증상문의(Agentforce 임베드), 레거시 Opp/Quote 대량 삭제, Agentforce 라우팅.

---

## A. 설비 건강도 모델 (QC 항목 2·5)

### A-1. 단일 소스 컨트롤러

- 신설 `CpAssetHealthController.getHealthForAccount(Id accountId)` — 건강도 판정의 유일한 소스.
- 반환(자산별): `{ assetId, band, bandLabel, reasons[] }`
  - `band` ∈ `REPLACE` / `INSPECT` / `WATCH` / `HEALTHY` / `NO_DATA`
  - `bandLabel` = 교체 필요 / 점검 필요 / 관찰 / 양호 / 데이터 확인 중
  - `reasons[]` = 판정 근거 문자열(툴팁/타임라인용), 예: `"보증 만료 — 유상 전환"`, `"누적 운전 43,000h ≥ 오버홀주기×3"`
- `cpPortalHome`, `cpAssetList`, `cpAssetDetail` 세 LWC가 **모두** 이 컨트롤러 결과를 사용 → 자산별 밴드가 세 화면에서 동일.

### A-2. 밴드 판정 규칙 (Q21 → 데이터 모델에 맞춰 조정, 2026-08-28 구현 완료)

**조정 이유**: org 확인 결과 `Next_Overhaul_Hours__c`·`Smart_Care_Stage__c`·`Expected_Replacement_Date__c`가
전부 수식 필드. Q21 표의 "점검 필요: `Next_Overhaul ≤ 0`"는 이 수식이 순환식(항상 0~~주기 사이)이라 발동 불가,
`Smart_Care_Stage__c`에 S5 없음(S1~~S4, 누적운전 4k/8k/24k/40k 임계).

수식 정의(org 실측):

- `Next_Overhaul_Hours__c` = 현재 오버홀 사이클 잔여 = `interval - MOD(runtime, interval)`
- `Smart_Care_Stage__c` = runtime ≥40000→S4, ≥24000→S3, ≥8000→S2, ≥4000→S1, else ""
- `Expected_Replacement_Date__c` = `InstallDate + Expected_Life_Years__c × 12개월`

확정 밴드 (우선순위 순 첫 매치):

| 밴드               | 조건 (하나라도 참)                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **교체 필요**      | `Status='Obsolete'` · `Total_Runtime_Hours__c ≥ Overhaul_Interval_Hours__c × 3` · 활성 `AssetWarranty` 없음(유상) · `Sales_Alert_Status__c='Alerted'` · `Expected_Replacement_Date__c ≤ 오늘` |
| **점검 필요**      | `Smart_Care_Stage__c` ∈ {S3, S4} (누적운전 ≥ 24,000h)                                                                                                                                         |
| **관찰**           | `Smart_Care_Stage__c='S2'` (누적운전 ≥ 8,000h) · 또는 오버홀 사이클 잔여 ≤ 주기 × 15%                                                                                                         |
| **양호**           | 그 외 (S1 이하)                                                                                                                                                                               |
| **데이터 확인 중** | `Total_Runtime_Hours__c` 없음 (이 org에선 필수필드라 실질 미발생)                                                                                                                             |

- **활성 AssetWarranty** = `StartDate ≤ 오늘 ≤ EndDate` 레코드 존재. Asset 자식 관계명 `WarrantyAssets`.
- **구현 완료**: `CpAssetHealthController` + `CpAssetHealthControllerTest`(3 test / 87% 커버) 배포됨.
  실데이터 검증 — 대한케미컬 CP6000 1호기=양호, 2호기=교체 필요(보증 유상). 삼양(테스트)은 다수 교체/관찰(허용).

### A-3. 출력 형태 (Q20 — 확정: 상태 밴드만, 숫자 점수 제거)

- `cpPortalHome`:
  - `STAGE_SCORE`, `healthScore`, `healthPercent`, `ringStyle`, `mapAsset`의 `score` 로직 **제거**.
  - 링 게이지 → **카운트 요약**: `"교체 N · 점검 M · 관찰 K · 양호 L"`.
  - "설비별 건강도" 위젯 → 밴드 뱃지 목록(교체/점검 먼저 정렬).
- `cpAssetList`: `mapAsset`의 상태 판정을 건강도 컨트롤러 밴드로 교체(현재 `Obsolete→교체필요` / `!isRunning→점검필요` 하드 로직 제거). 필터 칩("전체/운전 중/이상")도 밴드 기준으로.
- `cpAssetDetail`: `Sales_Alert_Status__c` 단독 뱃지 로직 → 건강도 컨트롤러 밴드 뱃지. `reasons[]`를 툴팁으로.

### A-4. 권한 수정 (사진 "모델 미등록" 원인 + 보증현황)

`CorePress_PRT_Customer_Login` permission set에 추가됨 (**배포 완료 2026-08-28**):

- **`Product2` 오브젝트 read** + `Product2.Family` / `Overhaul_Interval_Hours__c` / `Expected_Life_Years__c` FLS
  — 없어서 `Asset.Product2.Name`이 상세페이지에서 null → "모델 미등록" → 임펠러 부품사진 폴백. **사진 버그 근본 원인.** (`Product2.Name`은 표준 필수라 오브젝트 read만으로 노출됨.)
- **`AssetWarranty` 오브젝트 read** + `WarrantyType` / `PartsCovered` / `LaborCovered` / `ExpensesCovered` FLS
  — 보증현황 항상 빈값 원인. 유상 판정에도 필요. (`StartDate`/`EndDate`는 표준 필수라 FLS 불가·자동 노출.)
  - Customer Community Plus Login 라이선스에서 `AssetWarranty` 배포 성공 확인됨.
- `Asset.Replacement_Candidate__c` FLS는 유지 — org에 존재하나 참조 필드 삭제로 깨진 수식 필드(SOQL 불가). 건강도 로직에서 미사용.

### A-5. 설비 사진 매핑 (QC 항목 5)

- A-4로 모델명이 정상 로드되면 대부분 해결(`BODY_BY_MODEL` 정확 매칭).
- `cpProductImages.resolveProductImage`:
  - 압축기 family 폴백을 **임펠러 부품사진 → 중립 압축기 실루엣**으로 변경. 부품사진을 몸통 자리에 쓰지 않는다.
  - 드라이어(`CD####`) 전용 static resource 추가 + `BODY_BY_MODEL`에 CD 시리즈 매핑(현재 `CD7000 → cp6100Pro` 압축기 사진 오매핑).
  - 매칭 실패 시 `{type:'placeholder'}` 반환, caller가 그라디언트 플레이스홀더 렌더.

### A-6. 서비스 이력 / 보증현황 (QC 항목 5)

- 보증현황: A-4 권한으로 해결.
- 서비스 이력: 삼양 Case 0건이라 실제로 빈 게 맞음. **대한케미컬**에 데모용 Case 시드(B-1).

---

## B. 데모 데이터 + 조회 범위 (QC 항목 3·4)

### B-1. 대한케미컬 데이터 보강 (Q22 — 확정: 옵션 b)

- **제1공장 CP6000 2호기** (`Account.Name='대한케미컬'`, 보증 2020 만료 = 유상):
  - `Sales_Alert_Status__c = 'Alerted'`, `Sales_Alert_Sent_At__c = now`
  - `Expected_Replacement_Date__c = 오늘 + 75일`
  - → 상세페이지 "교체 필요" 뱃지 + 근거 2건(보증 유상 + Alert)로 서사 명확.
- **제1공장 CP6000 1호기**: 활성 보증(2025~2029) 유지 → **양호**.
- 데모용 Case 1~2건을 2호기에 시드 (예: "야간 운전 중 이상 진동 감지", 상태 완료) → 최근 서비스 이력 채움.
- 삼양중공업: **재튜닝 안 함** (Q15).

### B-2. 포털 조회 범위 = "저널 연결" 한정 (Q16 — 확정: 옵션 a)

RFP·RFQ·견적 세 화면 모두 **현재 `CorePress_RFP__c` 저널에 연결된** 레코드만 노출.

- `CpQuoteController.getQuotesForAccount`: 레거시 숨김 조건을 `Status == 'Presented'` 한정 → **저널 Opp가 아닌 모든 Quote 숨김**(외부 고객 한정). `scenarioOpportunityIds` 로직 재사용.
- `CpSalesPipelineController.getRfqsForAccount`(신설, F-3): 저널 연결 Opp만.
- 삼양의 `ㅈㄹ` / `ㅈㄹ 견적` 등 QC 중 생긴 쓰레기 입력은 E-4에서 정리.

---

## C. RFP 접수 폼 (`cpRfpPortal`) — QC 항목 3 (Q8 — 전부 확정)

### C-1. 관심 장비 자동 채움

- `cpRfpPortal.html` L146~149: `<input name="rfpEquipment" value="CP7100+">` 의 **하드코딩 value 제거**.
- "연결 카탈로그 문의" 선택(onchange) 시 해당 Lead의 `Interested_Equipment__c` 로 채움. 사용자가 수정 가능. 초기값은 빈 placeholder.

### C-2. 연결 카탈로그 문의 픽리스트 정제

- `CpSalesPipelineController.getLeadsForAccount`: `WHERE ... AND LeadSource = '카탈로그 문의'` 추가 (서비스 요청 Lead 제외).
- 옵션 라벨: `{equipment} · {name} · {createdDate:yyyy.MM.dd}` — 같은 이름/장비 중복 구분.

### C-3. 이메일 제출 모드도 레코드 생성

- 현재 `submitRfp`에서 `!isPortalMode` 면 `return` (아무 레코드 없음) → "내 RFP 현황" 빈 화면.
- 이메일 모드에서도 포털 모드와 **동일하게** Lead 연결 `CorePress_RFP__c` 생성:
  - `Source__c = '이메일'`
  - 업로드한 원본 파일을 `ContentDocument`로 RFP에 첨부
  - 이메일 모드 폼에도 **"연결 카탈로그 문의" 선택** 노출 (리드 인식·전환 가능하게)
  - 이메일 발송일/제목은 RFP 이벤트 `Detail__c` 또는 신규 필드에 보존

---

## D. 제안서 라이프사이클 (`cpRfpPortal` + `CorePress_RFP__c`) — QC 항목 3 (Q9·Q10) — **배포 완료 2026-08-28**

### D-1. 자동 "제안서 제출" 제거 ✅

- `CpSalesPipelineController.submitRfp`: `Proposal_Key__c` 하드코딩 + `PROPOSAL_KEY` 상수 제거.
- `RfpSummary.hasProposal` = `ContentDocumentLinks` 에 실제 첨부가 있을 때만 true. `proposalUploadedAt` = `ContentDocument.ContentModifiedDate`.
- `cpRfpPortal.timelineDisplay`: 합성 "제안서 제출" 행은 실제 파일이 있을 때만, 파일 기반 문구로만 표시(담당자 등록 문구 분기 제거).
- "제안서 다운로드" 버튼: `hasProposal`(실파일) 일 때만 활성.

### D-2. 담당자용 "제안서 제출" Quick Action ✅ (레이아웃 배치만 수동)

- Screen Flow `CorePress_RFP_Submit_Proposal` + Quick Action `CorePress_RFP__c.Submit_Proposal` (라벨 "제안서 제출") 배포됨.
  - 파일 업로드(`forceContent:fileUpload`, `recordId`={!recordId}) → RFP에 첨부
  - `CorePress_RFP_Event__c` 생성 (`Event_Type__c='제안서 제출'`, `Visible_To_Customer__c=true`, `Occurred_At__c=now`)
  - `CorePress_RFP__c.Proposal_Submitted_At__c` (신규 Datetime 필드) 스탬프
- **레이아웃 배치 완료**: `CorePress_RFP__c-CorePress RFP Layout` 를 retrieve → `platformActionList` 에 `CorePress_RFP__c.Submit_Proposal` (+ Edit/Delete/Clone) 추가 → 배포. "제안서 제출" 버튼이 RFP 레코드 액션바에 노출됨. (담당자가 표준 Files 에 첨부해도 D-1 로직상 포털 반영됨.)
- `Proposal_Key__c` 필드는 org에 남아있으나 코드에서 미사용(파괴적 삭제 보류).

### D-3. 제안서 수정요청 ✅

- "내 RFP 현황"에 **"제안서 수정요청"** 버튼(제안서 준비된 RFP만) + 사유 textarea 패널.
- `CpSalesPipelineController.requestProposalRevision(rfpId, contactId, message)` → `CorePress_RFP_Event__c` (`Event_Type__c='제안서 수정요청'`, 고객 입력 보존, `Visible_To_Customer__c=true`) → 타임라인 표시.
- **이메일 발송 안 함** (Q17). 테스트 2건 추가.

---

## E. Opportunity / RFQ 네이밍 + 리스트뷰 — QC 항목 3 (Q11·Q12·Q18 — 확정)

### E-1. Opportunity 이름 = RFP 제목

- `CpSalesPipelineController.selectShortlist`: `conversion.setOpportunityName(rfp.Interested_Equipment__c + ' 신규 도입')` → **`rfp.Title__c`** 로 변경.
- RFQ 단계에서 사용자가 RFQ 제목을 따로 주면 그때만 Opp.Name 갱신(현행 유지).

### E-2. RFP 번호 각인

- `Opportunity` 에 신규 필드 `RFP_Number__c` (Text) — `CorePress_RFP__c.Name`(예: `RFP-0034`) 저장.
- `selectShortlist` 에서 Opp 업데이트 시 세팅. 김영업이 번호로도 검색 가능.

### E-3. Quote 이름 규칙

- `ensureRfqQuote`: `Quote.Name = Opp.Name + ' 견적서'` (현행 유지, Opp.Name이 이제 RFP 제목이므로 자동 정합).

### E-4. Opportunity 리스트뷰 신설 ✅

- `Opportunity.Portal_New_Installation_Pipeline` (라벨 "포털 신규도입 진행") 배포됨.
  - 필터: `RFP_Number__c` 채워짐(= 포털 저널 Opp) AND 미종결(`CLOSED = 0`)
  - 컬럼: Name, RFP 번호, Stage, Account, Close Date. filterScope Everything(전체 공개).
  - `CorePress_Sales_Owner` permset에 `Opportunity.RFP_Number__c` FLS 추가.

### E-5. 기존 저널 레코드 백필 — ⚪ 사실상 불필요

- `scripts/backfill_opportunity_rfp_names.apex` 는 저널 연결 Opp 이름/번호를 규칙에 맞추는 범용 스크립트로 repo에 남겨둠.
- 그러나 현재 유일한 pre-existing 저널 Opp는 삼양 `ㅈㄹ`(RFP-0034) 하나뿐이고, 이건 **I-2 `cleanup_junk_opps.apex` 가 통째로 삭제**하므로 백필할 대상이 없어짐.
- (참고) `Opportunity.RFP_Number__c` 는 배포된 Apex/테스트에선 정상이나 ad-hoc SOQL/anon-apex 파서엔 전파가 느림 — 시간 지나면 해소. 백필이 불필요해져서 blocker도 무의미.

---

## F. RFQ 폼 + RFQ 현황 (`cpRfpPortal`) — QC 항목 4 (Q13) — **배포 완료 2026-08-28**

### F-1. 연결 RFP → 픽리스트 ✅

- 죽은 `<input ... readonly>` 제거 → `<select name="rfqRfpId" required>`, `shortlistedRfps`(= `shortlistComplete` RFP) 옵션, `selected` 마킹 + `onchange={selectRfqRfp}` → `selectedRfpId` 세팅.

### F-2. 필수 해제 + 오토필 ✅

- `required` 제거: "사내 품의 확인" select, "RFQ 요청 제목" input, 확인 체크박스 5개. (유일 필수 = 연결 RFP)
- 연결 RFP 선택 시 오토필: RFQ 제목 ← `Title__c + " 견적 요청"`, 희망 납기 ← `Requested_Delivery_Date__c`, 확정 사양(읽기전용) ← `Specifications__c`. `RfpSummary` 에 `requestedDeliveryDate`/`specifications` 추가.

### F-3. RFQ 현황 빈 화면 → Apex ✅

- 신설 `CpSalesPipelineController.getRfqsForAccount(Id accountId)` → 저널 연결 + `RecordType.DeveloperName='New_Installation'` + RFQ 단계 Opp 반환(`RfqSummary`: name/stage/closeDate/rfpNumber/…).
- `cpRfpPortal` 이 `getRelatedListRecords('Opportunities')` 대신 이걸 사용. `RFQ_STAGES` JS 상수 제거. submitRfq/handleShortlist 가 `wiredRfqsResult` refresh.
- 테스트 `shouldReturnJourneyRfqsForAccount` 추가. (총 11 test / 100%)

---

## G. Parked / 범위 밖

| 항목                       | 상태                          |
| -------------------------- | ----------------------------- |
| 레거시 Opp/Quote 대량 삭제 | 보류. B-2 코드 필터로만 대응. |

> **업데이트 (2026-08-28)**: Agentforce 라우팅은 사용자가 이미 해결함. 핸드오프 §5(백엔드 미프로비저닝)는
> 더 이상 유효하지 않다. QC 항목 5의 "AI 증상문의 동작 제대로 안함"은 아래 H로 재분류 — 범위 판단 대기.

## H. 상담 채널 = 임베디드 메시징 위젯 전면 노출 (Q24 — 방향 변경)

**결정 (2026-08-28)**: `cpAssetDetail` 의 커스텀 "AI 증상 문의" 버튼은 **제거**한다. 대신 우측 하단
**"Ask Me Anything" 임베디드 메시징 토글**을 포털 **모든 화면**에서 보이게 한다.

- 커스텀 버튼이 `prechatAPI.setHiddenPrechatFields` / `utilAPI.launchChat` 를 직접 호출하다
  `"상담 채널을 준비하고 있습니다"` 로 실패하던 문제 자체가 사라짐 (그 코드 경로를 없앰).

### H-1. `cpAssetDetail` 정리 ✅ (배포 완료 2026-08-28)

- "AI 증상 문의" 버튼 마크업 + `handleAgentInquiry`/`showAgentError`/`agentMessage`/`agentMessageIsError`/`agentMessageClass`/`disableAgentButton` 전부 제거.
- 남은 hero CTA는 "서비스 요청" 하나. (`window.embeddedservice_bootstrap` 직접 호출 경로 소멸 → "상담 채널을 준비하고 있습니다" 에러 재발 불가)

### H-2. "Ask Me Anything" 위젯 사이트 전역 노출 — ⚙️ Experience Builder 수동 설정

- 조사 결과: repo의 `digitalExperiences` / `ExperienceBundle` 에 임베디드 메시징 배치 정보 없음. 위젯은 **사이트 Head Markup 스니펫** 또는 **EmbeddedServiceConfig(`CorePress_Agent_Web`, WebV2/MIAW)** 로 주입되며, 이 계층은 이 저장소 메타데이터에 안 잡힘.
- **수동 절차** (Experience Builder, 관리자):
  1. Experience Builder → 해당 사이트 열기 → 설정(⚙️) → 고급 → **Head Markup 편집**.
  2. Head Markup에 임베디드 메시징 부트스트랩 스니펫이 있으면 → **이미 전 페이지 전역**(head는 모든 페이지 공통). 다른 페이지에서 안 보이면 브라우저 캐시/게스트-로그인 상태 차이일 가능성 → 각 페이지 재확인.
  3. 페이지별 "Embedded Messaging" 컴포넌트로 들어가 있으면 → 스니펫을 Head Markup으로 옮겨 전역화(권장) 하거나, 남은 페이지에 컴포넌트 추가.
  4. 배포는 `Setup → Embedded Service Deployments → CorePress Agent Web → Code Snippet` 에서 최신 스니펫 복사.
- 위젯/라우팅 자체는 사용자가 이미 정상화 — **노출 범위만** 손대는 작업이라 코드 변경 없음.

---

## 신규 메타데이터 요약 (배포 대상)

- Apex: `CpAssetHealthController` (신규), `CpSalesPipelineController` (수정: submitRfp/selectShortlist/getLeadsForAccount + getRfqsForAccount 신규), `CpQuoteController` (수정), `CpCatalogLeadController` (영향 없음 예상)
- LWC: `cpPortalHome`, `cpAssetList`, `cpAssetDetail`, `cpProductImages`, `cpRfpPortal`
- 필드: `CorePress_RFP__c.Proposal_Submitted_At__c`, `Opportunity.RFP_Number__c`
- Quick Action: `CorePress_RFP__c` "제안서 제출"
- ListView: `Opportunity.포털_신규도입_진행`
- Permission set: `CorePress_PRT_Customer_Login` (Product2 + AssetWarranty 접근), `CorePress_Sales_Owner` (Opportunity.RFP_Number__c FLS)
- Static resource: `CorePressCD7000Body` (드라이어 SVG)
- 데이터 스크립트: `seed_daehan_cp6000_2ho_demo.apex`(2호기 보강 + Case), `backfill_opportunity_rfp_names.apex`(저널 Opp 이름 백필 — 대기), `cleanup_junk_opps.apex`(쓰레기 Opp 삭제 — 실행 대기)

---

## I. 원래 요청의 이연 항목 (핸드오프 §4-1/§4-2) — 2026-08-28 세션에서 처리

### I-1. 카탈로그 문의 픽리스트 범위 ✅ 배포 완료

- 사용자 결정: **장비 본체만** (소모품·테스트 제외).
- `CpProductCatalogController.getEquipmentProducts` 쿼리에 `AND Is_Consumable__c != true AND (NOT Name LIKE 'test%')` 추가.
- 랜딩 카탈로그 문의 모달 "관심 제품" 드롭다운: **46개 → 19개** (압축기 13 + 드라이어 본체 6). 테스트 `shouldReturnOnlyEquipmentBodies` 갱신.
- `getEquipmentCatalog`(제품 목록 페이지)는 그대로 — 별개 화면.

### I-2. 레거시 Opp/Quote 정리 ⏳ 스크립트 준비, 실행은 사용자

- 사용자 결정: **쓰레기만 삭제** (Closed Won/Lost 등 과거 이력 보존).
- B-2 코드 필터로 포털은 이미 깨끗 — 이건 org 내부(김영업 리스트/리포트) 정리용.
- `scripts/cleanup_junk_opps.apex` 가 삭제하는 것 (그 외 전부 보존):
  - 삼양 `ㅈㄹ` Opp + `ㅈㄹ 견적` Quote + `RFP-0034` + 이벤트
  - 대한케미컬 `CP7100  RFQ Test` Opp + Quote + `RFP-0016` + 이벤트
- **자동 실행 차단됨** (파괴적 DML): 사용자가 `sf apex run -o trail-org --file scripts/cleanup_junk_opps.apex` 직접 실행하거나 승인 필요.
- 삭제 대상에서 `test CP5100 Pro`, `Test Product`, `TEST_MOB_*` **Product** 는 제외 — Opp/Quote 정리 범위 밖 + PricebookEntry 의존 위험. 픽리스트에선 I-1으로 이미 숨겨짐.

### I-3. 삼양중공업 시드 데이터 — 처리 안 함 (Q15)

테스트 계정이라 건강도 밴드가 다수 "교체 필요"로 떠도 허용. 데모는 대한케미컬.
