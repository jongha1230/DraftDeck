# DraftDeck Case Study

## Problem

기술 글 초안 작성은 메모 정리, source import, 문장 리라이트, 저장, 버전 관리가 자주 분리돼 있다. 그러면 AI 품질보다도 workflow 설명이 더 어려워진다.

## Goal

DraftDeck의 목표는 "글쓰기 중간 단계"를 연결하는 것이다. source를 가져와 초안을 만들고, 선택 영역만 다시 쓰고, autosave와 revision으로 변경 이력을 남기고, 최종적으로 Markdown으로 내보내는 흐름을 하나의 workspace 안에 둔다.

## Architecture

- Next.js App Router + server actions
- Supabase persistence layer
- Zustand client session store
- AI service boundary
- preview/demo mode for fast UX verification

## AI workflow

- source import 또는 selection text를 입력으로 받는다.
- action별 system prompt를 고정한다.
- source/user/selection text는 untrusted content로 감싸서 전달한다.
- 결과는 문서에 apply/append되기 전까지 별도 AI result state로 유지한다.

## Autosave / revision design

- autosave는 debounce queue를 사용한다.
- 저장 중 추가 편집이 들어오면 후속 save를 queued intent로 보낸다.
- `revision_number`로 optimistic conflict를 감지한다.
- conflict가 나면 로컬 편집 내용을 유지한 채 충돌을 알린다.

## Data model

- `posts`: 본문, 제목, revision metadata
- `draft_sources`: 초안 출발점 기록
- `draft_revisions`: 되돌릴 가치가 있는 checkpoint
- `ai_runs`: AI action trace와 soft quota

## Trade-offs

- broad AI feature expansion보다 workflow reliability를 우선했다.
- optional table fallback으로 preview/migration mismatch를 버티지만, production rigor를 대체하지는 않는다.
- prompt injection을 완전히 해결했다고 주장하지 않고, 경계 명시와 테스트 가능한 완화를 택했다.

## AI safety limitations

- source text 안의 악성 지시를 완전히 무해화한다고 주장하지 않는다.
- 결과 fact-checking은 아직 scope 밖이다.
- blank output 차단, input length 제한, soft quota 정도가 현재 방어선이다.

## Testing strategy

- AI prompt builder/service는 mock 기반 unit test
- autosave queue는 pure controller test
- source import는 validation helper test
- demo flow는 Playwright smoke test

## What I learned

- AI product의 신뢰성은 모델 품질만으로 설명되지 않는다.
- autosave conflict와 revision semantics를 분리해야 writing tool이 납득 가능해진다.
- migration fallback은 편리하지만, 문서와 테스트가 없으면 오히려 설명하기 어려운 부채가 된다.

## Interview talking points

- untrusted source text 경계를 prompt builder로 분리한 이유
- revision_number 기반 optimistic save와 conflict UX trade-off
- optional table fallback을 유지하되 과장하지 않은 이유
- demo/preview mode와 production persistence 경계
- AI feature보다 writing workflow를 중심으로 범위를 고정한 이유
