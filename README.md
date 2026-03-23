# DraftDeck

DraftDeck은 범용 AI writer가 아니라 `기술 글 초안 워크플로우`를 위한 개인용 writing workspace입니다.  
핵심은 자료를 가져와 초안으로 구조화하고, 선택 기반 AI 리라이트와 autosave, revision 기록, Markdown export까지 한 흐름으로 이어주는 것입니다.

- Live app: [https://draft-flow-one.vercel.app](https://draft-flow-one.vercel.app)
- Live demo: [https://draft-flow-one.vercel.app/demo](https://draft-flow-one.vercel.app/demo)
- Repo: [https://github.com/jongha1230/DraftDeck](https://github.com/jongha1230/DraftDeck)
- Architecture note: [docs/architecture.md](./docs/architecture.md)
- QA checklist: [docs/qa-checklist.md](./docs/qa-checklist.md)
- Migration: [supabase/migrations/20260319_draftdeck_supporting_upgrade.sql](./supabase/migrations/20260319_draftdeck_supporting_upgrade.sql)

## Product Focus

DraftDeck이 해결하려는 문제는 단순합니다.

- 메모와 자료를 초안 구조로 옮기는 데 시간이 오래 걸린다.
- 이미 쓴 문장을 요약, 번역, 리라이트하는 동안 맥락이 자주 끊긴다.
- 저장, 미리보기, 수정 이력이 분리돼 있으면 작성 흐름을 설명하기 어렵다.

그래서 제품 범위를 아래로 고정했습니다.

1. source import
2. source 기반 draft generation
3. selection-based AI editing
4. autosave + revision tracking
5. Markdown export

협업, 멀티디바이스 sync, analytics, PDF export는 이번 범위에서 제외했습니다.

## Screenshots

### Login

![DraftDeck login](./docs/assets/login.png)

### Workspace

![DraftDeck workspace](./docs/assets/workspace.png)

### Source Import

![DraftDeck source import](./docs/assets/source-import.png)

### AI Apply

![DraftDeck AI result](./docs/assets/ai-result.png)

### Revision History

![DraftDeck revision history](./docs/assets/revision-history.png)

## Why This Is Different

이 프로젝트는 `AI 버튼 몇 개 붙인 에디터`처럼 보이지 않도록 아래 구조를 넣었습니다.

- `posts.revision_number`
  - autosave 시점의 optimistic save 기준점
- `draft_sources`
  - 초안이 어떤 자료에서 출발했는지 기록
- `ai_runs`
  - 어떤 액션을 어떤 입력으로 실행했는지 기록
- `draft_revisions`
  - autosave, AI apply, source import를 revision으로 남김

UI에서도 이 구조가 드러나도록 오른쪽 패널에서 `자료`, `리비전`, `AI 실행 기록`을 같이 보여줍니다.

## Architecture

### 1. Server boundary

- `src/app/actions.ts`
  - 클라이언트에서 호출하는 서버 액션 entrypoint
- `src/lib/drafts/persistence.ts`
  - 문서 CRUD, source 기록, revision 기록, artifact 조회
- `src/lib/ai/service.ts`
  - Gemini 호출, soft quota, ai run 기록

### 2. Client session

- `src/store/useDraftStore.ts`
  - 현재 문서, artifact, toast, panel 상태만 보관
- `src/hooks/useDraftPageController.ts`
  - autosave queue, preview hydration, import/AI/apply orchestration

### 3. Preview mode

- auth를 끄지 않고 UI만 빠르게 검증하기 위한 bypass
- localStorage에 preview session을 저장해 새로고침 후에도 흐름 유지
- local:
  - `NEXT_PUBLIC_DRAFTDECK_UI_PREVIEW=1`
- query:
  - local dev 또는 Vercel preview 환경에서 `/?draftdeck-preview=1`

## Guest Demo

- public guest demo는 `/demo`로 바로 들어갈 수 있습니다.
- source import, AI apply, revision history를 로그인 없이 한 흐름으로 체험할 수 있습니다.
- guest demo 세션은 브라우저 localStorage에만 저장됩니다.
- demo 안의 AI 결과는 실제 모델 호출이 아니라 로컬 preview 예시 결과입니다.

## Verification

현재 기본 검증 명령은 아래입니다.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

추가로 README 캡처 자산은 아래 명령으로 다시 만들 수 있습니다.

```bash
npm run capture:screenshots
```

## Local Development

```bash
npm install
npm run dev
```

`.env.local`

```bash
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Schema Upgrade

새 revision/source/ai-run 구조는 아래 migration 기준입니다.

```text
supabase/migrations/20260319_draftdeck_supporting_upgrade.sql
```

추가되는 항목:

- `posts.revision_number`
- `draft_sources`
- `ai_runs`
- `draft_revisions`

아직 migration이 적용되지 않은 환경에서도 앱이 완전히 깨지지 않도록, 선택 기록 테이블은 합성 객체로 fallback 하도록 만들었습니다. 다만 면접용 설명과 실제 데이터 추적을 위해서는 migration 적용이 전제입니다.

## Tech Stack

- Next.js 16
- React 19 + TypeScript
- Zustand
- Supabase
- Gemini API
- Vitest
- Playwright
- Tailwind CSS
