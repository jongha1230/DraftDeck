# DraftDeck

DraftDeck은 기술 글 초안을 빠르게 만들고 다듬기 위해 만든 개인용 writing workspace입니다.  
포트폴리오 프로젝트지만, 단순 데모보다 실제 작성 흐름을 줄이는 데 초점을 뒀습니다.

## 핵심 문제

기술 글을 쓸 때 반복적으로 시간이 오래 걸리는 구간은 아래였습니다.

- 메모와 자료를 초안 구조로 옮기기
- 이미 쓴 문장을 계속 정리하고 리라이트하기
- 저장, 미리보기, 수정 사이를 오가며 집중이 끊기기

DraftDeck은 이 병목을 줄이기 위해 초안 작성, 자동 저장, 선택 기반 AI 보조를 한 화면 안에 묶었습니다.

## 현재 구현 범위

- Google OAuth 로그인
- 사용자별 문서 CRUD
- 자동 저장
- 선택 영역 기반 AI 액션
  - 요약
  - 번역
  - 개발자 톤 리라이트
  - 외부 텍스트 기반 초안 생성
- Markdown 미리보기
- 저장 중 이탈 경고
- 개발용 UI preview 모드

## 설계 방향

### 1. 화면과 상태 분리

- `ClientPage`는 레이아웃 조립 중심
- 상태와 액션은 `useDraftPageController`에 집중
- draft, editor, layout 단위로 UI 컴포넌트 분리

기능 확장 시 수정 범위를 줄이기 위한 구조입니다.

### 2. 서버 액션 경계 유지

- AI 요청과 DB 쓰기는 서버 액션에서 처리
- 클라이언트는 입력, 상태 반영, 렌더링에 집중
- 인증과 입력 제약은 서버에서 검증

### 3. 실제 제품처럼 보이는 편집 흐름

- 중앙 영역은 본문 편집을 우선
- 사이드바는 최근 문서와 새 초안 진입만 담당
- 오른쪽 도구 패널은 본문보다 조용하게 유지

## 트러블슈팅

### 미리보기와 수식 렌더링

수식과 Markdown 렌더링 품질을 높이는 과정에서 여러 접근을 시험했지만, 완성도보다 안정성을 우선해 일부 구현은 보수적으로 유지했습니다.

### 자동 저장 중 이탈

저장 중 브라우저를 닫을 때 데이터 유실 가능성이 있어 `beforeunload` 경고를 추가했습니다.

## 한계

- 협업 기능 없음
- 테스트 커버리지 낮음
- 배포 후 운영 지표 기반 개선 미적용

## 다음 단계

- 핵심 플로우 E2E 테스트 추가
- 배포 후 오류와 사용 로그 기반 개선
- 공유 링크와 export(PDF/Markdown) 기능 추가

## 기술 스택

- Next.js 16
- React 19 + TypeScript
- Zustand
- Supabase
- Gemini API
- Tailwind CSS

## 실행 방법

```bash
npm install
npm run dev
```

`.env.local`

```bash
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## 개발용 UI preview

기본 방식:

```bash
NEXT_PUBLIC_DRAFTDECK_UI_PREVIEW=1
```

또는 개발 환경에서만 query string으로도 진입할 수 있습니다.

```text
/?draftdeck-preview=1
```

## 폴더 구조

```text
src/
  app/
    actions.ts
    ClientPage.tsx
  hooks/
    useDraftPageController.ts
  components/
    draft/
    editor/
    layout/
  store/
    useDraftStore.ts
```
