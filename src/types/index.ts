// DraftDeck 핵심 데이터 타입

export interface Post {
  id: string; // UUID
  user_id: string; // 작성자 ID
  title: string; // 글 제목
  content: string; // 마크다운 본문
  is_published: boolean;
  revision_number: number;
  deleted_at: string | null;
  created_at: string; // 생성일
  updated_at: string; // 수정일
}

export enum AIActionType {
  SUMMARIZE = "SUMMARIZE",
  DEVELOPER_REWRITE = "DEVELOPER_REWRITE",
  TRANSLATE = "TRANSLATE",
  SOURCE_TO_DRAFT = "SOURCE_TO_DRAFT",
}

export enum DraftSourceKind {
  PASTE = "PASTE",
  FILE = "FILE",
}

export enum DraftRevisionTrigger {
  CREATE = "CREATE",
  AUTOSAVE = "AUTOSAVE",
  AI_APPLY = "AI_APPLY",
  AI_APPEND = "AI_APPEND",
  SOURCE_IMPORT = "SOURCE_IMPORT",
}

export enum AIRunStatus {
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export type ToastTone = "info" | "success" | "error";

export interface AppToast {
  id: string;
  message: string;
  tone: ToastTone;
  title?: string;
}

export interface DraftSource {
  id: string;
  post_id: string;
  user_id: string;
  kind: DraftSourceKind;
  label: string;
  content: string;
  content_length: number;
  created_at: string;
}

export interface DraftRevision {
  id: string;
  post_id: string;
  user_id: string;
  revision_number: number;
  title: string;
  content: string;
  trigger: DraftRevisionTrigger;
  ai_run_id: string | null;
  source_id: string | null;
  created_at: string;
}

export interface AIRun {
  id: string;
  post_id: string | null;
  user_id: string;
  action: AIActionType;
  status: AIRunStatus;
  input_excerpt: string;
  output_text: string;
  selection_text: string | null;
  source_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface DraftArtifacts {
  sources: DraftSource[];
  revisions: DraftRevision[];
  aiRuns: AIRun[];
  revisionCount?: number;
}

export interface DraftSaveInput {
  postId: string;
  title: string;
  content: string;
  expectedRevision: number;
}

export interface RecordDraftSourceInput {
  postId: string;
  kind: DraftSourceKind;
  label: string;
  content: string;
}

export interface SaveDraftOptions {
  trigger: DraftRevisionTrigger;
  aiRunId?: string | null;
  sourceId?: string | null;
}

export interface SaveDraftSuccessResult {
  ok: true;
  post: Post;
  revision?: DraftRevision;
}

export interface SaveDraftConflictResult {
  ok: false;
  reason: "conflict";
  post: Post;
  message: string;
}

export interface SaveDraftErrorResult {
  ok: false;
  reason: "error";
  message: string;
}

export type SaveDraftResult =
  | SaveDraftSuccessResult
  | SaveDraftConflictResult
  | SaveDraftErrorResult;

export interface RunAIActionInput {
  action: AIActionType;
  text: string;
  postId?: string | null;
  selectionText?: string | null;
  sourceId?: string | null;
}

export interface AIResultState {
  text: string;
  action: AIActionType;
  runId: string | null;
  sourceId: string | null;
}

export type PreviewMode = "preview" | "raw";
