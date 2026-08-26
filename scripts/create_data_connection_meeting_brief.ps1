$ErrorActionPreference = 'Stop'
$outDir = Join-Path (Get-Location) 'docs'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$docxPath = Join-Path $outDir 'CorePress_데이터연결_회의자료_유신_성하_유진.docx'
$pdfPath = Join-Path $outDir 'CorePress_데이터연결_회의자료_유신_성하_유진_QA.pdf'

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$doc.PageSetup.PaperSize = 2
$doc.PageSetup.TopMargin = 54
$doc.PageSetup.BottomMargin = 54
$doc.PageSetup.LeftMargin = 58
$doc.PageSetup.RightMargin = 58

$navy = 0x4A2A1B
$teal = 0xB6C42E
$gray = 0x666666
$light = 0xF3F6F8
$border = 0xD9E1E8

$normal = $doc.Styles.Item(-1)
$normal.Font.Name = '맑은 고딕'
$normal.Font.NameFarEast = '맑은 고딕'
$normal.Font.Size = 9.5
$normal.Font.Color = 0x333333
$normal.ParagraphFormat.SpaceAfter = 5
$normal.ParagraphFormat.LineSpacingRule = 0

function Add-Para([string]$text, [double]$size=9.5, [bool]$bold=$false, [int]$color=0x333333, [int]$after=5, [int]$align=0) {
  $insert = $doc.Range($doc.Content.End-1,$doc.Content.End-1)
  $p = $doc.Paragraphs.Add($insert)
  $p.Range.ListFormat.RemoveNumbers()
  $p.Range.Text = $text
  $p.Range.Font.Name = '맑은 고딕'; $p.Range.Font.NameFarEast = '맑은 고딕'
  $p.Range.Font.Size = $size; $p.Range.Font.Bold = [int]$bold; $p.Range.Font.Color = $color
  $p.Format.SpaceAfter = $after; $p.Alignment = $align
  $p.Range.InsertParagraphAfter()
  return $p
}
function Add-H1([string]$text) { Add-Para $text 17 $true $navy 10 | Out-Null }
function Add-H2([string]$text) { Add-Para $text 12.5 $true $navy 7 | Out-Null }
function Add-Kicker([string]$text) { Add-Para $text 8.5 $true $teal 4 | Out-Null }
function Add-Bullet([string]$text) {
  $p = Add-Para ("• " + $text) 9.2 $false 0x333333 3
  $p.LeftIndent = 12; $p.FirstLineIndent = -12
}
function Add-PageBreak() { $r=$doc.Range($doc.Content.End-1,$doc.Content.End-1); $r.InsertBreak(7) }
function Add-Table([array]$headers, [array]$rows, [array]$widths) {
  $anchor = $doc.Paragraphs.Add($doc.Range($doc.Content.End-1,$doc.Content.End-1))
  $anchor.Range.ListFormat.RemoveNumbers()
  $range = $anchor.Range
  $range.Collapse(1)
  $table = $doc.Tables.Add($range, $rows.Count + 1, $headers.Count)
  $table.AllowAutoFit = $false
  $table.Borders.Enable = 1
  $table.Borders.OutsideColor = $border; $table.Borders.InsideColor = $border
  for($c=1;$c -le $headers.Count;$c++) {
    $table.Columns.Item($c).Width = $widths[$c-1]
    $cell=$table.Cell(1,$c); $cell.Range.Text=$headers[$c-1]
    $cell.Shading.BackgroundPatternColor = $navy; $cell.Range.Font.Color=0xFFFFFF; $cell.Range.Font.Bold=1
  }
  for($r=0;$r -lt $rows.Count;$r++) {
    for($c=0;$c -lt $headers.Count;$c++) {
      $cell=$table.Cell($r+2,$c+1); $cell.Range.Text=[string]$rows[$r][$c]
      $cell.Range.Font.Name='맑은 고딕'; $cell.Range.Font.NameFarEast='맑은 고딕'; $cell.Range.Font.Size=8.3
      if(($r % 2) -eq 1){$cell.Shading.BackgroundPatternColor=$light}
    }
  }
  $table.Rows.SetLeftIndent(0,0)
  $table.Range.ParagraphFormat.SpaceAfter=2
  $table.Range.Cells.VerticalAlignment=1
  $doc.Range($doc.Content.End-1,$doc.Content.End-1).InsertParagraphAfter()
  return $table
}
function Add-Callout([string]$title,[string]$body) {
  $titlePara = Add-Para $title 9 $true $navy 2
  $titlePara.Shading.BackgroundPatternColor = $teal
  $bodyPara = Add-Para $body 8.8 $false 0x445566 10
  $bodyPara.Shading.BackgroundPatternColor = 0xF7FAFC
}

# Header/footer
$header=$doc.Sections.Item(1).Headers.Item(1).Range
$header.Text='COREPRESS  |  DATA CONNECTION WORKING SESSION'
$header.Font.Name='맑은 고딕';$header.Font.Size=8;$header.Font.Bold=1;$header.Font.Color=$gray
$footer=$doc.Sections.Item(1).Footers.Item(1).Range
$footer.Text='2026.08.19  ·  내부 협업용  ·  데이터 구조 변경 금지'
$footer.Font.Name='맑은 고딕';$footer.Font.Size=8;$footer.Font.Color=$gray;$footer.ParagraphFormat.Alignment=2

# Page 1
Add-Kicker 'WORKING SESSION BRIEF'
Add-Para 'CorePress 고객 포털 데이터 연결 회의' 25 $true $navy 8 | Out-Null
Add-Para 'PRT·AGT × CAS × SAL·APR 연결 기준 확정' 13 $false $gray 20 | Out-Null
Add-Table @('참석자','담당 범위','이번 회의 역할') @(
  @('김유신','PRT + AGT','포털 입력·조회 화면, 고객 컨텍스트, 연결 요구사항 정리'),
  @('성하님','CAS','Case 처리 흐름, 보증 판정, 엔지니어·작업 데이터 기준 확정'),
  @('유진님','SAL + APR','Opportunity·Quote 및 승인 흐름, 영업 데이터 인수 기준 확정')
) @(90,105,273) | Out-Null
Add-H2 '회의 종료 시 반드시 얻어야 할 결과'
Add-Bullet '포털에서 생성·조회하는 레코드의 오브젝트, 필드, 생성 시점, 소유자를 한 줄로 확정한다.'
Add-Bullet 'PRT → CAS, PRT → SAL, SAL → APR로 전달되는 Record Id와 상태값을 확정한다.'
Add-Bullet '현재 조직에 없는 필드는 대체 저장하지 않고 담당자·예정일·배포 순서를 합의한다.'
Add-Bullet '테스트 고객 사용자, 테스트 Account·Asset, 권한·Sharing 검증 담당자를 지정한다.'
Add-Callout '비협상 원칙' '오브젝트·필드·API Name·Picklist 값은 누구도 임의 생성·변경·삭제하지 않는다. 미확정 필드는 UI에서 입력받더라도 저장하지 않으며, 기존 필드에 합쳐 넣지 않는다.'
Add-H2 '권장 회의 시간 55분'
Add-Table @('시간','안건','산출물') @(
 @('0–5분','목표·원칙 확인','변경 금지 원칙 동의'),@('5–20분','Case 연결','PRT–CAS 필드·상태·소유권'),@('20–35분','Opportunity·Quote 연결','PRT–SAL–APR 인수 기준'),@('35–47분','권한·파일·자동화','Sharing/FLS/Flow 충돌 점검'),@('47–55분','결정 복기','담당자·기한·다음 배포 순서')
) @(60,170,238) | Out-Null

# Page 2
Add-PageBreak
Add-Kicker '01 · END-TO-END FLOW'
Add-H1 '사용자 행동에서 내부 처리까지'
Add-Table @('단계','고객 포털(PRT·AGT)','내부 처리','핵심 연결키') @(
 @('1. 로그인','User → Contact → Account 컨텍스트 확보','고객 범위 확정','User.ContactId / Contact.AccountId'),
 @('2. 설비 조회','Account의 Asset 목록·상세 조회','설비 마스터 유지','Asset.AccountId / Asset.Id'),
 @('3. 서비스 요청','Case 생성, 파일 첨부','CAS 판정·배정·처리','Case.Id / AssetId / ContactId'),
 @('4. RFP·RFQ','Opportunity 요청정보·원본문서 접수','SAL 영업기회 관리','Opportunity.Id / AccountId'),
 @('5. 견적·승인','고객에게 허용된 Quote 조회','SAL 견적, APR 승인','Quote.OpportunityId / Quote.Id'),
 @('6. 결과 확인','상태·일정·보증·견적 결과 조회','각 담당 영역에서 원천값 갱신','동일 Record Id 유지')
) @(58,143,143,124) | Out-Null
Add-H2 '연결 원칙'
Add-Bullet '고객 범위: 모든 조회는 로그인 User의 Contact.AccountId를 출발점으로 제한한다.'
Add-Bullet '설비 범위: Case.AssetId와 조회 대상 Asset.AccountId가 로그인 Account와 일치해야 한다.'
Add-Bullet '영업 범위: Opportunity.AccountId가 로그인 Account와 일치하는 건만 포털에 노출한다.'
Add-Bullet '파일: ContentVersion 생성 후 FirstPublishLocationId 또는 ContentDocumentLink로 해당 레코드에 연결한다.'
Add-Bullet '화면용 한글 상태는 표시 매핑이며, Salesforce 저장 Picklist 값 자체는 변경하지 않는다.'
Add-Callout '회의 질문' 'PRT가 레코드를 직접 생성한 뒤 내부 팀이 인수할지, 내부 자동화(Flow)가 중간 레코드·소유자·상태를 설정할지 오브젝트별로 확정해야 한다.'

# Page 3
Add-PageBreak
Add-Kicker '02 · CURRENT STATE'
Add-H1 '현재 구현 현황과 잠금 항목'
Add-H2 '이미 구현·배포된 포털 연결'
Add-Bullet '보유 설비 목록: 고객 Account의 Assets 조회, 검색·상태 필터, 상세 recordId 전달.'
Add-Bullet '설비 상세: Asset 표준/기존 커스텀 필드, AssetWarranty, 최근 Case 3건 조회.'
Add-Bullet '현재 내부 개발 사용자 김유신은 User.ContactId가 없어 고객별 Sharing 검증은 미완료.'
Add-Bullet 'Builder에서는 예시 데이터 안내를 표시하고 실제 고객 로그인 시 Account 범위 데이터를 사용.'
Add-H2 '조직에 없어 사용 금지된 필드'
Add-Table @('오브젝트','미확정 API Name','처리 원칙') @(
 @('Asset','Replaced_Asset__c, Last_Overhaul_Date__c, Replacement_Candidate__c','생성·참조 금지'),
 @('Asset','Maintenance_Count__c, Maintenance_Cost__c, Last_Failure_Cause__c','대체 필드 저장 금지'),
 @('Asset','Rated_Capacity__c, Rated_Discharge_Pressure__c, Rated_Power__c','상세 화면 더미값 제거'),
 @('Asset','Cooling_Type__c, Package_Type__c','공통 구조 확정 대기'),
 @('Opportunity','Replacement_Target_Asset__c','RFP에서 저장 보류'),
 @('Opportunity','Requested_Delivery_Date__c, Installation_Window__c, Performance_Guarantee__c','RFQ 저장 보류')
) @(76,252,140) | Out-Null
Add-Callout '중요' '이 필드들은 화면 요구사항에는 있으나 2026-08-19 조직 describe에서 존재하지 않았다. 회의에서 “필요 여부·소유 팀·정식 API Name·데이터 타입·배포 일정”을 결정하기 전까지 코드에 추가하지 않는다.'

# Page 4
Add-PageBreak
Add-Kicker '03 · DECISIONS BY OWNER'
Add-H1 '담당자별 확정이 필요한 항목'
Add-Table @('Owner','결정할 내용','상대 팀 확인','완료 기준') @(
 @('유신 · PRT/AGT','Case/Opportunity 생성 payload, 고객·설비 선택, 파일 첨부, URL Id 전달','성하·유진','허용 필드만 사용한 요청 명세'),
 @('성하 · CAS','Case 필수값, Status 전이, Priority/보증판정 주체, WorkOrder·ServiceAppointment 연결','유신','포털 생성 후 CAS가 즉시 처리 가능한 상태'),
 @('유진 · SAL','Opportunity 필수값, Stage/Type 초기값, RFP→RFQ 전환, Quote 공개 기준','유신','영업기회 중복 없이 인수 가능'),
 @('유진 · APR','승인 대상·트리거·승인 상태, 고객 노출 가능 시점','성하·유신','내부 단계가 고객에게 과다 노출되지 않음'),
 @('공동','Record ownership, Sharing Set, FLS, Flow/Validation Rule 충돌, 테스트 데이터','전원','고객 사용자 E2E 테스트 통과')
) @(70,165,95,138) | Out-Null
Add-H2 'PRT ↔ CAS 합의 체크리스트'
Add-Bullet 'Case 생성 시 Status 초기값은 신규접수인가? Origin은 포털로 고정하는가?'
Add-Bullet 'Requested_Urgency__c 자동 추천값과 사용자의 최종 선택 중 무엇을 저장하는가?'
Add-Bullet 'Priority는 CAS 내부 확정값으로 유지하는가? 포털 고객이 변경할 수 없는가?'
Add-Bullet '보증 판정·방문 일정·엔지니어 정보의 갱신 주체와 고객 노출 시점을 언제로 할 것인가?'
Add-H2 'PRT ↔ SAL·APR 합의 체크리스트'
Add-Bullet 'RFP 접수 시 Opportunity Type/StageName 초기값과 Owner 결정 방식은 무엇인가?'
Add-Bullet '이메일로 이미 제출된 RFP·RFQ는 원본문서만 연결하고 구조화 입력은 생략해도 되는가?'
Add-Bullet 'Quote Status 중 고객에게 보여줄 값과 승인 완료 전 숨길 값을 어디까지로 할 것인가?'
Add-Bullet 'RFQ 누락 필드가 배포되기 전 포털 저장·제출 버튼은 어떤 상태로 둘 것인가?'

# Page 5
Add-PageBreak
Add-Kicker '04 · CONFIRMED FIELD MAP'
Add-H1 '현재 조직에서 바로 연결 가능한 필드'
Add-Table @('업무','Salesforce 경로','포털 동작','Owner') @(
 @('고객 컨텍스트','User.ContactId → Contact.AccountId','조회 범위 자동 제한','PRT'),
 @('설비','Asset.Name, Product2.Name, SerialNumber, Status, Address, InstallDate','목록·상세 조회','PRT'),
 @('정비 지표','Total_Runtime_Hours__c, Runtime_As_Of__c, Next_Overhaul_Hours__c, Smart_Care_Stage__c','상세 조회','PRT/CAS'),
 @('보증','AssetWarranty.StartDate, EndDate, PartsCovered, LaborCovered, ExpensesCovered','보증 현황 조회','CAS'),
 @('서비스 요청','Case.AccountId, ContactId, AssetId, Subject, Type, Description, Requested_Urgency__c, Origin','Case 생성','PRT→CAS'),
 @('서비스 처리','Case.Status, Warranty_Determination__c, Scheduled_Visit__c, Engineer_Name__c, Work_Performed__c','진행 현황 조회','CAS→PRT'),
 @('RFP','Opportunity.Name, AccountId, Type, StageName, CloseDate, Description, Amount','Opportunity 생성·조회','PRT→SAL'),
 @('품목','OpportunityLineItem.Product2Id, Quantity, UnitPrice, TotalPrice','제안·확정 품목','SAL'),
 @('견적','QuoteNumber, Name, Status, ExpirationDate, Subtotal, Tax, GrandTotal','고객 견적 조회','SAL/APR→PRT'),
 @('첨부','ContentVersion + ContentDocumentLink','요청 원본·증빙 연결','공동')
) @(73,190,145,60) | Out-Null
Add-H2 'Picklist 저장값 확인'
Add-Para 'Case Status: 신규접수 → 판정완료 → 배정완료 → 진행중 → 대기 중 → 완료' 9.2 $false $gray 3 | Out-Null
Add-Para 'Opportunity Stage: Qualification → Discovery → Proposal/Quote → Negotiation → Closed Won / Closed Lost' 9.2 $false $gray 3 | Out-Null
Add-Para 'Quote Status: Draft, Needs Review, In Review, Approved, Rejected, Presented, Accepted, Denied' 9.2 $false $gray 8 | Out-Null
Add-Callout '표시와 저장 분리' '고객에게는 “접수”, “제안 준비 중”, “확인 필요”, “수락 완료”처럼 자연스러운 한글을 보여줄 수 있지만 저장값은 조직 Picklist를 그대로 사용한다.'

# Page 6
Add-PageBreak
Add-Kicker '05 · MEETING RECORD'
Add-H1 '회의 중 바로 채울 결정 기록'
Add-Table @('결정 항목','확정 내용','담당자','기한') @(
 @('Case 초기 Status / Owner','','',''),@('Case 자동화·Validation 충돌','','',''),@('Opportunity 초기 Type / Stage / Owner','','',''),@('RFP·RFQ 이메일 제출 처리','','',''),@('Quote 고객 노출 Status','','',''),@('누락 필드 생성 여부·API Name','','',''),@('Experience Cloud 테스트 사용자','','',''),@('Sharing Set / FLS 검증','','',''),@('다음 통합 배포 일시','','','')
) @(180,160,64,64) | Out-Null
Add-H2 '최소 E2E 테스트 시나리오'
Add-Table @('No.','시나리오','통과 기준') @(
 @('T1','고객 A 로그인 후 보유 설비 조회','고객 A Account의 Asset만 표시'),
 @('T2','Asset 상세에서 서비스 요청 생성','AccountId·ContactId·AssetId가 정확히 연결'),
 @('T3','CAS가 상태·일정·엔지니어 갱신','고객 포털 상세에 허용 정보만 반영'),
 @('T4','RFP 제출 후 SAL 인수','동일 Opportunity 1건 생성, 원본 파일 연결'),
 @('T5','Quote 승인·제시','허용된 Status에서만 고객에게 노출'),
 @('T6','고객 B가 고객 A URL 직접 접근','레코드 조회 차단')
) @(42,216,210) | Out-Null
Add-H2 '회의 직후 액션'
Add-Bullet '유신: 확정된 payload와 표시 매핑을 PRT_SALESFORCE_FIELD_MAPPING.md에 반영.'
Add-Bullet '성하: Case/WorkOrder/ServiceAppointment 자동화와 필수값 목록 공유.'
Add-Bullet '유진: Opportunity/Quote/Approval 초기값·공개 조건 공유.'
Add-Bullet '공동: 고객 Contact에 연결된 Experience Cloud 테스트 사용자로 T1–T6 실행.'

$doc.SaveAs2($docxPath,16)
$doc.ExportAsFixedFormat($pdfPath,17)
$doc.Close()
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Output $docxPath
Write-Output $pdfPath
