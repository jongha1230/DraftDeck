# DraftDeck Refactor Breakdown

이 문서는 현재 `main` 기준 DraftDeck의 구조 부채를 실제 작업 단위로 쪼갠 계획이다. 목표는 큰 파일을 억지로 나누는 것이 아니라, 변경이 자주 일어나는 경계를 독립적으로 움직이게 만드는 것이다.

## Phase 1. Page Controller를 흐름 단위로 분리

- 대상: `src/hooks/useDraftPageController.ts`
- 유지할 것: `ClientPage`가 의존하는 반환 shape
- 분리할 것:
  - `useDraftAiFlow`: preview gate, AI run, apply/append, AI result reset
  - `useDraftSourceImportFlow`: source modal, file upload, source recording, apply-to-current
  - `useDraftRevisionFlow`: revision restore/delete, export, artifact lazy load
  - `useDraftWorkspaceUiState`: sidebar, assistant panel, preview modal, selection state
- 끝 상태:
  - page controller는 store/hook composition만 담당
  - `runAIActionFlow`와 `handleApplySourceToCurrent`가 page controller에서 빠짐

## Phase 2. Persistence를 repository + policy 계층으로 분리

- 대상: `src/lib/drafts/persistence.ts`
- 분리할 것:
  - `draft-post-repository.ts`: post CRUD, soft delete, restore
  - `draft-artifact-repository.ts`: source/revision/ai run select and insert
  - `draft-revision-policy.ts`: autosave checkpoint 판단, revision insert orchestration
  - `draft-schema-compat.ts`: optional table, deleted_at, revision_number fallback 처리
  - `draft-synthetic-records.ts`: preview-like synthetic record builders
- 끝 상태:
  - persistence root는 공개 API만 export
  - schema fallback과 synthetic fallback이 domain write path에서 분리

## Phase 3. Store를 domain slice와 reducer helper로 정리

- 대상: `src/store/useDraftStore.ts`
- 분리할 것:
  - `draftArtifacts.ts`: `prependSource`, `prependRevision`, `removeRevision`, `prependAIRun`
  - `draftPosts.ts`: post/deleted post 이동 로직
  - `draftNotifications.ts`: toast timer와 notification lifecycle
- 끝 상태:
  - zustand store는 state + action wiring만 유지
  - artifact mutation 규칙은 pure function으로 테스트 가능

## Phase 4. 브라우저 검증을 merge gate로 추가

- 경로: `/demo`
- smoke 시나리오:
  - 자료 import -> preview AI gate -> apply -> source/revision 확인
  - selection summarize -> append -> AI append revision 확인
  - autosave -> revision restore
- merge gate:
  - `npm run test`
  - `npm run test:e2e`
  - `npm run lint`
  - `npm run build`

## 권장 작업 순서

1. 이번 라운드에서는 Phase 4를 먼저 고정해 회귀 방지선을 만든다.
2. 그 다음 Phase 1에서 `useDraftAiFlow`와 `useDraftSourceImportFlow`를 먼저 뽑는다.
3. Page controller 경계가 안정되면 Phase 2로 넘어가 persistence fallback을 분리한다.
4. 마지막에 Phase 3로 store mutation을 reducer helper로 옮긴다.

## 이번 라운드 시작점

- `playwright.config.ts`
- `tests/e2e/demo.spec.ts`
- `/demo` 기준 smoke test 3개
