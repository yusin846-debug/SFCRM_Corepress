# CorePress 브랜딩 배포 패키지

이 패키지는 CorePress의 시각 테마, 로고 자산과 Lightning 앱 껍데기만 다룹니다. 허용 메타데이터는 ContentAsset, BrandingSet, LightningExperienceTheme, CustomApplication 네 종류뿐이며 Salesforce 데이터 모델이나 자동화를 생성·수정하지 않습니다.

## 배포 명령

```powershell
npx --yes @salesforce/cli project deploy start --manifest manifest/package-branding.xml --target-org <별칭>
```

연결된 Trailhead 조직에서는 `<별칭>` 대신 `trail-org`를 사용할 수 있습니다.

## 배포 전 확인사항

1. 대상 조직의 Lightning Experience Theme 슬롯에 여유가 있는지 확인합니다. 조직 상태에 따라 기존 사용자 정의 테마를 비활성화하거나 삭제해야 할 수 있습니다.
2. `contentassets`의 투명 placeholder를 실제 CorePress 로고로 교체하고, 대응하는 `.asset` 파일에도 같은 PNG 바이트를 반영합니다.
3. 조직에서 source tracking을 지원하지 않으면 `project deploy preview` 대신 아래 check-only 명령으로 검증합니다.

```powershell
npx --yes @salesforce/cli project deploy start --dry-run --manifest manifest/package-branding.xml --target-org <별칭>
```

## 영향을 주지 않는 항목

이 패키지는 오브젝트, 필드, Record Type, Business Process, Compact Layout, Page Layout, 모든 FlexiPage, 이메일 템플릿, Letterhead, 프로필, Permission Set, Flow, Workflow, Apex, Trigger, 검증 규칙, 번역, Experience Cloud 사이트, Queue, 공유 규칙, Report 및 Dashboard 메타데이터에 영향을 주지 않습니다.

## 팀 협업

이 패키지는 브랜딩만 다루므로 `objects/`, `layouts/`, `classes/` 등 데이터 구조 디렉토리와 충돌하지 않습니다. 다른 팀원의 작업과 동시에 배포할 수 있습니다.

## Salesforce 소스 형식 참고

ContentAsset은 사람이 교체하기 쉬운 `.png`와 Metadata API 배포에 필요한 동일 바이트의 `.asset` 파일을 함께 둡니다.
