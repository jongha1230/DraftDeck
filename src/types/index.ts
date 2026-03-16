// DraftDeck 핵심 데이터 타입

export interface Post {
  id: string; // UUID
  user_id: string; // 작성자 ID
  title: string; // 글 제목
  content: string; // 마크다운 본문
  is_published: boolean;
  created_at: string; // 생성일
  updated_at: string; // 수정일
}

export enum AIActionType {
  SUMMARIZE = "SUMMARIZE",
  DEVELOPER_REWRITE = "DEVELOPER_REWRITE",
  TRANSLATE = "TRANSLATE",
  SOURCE_TO_DRAFT = "SOURCE_TO_DRAFT",
}

export interface User {
  id: string;
  email: string;
}

export interface AIResponse {
  text: string;
  error?: string;
}

export type ToastTone = "info" | "success" | "error";

export interface AppToast {
  id: string;
  message: string;
  tone: ToastTone;
  title?: string;
}

export type AssistantPanelMode = "overview" | "selection" | "result";

export type PreviewMode = "preview" | "raw";
