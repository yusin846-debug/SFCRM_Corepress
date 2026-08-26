# CorePress 포털 React 프로토타입

`화면기획서.html`(10개 화면 x 2개 옵션의 blueprint 와이어프레임)을 바탕으로 만든 **독립 React 디자인 프로토타입**입니다.

## 이게 무엇인가

- Vite + React (순수 JS, Salesforce와 무관한 별도 npm 프로젝트)
- Salesforce에는 배포되지 않습니다. Experience Cloud 실제 화면은 `EXPERIENCE_CLOUD_공동개발_계획.md`에 따라 **LWC**로 별도 구현되어야 합니다.
- 목적: 브랜드 톤(짙은 네이비 + 틸 accent, Manrope)을 적용한 디자인 시스템과 핵심 화면 흐름을 검토·합의하기 위한 시안입니다.

## 포함된 화면

디자인 시스템(토큰 + 버튼/카드/태그/입력/테이블/다이얼로그) + 대표 화면 5개:

1. 랜딩(마케팅) — `/`
2. 로그인 후 대시보드 — `/portal`
3. 보유 장비 목록 — `/portal/equipment`
4. 장비 상세 — `/portal/equipment/:equipmentId`
5. 서비스 요청 등록 — `/portal/service-request`

데이터는 전부 `src/data/mock.js`의 목 데이터입니다. 실제 Asset/Case/Warranty 필드 계약이 확정되면 이 자리를 Apex/REST 연동으로 교체하세요.

## 실행

```bash
cd frontend
npm install
npm run dev
```

## LWC로 옮길 때 참고

- 디자인 토큰(`src/styles/tokens.css`)은 CSS 커스텀 프로퍼티라 LWC의 `:host` 스코프 CSS로 거의 그대로 이식 가능합니다.
- 컴포넌트 단위(`src/components/ui/*`)가 LWC 컴포넌트 분리 기준의 참고가 될 수 있습니다.
- 이미지는 임시 Unsplash 링크와 자체 생성 아이콘/뱃지 조합입니다. 실제 자산 사진이 없으므로 장비 카드는 사진 대신 명판(rating plate) 스타일 타일(`EquipmentTile`)로 처리했습니다.
