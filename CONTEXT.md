# CorePress 고객 포털 (PRT)

Experience Cloud 기반 CorePress 고객 셀프서비스 포털. 로그인한 고객이 보유 설비, 서비스 요청, RFP/RFQ, 견적을 조회·제출하는 영역이다.

## Language

**공개 랜딩**:
로그인 여부와 무관하게 항상 동일하게 보이는 사이트 루트(`/`) 페이지. 게스트 방문자에게 제품·카탈로그를 소개하고 "고객 포털 접속" 버튼으로 로그인을 유도한다. 로그인 상태를 반영하지 않는다 — 로그인한 사용자가 다시 루트로 돌아와도 이 화면이 그대로 보인다.
_Avoid_: 홈, 메인 페이지

**포털 홈**:
로그인한 고객 전용 대시보드 화면(`/portal-home`). 로그인 성공 시 곧바로 이동해야 하는 화면이며, 설비·서비스 요청 현황 요약을 보여준다.
_Avoid_: 홈, 메인, 대시보드

**헤더 계정 라벨**:
포털 페이지(포털 홈 포함 전 화면 공통) 우상단에 표시되는 텍스트, 현재는 `"대한케미컬"` 하드코딩 고정값(회사명 단독)이다. 이전엔 담당자 이름("· 김재혁")도 함께 표시됐지만, 2026-08-24 발표용 데모 요청에 따라 회사명만 남기고 이름은 제거됨. `contactId`/`accountId` 자체(로그인 사용자 → Contact → Account 매핑)는 각 페이지의 실제 데이터 조회(Asset/Case/Opportunity)와 레코드 생성에 계속 쓰이므로 라벨과 무관하게 유지된다.
_Avoid_: 실데이터 라벨, 로그인 정보 표시

**어카운트(고객사) / 콘택트(담당자)**:
포털의 데이터 조회 범위는 항상 로그인 사용자의 Contact → 그 Contact가 속한 Account 기준이다.
_Avoid_: 고객, 계정 (Account/User 구분이 흐려짐)

**김재혁 / 김설비**:
대한케미컬(고객사) 소속 두 페르소나. 시나리오상 등장 시점이 다르므로 별개 포털 로그인 유저다.
- **김재혁**(설비관리팀 차장, `kim.jaehyuk@daehan-corepress-poc.com`): 시나리오 1(카탈로그 요청·신규 설비 도입) 담당. RFP/RFQ 제출, 견적 조회를 시연한다.
- **김설비**(설비관리팀 팀장, `kim.seolbi@daehan-corepress-poc.com`): 시나리오 2·3(정례 서비스, 노후 설비 교체) 담당. 서비스 요청 등록, 진단 견적 승인, 교체 요청을 시연한다.
둘 다 Customer Community Plus Login 라이선스 포털 유저이며 같은 4개 permission set(포털 접근, 오포튜니티 포털, 서비스 상세, 견적 포털)을 부여받는다. 비밀번호는 데모 편의상 동일(`CorePress2026!`).
_Avoid_: 하나의 페르소나로 두 시나리오 시연 (스토리 훼손)

**김영업(SALES_OWNER)**:
포털에서 접수된 Lead와 Opportunity의 소유자로 지정되는 CorePress 내부 영업사원 유저(`saleskim@corepress.demo`). 두 컨트롤러(`CpCatalogLeadController`, `CpSalesPipelineController`)의 `SALES_OWNER_USERNAME` 상수로 참조되며, 이 유저가 없거나 비활성이면 소유권 재할당은 조용히 스킵된다. 프로필은 Minimum Access - Salesforce라 Lead/Opportunity 접근은 별도 permission set `CorePress_Sales_Owner`로 부여된다.
_Avoid_: 시스템 관리자(admin) 소유 (실제 영업 담당자 아니므로 시연 흐름 어색)
