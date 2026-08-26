# 세션 이관 문서 — CorePress 고객 포털 로그인 / 로고 / 권한

작성일: 2026-08-24
대상 org: `trail-org` (alias) / username `<EMAIL_ADDRESS_1>` / instance `https://trailsignup-783b48e7f9b1eb.my.salesforce.com`

---

## 1. 현재 미해결 (최우선)

### 김재혁 차장 포털 로그인 실패

- **증상**: 로그인 화면에서 "Your login attempt has failed. Make sure the username and password are correct."
- **핵심 단서**: `LoginHistory`에 **새 실패 기록이 남지 않음** (마지막 기록은 2026-08-24T01:40:44 `No community access` 1건뿐).
  - LoginHistory는 유저 식별 성공 후에만 기록됨 → **인증 단계 이전에서 실패**한다는 의미 → username 매칭 또는 password 문제로 강하게 의심됨.
- **마지막 조치**: `System.setPassword('005gK000071kBuXQAU', 'CorePress2026!')` 를 깨끗하게 재실행 성공 (에러 없음).
- **다음 시도할 것 (진단 분기)**:
  1. 재로그인 후 `LoginHistory` 재확인.
     - 기록이 **남으면** → 인증 통과, 커뮤니티 접근/권한 문제로 방향 전환.
     - 기록이 **안 남으면** → username/password 매칭 문제 확정. username 앞뒤 공백, 붙여넣기 확인. 필요시 password 다시 setPassword 후 즉시 테스트.
  2. 올바른 로그인 URL 사용 여부 확인 (아래 §2 URL 주의).
  3. `sf data query`로 `SELECT Id,Status,UserType FROM User WHERE Id='005gK000071kBuXQAU'` — UserType=`PowerCustomerSuccess` (Plus) 확인됨, active=true 확인됨.

### 로그인 계정 정보 (설정한 값)

| 항목     | 값                                                        |
| -------- | --------------------------------------------------------- |
| Username | `<EMAIL_ADDRESS_0>`                                       |
| Password | `CorePress2026!`                                          |
| User Id  | `005gK000071kBuXQAU`                                      |
| Profile  | Customer Community Plus Login User (`00egK00000C6Yp7QAF`) |
| Contact  | `003gK00000zpUs9QAE` (김재혁)                             |
| Account  | `001gK00001MoZWrQAN` (대한케미컬_PRT 통합테스트)          |

---

## 2. URL 주의 — 사이트가 2개 존재 (중요)

| Site (CustomSite)            | URL prefix             | 성격                                     |
| ---------------------------- | ---------------------- | ---------------------------------------- |
| `CorePress_Customer_Portal`  | `/corepressvforcesite` | Visualforce 로그인 짝 사이트 (혼동 주의) |
| `CorePress_Customer_Portal1` | `/corepress`           | **실제 LWR 포털 — 로그인은 여기로**      |

- 두 Site는 같은 게스트 유저(`005gK00006xPSGzQAO`)를 공유 → 하나의 Network에 속함.
- Network: `CorePress Customer Portal` (`0DBgK000001mveXWAQ`), Status = **Live**.
- **올바른 로그인 URL**: `https://trailsignup-783b48e7f9b1eb.my.site.com/corepress/login`
- ⚠️ `sf community publish` 및 초기 안내가 준 `/corepressvforcesite` 는 잘못된 경로였음.

---

## 3. 이번 세션에서 완료한 작업

### (A) 사이트 활성화

- `networks/CorePress Customer Portal.network-meta.xml` 의 `<status>` 를 `UnderConstruction` → `Live` 로 변경 후 배포.
- `sf community publish --name "CorePress Customer Portal"` 실행 (publish 잡 시작됨).
- 로그인 페이지 HTTP 200 확인.

### (B) 사이트 멤버십 추가

- 같은 network-meta.xml 의 `<networkMemberGroups>` 에 프로필 추가:
  ```
  <profile>admin</profile>
  <profile>customer community plus user</profile>
  <profile>customer community plus login user</profile>   ← 추가함
  ```
- 이유: 김재혁의 프로필(Login User)이 멤버가 아니어서 "don't belong to any active experience" 에러 발생 → 추가로 해결.
- 배포 후 `NetworkMemberGroup` 에 `00egK00000C6Yp7QAF` 포함 확인, `NetworkMember` 에 유저 등록(`0DOgK000003CSRpWAO`) 확인.

### (C) 권한(퍼미션셋) 부여

라이선스 불일치 이슈로 우회함:

- **문제**: `CorePress_PRT_Customer` 퍼미션셋은 `<license>Customer Community Plus</license>` 로 잠겨 있는데, 김재혁은 **Login** 라이선스라 할당 거부 (FIELD_INTEGRITY_EXCEPTION).
- 메타데이터 재배포로 `<license>` 제거 시도 → **효과 없음** (org이 기존 라이선스 잠금 제거를 무시함, LicenseId 유지됨).
- 유저를 Plus 라이선스로 재생성 시도 → **실패** (PORTAL_USER_ALREADY_EXISTS_FOR_CONTACT: 한 Contact당 포털 유저 1개, 비활성 유저도 점유).
- **최종 해결**: 라이선스 잠금이 없는 **복제 퍼미션셋** 신규 생성.
  - 신규 파일: `force-app/main/default/permissionsets/CorePress_PRT_Customer_Login.permissionset-meta.xml`
  - 내용: `CorePress_PRT_Customer` 와 동일 권한 (Account/Contact/Asset/Case/ContentVersion object perms, Asset 5개 필드 FLS, `CpPortalFileController` apex) — `<license>` 만 제거.
  - 배포 성공.
- **최종 할당 (김재혁에게 3개 모두 확인됨)**:
  - `CorePress_PRT_Customer_Login` (신규, 라이선스 없음)
  - `CorePress_Opportunity_Portal_Access`
  - `CorePress_Service_Detail_Access`

> 앞으로 김재혁(Login 라이선스)에게 권한 추가 시 **라이선스 잠금 없는 퍼미션셋**을 써야 함. Plus 잠금 퍼미션셋은 할당 불가.

### (D) 원복해 둔 것

- `CorePress_PRT_Customer.permissionset-meta.xml` 의 `<license>Customer Community Plus</license>` 라인은 **org과 일치하도록 다시 복구**해 둠 (제거 시도했다가 되돌림).
- 옛 유저 username을 `.old` 로 바꿨다가 재생성 실패 후 **원래 username으로 복구 + 재활성화** 완료.

---

## 4. 로고 문제 (별건, 부분 진전)

- 로그인 화면 상단 COREPRESS 로고는 **현재 정상 표시됨** (스크린샷 확인).
- 다만 브랜딩 세트(`sfdc_cms__brandingSet/Build_Your_Own_LWR/content.json`)의 `SiteLogo` / `_SiteLogoUrl` 는 여전히 **빈 값**으로 되돌려 둔 상태.
- 로고 에셋은 **ContentAsset** (ManagedContent 아님):
  - `X04_experience_header_logo_600x120` = `03SgK000001ozHRUAY` (외부 가시 true)
  - `Dark_experience_header_logo_inverse` = `03SgK000001rALdUAM`
- **막힌 지점**: `SiteLogo` 에 raw ContentAsset Id 넣으면 "None of the rules validated" 거부, `/file-asset/...` 넣으면 opaque 서버 에러. `ExperienceSiteLwr` 스키마 MCP는 이 org에서 **비활성**("Access to experts knowledge is not enabled").
- **권장 접근**: 사이트가 이제 Live이므로 **Experience Builder에서 로고를 한 번 지정 → `sf project retrieve start --metadata DigitalExperienceBundle` 로 정확한 JSON 포맷을 캡처** 후 버전관리에 반영. 추측 배포는 그만할 것.

---

## 5. 참고 — 유용한 조회 커맨드

```bash
# 로그인 실패 기록
sf data query --target-org trail-org --json \
  --query "SELECT LoginTime, Status, Application FROM LoginHistory WHERE UserId='005gK000071kBuXQAU' ORDER BY LoginTime DESC LIMIT 8"

# 김재혁 상태
sf data query --target-org trail-org --json \
  --query "SELECT Username, IsActive, Profile.Name, Profile.UserType FROM User WHERE Id='005gK000071kBuXQAU'"

# 사이트/URL prefix
sf data query --target-org trail-org --json \
  --query "SELECT Name, UrlPathPrefix, Status FROM Site"

# 할당된 퍼미션셋
sf data query --target-org trail-org --json \
  --query "SELECT PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId='005gK000071kBuXQAU' AND PermissionSet.IsOwnedByProfile=false"

# 비밀번호 재설정 (익명 Apex)
# System.setPassword('005gK000071kBuXQAU', 'CorePress2026!');
```

## 6. 두 번째 포털 유저 (대안 계정)

- `<EMAIL_ADDRESS_2>` — User Id `005gK00006zxg9fQAA`, Profile = Customer Community Plus **User** (Plus 라이선스), Contact = 유신 김.
- 이미 사이트 멤버. 비밀번호 `CorePress2026!` 로 설정해 둠. 김재혁이 계속 막히면 이 계정으로 우회 로그인 테스트 가능.
