import {
  AIRun,
  AIRunStatus,
  AIActionType,
  DraftArtifacts,
  DraftRevision,
  DraftRevisionTrigger,
  DraftSource,
  DraftSourceKind,
  Post,
} from "@/types";
import {
  getCheckpointRevisionCount,
  normalizeDraftArtifacts,
} from "@/lib/drafts/records";

export interface PreviewUser {
  email: string;
  avatarUrl?: string;
}

export interface PreviewSessionData {
  posts: Post[];
  deletedPosts: Post[];
  activePostId: string | null;
  artifactsByPostId: Record<string, DraftArtifacts>;
}

export const UI_PREVIEW_QUERY_KEY = "draftdeck-preview";
const PREVIEW_STORAGE_KEY = "draftdeck-preview-session";
const PREVIEW_USER_ID = "preview-user";

const isPreviewEnvEnabled = () =>
  process.env.NEXT_PUBLIC_DRAFTDECK_UI_PREVIEW === "1";

const isClientQueryPreviewEnabled = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return searchParams.get(UI_PREVIEW_QUERY_KEY) === "1";
};

export const UI_PREVIEW_ENABLED =
  isPreviewEnvEnabled() || isClientQueryPreviewEnabled();

export function isServerUiPreviewEnabled(value?: string | string[]) {
  const resolved = Array.isArray(value) ? value[0] : value;
  const isPreviewRuntime =
    process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";

  return isPreviewEnvEnabled() || (isPreviewRuntime && resolved === "1");
}

export const PREVIEW_USER: PreviewUser = {
  email: "preview@draftdeck.local",
};

const now = Date.now();

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
    revision_number: 3,
    deleted_at: null,
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
    revision_number: 2,
    deleted_at: null,
    created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
  },
];

const PREVIEW_ARTIFACTS: Record<string, DraftArtifacts> = {
  "preview-post-1": {
    sources: [
      {
        id: "preview-source-1",
        post_id: "preview-post-1",
        user_id: PREVIEW_USER_ID,
        kind: DraftSourceKind.PASTE,
        label: "서비스 경계 메모",
        content:
          "현재 DraftDeck은 상태와 서버 로직이 한 훅에 뭉쳐 있어서 설명은 가능하지만 확장 신호가 약하다.",
        content_length: 59,
        created_at: new Date(now - 1000 * 60 * 80).toISOString(),
      },
    ],
    revisions: [
      {
        id: "preview-revision-3",
        post_id: "preview-post-1",
        user_id: PREVIEW_USER_ID,
        revision_number: 3,
        title: "기술 설계 초안",
        content: PREVIEW_POSTS[0].content,
        trigger: DraftRevisionTrigger.AI_APPLY,
        ai_run_id: "preview-airun-1",
        source_id: "preview-source-1",
        created_at: new Date(now - 1000 * 60 * 25).toISOString(),
      },
      {
        id: "preview-revision-2",
        post_id: "preview-post-1",
        user_id: PREVIEW_USER_ID,
        revision_number: 2,
        title: "기술 설계 초안",
        content: "# 서비스 경계 다시 정리하기\n\n기존 구조를 기록했다.",
        trigger: DraftRevisionTrigger.AUTOSAVE,
        ai_run_id: null,
        source_id: null,
        created_at: new Date(now - 1000 * 60 * 90).toISOString(),
      },
    ],
    aiRuns: [
      {
        id: "preview-airun-1",
        post_id: "preview-post-1",
        user_id: PREVIEW_USER_ID,
        action: AIActionType.DEVELOPER_REWRITE,
        status: AIRunStatus.SUCCESS,
        input_excerpt: "현재 DraftDeck은 상태와 서버 로직이 한 훅에 뭉쳐 있어서...",
        output_text:
          "DraftDeck의 현재 구현은 기능은 동작하지만 상태와 서버 경계가 밀집돼 있다.",
        selection_text:
          "현재 DraftDeck은 상태와 서버 로직이 한 훅에 뭉쳐 있어서 설명은 가능하지만 확장 신호가 약하다.",
        source_id: "preview-source-1",
        error_message: null,
        created_at: new Date(now - 1000 * 60 * 30).toISOString(),
      },
    ],
    revisionCount: 2,
  },
  "preview-post-2": {
    sources: [],
    revisions: [
      {
        id: "preview-revision-4",
        post_id: "preview-post-2",
        user_id: PREVIEW_USER_ID,
        revision_number: 2,
        title: "릴리즈 노트 초안",
        content: PREVIEW_POSTS[1].content,
        trigger: DraftRevisionTrigger.AUTOSAVE,
        ai_run_id: null,
        source_id: null,
        created_at: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      },
    ],
    aiRuns: [],
    revisionCount: 1,
  },
};

export function createDefaultPreviewSession(): PreviewSessionData {
  return {
    posts: structuredClone(PREVIEW_POSTS),
    deletedPosts: [],
    activePostId: PREVIEW_POSTS[0]?.id ?? null,
    artifactsByPostId: Object.fromEntries(
      Object.entries(structuredClone(PREVIEW_ARTIFACTS)).map(([postId, artifacts]) => [
        postId,
        normalizeDraftArtifacts(artifacts),
      ]),
    ),
  };
}

export function readPreviewSession() {
  if (typeof window === "undefined") {
    return createDefaultPreviewSession();
  }

  const raw = window.localStorage.getItem(PREVIEW_STORAGE_KEY);

  if (!raw) {
    return createDefaultPreviewSession();
  }

  try {
    const parsed = JSON.parse(raw) as PreviewSessionData;

    return {
      posts: parsed.posts?.length ? parsed.posts : createDefaultPreviewSession().posts,
      deletedPosts: parsed.deletedPosts ?? createDefaultPreviewSession().deletedPosts,
      activePostId:
        parsed.activePostId ??
        parsed.posts?.[0]?.id ??
        createDefaultPreviewSession().activePostId,
      artifactsByPostId:
        parsed.artifactsByPostId
          ? Object.fromEntries(
              Object.entries(parsed.artifactsByPostId).map(([postId, artifacts]) => [
                postId,
                normalizeDraftArtifacts({
                  ...artifacts,
                  revisionCount:
                    artifacts.revisionCount ??
                    getCheckpointRevisionCount(artifacts.revisions ?? []),
                }),
              ]),
            )
          : createDefaultPreviewSession().artifactsByPostId,
    };
  } catch {
    return createDefaultPreviewSession();
  }
}

export function writePreviewSession(data: PreviewSessionData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(data));
}

export function createPreviewPost(): Post {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    user_id: PREVIEW_USER_ID,
    title: "새 문서",
    content: "",
    is_published: false,
    revision_number: 1,
    deleted_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function createPreviewSource(input: {
  postId: string;
  label: string;
  content: string;
  kind: DraftSourceKind;
}): DraftSource {
  return {
    id: crypto.randomUUID(),
    post_id: input.postId,
    user_id: PREVIEW_USER_ID,
    kind: input.kind,
    label: input.label,
    content: input.content,
    content_length: input.content.trim().length,
    created_at: new Date().toISOString(),
  };
}

export function createPreviewAIRun(input: {
  action: AIActionType;
  postId?: string | null;
  text: string;
  outputText: string;
  selectionText?: string | null;
  sourceId?: string | null;
  status?: AIRunStatus;
  errorMessage?: string | null;
}): AIRun {
  return {
    id: crypto.randomUUID(),
    post_id: input.postId ?? null,
    user_id: PREVIEW_USER_ID,
    action: input.action,
    status: input.status ?? AIRunStatus.SUCCESS,
    input_excerpt: input.text.trim().slice(0, 180),
    output_text: input.outputText,
    selection_text: input.selectionText ?? null,
    source_id: input.sourceId ?? null,
    error_message: input.errorMessage ?? null,
    created_at: new Date().toISOString(),
  };
}

export function createPreviewRevision(input: {
  post: Post;
  trigger: DraftRevisionTrigger;
  aiRunId?: string | null;
  sourceId?: string | null;
}): DraftRevision {
  return {
    id: crypto.randomUUID(),
    post_id: input.post.id,
    user_id: PREVIEW_USER_ID,
    revision_number: input.post.revision_number,
    title: input.post.title,
    content: input.post.content,
    trigger: input.trigger,
    ai_run_id: input.aiRunId ?? null,
    source_id: input.sourceId ?? null,
    created_at: new Date().toISOString(),
  };
}

export function createPreviewAIResult(action: AIActionType, input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return "입력된 내용이 아직 없어 preview 결과를 만들 수 없습니다.";
  }

  switch (action) {
    case AIActionType.SUMMARIZE:
      return `## 핵심 요약\n\n${trimmed.slice(0, 240)}${trimmed.length > 240 ? "..." : ""}\n\n## 주요 포인트\n\n- 문제 배경과 사용자 요구를 먼저 유지했다.\n- 핵심 개념은 줄이지 않고 문장 길이만 정리했다.\n- 결과를 바로 붙여 넣기보다 초안 다듬기 출발점으로 쓰는 형식이다.\n\n## 남은 쟁점\n\n- 수치, 성능, 검증 결과는 원문 기준으로 다시 확인하는 편이 안전하다.`;
    case AIActionType.DEVELOPER_REWRITE:
      return `## 개발자 톤으로 다듬은 초안\n\n${trimmed.slice(0, 240)}\n\n이 문장은 구조를 더 명확히 하고, 모호한 표현을 줄이는 방향으로 정리할 수 있다.`;
    case AIActionType.TRANSLATE:
      return `## 자연스러운 번역 preview\n\n${trimmed.slice(0, 220)}\n\n문맥 유지 중심으로 번역 결과를 확인하는 로컬 preview다.`;
    case AIActionType.SOURCE_TO_DRAFT:
      return `# 초안 구조 제안\n\n## 핵심 배경\n\n${trimmed.slice(0, 220)}\n\n## 권장 구성\n\n1. 문제 정의\n2. 현재 제약\n3. 해결 접근\n4. 검증 계획\n\n## 시작 문단\n\n입력한 자료를 기반으로 초안의 뼈대를 먼저 세우고, 이후 편집 화면에서 세부 문장을 채우는 흐름을 가정했다.`;
    default:
      return trimmed;
  }
}
