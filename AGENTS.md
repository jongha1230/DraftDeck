# DraftDeck AGENTS

## Project purpose

DraftDeck은 source import, selection-based AI editing, autosave, revision history를 갖춘 기술 글 초안 워크스페이스다. 포트폴리오 관점에서 중요한 신호는 AI 자체보다도 글쓰기 워크플로우, 저장 충돌 처리, persistence 경계, 테스트, 문서화다.

## Important directories

- `src/app`: App Router pages와 server actions
- `src/components`: 에디터, source import, revision UI
- `src/hooks`: draft page orchestration, autosave, AI flow
- `src/lib/ai`: AI prompt/service helpers
- `src/lib/drafts`: persistence, revision/source helpers
- `src/store`: Zustand client session store
- `tests/e2e`: Playwright 시나리오
- `docs`: 아키텍처, AI safety, case study 문서
- `supabase/migrations`: schema migration

## Setup command

```bash
npm ci
```

## Dev command

```bash
npm run dev
```

## Lint command

```bash
npm run lint
```

## Typecheck command

```bash
npm run typecheck
```

## Test command

```bash
npm run test
```

## Build command

```bash
npm run build
```

## E2E command

```bash
npm run test:e2e
```

## Code style rules

- 기존 한국어 UX 카피를 유지하고, 메시지가 바뀌면 왜 바뀌는지 설명 가능해야 한다.
- App Router/server action/store/hook 경계를 흐리지 않는다.
- AI prompt 문자열은 helper로 분리하고, untrusted input 경계를 명시한다.
- 저장/충돌/읽기 오류는 조용히 삼키지 않는다.
- 큰 의존성 추가나 전면 리라이트 대신 작은 테스트 가능한 분리를 우선한다.

## Testing expectations

- AI 테스트는 반드시 mock 기반이어야 하며 실제 Gemini를 호출하지 않는다.
- unit test는 Supabase나 브라우저 request context 없이도 돌아야 한다.
- autosave/revision/source import 같은 business rule은 deterministic test로 남긴다.
- Playwright는 critical demo flow 위주로 유지한다.

## Do-not rules

- 실제 `.env` 파일을 수정하거나 secret을 커밋하지 않는다.
- 테스트에서 실제 Supabase/Gemini를 요구하지 않는다.
- 협업 편집, multi-device sync, PDF export 같은 범위 밖 기능을 억지로 추가하지 않는다.
- preview/demo 전용 흐름을 production capability처럼 과장하지 않는다.

## Definition of done

- lint, typecheck, test, build 결과를 확인했다.
- 가능하면 `npm run test:e2e`도 확인했다.
- AI safety, data model, autosave/revision 문서를 현재 코드와 맞췄다.
- PR은 작고 설명 가능한 commit stack으로 정리했다.
