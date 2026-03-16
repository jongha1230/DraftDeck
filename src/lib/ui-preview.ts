import { AIActionType, Post } from "@/types";

export interface PreviewUser {
  email: string;
  avatarUrl?: string;
}

export const UI_PREVIEW_QUERY_KEY = "draftdeck-preview";
const isPreviewEnvEnabled = () =>
  process.env.NEXT_PUBLIC_DRAFTDECK_UI_PREVIEW === "1";

const isClientQueryPreviewEnabled = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return searchParams.get(UI_PREVIEW_QUERY_KEY) === "1";
};

export const UI_PREVIEW_ENABLED = isPreviewEnvEnabled() || isClientQueryPreviewEnabled();

export function isServerUiPreviewEnabled(value?: string | string[]) {
  const resolved = Array.isArray(value) ? value[0] : value;

  return isPreviewEnvEnabled() || (process.env.NODE_ENV !== "production" && resolved === "1");
}

const PREVIEW_USER_ID = "preview-user";

const now = Date.now();

export const PREVIEW_USER: PreviewUser = {
  email: "preview@draftdeck.local",
};

export const PREVIEW_POSTS: Post[] = [
  {
    id: "preview-post-1",
    user_id: PREVIEW_USER_ID,
    title: "기술 설계 초안",
    content: `# 서비스 경계 다시 정리하기

## 문제 정의

현재 워크플로는 기능은 많지만 작성 흐름이 자주 끊긴다. 사용자는 사이드 패널, 모달, 미리보기 사이를 왕복하며 맥락을 잃는다.

## 이번 정리 방향

- 기본 화면은 쓰기 캔버스에 집중한다.
- AI 보조는 필요할 때만 열리도록 한다.
- 저장 상태는 조용하게 알리고, 편집 면적은 넓게 유지한다.
`,
    is_published: false,
    created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "preview-post-2",
    user_id: PREVIEW_USER_ID,
    title: "릴리즈 노트 초안",
    content: `# 3월 릴리즈 노트

이번 릴리즈에서는 에디터 안정성과 미리보기 속도를 개선했다.

## 변경 사항

1. 자동 저장 신뢰성 개선
2. 선택 영역 AI 요청 안정화
3. 모바일 패널 전환 방식 정리
`,
    is_published: false,
    created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
  },
];

export function createPreviewPost(): Post {
  const timestamp = new Date().toISOString();

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `preview-${Date.now()}`,
    user_id: PREVIEW_USER_ID,
    title: "새 문서",
    content: "",
    is_published: false,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function createPreviewAIResult(
  action: AIActionType,
  input: string,
): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return "입력된 내용이 아직 없어 preview 결과를 만들 수 없습니다.";
  }

  switch (action) {
    case AIActionType.SUMMARIZE:
      return `## 요약\n\n${trimmed.slice(0, 180)}${trimmed.length > 180 ? "..." : ""}\n\n- 핵심 흐름을 유지하면서 문장을 짧게 정리했다.\n- 세부 표현은 편집 캔버스에서 이어서 다듬으면 된다.`;
    case AIActionType.DEVELOPER_REWRITE:
      return `## 개발자 톤으로 다듬은 초안\n\n${trimmed.slice(0, 240)}\n\n이 문장은 구조를 더 명확히 하고, 모호한 표현을 줄이는 방향으로 정리할 수 있다.`;
    case AIActionType.TRANSLATE:
      return `## 자연스러운 번역 preview\n\n${trimmed.slice(0, 220)}\n\n문맥 유지 중심으로 번역 결과를 확인하는 로컬 preview다.`;
    case AIActionType.SOURCE_TO_DRAFT:
      return `# preview 초안 생성 결과\n\n## 입력 요약\n\n${trimmed.slice(0, 220)}\n\n## 구성 제안\n\n1. 배경\n2. 핵심 문제\n3. 해결 방향\n4. 다음 단계\n\n## 첫 문단\n\n입력한 자료를 기반으로 초안의 뼈대를 먼저 세우고, 이후 편집 화면에서 세부 문장을 채우는 흐름을 가정했다.`;
    default:
      return trimmed;
  }
}
