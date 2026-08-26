# Salesforce Support Case — Agentforce Messaging Session Routing Failure

작성일: 2026-08-25
접수: help.salesforce.com → Contact Support → 새 케이스
Case Type: **Technical Support**
Severity 권장: **Level 2 (Critical Business Impact)** — 데모/POC 블로킹

---

## 접수 시 사용할 필드

**Subject**

```
Agentforce Messaging — new sessions stuck in "Waiting" state with AgentType=System, no AgentWork records created
```

**Product / Feature**: Service Cloud → Agentforce / Enhanced Messaging (Web)

**Org ID**: `00DgK000004DXt6` (My Domain: `trailsignup-783b48e7f9b1eb`)

> 실제 Org ID는 Setup → Company Information에서 확인 후 정확한 값으로 대체

**Sandbox / Production**: Developer / POC 조직

---

## Description (본문 — 그대로 붙여넣기)

```
Summary
-------
New Enhanced Messaging (Web) sessions initiated against a native
Agentforce v3 deployment are stuck in a "Waiting" state indefinitely.
The MessagingSession is created with AgentType = "System" and no
AgentWork record is ever generated, so the assigned Agentforce agent
never picks up the conversation. All customer-side prerequisites
(channel, agent, user, licenses, permissions, surfaces) have been
verified as correctly configured, which narrows the failure to the
Agentforce / Messaging provisioning tier managed by Salesforce.

Environment
-----------
- Org ID: 00DgK000004DXt6 (My Domain: trailsignup-783b48e7f9b1eb)
- Site: CorePress Customer Portal (LWR)
- Bot / Agent (Agentforce v3): "CorePress Agent Web"
- Embedded Messaging Deployment: CorePress_Agent_Web
- Channel Id (new native channel): 0MjgK000000XvNhSAK
- Failing MessagingSession Id (most recent): 0MwgK00000DZhtpSAD

Impact
------
Blocks a live POC / demo scenario where the customer portal opens a
messaging session with an Agentforce agent. The agent-side runtime
does not start, so every session appears "dead" to the customer.

Steps to Reproduce
------------------
1. Open the LWR site at
   https://trailsignup-783b48e7f9b1eb.my.site.com/corepress
2. Click the embedded messaging button (Enhanced Messaging Web,
   Deployment: CorePress_Agent_Web).
3. Session is created (visible in Setup > Messaging Sessions and via
   SOQL as MessagingSession row).
4. Session Status stays "Waiting", AgentType is "System", and no
   AgentWork record is created for the session.
5. The Agentforce agent's Bot Session / conversation never starts.

Expected Behavior
-----------------
On session creation, Salesforce's messaging routing engine should
allocate an AgentWork record targeting the configured Agentforce
agent, transition the session to an active conversation with the
agent, and stream bot messages back to the embedded widget.

Actual Behavior
---------------
- MessagingSession row is created (Id 0MwgK00000DZhtpSAD).
- Status remains "Waiting" indefinitely; no state transition.
- AgentType stays "System" (never becomes Bot / Agentforce).
- No AgentWork row is inserted for the session.
- Nothing surfaces in the embedded chat window on the client side
  beyond the initial system greeting.

What We Have Already Verified (please do not ask us to re-check these)
----------------------------------------------------------------------
- The Builder-native channel "CorePress Agent Web" is created and
  Active (channel Id 0MjgK000000XvNhSAK).
- A fresh Embedded Deployment was created and Published.
- The landing page, portal home, and asset detail pages in the LWR
  site were re-pointed to the new Deployment (view content.json
  updated: home, custom_route, custom_asset_detail — all published).
- Agentforce Bot Version v3 had surfacesEnabled=false; this was
  corrected to true (v3.botVersion-meta.xml) and the bot version was
  re-activated.
- The Deployment was re-published after the surface fix.
- The Experience Site was re-published (community publish).
- Site licenses, PSL for Agentforce, user permission sets for
  Messaging + Agentforce Service Agent User are all assigned to the
  test user.
- Surface (Web) is enabled on the bot version.

What We Need From Support
-------------------------
1. Please inspect the routing pipeline for
   MessagingSession Id 0MwgK00000DZhtpSAD and explain why no
   AgentWork record is generated.
2. Please verify that the Agentforce provisioning is fully complete
   on this org for channel Id 0MjgK000000XvNhSAK — specifically
   whether the channel is bound to the Agentforce v3 bot on the
   backend routing side (customer-side metadata all looks correct
   but the runtime does not appear to acknowledge it).
3. If provisioning is incomplete or stuck on Salesforce's side,
   please trigger the missing steps or point us at the specific
   toggle we still need to flip.

Attachments (attach in the ticket)
----------------------------------
- Screenshot of Setup > Embedded Service Deployments showing the
  new Deployment as Published.
- Screenshot of the Messaging Session detail page for
  0MwgK00000DZhtpSAD showing Status=Waiting, AgentType=System.
- Screenshot of the Agentforce v3 bot version detail showing
  surfacesEnabled=true and Active.
```

---

## 접수 후 팔로우업 팁

1. **케이스 오픈 후 5분 안에 Salesforce 자동 응답 이메일**이 옵니다. 그 이메일에 새 정보(추가 스크린샷, 로그 등)를 회신하면 케이스에 자동 첨부됩니다.
2. **하루 이상 반응 없으면 Escalate 버튼** 사용 (help.salesforce.com의 케이스 상세 페이지 상단).
3. Support가 "release lock", "backend flag toggle", "route re-registration" 등의 표현을 쓰면 정상 → provisioning 이슈 확정입니다. 몇 시간 안에 라우팅 시작될 확률 높음.
4. Support가 "please share your session recording / console logs"를 요구할 수 있으니 데모 계정에서 재현되는 상태를 유지해두세요 (세션 삭제하지 말 것).

---

## 참고 — 로컬 재현 진단 커맨드

Support가 요청할 수도 있는 진단 쿼리를 미리 뽑아두면 좋습니다:

```bash
# 실패 세션의 필드 전체
sf data query --target-org trail-org \
  --query "SELECT Id, Status, AgentType, ChannelId, StartTime, EndTime, LastModifiedDate, MessagingChannel.MessagingPlatformKey FROM MessagingSession WHERE Id='0MwgK00000DZhtpSAD'"

# AgentWork 생성 여부
sf data query --target-org trail-org \
  --query "SELECT Id, WorkItemId, Status, CreatedDate FROM AgentWork WHERE WorkItemId='0MwgK00000DZhtpSAD'"

# 채널 상태
sf data query --target-org trail-org \
  --query "SELECT Id, DeveloperName, MessagingPlatformKey, MessageType, IsActive FROM MessagingChannel WHERE Id='0MjgK000000XvNhSAK'"

# Agentforce Bot Version 활성 상태
sf data query --target-org trail-org --use-tooling-api \
  --query "SELECT Id, DeveloperName, VersionNumber, Status FROM BotVersion WHERE Bot.DeveloperName='CorePress_Agent_Web'"
```

이 결과들을 케이스 첨부에 붙이면 Support가 빠르게 상황 파악합니다.
