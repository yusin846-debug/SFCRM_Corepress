# CorePress 신규 설비 도입 시나리오

카탈로그 문의 Lead는 실제 문의자 이름, `{관심 장비} 신규요청` 타이틀, 선택형 마케팅 동의 여부·일시·경로를 저장한다. 포털 RFP 제출은 선택된 Lead를 `RFP접수`로 진행시키고 RFP 상세 레코드와 고객 공개 이벤트를 생성한다.

고객 담당자 김도입이 제안서를 확인하고 숏리스트를 선정하면 해당 Lead는 김영업 소유를 유지한 채 `New_Installation` Record Type, `New Business` Type, `숏리스트 선정` Stage의 Opportunity로 한 번만 전환된다. 이후 RFQ 제출은 같은 Opportunity를 `RFQ 접수`로 진행한다.

RFP 현황은 CP7100+ 제안서 다운로드와 멱등적인 숏리스트 버튼을 제공한다. RFQ 타임라인은 RFP 활동 이벤트와 Opportunity History를 시간순으로 합친다. 견적 목록은 Salesforce Quote만 조회하므로 삭제된 Quote는 포털에도 나타나지 않는다.

대한케미컬에는 기존 CP6000 견적 2건과 신규 CP7100+ 견적이 실제 Quote로 구성된다. 한빛석유화학/김도현은 별도 EC 사용자로 Account 데이터 격리를 검증하며 `[QC]` 거래 데이터는 검증 후 제거한다. 기존 Opportunity는 수정하지 않는다.
