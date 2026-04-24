# Data Model

## Required table

### `posts`

- 문서 본문과 제목을 저장한다.
- `revision_number`는 optimistic save 충돌 감지에 사용한다.
- `deleted_at`은 최근 삭제 복구 흐름에 사용한다.

## Optional-but-supported tables

### `draft_sources`

- 붙여넣기/파일 source 기록
- migration이 빠진 환경에서는 synthetic source fallback으로 UI를 깨지 않게 유지한다.

### `draft_revisions`

- autosave, AI apply, source import 등 의미 있는 체크포인트 기록
- migration이 빠진 환경에서는 synthetic revision fallback을 사용한다.

### `ai_runs`

- 어떤 action을 어떤 입력으로 돌렸는지 기록
- soft quota 계산과 activity trace에 사용한다.
- migration이 빠진 환경에서는 count가 `null`이 될 수 있고 synthetic run fallback을 사용한다.

## 왜 fallback이 있나

- 포트폴리오/preview 환경에서 migration 적용 전에도 앱 전체가 하드 크래시하지 않게 하기 위해서다.
- 다만 interview/demo에서 persistence 경계를 제대로 설명하려면 migration 적용이 사실상 전제다.

## 명시적 한계

- fallback은 compatibility를 위한 장치이지 production schema 검증을 대체하지 않는다.
- multi-user collaboration이나 cross-device merge resolution은 이 데이터 모델의 목표가 아니다.
