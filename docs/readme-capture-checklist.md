# README Capture Checklist

현재 README 자산은 2026-03-20 기준 UI를 반영하고 있어, 최신 `main` 흐름과 일부 어긋난다.
특히 `scripts/capture-screenshots.mjs`는 예전 `AI 제안` 흐름을 기준으로 짜여 있어 최신 UI에 맞게 다시 맞춰야 한다.

## 우선 교체할 캡처

1. `docs/assets/login.png`
   - 데스크톱 로그인 화면
   - 현재 로그인 카드와 좌측 설명 밀도 기준으로 다시 촬영

2. `docs/assets/workspace.png`
   - 기본 workspace 상태
   - 좌측 문서 목록, 중앙 편집 캔버스, 우측 도우미 패널이 모두 보이는 장면

3. `docs/assets/source-import.png`
   - `자료 가져오기` 모달
   - 최신 버튼 구성
     - `파일 불러오기`
     - `현재 문서에 적용`
     - `초안 생성`

4. `docs/assets/ai-result.png`
   - 문장 선택 후 AI 결과 모달
   - `본문 덮어쓰기` 또는 `문단 뒤에 이어붙이기` 액션이 보이는 장면

5. `docs/assets/revision-history.png`
   - 우측 패널의 `최근 버전`
   - `이 버전으로 되돌리기`가 보이는 장면

## 새로 추가할 캡처

6. `docs/assets/source-preview.png`
   - `최근 자료` 카드 클릭 후 `원본 보기` 모달
   - 현재 README에 없는 신규 핵심 흐름

## 보조 캡처

7. `docs/assets/workspace-mobile.png`
   - 모바일 workspace 전체
   - 필요하면 README 본문보다는 PR/문서용 보조 자산으로 사용

8. `docs/assets/workspace-tablet.png`
   - 태블릿 workspace 전체
   - 반응형 품질 증거용

## 촬영 조건

- 기본 기준 폭
  - 로그인: `1440`
  - workspace: `1440`
  - 모바일: `390`
  - 태블릿: `768`
- 가능하면 `preview` 모드에서 기본 흐름을 고정한다.
- 단, 실제 로그인에서만 확인 가능한 흐름은 별도 수동 검수한다.
- 캡처는 장식보다 흐름 증거가 우선이다.

## README 반영 순서

1. 기존 `login/workspace/source-import/ai-result/revision-history` 교체
2. `source-preview.png` 추가
3. 캡션 문구 최신화
4. `Troubleshooting` 섹션 추가
