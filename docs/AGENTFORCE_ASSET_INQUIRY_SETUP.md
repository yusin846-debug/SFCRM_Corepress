# Agentforce Asset 문의 설정·검증

## 구현 범위

- Asset 상세 화면의 `AI 증상 문의` 버튼이 Enhanced Web Chat을 연다.
- 버튼 클릭 시 현재 Asset 정보를 Hidden Pre-Chat 값으로 전달한다.
- Agent Router가 설비 증상·알람·소음·진동 문의를 Knowledge FAQ로 라우팅한다.
- Agent는 포털에서 받은 설비 식별자를 다시 묻지 않고 증상·발생 시점·알람 코드를 보완 질문한다.
- 이 경로는 Case를 생성하는 Action을 호출하지 않는다.

## Embedded Messaging 채널 변수

Setup의 Embedded Service Deployment / Messaging Channel에서 다음 Hidden Pre-Chat 채널 변수를 만들고 대상 필드에 매핑한다. 변수명은 대소문자까지 코드와 같아야 한다.

| 채널 변수           | 전달 값                    |
| ------------------- | -------------------------- |
| `AssetId`           | 현재 `Asset.Id`            |
| `AssetName`         | 현재 `Asset.Name`          |
| `AssetSerialNumber` | 현재 `Asset.SerialNumber`  |
| `AssetProductName`  | 현재 `Asset.Product2.Name` |
| `InquirySource`     | `CorePress Asset Detail`   |

대상 MessagingSession 필드는 팀 데이터 모델 담당자와 합의된 기존 필드를 사용한다. 임시 커스텀 필드는 만들지 않는다.

## 수동 검증

1. Experience Cloud 사이트를 게시하고 로그인한다.
2. 보유 설비 목록에서 설비 하나를 선택해 Asset 상세로 이동한다.
3. `AI 증상 문의`를 누른다.
4. 채팅 창이 열리고 화면에 설비 정보 전달 완료 메시지가 나타나는지 확인한다.
5. `운전 중 진동이 갑자기 커졌어요`라고 입력한다.
6. Agent가 설비명·모델·일련번호를 다시 묻지 않고 발생 시점이나 알람 코드를 질문하는지 확인한다.
7. 구체적인 조치 답변 전 Knowledge 검색 Action이 실행되는지 Trace에서 확인한다.
8. 대화 종료 후 새 Case가 생성되지 않았는지 확인한다.

## 오류 확인

- `상담 채널을 준비하고 있습니다`가 표시되면 해당 페이지에 Embedded Messaging 배포가 초기화됐는지 확인한다.
- `상담 도우미를 열지 못했습니다`가 표시되면 브라우저 콘솔과 Hidden Pre-Chat 변수 매핑을 확인한다.
- 기본 우측 하단 채팅 버튼은 장애 시 대체 진입점으로 유지한다.
