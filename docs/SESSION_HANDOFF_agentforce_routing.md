# 세션 이관 — CorePress Agentforce Messaging 라우팅 미작동

작성일: 2026-08-25
작성자: 유신 (yusin846@gmail.com)
대상 org: `trail-org` (My Domain: `trailsignup-783b48e7f9b1eb`)
사이트: `CorePress Customer Portal` (LWR, prefix `/corepress`, Status Live)
관련 문서: `docs/SUPPORT_CASE_AGENTFORCE_ROUTING.md` (Support 케이스 초안)

---

## TL;DR

- **봇 자체는 정상 작동함** (Agentforce Builder의 "Try it" 미리보기에서 실시간 응답 확인)
- **포털 임베드에서 세션 라우팅이 안 됨** — 세션은 만들어지지만 `Status=Waiting / AgentType=System`에서 멈춤, `AgentWork` 생성 안됨
- **원인**: Salesforce 백엔드의 org-level Agentforce provisioning 미완료로 잠정 결론
- **자체 해결 불가** — client-side(채널·Deployment·페이지 바인딩) 완전 재구성해봤지만 동일 실패
- **다음 단계 선택지**: (a) Salesforce Support 케이스 접수 or (b) 데모용 대체 시연 전략

---

## 1. 현재 상태 (인프라)

### 1-1. 잘 되는 부분

- Agent `CorePress_Support_Agent` v3: **Active**, Builder에서 "Try it" 실시간 응답 O
- Bot 토픽/액션/시스템 메시지 배포 완료
- Genie/GenAI 관련 permission set 부여 완료

### 1-2. 라우팅 실패 부분

- 이 org의 어떤 Enhanced Messaging Web 채널이든 세션 라우팅이 되지 않음
- 옛 채널·새 채널(v2) 두 경로 모두 동일 증상 → **채널 단위 문제가 아니라 org 단위 문제**

### 1-3. 리소스 인벤토리

**Bot / Agent**

| 항목              | 값                                                     |
| ----------------- | ------------------------------------------------------ |
| Bot DeveloperName | `CorePress_Support_Agent`                              |
| Active version    | v3                                                     |
| 파일              | `force-app/main/default/bots/CorePress_Support_Agent/` |

**옛 채널 (Support 진단용 보존)**

| 항목                                     | 값                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Channel DeveloperName                    | `CorePress_Agent_Web`                                                              |
| Channel Id                               | `0MjgK000000XvNhSAK`                                                               |
| Deployment DeveloperName                 | `CorePress_Agent_Web`                                                              |
| Deployment Site Endpoint                 | `https://trailsignup-783b48e7f9b1eb.my.site.com/ESWCorePressAgentWeb1787644157621` |
| **실패 세션 Id (Support가 열어볼 대상)** | `0MwgK00000DZhtpSAD`                                                               |

**새 채널 (동일 증상, Support 진단용 보존)**

| 항목                     | 값                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------ |
| Channel DeveloperName    | `CorePress_Agent_Web_v2`                                                             |
| Channel Id               | `0MjgK000000XzJFSA0`                                                                 |
| Deployment DeveloperName | `CorePress_Agent_Web_v2`                                                             |
| Deployment Site Endpoint | `https://trailsignup-783b48e7f9b1eb.my.site.com/ESWCorePressAgentWebv21787657197947` |
| Fallback Queue           | `CorePress Agent Escalation`                                                         |
| Agentforce Service Agent | `CorePress 지원 도우미` (`CorePress_Support_Agent` v3)                               |
| Session-Based Chat       | ON                                                                                   |
| Abandoned Chats          | ON (5분)                                                                             |

**LWR 임베드 위치 (현재 새 Deployment로 바인딩)**

- `force-app/main/default/digitalExperiences/site/CorePress_Customer_Portal1/sfdc_cms__view/home/content.json`
- `.../sfdc_cms__view/custom_route/content.json`
- `.../sfdc_cms__view/custom_asset_detail/content.json`

**Org 컨텍스트**

| 항목        | 값                                                          |
| ----------- | ----------------------------------------------------------- |
| Org Id      | `00DgK00000WSKnl`                                           |
| My Domain   | `trailsignup-783b48e7f9b1eb.my.salesforce.com`              |
| Site domain | `trailsignup-783b48e7f9b1eb.my.site.com`                    |
| scrt URL    | `https://trailsignup-783b48e7f9b1eb.my.salesforce-scrt.com` |

---

## 2. 이번 세션에서 이미 시도한 것 (재확인 불필요)

| #   | 시도                                                                                                             | 결과                                      |
| --- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Bot version v3의 `surfacesEnabled` false → true 교정 (`v3.botVersion-meta.xml`)                                  | 배포 성공, 라우팅은 여전히 실패           |
| 2   | v3 재활성화                                                                                                      | Active 확인, 라우팅 여전히 실패           |
| 3   | Deployment 재게시                                                                                                | Published, 라우팅 여전히 실패             |
| 4   | Experience 사이트 재게시 (`sf community publish`)                                                                | 성공, 라우팅 여전히 실패                  |
| 5   | LWR 3개 페이지 (home, custom_route, custom_asset_detail)의 embeddedMessaging 컴포넌트를 새 Deployment로 재바인딩 | 배포·publish 성공, 라우팅 여전히 실패     |
| 6   | 새 채널 + 새 Deployment 완전 신규 생성 (병렬)                                                                    | 생성 성공, **새 채널로도 동일 증상 재현** |
| 7   | Agentforce Builder Try it (직접 봇 호출)                                                                         | 정상 응답 확인 — 봇 자체는 문제 없음      |

**7번 결과의 의미**: 봇 metadata, LLM 연결, GenAI Planner는 정상. **문제는 Messaging Session → Agentforce 라우팅 파이프라인**만.

---

## 3. 원인 진단

### 실패 모드

- `MessagingSession` 레코드는 생성됨
- `AgentType` = `System`에 고정, 봇으로 전환 안됨
- `AgentWork` 레코드가 생성 안됨 (라우팅 엔진이 배정 못함)
- 클라이언트 임베드 위젯은 인사 문구만 뜨고 대화 시작 안됨

### 결론

**Salesforce 백엔드에서 이 org의 Agentforce → Messaging 라우팅이 완전히 프로비저닝되지 않은 상태**로 잠정 결론.

근거:

- 클라이언트 설정(채널·Deployment·봇·권한·서페이스) 재구성 두 번 다 실패
- 완전히 새로운 이름의 병렬 채널로도 동일 증상
- Builder Preview는 라우팅 파이프라인을 우회하므로 정상 작동 (증상 위치 특정에 도움)

---

## 4. 다음 단계 선택지

### 옵션 A — Salesforce Support 케이스 접수 (근본 해결)

케이스 초안 이미 준비되어 있음: `docs/SUPPORT_CASE_AGENTFORCE_ROUTING.md`

접수 흐름:

1. https://help.salesforce.com 접속, 관리자 자격증명 로그인
2. Contact Support → Create a Case
3. Product: Service Cloud → Feature: Agentforce / Enhanced Messaging
4. Severity: Level 2 (POC 블로킹)
5. Description란에 초안 MD 파일의 해당 섹션 붙여넣기
6. 케이스 오픈 후 실패 세션 Id `0MwgK00000DZhtpSAD` + 채널 Id 두 개 명시적으로 언급

**주의**: Support 진단 위해 옛 채널(`CorePress_Agent_Web`)과 실패 세션은 절대 삭제하지 말 것.

### 옵션 B — 데모 대체 시연 (Support 응답 대기 여유 없을 때)

두 가지 조합 권장:

**B-1. 임베드 위젯 숨김**

- `home`, `custom_route`, `custom_asset_detail` 3개 페이지의 `experience_messaging:embeddedMessaging` 블록 제거
- 데모에서 깨진 UX 노출 방지
- 배포 방법:
  ```
  sf project deploy start --target-org trail-org \
    --source-dir force-app/main/default/digitalExperiences/site/CorePress_Customer_Portal1/sfdc_cms__view/home \
    --source-dir .../custom_route --source-dir .../custom_asset_detail --wait 15
  sf community publish --target-org trail-org --name "CorePress Customer Portal"
  ```

**B-2. Agentforce Builder Preview 사전 녹화**

- Agent Builder에서 "Try it" 열고 시나리오 흐름 스크린 레코딩
- 데모에서 "포털 임베드는 org 프로비저닝 대기 중, 봇 자체는 실시간 동작 여기서 확인" 발화와 함께 재생
- 라이브 리스크 제로

---

## 5. 참고 — 진단용 SOQL

```bash
# 실패 세션 상세
sf data query --target-org trail-org \
  --query "SELECT Id, Status, AgentType, ChannelId, StartTime, LastModifiedDate FROM MessagingSession WHERE Id='0MwgK00000DZhtpSAD'"

# AgentWork 생성 여부 (계속 0건일 것)
sf data query --target-org trail-org \
  --query "SELECT Id, WorkItemId, Status, CreatedDate FROM AgentWork WHERE WorkItemId='0MwgK00000DZhtpSAD'"

# 두 채널 상태 비교
sf data query --target-org trail-org \
  --query "SELECT Id, DeveloperName, IsActive FROM MessagingChannel WHERE Id IN ('0MjgK000000XvNhSAK','0MjgK000000XzJFSA0')"

# Bot 버전 상태
sf data query --target-org trail-org --use-tooling-api \
  --query "SELECT Id, DeveloperName, VersionNumber, Status FROM BotVersion WHERE Bot.DeveloperName='CorePress_Support_Agent'"
```

---

## 6. 코드 상 관련 파일

**Agentforce metadata**

- `force-app/main/default/bots/CorePress_Support_Agent/v3.botVersion-meta.xml`
- `force-app/main/default/aiAuthoringBundles/CorePress_Support_Agent/`
- `force-app/main/default/genAiPlannerBundles/CorePress_Support_Agent_v2/`
- `force-app/main/default/EmbeddedServiceConfig/CorePress_Agent_Web.EmbeddedServiceConfig-meta.xml` (옛 Deployment)

**LWR 임베드 바인딩 (현재 새 Deployment로 재바인딩된 상태)**

- `force-app/main/default/digitalExperiences/site/CorePress_Customer_Portal1/sfdc_cms__view/home/content.json`
- `.../sfdc_cms__view/custom_route/content.json`
- `.../sfdc_cms__view/custom_asset_detail/content.json`

**Queue & Permset**

- `force-app/main/default/queues/CorePress_Agent_Escalation.queue-meta.xml`
- `force-app/main/default/permissionsets/CorePress_Support_Agent_Knowledge.permissionset-meta.xml`

---

## 7. 이관 시 궁금할 것

**Q: Bot이 정말 되는지 다시 확인하려면?**
Setup → Agentforce Studio → `CorePress_Support_Agent` → v3 열기 → 우상단 **Preview** → "안녕" 같은 메시지 입력해서 응답 오면 봇 OK.

**Q: 옛 채널 삭제해도 되나?**
Support 진단 완료 전엔 삭제 금지. 실패 세션 Id `0MwgK00000DZhtpSAD` 가 옛 채널에 종속.

**Q: 새 채널·Deployment도 지금 지워도 되나?**
Support 케이스 접수할 거면 남겨두는 게 좋음 (재현 증거 두 세트). 완전 포기라면 삭제 무방.

**Q: 왜 새로 만든 것도 안 될까?**
Q3에서 설명한 대로 클라이언트 재구성으론 못 고침. Salesforce backend에서 org-level Agentforce ↔ Messaging 라우팅 활성화가 필요.

---

이 문서 + `docs/SUPPORT_CASE_AGENTFORCE_ROUTING.md` 두 개면 다른 팀원이 상황 파악하고 Support 접수 or 데모 대체 결정 진행 가능.
