# DraftDeck QA Checklist

## Preview Mode

1. `/?draftdeck-preview=1` 또는 `NEXT_PUBLIC_DRAFTDECK_UI_PREVIEW=1`로 진입한다.
2. 새 문서를 만든다.
3. 자료 가져오기에서 메모를 붙여넣고 초안 생성을 실행한다.
4. AI 결과를 본문에 적용한다.
5. 우측 패널에서 source, ai run, revision이 모두 보이는지 확인한다.
6. Markdown 내보내기를 실행한다.
7. 새로고침 후 preview 세션이 유지되는지 확인한다.

## Auth / Real Data

1. Google OAuth 로그인
2. 새 문서 생성
3. 제목/본문 수정 후 autosave 확인
4. 선택 영역 요약 또는 리라이트 실행
5. 우측 패널에서 revision과 ai run 기록 확인
6. 문서 삭제 후 사이드바 반영 확인

## Responsive Checks

- `390`
- `768`
- `1280`

기준:

- 본문이 첫 시야에서 바로 보여야 한다.
- assistant panel은 본문보다 튀지 않아야 한다.
- sidebar와 assistant panel 토글이 겹치지 않아야 한다.
