# 세션 이관 — 포털 다중 이슈 수정 (2026-08-27)

작성일: 2026-08-27
대상 org: `trail-org` / `https://trailsignup-783b48e7f9b1eb.my.salesforce.com`
사이트: `CorePress Customer Portal` (`/corepress`, Status Live)
관련 문서: `CONTEXT.md`, `docs/PRT_SCOPE_AND_SCENARIOS.md`, `docs/SCENARIO_3_CP6000_REINTRODUCTION.md`, `docs/SESSION_HANDOFF_agentforce_routing.md`

이 문서는 2026-08-26~27 세션에서 다룬 작업을 이어받을 다음 세션을 위한 것이다. **아래 "미확인/재현 필요" 섹션을 최우선으로 읽을 것** — 사용자가 마지막으로 검증을 요청했으나 이 세션에서 결과를 받지 못한 항목들이다.

---

## 1. TL;DR — 지금 무엇이 안정적이고 무엇이 불안정한가

| 영역                                                    | 상태                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Quote 포털 승인/반려                                    | ✅ 배포·커밋 완료, 코드 리뷰 완료                                      |
| Service Overview 페이지 (이미지 목업)                   | ✅ 배포·커밋 완료                                                      |
| 헬스스코어 뱃지 (설비 상세 + 포털홈)                    | ✅ 배포·커밋 완료, 시드 데이터로 확인됨                                |
| RFP 제안서 동적 다운로드                                | ✅ 배포·커밋 완료                                                      |
| 3개 신규 테스트 계정 (삼양중공업/정민플라스틱/성진공업) | ⚠️ **자산 owner 문제 수정했으나 최종 미검증**                          |
| 카탈로그 문의 픽리스트 + 다운로드 에러                  | ⚠️ **원인 진단하고 fix 배포했으나 사용자 확인 못 받음**                |
| 대한케미컬(김도입) 견적 25건 뒤섞임                     | 🔴 **미해결 — 사용자가 "나중에 하자"고 보류함**                        |
| Agentforce 채팅 라우팅                                  | 🔴 **미해결 — Salesforce 백엔드 프로비저닝 문제, Support 케이스 필요** |

---

## 2. 미확인/재현 필요 (최우선)

### 2-1. 카탈로그 문의 픽리스트 + "The Apex request is invalid" 에러

**증상(스크린샷 근거)**: 로그인 상태(강태호)로 랜딩 페이지 카탈로그 문의 모달을 열면 관심 제품 드롭다운이 "전체 제품" 하나만 뜸. 제출 시 "The Apex request is invalid" 표시.

**원인 진단 완료**: `CorePress Customer Portal Profile`(Customer Community Plus Login 라이선스 — 포털 로그인 유저 전원이 이 라이선스)의 프로파일 자체에 `CpProductCatalogController`, `CpCatalogLeadController` 두 Apex 클래스 접근이 **disabled**로 되어 있었음. Guest(비로그인) 세션은 다른 프로파일이라 정상 작동했기 때문에 어제는 게스트 상태에서 성공, 오늘 로그인 상태에서 실패한 것으로 추정.

**조치 완료**: `CorePress_PRT_Customer_Login` 퍼미션셋(포털 유저 5명 전원에게 이미 할당됨)에 두 클래스 접근 추가 → 배포 완료 → 사이트 republish 완료 (커밋 `b0040d1`).

**⚠️ 사용자로부터 재현 테스트 결과를 받지 못했음.** 다음 세션에서 반드시:

```
1. 시크릿 창에서 kang.taeho@samyangheavy.demo / CorePress2026! 로그인
2. 랜딩(/corepress) → 카탈로그 문의 모달 열기
3. 관심 제품 드롭다운에 CP7100+, CP7100 Pro, CP6000, CD7000, CP5100 Pro 등이 뜨는지 확인
4. 폼 제출 → 에러 없이 성공 화면 뜨는지 확인
```

안 되면: 브라우저 콘솔(F12) Network 탭에서 실패한 Apex 요청의 Response body 확보.

### 2-2. 삼양중공업 포털홈 설비 미연동

**증상**: 강태호 로그인 시 포털홈에 설비 카운트/타일이 안 뜸 (사용자 보고, 시각적 확인 스크린샷은 못 받음).

**진행한 진단/조치**:

1. Asset owner가 어드민(김유신)으로 세팅되어 있었음 → **김영업으로 재할당 완료** (Asset OWD가 Private이라 포털 role hierarchy 밖의 owner는 안 보임). 커밋 `50dba77`.
2. `Sales_Alert_Status__c` 등 신규 필드에 `CorePress_PRT_Customer_Login` 퍼미션셋 FLS가 없어서 `getRelatedListRecords`가 응답을 못 만들었을 가능성 → FLS 7개 필드 추가. 커밋 `86b1f5c`.
3. 위 2-1의 Apex 클래스 접근 fix도 카탈로그 모달 wire와는 무관하지만, 혹시 다른 wire에도 비슷한 패턴의 누락이 더 있을 수 있음 — **완전히 훑지는 못함**.

**⚠️ 여전히 미검증.** 다음 세션에서:

```
1. 시크릿 창에서 kang.taeho@samyangheavy.demo 재로그인
2. 포털홈에서 "등록 설비 12대" 카운트 확인
3. 보유 설비 목록 페이지에서 12개 타일 확인
4. 안 되면: LWC 개발자 콘솔에서 cpPortalHome 컴포넌트 에러 확인, 또는 org에서
   SELECT COUNT() FROM Asset WHERE AccountId = '001gK00001OszhiQAB' 실행해 데이터 자체는 있는지부터 재확인
```

### 2-3. Agentforce 사이트 republish 결과 미확인

직전 턴에서 `sf community publish` 백그라운드 실행 완료 통보만 받았고, 사용자가 실제 브라우저에서 확인한 결과는 이 세션 종료 시점까지 없음.

---

## 3. 이번 세션에서 완료된 것 (재작업 불필요)

### 3-1. Quote 포털 승인/반려 (커밋 `2497be4`)

- `CpQuoteController.updateQuoteStatus(quoteId, action)` — approve/reject, Contact.Account 소유권 검증, 이미 처리된 건 재처리 차단
- `cpQuoteList`: 승인/반려 버튼 2-click 확인 패턴(회의에서 `confirm()` alert 금지 lint 규칙 때문에 대체)
- 데모 시 김도입/김설비 계정으로 Quote 승인 시연 가능

### 3-2. Service Overview 페이지 (커밋 `d318371`)

- 정적 목업 PNG 1440×700으로 교체, CTA 1개만 실좌표 오버레이
- `CorePressServiceMockup` 스태틱 리소스

### 3-3. 헬스스코어 뱃지 (커밋 `028e99e`)

- 설비 상세: `Sales_Alert_Status__c='Alerted'`면 붉은 "점검 필요" 뱃지(tooltip 포함), `Needs Data`면 회색 뱃지
- 포털홈: Alerted 자산이 기존 "점검 필요" 카운트에 자동 합산
- 시드 데이터로 확인됨: 안산 1공장 CP6000 #2, 한빛 CP7100 Pro #1 → Alerted

### 3-4. RFP 제안서 동적화 (커밋 `30af1b1`)

- `CpSalesPipelineController.getRfpsForAccount`가 ContentDocumentLink를 가져와 `proposalContentDocumentId` 노출
- `cpRfpPortal`: 첨부파일 있으면 다운로드 버튼 활성화, 없으면 "제안서 준비 중"
- 첨부 즉시 타임라인에 "제안서 제출" 가상 이벤트 자동 표시 (백엔드 트리거 없이)

### 3-5. 3개 신규 테스트 계정 시드 (커밋 `8ec1bc3`, `50dba77`)

| 계정         | Username                          | 규모   | 자산                     |
| ------------ | --------------------------------- | ------ | ------------------------ |
| 삼양중공업   | `kang.taeho@samyangheavy.demo`    | 대기업 | 12대 (안성5+청주4+대전3) |
| 정민플라스틱 | `park.seojun@jungminplastic.demo` | 중견   | 2대 (울산)               |
| 성진공업     | `jung.soyoung@sungjin.demo`       | 소기업 | 1대 (부천)               |

모두 비밀번호 `CorePress2026!`. 스크립트: `scripts/seed_multi_tier_step1_data.apex` (계정/연락처/자산) → `scripts/seed_multi_tier_step2_users.apex` (유저/비밀번호/퍼미션셋), 두 스텝인 이유는 MIXED_DML_OPERATION 회피.

### 3-6. 권한 관련 수정 (커밋 `86b1f5c`, `b0040d1`)

- `CorePress_PRT_Customer_Login` 퍼미션셋: Asset 신규 필드 FLS + Apex 클래스 2개 접근 추가

### 3-7. 기타 정리 커밋

- `.gitignore` 보강, Agentforce v2 재바인딩 되돌림, Codex 산출물 정리 커밋 다수 (자세한 목록은 `git log` 참고, 8/26 이전 내역)

---

## 4. 미해결 — 사용자가 보류 지시함 (나중에 처리)

### 4-1. 대한케미컬(김도입) 견적 25건 뒤섞임

**증상**: 김도입 계정으로 로그인해 견적 조회하면 25건이 뜸 (Presented 1, Draft 2, Accepted 12, Rejected 11). 시나리오상 김도입은 "제2공장 CP7100+ 신규 도입 견적" 딱 1건만 봐야 함.

**원인**: 대한케미컬 Account에 Opportunity가 30건 누적되어 있음 (여러 세션에 걸쳐 Codex/이전 세션이 계속 test 데이터를 쌓음). `CpQuoteController.getQuotesForAccount`는 그 계정의 모든 Opp의 Quote를 필터 없이 반환하는 구조라 전부 노출됨.

**사용자 결정 (이번 세션에서 확정)**: "일단 두고 나중에 생각하기" — **지금 손대지 말 것.**

**다음 세션에서 재개 시 참고할 목표 상태**:

```
남겨야 할 것: "대한케미컬 제2공장 증설 CP7100+ 견적" (006gK00000N47gnQAB, Stage=견적 제출)
관련 Opp: "대한케미컬 제2공장 신규 생산라인 압축기 도입" (006gK00000N47YjQAJ, Stage=숏리스트 선정)
```

정리 방향 옵션(그릴링 시 논의됨, 확정 안 됨):

- (a) 관계없는 29건 Opp/Quote 삭제
- (b) 포털 쿼리에 필터(record type/최근성/명시적 flag) 추가
  사용자가 방향 정할 때까지 **어느 쪽도 진행하지 말 것**.

### 4-2. 카탈로그 픽리스트 Family 필터링 로직 재검토 필요할 수 있음

`CpProductCatalogController.getEquipmentProducts`가 `INQUIRY_FAMILIES = {'압축기','드라이어'}`만 반환. org에 있는 46개 활성 제품 중 다수가 이 두 Family에 속해서 픽리스트가 길다 (CP2100, CP3000... CPA3100 등 12개+). 이게 의도인지 사용자에게 확인 안 됨 — 원래는 5개 카탈로그 제품(CP7100+, CP7100 Pro, CP6000, CD7000, CP5100 Pro)만 노출하려던 의도였을 가능성 있음. **2-1 재현 테스트 시 픽리스트 항목 개수도 같이 확인해서 사용자에게 의도 여부 물어볼 것.**

---

## 5. 완전 별도 트랙 — Agentforce 라우팅 (연결 문서 있음)

`docs/SESSION_HANDOFF_agentforce_routing.md`, `docs/SUPPORT_CASE_AGENTFORCE_ROUTING.md` 참고. 요약:

- 봇 자체는 정상 (Builder Preview 확인됨)
- 포털 임베드 세션이 `Waiting/AgentType=System`에서 멈춤, 채널 재구성(v2) 해도 동일 → **org 백엔드 프로비저닝 미완료로 결론**
- 사용자가 Salesforce Support 케이스 접수를 원치 않아 임베드는 옛 Deployment(`CorePress_Agent_Web`)로 되돌려놓은 상태 (커밋 `770ccbf`)
- 재개하려면 Support 케이스 초안이 이미 준비되어 있음

---

## 6. Org 컨텍스트 요약

| 항목       | 값                                                         |
| ---------- | ---------------------------------------------------------- |
| Org alias  | `trail-org`                                                |
| 사이트 URL | `https://trailsignup-783b48e7f9b1eb.my.site.com/corepress` |
| 로그인 URL | `.../corepress/login`                                      |

**포털 로그인 계정 전체 목록** (비밀번호 전부 `CorePress2026!`):

| 페르소나      | Username                                       | 회사         | 시나리오                               |
| ------------- | ---------------------------------------------- | ------------ | -------------------------------------- |
| 김도입        | `kim.jaehyuk@daehan-corepress-poc.com`         | 대한케미컬   | 시나리오 1 (신규 도입)                 |
| 김설비        | `kim.seolbi@daehan-corepress-poc.com`          | 대한케미컬   | 시나리오 2·3 (서비스/교체)             |
| 김도현        | `kim.dohyun.corepress.qc.20260825@example.com` | 한빛석유화학 | QC 검증용 (Codex가 만든 테스트 고객)   |
| 강태호        | `kang.taeho@samyangheavy.demo`                 | 삼양중공업   | 대기업 규모 테스트                     |
| 박서준        | `park.seojun@jungminplastic.demo`              | 정민플라스틱 | 중견 규모 테스트                       |
| 정소영        | `jung.soyoung@sungjin.demo`                    | 성진공업     | 소기업 규모 테스트                     |
| 김영업 (내부) | `saleskim@corepress.demo`                      | CorePress    | Lead/Opp/Asset owner, 로그인 시연 없음 |

---

## 7. 다음 세션 시작 시 권장 순서

1. **§2 미확인 항목 3개 재현 테스트** (카탈로그 픽리스트, 삼양 포털홈, Agentforce publish) — 유저에게 실제로 됐는지 물어보고 스크린샷 요청
2. 안 되는 게 있으면 그 자리에서 추가 진단
3. 다 되면 §4-1(대한케미컬 견적 정리), §4-2(픽리스트 Family 범위)를 사용자에게 그릴링해서 방향 확정
4. Agentforce는 사용자가 다시 꺼내기 전까지 건드리지 않음
