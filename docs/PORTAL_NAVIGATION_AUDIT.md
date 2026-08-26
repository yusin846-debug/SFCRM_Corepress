# CorePress Experience Cloud 내비게이션 점검

점검일: 2026-08-20  
대상 사이트: `CorePress_Customer_Portal1` (`/corepress/s/`)

## 현재 존재하는 페이지

| 화면             | Route                       | LWC                | 상태                      |
| ---------------- | --------------------------- | ------------------ | ------------------------- |
| 공개 랜딩        | 기본 Home                   | `cpPortalLanding`  | 구현됨                    |
| 고객 포털 홈     | `portal-home`               | `cpPortalHome`     | 구현됨                    |
| 보유 설비 목록   | `asset-list`                | `cpAssetList`      | 구현됨                    |
| 보유 설비 상세   | `asset-detail?recordId=...` | `cpAssetDetail`    | 구현됨                    |
| 서비스 요청 등록 | `service-request`           | `cpServiceRequest` | 구현됨                    |
| 서비스 요청 상세 | `service-detail`            | `cpServiceDetail`  | 정적 UI, 데이터 연결 필요 |
| RFP·RFQ          | `rfp-rfq`                   | `cpRfpPortal`      | 정적 UI, 데이터 연결 필요 |
| 견적조회         | `quotes`                    | `cpQuoteList`      | 정적 UI, 데이터 연결 필요 |

## 이번에 수정한 연결 오류

- 존재하지 않는 `rfp-list`를 실제 Route인 `rfp-rfq`로 통일
- Builder에 저장된 `/asset-list`, `/service-request`, `/quotes` 등의 도메인 루트 경로를 사이트 내부 상대 경로로 수정
- Builder의 홈 경로 `/`를 고객 포털 홈 `portal-home`으로 수정
- 로그아웃 후 복귀 경로를 `/corepress/s/login`으로 수정
- 공개 랜딩의 `전체 제품 보기`를 실제 제품 섹션 `#products`로 수정
- 서비스 목록 페이지가 없는 상태에서 목록으로 오인되던 문구를 `서비스 요청 등록`으로 수정
- 아직 없는 공지 목록 링크는 오류 페이지 대신 `공지 전체보기 준비 중`으로 표시

## 추가 개발 범위

우선순위는 실제 사용자 동선과 현재 Salesforce 데이터 연결 상태를 기준으로 정한다.

### P1 — 반드시 필요

1. **서비스 요청 목록 (`service-list`)**
   - 로그인 Contact의 Account에 연결된 Case 목록
   - 상태·설비·접수일 필터
   - 행 선택 시 `service-detail?recordId={CaseId}` 이동
   - 포털 홈의 `전체 서비스 요청 보기`, 설비 상세의 `전체 서비스 이력 보기`를 이 Route로 연결

2. **서비스 요청 상세 데이터 연결**
   - URL의 Case Id로 Case 조회
   - 처리 단계, 담당자, 방문 예정일, 첨부파일 표시
   - 계정 불일치 레코드 접근 차단

3. **404/Error 화면 정비**
   - 고객용 한국어 안내
   - `포털 홈으로`, `이전 페이지` 버튼
   - 존재하지 않는 Route가 노출되더라도 사용자가 복귀할 수 있도록 구성

### P2 — 업무 흐름 완성

4. **RFP·RFQ 목록/상세 데이터 연결**
   - 현재 한 페이지의 정적 탭을 실제 고객별 요청 데이터로 연결
   - 기술 제안서 PDF 링크를 ContentDocument에 연결

5. **견적 목록/상세 데이터 연결**
   - 현재 더미 견적을 실제 Quote/QuoteLineItem 또는 합의된 커스텀 구조로 교체
   - PDF 다운로드, 수락 상태 처리

6. **공지·보증 안내 목록 (`notices`)**
   - 공지, 보증 만료 안내, 기술자료 유형 구분
   - 상세 또는 파일 다운로드 연결

### P3 — 공개 사이트 확장

7. **제품 목록·제품 상세**
   - 랜딩의 `전체 제품 보기`, 각 제품의 `자세히 보기` 연결

8. **서비스 소개·기술자료·회사소개**
   - 현재 공개 랜딩 헤더의 `서비스`, `기술자료`, `회사소개`는 전용 콘텐츠가 없음
   - 독립 페이지 또는 랜딩 섹션으로 구현 후 메뉴 연결

## 연결 규칙

- Experience Cloud 내부 URL은 `portal-home`, `asset-list`처럼 사이트 상대 경로를 사용한다.
- `/asset-list`처럼 도메인 루트부터 시작하는 값은 사용하지 않는다.
- 상세 화면은 `route?recordId={SalesforceId}` 형식으로 통일한다.
- 존재하지 않는 Route를 임시 링크로 노출하지 않는다.
- 페이지 생성 후 LWC 기본값과 Builder 컴포넌트 속성을 함께 갱신한다.
