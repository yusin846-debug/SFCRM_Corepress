# CorePress Experience Cloud 공동개발 계획

## 1. 목적과 절대 원칙

담당자는 유신이며 개발 범위는 `PRT-01~PRT-66`과 `AGT-01~AGT-03`이다.

이 프로젝트는 하나의 공통 Salesforce 프로덕션 조직(`trail-org`)에서 여러 팀원이 동시에 개발한다. 따라서 다음을 절대 원칙으로 한다.

1. 오브젝트를 새로 만들거나 삭제하지 않는다.
2. 기존 필드의 API Name, 데이터 타입, 관계, 길이, 필수 여부를 변경하지 않는다.
3. Picklist 값을 임의로 추가·수정·삭제하거나 순서를 바꾸지 않는다.
4. Page Layout, Permission Set, Profile, Sharing, Flow 등 다른 담당자 소유 메타데이터를 덮어쓰지 않는다.
5. 필요한 필드가 없거나 정의와 실제 조직이 다르면 임시 필드를 만들지 않고 담당자와 PL에게 이슈로 전달한다.
6. 배포는 작업 디렉터리 전체가 아니라 승인된 컴포넌트 목록만 지정한다.
7. 배포 직전 조직의 최신 버전을 다시 확인하고 validate-only 후 실제 배포한다.

## 2. 현재 확인된 상태

- 기본 대상 조직은 `trail-org`이며 연결 상태는 정상이다.
- 로컬 디렉터리는 현재 Git 저장소가 아니다.
- 로컬 `force-app`에는 CorePress 브랜딩 메타데이터만 존재한다.
- 조직에서 `Network`, `CustomSite`, `ExperienceBundle`, `NavigationMenu`가 조회되지 않았다.
- 즉, 업무분담표의 선행조건 `PRE-06 Experience Cloud 준비`는 아직 완료되지 않은 것으로 보인다.
- 조직에는 다른 팀원이 만든 Case 관련 Flow와 Field Service 관련 메타데이터가 이미 존재한다. 전체 retrieve 또는 전체 deploy는 충돌 위험이 크다.

## 3. 오늘 개발 전 필수 합의

### 공통 담당자 또는 PL에게 확인

- Experience Cloud 기능 활성화 여부
- 생성할 사이트의 정확한 Name, URL Path Prefix, Template
- 사이트 생성 담당자 1명 지정
- 고객 라이선스와 테스트 Contact/User
- 사이트 공개·게시 권한 보유자

### SEC 담당 범위와 합의

- 고객 Sharing Set: 자기 Account의 Asset과 자기 Contact의 Case만 조회
- 고객 Profile/Permission Set의 Object 및 Field 권한
- 고객이 편집 가능한 필드와 읽기 전용 필드
- ContentDocumentLink 공개범위

### 데이터 계약

- 화면에서 사용할 API Name은 `Object(Field).csv`와 조직 describe 결과가 모두 일치할 때만 사용한다.
- 불일치하면 코드에 임의 이름을 넣지 않고 `BLOCKED_FIELD_CONTRACT`로 기록한다.
- 화면 Label은 자유롭게 디자인할 수 있지만 데이터 바인딩은 확정 API Name만 사용한다.

## 4. 팀별 인터페이스

| 상대 담당자 | 받는 것 | 유신이 전달할 것 |
|---|---|---|
| 다정 / PRD | Product, Asset, Warranty, 세대관계 필드와 테스트 데이터 | 포털 Asset 목록·상세에서 실제로 참조한 필드 목록 |
| 유진1 / SAL+APR | Lead, RFP/RFQ, Quote 상태와 출력 데이터 | `PRT-05` 자료 신청 결과, RFP/RFQ 제출 payload, 포털 견적 표시 계약 |
| 성하1 / CAS | Case 상태, 보증판정, 승인·미러 필드 | `PRT-36` Case 생성 결과와 고객 입력 필드 목록 |
| 정민2 / WO | 조치내역, 사용부품, 보고서, 견적금액 | 포털 서비스 상세에서 필요한 읽기 모델 |
| 지현1 / DSP+MOB | 방문일시, 엔지니어, 작업상태, 설치완료 데이터 | 포털에서 표시할 값과 갱신 확인 시나리오 |
| 공통 PRE | Experience Cloud 및 Messaging 활성화 | 사이트/채널에 필요한 정확한 설정 요청 |
| 공통 SEC | Profile, Permission Set, Sharing Set, FLS | LWC/Flow가 요구하는 최소 권한 목록 |

## 5. PRT 개발 묶음과 착수 조건

### A. 포털 기반과 공개 랜딩 (`PRT-01~05`)

- 선행: `PRE-06` 사이트 생성
- 구현: 랜딩, 카탈로그, 신청 모달, 개인정보·마케팅 동의, PDF 다운로드
- 데이터 변경 금지: Lead의 기존 표준/커스텀 필드만 사용
- 인계: `PRT-05` 결과를 유진1의 `SAL-05`에 전달

### B. RFP/RFQ와 견적 (`PRT-06~18`)

- 선행: 고객 로그인, SEC 권한·Sharing, SAL 데이터 계약
- 구현: RFP 제출, 첨부, 제안 조회, RFQ 제출, Quote 조회
- 주의: RFP/RFQ 전용 오브젝트나 필드가 확정되지 않았으면 생성하지 않고 UI 골격과 계약 문서까지만 진행

### C. Asset 목록·상세 (`PRT-19~30`)

- 선행: PRD Asset 필드/테스트 데이터, SEC Sharing Set
- 구현: 고객별 Asset 목록, 상태, 모델·시리얼·설치·보증 정보
- 완료 산출물: `PRT-28` 설비 상세 컨텍스트를 AGT에 전달

### D. 서비스 요청 생성 (`PRT-31~37`)

- 선행: CAS와 Case 입력 계약, SEC 파일 권한
- 구현: 선택 Asset 고정, 증상·상세·긴급도·첨부, Case 생성, 접수번호와 이메일
- 인계: `PRT-36`을 성하1의 `CAS-01`, `CAS-10`에 전달
- 금지: Case 필드나 Picklist를 포털 편의를 위해 임의 변경하지 않음

### E. 서비스 진행·완료 조회 (`PRT-38~55`)

- 선행: CAS 판정값, DSP 배정값, WO/MOB 완료값
- 구현: 보증판정, 방문·엔지니어, 승인, 조치, 부품, 보고서, 이력
- 원칙: 포털은 다른 팀의 원본 필드를 수정하지 않고 읽기 전용으로 표시. 고객 승인 필드만 SEC 합의 후 편집

### F. 교체·정비·신규 설비 (`PRT-56~66`)

- 선행: PRD 교체후보·정비지표·세대관계, SAL 교체제안, MOB 설치완료
- 구현: 교체 제안 연결, 누적 정비 이력, 신규 Asset, 보증, 구설비 폐기 표시

### G. Agentforce 문의 (`AGT-01~03`)

- 선행: `PRE-07` Agentforce/Messaging 채널, `PRT-28` Asset 상세
- 1차 범위: 문의 진입, Asset 지정, 증상 자연어 입력
- 제외: 자가조치 답변과 Case 자동 생성

## 6. 오늘의 실행 순서

### 0단계 — 변경 동결과 백업

1. 팀 채널에 오늘 작업시간, 대상 사이트, 수정할 메타데이터 목록을 공지한다.
2. Experience Cloud 사이트 생성 담당자를 한 명으로 고정한다.
3. 로컬 프로젝트를 Git으로 관리하고 현재 브랜딩 상태를 기준 커밋으로 남긴다.
4. 조직의 기존 사이트 관련 메타데이터를 선택적으로 retrieve해 기준본을 만든다.

### 1단계 — 사이트 셸

1. PRE 담당자가 Experience Cloud를 활성화하고 사이트를 1회 생성한다.
2. 유신은 사이트 이름과 URL이 확정된 뒤 Navigation과 페이지 셸을 구성한다.
3. 브랜드 로고·색상만 연결하고 다른 앱이나 전역 테마는 수정하지 않는다.

### 2단계 — 충돌이 적은 화면부터

1. Landing과 Catalog 영역
2. Asset 목록/상세용 재사용 LWC의 표시 골격
3. Service Request 입력 UI 골격
4. 서비스 상세 읽기 UI 골격

데이터 계약이 미확정인 부분은 하드코딩 필드나 임시 필드를 만들지 말고 명시적인 TODO/차단 상태로 둔다.

### 3단계 — 확정 데이터 연결

1. PRD에서 Asset·Warranty 계약을 받은 뒤 Asset 화면 연결
2. CAS와 Case 생성 payload를 합의한 뒤 서비스 요청 연결
3. SAL과 Lead/RFP/RFQ/Quote 계약을 합의한 뒤 영업 화면 연결
4. WO/DSP/MOB 결과 필드를 받은 뒤 서비스 상세 연결

### 4단계 — AGT 연결

1. Messaging 채널 확인
2. 포털 공통 문의 버튼 배치
3. Asset 상세의 recordId/context 전달
4. 문의가 Case를 생성하지 않는지 검증

### 5단계 — 안전 배포

1. 변경한 컴포넌트만 `sf project deploy validate` 대상으로 지정
2. 배포 목록에 `objects`, `fields`, 다른 담당자의 `flows`, `permissionsets`, `profiles`가 포함되지 않았는지 확인
3. validate 결과와 배포 목록을 팀에 공유
4. 팀원의 동시 변경 여부를 재확인한 뒤 동일 목록만 배포
5. 게스트·고객·내부 사용자별 smoke test 후 게시

## 7. 메타데이터 소유권과 배포 허용 목록

### 유신이 소유해도 되는 항목

- CorePress 포털 전용 LWC/Aura 컴포넌트
- CorePress 포털 전용 정적 리소스
- 확정된 사이트의 ExperienceBundle/DigitalExperienceBundle 페이지
- 포털 전용 Navigation Menu
- 이름 충돌이 없는 포털 전용 Flow(사전 합의된 경우만)

### 직접 수정 금지

- `objects/**`와 모든 Field 메타데이터
- Global Value Set 및 Picklist 정의
- 타 담당자가 소유한 Flow
- Profile, Permission Set, Sharing Rule/Set
- PRD·SAL·CAS·WO·DSP·MOB의 Page Layout과 Record Type
- 관리 패키지(FSL 등) 컴포넌트

## 8. 충돌 방지 운영 규칙

- 컴포넌트 이름은 `cpPortal*` 또는 합의된 접두사를 사용한다.
- 동일 Experience Builder 페이지는 동시에 두 명이 편집하지 않는다.
- Builder에서 수정 후 즉시 메타데이터를 retrieve하고 변경 파일을 확인한다.
- 전체 `force-app` 배포 명령을 사용하지 않는다.
- 조직에서 급히 수정한 경우 수정자·시간·컴포넌트 이름을 팀 채널에 기록한다.
- 배포 실패 시 누락된 필드를 생성해서 우회하지 않는다.
- 하루 종료 전 수정 목록, 참조 필드, 미해결 의존성을 공유한다.

## 9. 오늘의 완료 기준

- 사이트 셸과 Navigation이 확정되어 있다.
- 공개 Landing과 고객 로그인 후 기본 페이지가 열린다.
- Asset 목록/상세와 서비스 요청 UI 골격이 있다.
- 실제 연결된 모든 API Name 목록이 기록되어 있다.
- 다른 팀 소유 메타데이터와 데이터 구조 변경이 0건이다.
- validate-only 배포가 성공하거나, 선행조건별 차단 사유가 기록되어 있다.
