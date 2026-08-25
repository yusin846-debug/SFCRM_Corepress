# CorePress 고객 포털 (PRT) — 개발 범위 & 시나리오 매핑

작성일: 2026-08-25
대상 org: `trail-org` (alias) / `https://trailsignup-783b48e7f9b1eb.my.salesforce.com`
사이트: `CorePress Customer Portal` (Network `0DBgK000001mveXWAQ`, prefix `/corepress`, Status Live)
담당: 유신 (PRT-01~66 + AGT-01~03)

이 문서는 CorePress To-Be Process 4개 시나리오(`CorePress_ToBe_AllScenarios.html`)에 대해 PRT 담당 개발 범위가 무엇을 커버하고 있고 무엇이 다른 팀 소유인지를 정리한다. `CONTEXT.md`의 용어 정의를 전제로 하고, 실행 세부(파일 경로, 구현 결정)는 반복하지 않는다.

---

## 1. 페르소나 & 계정

포털 데모를 돌리는 데 필요한 유저는 셋이다. 세부 정의는 `CONTEXT.md` 참고.

| 페르소나 | 역할 | 로그인 | 시나리오 |
|---|---|---|---|
| 김재혁 | 대한케미컬 설비관리팀 차장 | `kim.jaehyuk@daehan-corepress-poc.com` / `CorePress2026!` | 시나리오 1 |
| 김설비 | 대한케미컬 설비관리팀 팀장 | `kim.seolbi@daehan-corepress-poc.com` / `CorePress2026!` | 시나리오 2·3 |
| 김영업 | CorePress 영업사원 (Lead/Opp 소유자) | `saleskim@corepress.demo` (내부, 로그인 시연 없음) | 전 시나리오 백엔드 |

포털 로그인 URL: `https://trailsignup-783b48e7f9b1eb.my.site.com/corepress/login`.

Case 00001047(대한케미컬 CP6000 #2 서비스 요청)은 시나리오 2 승인 액션 데모용으로 `유상`/`승인 대기` 상태로 세팅되어 있다.

---

## 2. 시나리오 × PRT 스코프 매트릭스

| 단계 | 시나리오 1 (신규 도입) | 시나리오 2 (정례 서비스) | 시나리오 3 (노후 교체) | 시나리오 4 (경영 KPI) |
|---|---|---|---|---|
| 이슈 인지 / 감지 | PRT | PRT | 외부 (자동 알림) | 외부 |
| 자료실 · 카탈로그 다운로드 | **PRT** | — | — | — |
| RFP / RFQ 제출 | **PRT** | — | **PRT** | — |
| 서비스 요청 등록 (Web-to-Case) | — | **PRT** | — | — |
| 자산 이력 조회 | **PRT** | **PRT** | **PRT** | — |
| 견적 포털 조회 · 승인 | **PRT** | **PRT** (승인) | — | — |
| 공지·기술자료 | **PRT** | **PRT** | **PRT** | — |
| Flow 자동화 (Lead·Case·Asset 자동생성) | 다른 팀 | 다른 팀 | 다른 팀 | — |
| Agentforce AI (리스크리포트·부품추천·엔지니어배정·TCO) | **AGT** (미착수) | **AGT** (미착수) | **AGT** (미착수) | — |
| CPQ Quote 자동 생성 | SAL | SAL | SAL | — |
| Field Service Mobile (실사·설치·교체) | DSP+MOB | DSP+MOB | DSP+MOB | — |
| 통합 대시보드 · KPI | — | — | — | 외부 |

**PRT = 이미 구현되어 포털에 살아있음**. 시나리오 4는 PRT 범위 밖.

---

## 3. 시나리오 1 — 카탈로그 요청 (신규 설비 도입)

### 배경 스토리
안산 1공장의 CP6000 노후화 및 2공장 신규 라인 증설 니즈로 신규 터보압축기 도입을 검토. 김재혁이 카탈로그 요청부터 RFP·RFQ, 견적 조회까지 진행한다.

### 포털 시연 흐름
1. 게스트로 랜딩 페이지(`/corepress`) 방문 → 제품 카드 확인
2. "전체 제품 보기" → `/products` 카탈로그 페이지 → 압축기·드라이어 라인업 확인
3. `CP7100+` 카드 클릭 → `/product-detail?recordId=...` 상세 확인 (실 Product2 스펙 + 마케팅 카피)
4. "카탈로그·도입 문의" CTA → 랜딩으로 이동하며 카탈로그 문의 모달 자동 오픈 (관심제품 pre-select)
5. 문의 폼 제출 → **Lead 자동 생성** (LeadSource=카탈로그 문의, Product_Interest=압축기, Owner=김영업)
6. 김재혁 계정으로 포털 로그인 → RFP·RFQ 탭 (`/rfp-rfq`)
7. RFP 발행 → **동일 회사명 Lead가 `RFP접수` 상태로 자동 갱신** (Opportunity 아직 없음)
8. "내 RFP 현황" 탭에서 방금 갱신된 Lead 확인
9. RFQ 제출 → **Lead가 `숏리스트 선정`(내부 API `Converted`)으로 변환** → Opportunity(`Proposal/Quote`) 자동 생성, 김영업 소유
10. 견적 탭(`/quotes`) → 실제 Quote 레코드(제2공장 증설 CP7100+, ₩23.2억) 확인

### PRT가 소유하는 컴포넌트
- 랜딩 페이지 + 카탈로그 문의 모달 (`cpPortalLanding`)
- 제품 카탈로그 목록/상세 (`cpProductList`, `cpProductDetail`)
- RFP/RFQ 포털 + 현황 탭 (`cpRfpPortal`)
- 견적 목록/상세 (`cpQuoteList`)
- Apex: `CpCatalogLeadController`, `CpSalesPipelineController`, `CpProductCatalogController`, `CpQuoteController`
- 데이터: 대한케미컬 Account, 김재혁 Contact/User, 박신규 Lead(신규 문의 상태), 제2공장 CP7100+ Opportunity + Quote, 카탈로그(Product2·PricebookEntry)

### 다른 팀 담당 (미착수 또는 별개)
- 영업사원 모바일 알림 (SF Flow) — CAS/SAL 팀
- Agentforce 리스크 리포트 자동 생성 (AGT-01~03) — **본인 담당, 마지막에 진행 예정**
- 모바일 사전회의 Activity 기록 — SAL/MOB
- CPQ Quote 자동 생성 (현재 데모 Quote는 수동 시딩) — SAL
- 결재라인 자동 라우팅 (Flow) — SAL
- FSL 설치·시운전 (Field Service Mobile) — DSP+MOB
- 설치 완료 시 Asset 자동 등록·보증 자동 설정 (Flow) — MOB
- 설치 WO 배정 — 서비스 코디네이터

---

## 4. 시나리오 2 — 정례적 서비스

### 배경 스토리
안산 1공장 CP6000 #2 진동·소음 이상 감지. 김설비가 포털에서 자산 이력을 확인 후 서비스 요청을 등록하고, 진단 결과 유상 판정이 나오면 견적을 승인한다.

### 포털 시연 흐름
1. 김설비 계정으로 포털 로그인 → 포털 홈(`/portal-home`)에서 안산 1공장 CP6000 2대 확인 (#2가 "교체 필요" 표시)
2. 보유 설비 목록(`/asset-list`)에서 CP6000 #2 카드 → 상세(`/asset-detail?recordId=...`)로 이동해 이력 확인
3. 서비스 요청 등록(`/service-request`) → 대상 설비=CP6000 #2, 증상·긴급도·첨부파일 입력 → **Case 자동 생성** (신규접수, Asset 자동 연결)
4. 담당 엔지니어의 현장 진단 완료 (실제 데모에선 Case 00001047의 `Warranty_Determination__c=유상`, `Approval_Status__c=승인 대기`가 세팅되어 있음)
5. 서비스 요청 목록(`/service-list`) → Case 00001047 → 상세(`/service-detail?recordId=...`)에서 견적금액 확인
6. "승인" 버튼 클릭 → **Approval_Status__c=승인, Approved_At__c=현재 시각으로 자동 갱신** (버튼 사라지고 즉시 UI 반영)
7. 완료 후 자산 이력 재확인 가능

### PRT가 소유하는 컴포넌트
- 포털 홈 (`cpPortalHome`) — 자산·서비스 현황·공지 프리뷰
- 보유 설비 목록/상세 (`cpAssetList`, `cpAssetDetail`)
- 서비스 요청 폼 (`cpServiceRequest`), 목록 (`cpServiceList`), 상세 (`cpServiceDetail` — 승인/반려 액션 포함)
- 공지·기술자료 (`cpPortalNotices`)
- Apex: `CpPortalFileController` (Case 첨부), 승인 액션은 `lightning/uiRecordApi` 표준 `updateRecord` 직접 사용
- 데이터: CP6000 x 2 Asset (안산 1공장 A/B동), Case 00001047 (유상/승인 대기)

### 다른 팀 담당 (미착수 또는 별개)
- Flow 기반 Case 자동 생성 + Asset 연결 (Web-to-Case 자동화) — CAS
- Entitlement 즉시 조회 — CAS
- Agentforce 부품 추천·재고 확인 (AGT) — **본인 담당, 미착수**
- Agentforce 최적 엔지니어 자동 배정 (AGT) — **본인 담당, 미착수**
- FSL 방문·현장 진단·부품 교체·조치 (Field Service Mobile) — DSP+MOB
- Flow 기반 Asset 이력 자동 연결 — WO
- AI 영업 기회 자동 감지(추가 정례 계약 제안) — SAL

---

## 5. 시나리오 3 — 노후화 설비 교체

### 배경 스토리
CP6000 #2가 임계치(누적 63,200시간, 8년차) 초과. 김설비가 TCO 리포트를 검토하고 진기내 교체를 요청. 실제 신규 도입(CP7100+ 등)은 시나리오 1의 RFP/RFQ 흐름을 재사용한다.

### 포털 시연 흐름
1. 김설비 계정 로그인 → 공지·기술자료(`/notices`) → "CP6000 #2 보증기간 만료 예정", "CorePress 예방정비 계약 갱신 안내", "터보압축기 노후 교체 판단 기준" 등 확인
2. 보유 설비 상세(`/asset-detail?recordId=...`)에서 CP6000 #2의 누적 운전시간·이력 확인 (Runtime_As_Of__c, Total_Runtime_Hours__c)
3. RFP·RFQ 탭에서 교체용 RFP 제출 → **시나리오 1과 동일 파이프라인** (Lead 상태 갱신 → RFQ 시 Opp 전환)
4. 견적 탭에서 교체 Quote 확인

### PRT가 소유하는 컴포넌트
- 시나리오 2의 자산/공지 컴포넌트 + 시나리오 1의 RFP/RFQ/견적 컴포넌트 (재사용, 신규 없음)

### 다른 팀 담당 (미착수 또는 별개)
- Flow 임계치 초과 자동 알림 — SAL/WO
- Agentforce 교체 제안서 자동 생성 (AGT) — **본인 담당, 미착수**
- Agentforce 3사 비교 TCO 리포트 (AGT) — **본인 담당, 미착수**
- SF 진행 상황 대시보드 — SAL
- CPQ 기존 계약 기반 교체 Quote 자동 생성 — SAL
- FSL 진기내 교체·모바일 보고 — DSP+MOB
- Flow 구 Asset 비활성화 + 신규 Asset 등록 자동화 — WO+MOB
- 교체 WO 배정 — 서비스 코디네이터

---

## 6. 시나리오 4 — 분기 회의 (성과 측정)

**PRT 범위 밖.** 경영진 대시보드는 Salesforce 표준 대시보드 + Report로 구현되며 SAL/CAS/WO 팀 데이터가 소스가 된다. PRT는 이 시나리오에 아무것도 노출하지 않는다.

---

## 7. 배포된 자산 목록 (2026-08-25 기준)

### LWC (13개)
`cpPortalLanding`, `cpPortalHome`, `cpAssetList`, `cpAssetDetail`, `cpServiceList`, `cpServiceDetail`, `cpServiceRequest`, `cpRfpPortal`, `cpQuoteList`, `cpProductList`, `cpProductDetail`, `cpPortalNotices`, `cpPortalError`

### Apex Controller (6개)
`CpCatalogLeadController`, `CpSalesPipelineController`, `CpProductCatalogController`, `CpQuoteController`, `CpPortalFileController`, `CpSalesPipelineControllerTest` 외 4개 테스트 클래스 (총 15개 테스트, 100% 통과)

### Permission Set (6개)
- 포털 고객용: `CorePress_PRT_Customer` (Plus 라이선스 잠금), `CorePress_PRT_Customer_Login` (Login 라이선스용, unlocked)
- 포털 데이터 접근: `CorePress_Opportunity_Portal_Access`, `CorePress_Service_Detail_Access`, `CorePress_Quote_Portal_Access`
- 내부 영업: `CorePress_Sales_Owner` (Lead/Opp RUD + Quote R)

### 사이트 라우트 (신규)
`/products`, `/product-detail`, `/notices` (기존 `portal-home`, `asset-list`, `asset-detail`, `service-list`, `service-detail`, `service-request`, `rfp-rfq`, `quotes` 유지)

### 데이터 시드
- Account: 대한케미컬_PRT 통합테스트
- Contact: 김재혁(설비관리팀 차장), 김설비(설비관리팀 팀장), 유신 김(backup)
- User: 김재혁(portal), 김설비(portal), 김영업(internal SALES_OWNER)
- Asset: 안산 1공장 CP6000 #1 (Installed), #2 (Obsolete/교체 필요)
- Case: 00001047 (유상/승인 대기, CP6000 #2에 연결)
- Lead: 박신규 (신규 문의, 김영업 소유)
- Opportunity: 제2공장 증설 CP7100+ 견적 요청, 제2공장 신규 생산라인 압축기 도입 (둘 다 김영업 소유)
- Quote: 제2공장 증설 CP7100+ 견적서 (₩23.2억, Opp에 연결)

---

## 8. 데모 시연 순서 제안

시나리오 파이프라인이 자연스럽게 이어지는 순서:

**Part 1 — 시나리오 2 (정례 서비스)** — 김설비 로그인
1. 포털 홈에서 안산 1공장 CP6000 2대 확인, #2가 "교체 필요" 표시
2. 공지·기술자료 → "CP6000 #2 보증기간 만료 예정" 확인
3. 서비스 요청 목록 → Case 00001047 상세 → 유상 판정 + 견적 확인 → **승인** 클릭
4. 로그아웃

**Part 2 — 시나리오 3 → 1 (교체 니즈 → 신규 도입)** — 김재혁 로그인 (전환)
1. 랜딩 페이지 게스트 모드로 이동 (별개 브라우저 창 또는 시크릿) → 제품 카탈로그(`/products`) → CP7100+ 상세 → 카탈로그 문의 (Lead 생성)
2. 김재혁 로그인 → 포털 홈 → RFP·RFQ 탭 → **RFP 제출** → 내 RFP 현황에서 Lead가 `RFP접수`로 뜸
3. RFQ 제출 → Lead가 변환되며 Opportunity 자동 생성
4. 견적 조회 → 제2공장 CP7100+ Quote 확인

**Part 3 (선택) — 백엔드 확인**
- Setup에서 김영업 유저 로그인 후 Lead/Opportunity 소유자 = 김영업 확인
- Approval 데모 후 Case 00001047의 `Approval_Status__c=승인`, `Approved_At__c=방금 시각` 확인

---

## 9. 남은 이슈 / 미구현

### PRT 담당 (본인)
- **AGT-01~03** — Agentforce 문의(Asset context 전달 포함). 팀 우선순위 상 가장 마지막.
- 로그인 페이지 로고 CMS 업로드 (현재 기본 로고 상태, ContentAsset 방식 문제로 부분 진행)

### 다른 팀 담당 (PRT는 대기)
- Flow 기반 Web-to-Case 자동화 (CAS)
- Entitlement 자동 조회 (CAS)
- CPQ Quote 자동 생성 (현재 수동 시딩 — SAL)
- 결재라인 라우팅 Flow (SAL)
- FSL 모바일 흐름 전체 (DSP+MOB)
- Asset 자동 등록·보증 자동 설정 Flow (WO+MOB)
- 임계치 초과 알림 Flow (SAL/WO)
- 경영 KPI 대시보드 (SAL/CAS)

### 데모 진행 시 주의
- 두 페르소나(김설비 → 김재혁) 로그인 전환 필요. 시크릿/브라우저 창 분리 권장.
- 승인 액션은 한 번만 시연 가능 (승인 후 버튼 사라짐). 재시연 필요 시 Case 00001047을 다시 `승인 대기`로 리셋해야 함. 방법은 `docs/SERVICE_APPROVAL_TEST_GUIDE.md` 참조.
- 스모크 실행 시 Lead가 소진될 수 있음. 필요시 `scripts/cleanup_smoke_and_reseed.apex`로 초기화.

---

## 10. 참고 문서

- `CONTEXT.md` — 도메인 용어집
- `docs/SERVICE_APPROVAL_TEST_GUIDE.md` — 승인 액션 QA 가이드 (성하님용)
- `docs/PORTAL_NAVIGATION_AUDIT.md` — 초기 네비게이션 점검 (구버전, 참고만)
- `docs/SESSION_HANDOFF_*.md` — 세션 인수인계 (구버전 순차 진행 이력)
- `EXPERIENCE_CLOUD_공동개발_계획.md` — 팀 공동 개발 원칙
- `PRD_선행개발_의존관계.md` — PRD 팀 선행 산출물 의존관계
- `CorePress_ToBe_AllScenarios.html` — To-Be 프로세스 4개 시나리오 원본
