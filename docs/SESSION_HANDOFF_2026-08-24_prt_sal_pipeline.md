# 세션 이관 문서 — PRT 포털 실데이터 연동 + SAL 파이프라인 + 헤더 계정 표시

작성일: 2026-08-24
대상 org: `trail-org` (alias) / username `aicrm_yusin846@gmail.com` / instance `https://trailsignup-783b48e7f9b1eb.my.salesforce.com`
사이트: `CorePress_Customer_Portal1` (Network Id `0DBgK000001mveXWAQ`), `urlPathPrefix = corepress`, Status **Live**
로그인 URL: `https://trailsignup-783b48e7f9b1eb.my.site.com/corepress/login` (⚠️ `/s/` 경로 아님)

---

## 0. 가장 먼저 확인할 것 — 미해결 이슈

**로그인 후 포털 홈(`/portal-home`)으로 자동 이동이 안 됨.**

- 로그인 폼(`sfdc_cms__view/login/content.json`)의 `startUrl`을 `portal-home`으로 설정하고 배포·Publish까지 했다고 사용자가 확인함.
- 그런데도 "고객포탈접속 → 로그인" 후 안내한 화면으로 안 넘어가고, 홈으로 가도 로그인 안 된 것처럼 보인다는 보고가 마지막 상태.
- 직접 URL 접속(`/corepress/portal-home`, `/s/` 없이)도 아직 재시도 결과를 못 받음.
- 다음 가설(미검증): Experience Builder에서 `portal-home` 페이지 자체가 "Active" 상태가 아닐 수 있음 — Builder의 페이지 목록에서 토글 확인 필요. API로 이 상태를 조회하는 방법을 못 찾았음(2번 시도, 둘 다 실패).
- **다음 세션 최우선 작업**: 이 리다이렉트 문제부터 마무리할 것.

---

## 1. 이번 세션에서 완료한 작업

### 1-1. 로컬-원격 git 동기화
- 로컬 Windows 체크아웃이 origin보다 뒤처져 있던 걸 발견, `git pull` + stash 충돌 정리로 동기화 완료.

### 1-2. PRT P1: 서비스 요청 목록/상세 실데이터 연결
- `cpServiceList`(신규 LWC) — 계정별 Case 목록, Apex 없이 LDS `getRelatedListRecords`.
- `cpServiceDetail` — 하드코딩 목업 → 실제 Case 데이터 바인딩, 처리 단계 동적 렌더링.
- `cpPortalError`(신규) — 영어 "Invalid Page" 대신 한국어 오류 화면.
- 신규 권한 세트 `CorePress_Service_Detail_Access`.

### 1-3. RFQ 현황 탭 추가
- `cpRfpPortal`에 "내 RFQ 현황" 탭 추가(RFP 현황 탭과 동일 목업 수준으로 시작).

### 1-4. RFP/RFQ → Opportunity 실연동 + 카탈로그 실데이터
- `cpRfpPortal.js`: RFP/RFQ 제출 시 실제 Opportunity 생성(각각 `Qualification`/`Proposal/Quote` 단계), 제목 중복 시 재제출 차단.
- `CpProductCatalogController`(신규) — 카탈로그 문의 모달의 "관심 제품" 드롭다운을 실제 Product2(압축기/드라이어 Family)로 연결.
- `CpCatalogLeadController` 버그 수정 — `Product_Interest__c`가 제한 픽리스트(압축기/드라이어/필터·부품/서비스)인데 특정 모델명을 넣으려다 실패하던 것 발견·수정 (Family로 매핑, 모델명은 Description에만 기록).
- `cpAssetList`/`cpAssetDetail` 이미지 매칭 정확도 수정 — 느슨한 부분 문자열 매칭 → 정확한 모델명 매칭.
- 신규 권한 세트 `CorePress_Opportunity_Portal_Access`.

### 1-5. SAL-05 / SAL-08 / SAL-09 구현
(SAL은 원래 팀 역할분담표상 "유진1" 담당이나, 사용자가 오늘 직접 처리하기로 확인함 — §4 참고)
- **SAL-05** (카탈로그 Lead 확인): 코드 변경 없음, 검증만. 대신 Lead 배정 규칙/큐가 org에 없다는 것 확인.
- **SAL-08** (RFP 제출 시 Lead 상태 갱신): 신규 Apex `CpSalesPipelineController.syncLeadOnRfpSubmit` — 같은 회사명의 미전환 Lead를 찾아 Status를 `제안 진행`으로 갱신. 실제 데이터로 검증 완료.
- **SAL-09** (제안서 제출/EC 전달): "내 RFP 현황"/"내 RFQ 현황" 탭을 실제 Opportunity 데이터로 연결(StageName 기준으로 두 탭에 분류), 첨부파일 있으면 실제 다운로드 링크.
- **추가 요청사항**: 신규 Lead와 포털에서 만든 Opportunity의 소유권을 `test.teamlead.backup@corepress.demo`(영업팀장대리, 리드 육성부터 Opty 관리 전담 계정)로 자동 이전하도록 `CpSalesPipelineController.reassignOpportunityOwner` 추가. `CpCatalogLeadController`도 신규 Lead 생성 시 이 계정 소유로 지정하도록 수정.
- Apex 테스트 21개 전부 통과, 실 데이터로 Lead/Opportunity 소유권 이전까지 확인함.

### 1-6. 로그인 페이지 로고
- 원인: 로고 자산이 클래식 ContentAsset이 아니라 Enhanced CMS Workspace("CorePress Portal Assets") 콘텐츠를 요구하는 구조.
- ContentAsset 2개(`X04_experience_header_logo_600x120`, `Dark_experience_header_logo_inverse`)를 게스트 공개로 전환해둠(이미 배포됨).
- 실제 로고 PNG를 org에서 추출해 사용자에게 전달함(다른 페이지 GNB와 동일 파일).
- **미해결**: CMS Workspace의 "Add" 버튼이 비활성 상태였음 — Contributors 확인 결과 사용자는 이미 Content Admin이라 권한 문제는 아님. Content Type 설정 문제로 추정했으나 확인 못 함. **로고 자체는 이번 세션에서 완료 못 함.**

### 1-7. 포털 헤더 계정 라벨 실데이터 연결
- 하드코딩된 "대한케미컬 · 김유신"이 남아있던 7개 파일(cpAssetList, cpAssetDetail, cpServiceList, cpServiceDetail, cpServiceRequest, cpQuoteList, cpRfpPortal) 전부 `Contact.Name · Account.Name`으로 교체.
- 실데이터 없을 때(미리보기)는 기존 문구를 기본값으로 유지, 매칭되면 실제 값으로 교체.
- 김재혁 Contact의 `Title`을 "설비관리팀 차장"으로 갱신(시나리오 일치).
- `CONTEXT.md` 신규 생성 — 도메인 용어 정리(공개 랜딩 vs 포털 홈, 헤더 계정 라벨, Account/Contact 구분).

---

## 2. ⚠️ 다른 세션과의 충돌 흔적 (중요)

이 로컬 저장소를 **여러 Claude 세션/팀원이 동시에 건드리고 있는 것으로 보임**. 이번 세션 도중 발견한 것들:

1. `docs/SESSION_HANDOFF_portal_login.md` — 다른 세션이 만든 문서. 같은 로그인 문제를 다른 각도(NetworkMemberGroup에 Login User 프로필 누락, 라이선스 잠긴 권한세트 문제)로 진단하고 고쳤음. **`CorePress_PRT_Customer_Login` 권한 세트는 그 세션이 만든 것으로, 로컬 git엔 없고 org에만 있음.**
2. `cpPortalHome.js/.html/.css`가 세션 도중 디스크에서 변경된 걸 발견 — **내가 한 게 아님**. 다른 세션이 이미 실제 Asset/Case 데이터 바인딩을 구현해놓은 상태(이전엔 100% 목업이었음). 이번 세션에서 되돌리지 않고 그대로 뒀음 — 다음 세션에서 내용 검토 후 커밋 필요.
3. `sfdc_cms__view/custom_service_list`, `sfdc_cms__route/custom_service_list__c`, `sfdc_cms__styles/*`, `sfdc_cms__brandingSet/Build_Your_Own_LWR/content.json`도 세션 도중 로컬 파일이 바뀐 게 확인됨 — 아마 다른 세션이 Builder에서 작업하며 자동 retrieve된 것으로 추정. **내용을 검토 안 한 상태.**
4. 로그인 계정 `kim.jaehyuk@daehan-corepress-poc.com`의 비밀번호를 이번 세션에서 `CorePress#2026Rfp!`로 설정했는데, 다른 세션 문서엔 그 이후 `CorePress2026!`로 다시 바꿨다고 기록돼 있음 — **현재 실제 비밀번호가 뭔지 불확실**. 다음 세션에서 재확인/재설정 필요.

**팀 운영 문서(`EXPERIENCE_CLOUD_공동개발_계획.md`)에 "동일 페이지를 동시에 두 명이 편집하지 않는다", "급히 수정 시 팀 채널에 기록한다"는 규칙이 있음 — 다음 세션 시작 전에 이 규칙이 지켜지고 있는지, 지금 커밋 안 된 변경 중 뭐가 남의 작업인지부터 정리하는 게 좋음.**

---

## 3. 커밋 안 된 변경사항 (이 문서 작성 시점)

```
M  digitalExperiences/.../sfdc_cms__brandingSet/Build_Your_Own_LWR/content.json   ← 남의 작업 추정, 미검토
M  digitalExperiences/.../sfdc_cms__route/custom_service_list__c/*               ← 남의 작업 추정, 미검토
M  digitalExperiences/.../sfdc_cms__styles/print_css/content.json                ← 남의 작업 추정, 미검토
M  digitalExperiences/.../sfdc_cms__styles/styles_css/content.json               ← 남의 작업 추정, 미검토
M  digitalExperiences/.../sfdc_cms__view/custom_service_list/*                   ← 남의 작업 추정, 미검토
M  digitalExperiences/.../sfdc_cms__view/login/content.json                      ← 내 작업 (startUrl 수정)
M  lwc/cpAssetDetail/*, cpAssetList/*, cpQuoteList/*, cpRfpPortal/*,
   cpServiceDetail/*, cpServiceList/*, cpServiceRequest/*                        ← 내 작업 (헤더 라벨 + 오늘 세션 기능)
M  lwc/cpPortalHome/*                                                            ← 남의 작업, 미검토
?? CONTEXT.md                                                                    ← 내 작업 (신규)
?? docs/ (여러 회의자료·인수인계 문서)                                              ← 남의 작업 추정
?? force-app/.../permissionsets/CorePress_PRT_Customer.permissionset-meta.xml    ← 남의 작업 추정
?? frontend/, scripts/, skills-lock.json, tmp/, .agents/, .claude/, deploy_err.txt, deploy_out.json ← 남의 작업 추정
```

**아직 커밋 안 한 내 작업**(이전 턴들에서 이미 커밋한 것 제외):
- 로그인 리다이렉트 수정(`login/content.json` startUrl)
- 포털 헤더 계정 라벨 7개 파일 + `CONTEXT.md`

다음 세션에서 커밋할 때는 위 "남의 작업 추정" 항목들을 먼저 사람에게 확인(또는 내용 diff 검토)한 뒤 포함 여부를 결정할 것 — 이번 세션에서도 매번 이 방식으로 스코프를 좁혀 커밋해왔음(전체 `git add -A` 금지).

---

## 4. 팀 역할분담 참고

- `EXPERIENCE_CLOUD_공동개발_계획.md`: 유신 담당 = PRT-01~66 + AGT-01~03. 다른 담당자 소유 메타데이터(Profile/Permission Set/Sharing/타 팀 Flow)는 직접 수정 금지 원칙.
- `PRD_선행개발_의존관계.md`: PRD(다정)가 SAL/CAS에 넘겨야 하는 선행 산출물 정리.
- SAL(영업 프로세스)은 원래 "유진1" 담당이나, 사용자가 "유진님꺼 내가 하기로했어"라고 확인해 이번 세션에서 SAL-05/08/09를 유신이 대신 구현함. **유진1 계정 자체가 org에 아직 없음** — Lead 자동 배정 등 유진1이 실제로 존재해야 하는 작업은 계정 생성 후로 미룸.

---

## 5. 테스트 계정

| 계정 | 용도 | 비고 |
|---|---|---|
| `kim.jaehyuk@daehan-corepress-poc.com` | 포털 로그인 테스트(김재혁, 대한케미컬_PRT 통합테스트 Account) | 비밀번호 불확실(§2-4 참고), Customer Community Plus **Login** 라이선스 |
| `test.teamlead.backup@corepress.demo` | 영업팀장대리 — Lead/Opportunity 소유자 | System Administrator 프로필, 이미 org에 존재 |
| `유신 김` (Contact) 연결 User | 김재혁 로그인 계속 막힐 때 우회용 백업 계정 | `docs/SESSION_HANDOFF_portal_login.md` §6 참고, 비밀번호 `CorePress2026!` |

---

## 6. 다음 세션 시작 순서 제안

1. `git status`로 로컬 상태 재확인, §2/§3의 "남의 작업" 파일들을 diff로 검토(누가 왜 바꿨는지).
2. §0 로그인 리다이렉트 문제부터 해결 (Builder 페이지 Active 상태 확인이 최우선 가설).
3. 김재혁 계정 비밀번호 재확인/재설정 후 실제 로그인 테스트.
4. 로고 CMS 업로드 마무리(Content Type 설정 확인).
5. 위 확인 끝나면 오늘 작업분 커밋.
