# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

CorePress 고객 포털 — Salesforce DX 프로젝트로 구축한 Experience Cloud(LWR) 고객 셀프서비스 포털이다. 로그인한 고객은 보유 설비(Asset) 조회, 서비스 요청(Case) 등록·추적, RFP/RFQ 제출(Opportunity), 견적 조회를 한다. 게스트에게는 공개 랜딩이 보이며, 이 페이지의 카탈로그 문의 폼은 Lead를 생성한다.

UI 문자열, 픽리스트 값, 대부분의 문서는 한국어다. Apex/JS 주석은 영어다. 코드를 수정할 때 이 두 관례를 그대로 유지한다.

**배포 대상은 여러 팀원이 동시에 개발하는 단일 공유 프로덕션 조직(CLI 별칭 `prod org`)이다.** 실무상 스크래치 조직은 쓰지 않는다. 아래 규칙 대부분이 여기서 나온다.

## 명령어

```bash
npm run lint                 # aura/lwc JS 대상 eslint
npm run test:unit            # sfdx-lwc-jest (현재 LWC 테스트는 없음)
npm run test:unit -- --findRelatedTests force-app/main/default/lwc/cpAssetList/cpAssetList.js
npx sfdx-lwc-jest -- -t "renders header"   # 테스트 이름으로 단건 실행
npm run prettier             # cls/html/js/xml/md 포맷 (prettier-plugin-apex + plugin-xml)
npm run prettier:verify
```

Husky `pre-commit`이 lint-staged를 실행한다: 스테이징된 파일에 prettier + eslint + `sfdx-lwc-jest --bail --findRelatedTests`.

Salesforce CLI (`sf`가 PATH에 있음. 문서에서는 `npx --yes @salesforce/cli`도 사용):

```bash
sf project deploy start --source-dir force-app/main/default/lwc/cpServiceList --target-org "prod org"
sf project deploy start --dry-run --source-dir <paths> --target-org "prod org"   # 먼저 검증
sf apex run test --tests CpSalesPipelineControllerTest --result-format human --wait 10 --target-org "prod org"
sf project retrieve start --metadata DigitalExperienceBundle:site/CorePress_Customer_Portal1 --target-org "prod org"
```

**디렉터리 전체 배포(`--source-dir force-app`)는 절대 금지.** 변경한 컴포넌트 경로만 명시해 배포하고, 먼저 dry-run한다. 같은 조직과 같은 로컬 트리에 다른 팀원의 무관한 메타데이터가 들어 있다.

## 절대 원칙 (`EXPERIENCE_CLOUD_공동개발_계획.md` 기준)

취향이 아니라 팀 규칙이다.

- 오브젝트를 생성·삭제하지 않고, 필드 API Name·타입·필수 여부를 변경하지 않으며, 픽리스트 값을 수정하지 않는다. 필요한 필드가 없으면 임시 필드를 만들지 말고 이슈로 보고한다.
- 다른 담당 영역의 메타데이터를 수정하지 않는다: `objects/**`와 모든 필드 메타데이터, Profile, SEC 소유의 Permission Set·Sharing, 타 팀 Flow, Page Layout, Record Type, 관리 패키지(FSL) 컴포넌트.
- 포털 컴포넌트는 `cp*` 접두사를 쓴다. 우리 소유는 포털 LWC, 포털 정적 리소스, `CorePress_Customer_Portal1` 사이트 번들, 포털 내비게이션 메뉴뿐이다.
- `git add -A` 금지. 다른 세션과 Experience Builder 자동 retrieve 때문에 디스크의 파일이 수시로 바뀐다. 직접 건드린 경로만 스테이징하고, 예상 못 한 변경은 diff로 확인한 뒤 포함 여부를 정한다.

## 아키텍처

**포털 페이지 = LWC + 사이트 route/view 메타데이터.** 각 페이지는 자체 헤더·내비게이션·CSS를 포함한 독립 LWC 하나이며(공유 레이아웃 컴포넌트는 없다) LWR 라우트에 배치된다.

- `force-app/main/default/digitalExperiences/site/CorePress_Customer_Portal1/sfdc_cms__route/<name>__c/content.json` — URL 접두사(`urlPrefix`)와 활성화할 view.
- `.../sfdc_cms__view/<name>/content.json` — 컴포넌트 트리. 말단의 `"definition": "c:cpServiceList"` 노드의 `attributes`가 곧 LWC의 `@api` 속성이므로, 페이지 간 이동 URL은 코드에 하드코딩하지 않고 여기서 설정한다.

페이지 추가 = LWC 신규 + route JSON + view JSON, 그리고 배포 후 Experience Builder에서 **Publish**까지 해야 한다(배포만으로는 반영되지 않는다).

**데이터 접근은 LDS 우선.** 컴포넌트는 `@salesforce/schema/*` import와 함께 `getRecord`/`getRelatedListRecords`/`createRecord`를 쓴다. 일반 조회를 Apex SOQL로 하지 않는다. 모든 페이지는 동일한 체인으로 조회 범위를 얻는다: `USER_ID` → `User.ContactId` → `Contact.AccountId` → 해당 Account의 Asset/Case/Opportunity. 새 페이지를 만들 때 이 wire 체인을 그대로 따른다.

**Apex는 LDS로 불가능한 곳에만 존재한다** — 4개 컨트롤러 전부 의도된 예외다.

- `CpCatalogLeadController` / `CpSalesPipelineController` — `without sharing`. Guest User(Lead 생성)와 포털 사용자가 오브젝트 직접 접근 권한을 얻지 않게 하기 위함이다. `CpSalesPipelineController`는 RFP/RFQ 전 과정(`CorePress_RFP__c`, 고객 노출용 이력 `CorePress_RFP_Event__c`, Opportunity 전환)을 담당하고, 신규 Lead·Opportunity 소유권을 `saleskim@corepress.demo`로 넘긴다. 포털에는 포털 안전 DTO(`RfpSummary`/`RfqSummary`/`TimelineEntry`)만 반환한다.
  - **제안서 제출 여부는 `제안서 제출` 이벤트로만 판정한다.** 첨부 파일 존재는 근거가 될 수 없다 — `submitRfp()`가 고객이 올린 RFP 원본을 같은 레코드에 링크하기 때문이다. 화면도 저장된 이벤트만 렌더링하고 합성 행을 만들지 않는다.
- `CpPortalFileController` — `with sharing`. 파일 첨부 전에 호출자의 Contact가 해당 Case의 소유 고객사인지 재확인한다(2MB 제한).
- `CpProductCatalogController` — 카탈로그 문의 픽리스트를 실제 `Product2` Family 값으로 채운다.

Lead의 `Product_Interest__c`는 `Product2.Family`에 맞춘 **제한(restricted)** 픽리스트다(`압축기`/`드라이어`/`필터·부품`/`서비스`). 모델명은 `Description`에만 기록한다. 다른 값을 넣으면 insert가 실패한다.

**미리보기 폴백 패턴.** 컴포넌트는 `isPreview = true`와 모듈 상수 목업(예: `ASSETS`, 헤더 라벨 `대한케미컬 · 김유신`)으로 시작해서, Experience Builder 미리보기와 Contact 미연결 내부 사용자에게도 화면이 렌더링되게 한다. 실제 wire 데이터가 들어오면 `isPreview = false`가 되고 목업이 교체된다. 필드나 페이지를 추가할 때 두 경로를 함께 유지해야 한다 — 실데이터 교체가 없는 하드코딩 값은 버그다.

**이미지는 정적 리소스**이며 `@salesforce/resourceUrl/CorePress*`로 import한다. 모델-이미지 매칭은 부분 문자열이 아니라 정확한 모델명 매칭이어야 한다.

**필드 수준 접근 권한은 기능별 Permission Set으로 배포한다**(`CorePress_Service_Detail_Access`, `CorePress_Opportunity_Portal_Access`). 화면 하나가 필요로 하는 커스텀 필드에만 읽기 전용 FLS를 준다. 포털에 새 필드를 노출하려면 대응하는 permission set 항목이 있어야 하고, 없으면 고객에게 빈 값으로 보인다. 다른 세션이 만들어 조직에만 있고 git에는 없는 permission set이 있다(예: `CorePress_PRT_Customer_Login`).

## 함정

- **git이 조직보다 한참 뒤처져 있다.** 조직엔 LWC 19개·Apex 62개가 있는데 git엔 일부만 있다. 로컬 파일을 그대로 고쳐 배포하면 남의 작업을 되돌린다. **파일을 건드리기 전에 그 파일만 retrieve해서 무수정 상태로 베이스라인 커밋을 남기고, 그 위에 수정한다** — 그래야 diff가 실제 변경만 보여준다. 전체 retrieve는 남의 미완성 작업과 `objects/**`까지 끌어오므로 금지. retrieve 전에 `git diff`로 사라지는 코드에 조직 쪽 후속 구현이 있는지 확인한다.
- **CI/CD가 없다.** `git push`와 조직 배포는 무관하다. `sf project deploy start`는 현재 체크아웃된 작업 디렉터리 파일을 그대로 보낸다. 병합은 배포의 전제 조건이 아니지만, **배포 전에 푸시**해야 라이브 코드가 원격에 남는다.
- **`CpSalesPipelineControllerTest`는 조직에서 컴파일 실패 상태다.** 공용 `TestDataFactory`가 교체되면서 `createAccount(String, Boolean)`, `createContact(Id, String, Boolean)`, `createCatalogLead(...)`가 없어졌다. 영업 트랙 Apex는 당분간 `--test-level NoTestRun`으로 배포해야 한다.
- **사이트 메타데이터가 둘인데, 하나는 포털이 아니다.** `networks/CorePress Customer Portal` + `sites/CorePress_Customer_Portal`은 예전 Visualforce 사이트다(`urlPathPrefix: corepressvforcesite`, UnderConstruction). 실제 운영 포털은 LWR 번들 `digitalExperiences/site/CorePress_Customer_Portal1`이며 `/corepress/...`로 서비스된다 — **경로에 `/s/`가 없다.**
- `manifest/package-branding.xml`은 의도적으로 범위를 좁힌 브랜딩 전용 패키지다(ContentAsset/BrandingSet/LightningExperienceTheme/CustomApplication). `BRANDING_README.md` 참고. ContentAsset은 `.png`와 동일 바이트의 `.asset` 파일을 함께 갱신해야 한다.
- `docs/SESSION_HANDOFF_*.md`에 현재 미해결 이슈(`/portal-home` 로그인 리다이렉트, CMS 로고 업로드, 불확실한 테스트 계정 비밀번호)와 어떤 미커밋 파일이 다른 세션 작업인지가 기록돼 있다. 작업 시작 전 최신 문서를 읽는다.
- `CONTEXT.md`가 도메인 용어를 확정한다 — 공개 랜딩(사이트 루트, 항상 게스트용) vs 포털 홈(`/portal-home`, 로그인 대시보드), Account = 고객사, Contact = 담당자. 이 용어를 쓰고 홈/메인/고객/계정은 피한다.

## 저장소 내 참고 문서

`CONTEXT.md`(도메인 용어) · `EXPERIENCE_CLOUD_공동개발_계획.md`(소유권, PRT/AGT 범위, 배포 규칙) · `PRD_선행개발_의존관계.md`(영역 간 의존관계) · `BRANDING_README.md` · `docs/`(세션 이관 문서).
