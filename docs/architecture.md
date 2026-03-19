# DraftDeck Architecture

DraftDeck은 범용 AI writer가 아니라 `기술 글 초안 워크플로우`를 다루는 개인용 workspace다. 핵심 시나리오는 아래로 고정한다.

1. 외부 메모나 Markdown 파일을 source로 가져온다.
2. source를 바탕으로 초안 구조를 만든다.
3. 선택 영역이나 본문 전체를 AI로 다듬는다.
4. autosave와 revision 기록으로 변경 이력을 남긴다.
5. Markdown으로 내보낸다.

## Runtime Boundaries

- `src/app/actions.ts`
  - 클라이언트에서 호출하는 서버 액션 entrypoint만 둔다.
- `src/lib/drafts/persistence.ts`
  - 문서 CRUD, source 기록, revision 기록, artifact 조회를 담당한다.
- `src/lib/ai/service.ts`
  - Gemini 호출, soft quota, ai run 기록을 담당한다.
- `src/store/useDraftStore.ts`
  - 현재 문서, artifacts, toast, panel 상태 같은 클라이언트 세션 상태만 가진다.
- `src/hooks/useDraftPageController.ts`
  - autosave queue, preview hydration, UI event orchestration을 담당한다.

## Data Model

### posts

- 기존 문서 엔티티
- `revision_number`를 추가해 optimistic save 기준점으로 사용한다.

### draft_sources

- 붙여넣은 메모나 파일 기반 source를 기록한다.
- 실제 초안이 어떤 자료에서 출발했는지 설명할 수 있게 한다.

### ai_runs

- 어떤 액션을 어떤 입력으로 실행했는지 남긴다.
- 메모리 Map rate limit 대신 최근 실행 수 기반 soft quota에 활용한다.

### draft_revisions

- autosave, AI apply, source import 같은 변경 계기를 revision으로 남긴다.
- 면접에서 "왜 이 구조를 추가했는가"를 설명하는 핵심 테이블이다.

## Failure Handling

- `posts.revision_number`이 예상값과 다르면 stale write로 판단하고 conflict를 반환한다.
- 새 테이블이 아직 적용되지 않은 환경에서는 source/revision/ai run 기록을 합성 객체로 대체해 UI를 깨지 않게 유지한다.
- preview 모드는 localStorage에 세션을 저장해 새로고침 후에도 흐름을 확인할 수 있게 한다.

## Out of Scope

- 협업 편집
- 멀티디바이스 sync
- analytics
- PDF export
