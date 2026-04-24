# Autosave And Revisions

## 저장 흐름

1. 에디터에서 title/content가 바뀌면 autosave intent를 queue에 넣는다.
2. debounce 이후 최신 snapshot을 기준으로 저장을 시도한다.
3. 저장 중 추가 편집이 생기면 현재 요청이 끝난 뒤 queued save를 한 번 더 실행한다.

## revision_number 역할

- `posts.revision_number`는 optimistic save 기준점이다.
- 저장 요청은 `expectedRevision`과 함께 전송된다.
- 서버의 revision이 먼저 증가한 상태라면 conflict를 반환한다.

## 충돌 처리

- conflict가 나면 알림으로 충돌을 surface한다.
- 현재 로컬 편집 내용은 유지하고, revision metadata만 최신 값으로 맞춘다.
- 즉, "최신 서버 문서로 덮어쓰기"보다 "작성 중인 텍스트를 잃지 않기"를 우선한다.

## 어떤 revision을 남기나

- `CREATE`: 새 문서 생성
- `AUTOSAVE`: 의미 있는 autosave checkpoint
- `AI_APPLY` / `AI_APPEND`: AI 결과를 실제 문서에 반영
- `SOURCE_IMPORT`: source import로 문서가 바뀜

모든 autosave를 revision으로 남기지는 않는다. 너무 작은 수정까지 전부 기록하면 되돌릴 가치가 있는 버전과 단순 저장 상태가 섞이기 때문이다.

## Preview / Demo 모드

- preview/demo에서는 DB 대신 local/session 기반 preview revision을 만든다.
- 이 모드는 UX 검증용이며 production persistence를 대체하지 않는다.

## 테스트 포인트

- 저장 성공 시 revision number 업데이트
- 저장 중 추가 편집이 생기면 후속 save 실행
- conflict가 나도 로컬 텍스트는 유지
- 저장 실패 시 dirty state 유지
- dispose 시 pending timer 정리
