import {
  AIActionType,
  AIRun,
  AIRunStatus,
  DraftArtifacts,
  DraftRevision,
  DraftRevisionTrigger,
  DraftSource,
  DraftSourceKind,
  Post,
} from "@/types";

type UnknownRecord = Record<string, unknown>;

export const EMPTY_DRAFT_ARTIFACTS: DraftArtifacts = {
  sources: [],
  revisions: [],
  aiRuns: [],
  revisionCount: 0,
};

export function normalizePostRecord(record: UnknownRecord): Post {
  return {
    id: String(record.id ?? ""),
    user_id: String(record.user_id ?? ""),
    title: String(record.title ?? ""),
    content: String(record.content ?? ""),
    is_published: Boolean(record.is_published),
    revision_number: Number(record.revision_number ?? 1),
    deleted_at: record.deleted_at ? String(record.deleted_at) : null,
    created_at: String(record.created_at ?? new Date(0).toISOString()),
    updated_at: String(record.updated_at ?? new Date(0).toISOString()),
  };
}

export function normalizeDraftSourceRecord(record: UnknownRecord): DraftSource {
  return {
    id: String(record.id ?? ""),
    post_id: String(record.post_id ?? ""),
    user_id: String(record.user_id ?? ""),
    kind:
      record.kind === DraftSourceKind.FILE
        ? DraftSourceKind.FILE
        : DraftSourceKind.PASTE,
    label: String(record.label ?? "붙여넣은 자료"),
    content: String(record.content ?? ""),
    content_length: Number(record.content_length ?? 0),
    created_at: String(record.created_at ?? new Date(0).toISOString()),
  };
}

export function normalizeDraftRevisionRecord(
  record: UnknownRecord,
): DraftRevision {
  return {
    id: String(record.id ?? ""),
    post_id: String(record.post_id ?? ""),
    user_id: String(record.user_id ?? ""),
    revision_number: Number(record.revision_number ?? 1),
    title: String(record.title ?? ""),
    content: String(record.content ?? ""),
    trigger: normalizeRevisionTrigger(record.trigger),
    ai_run_id: record.ai_run_id ? String(record.ai_run_id) : null,
    source_id: record.source_id ? String(record.source_id) : null,
    created_at: String(record.created_at ?? new Date(0).toISOString()),
  };
}

export function normalizeAIRunRecord(record: UnknownRecord): AIRun {
  return {
    id: String(record.id ?? ""),
    post_id: record.post_id ? String(record.post_id) : null,
    user_id: String(record.user_id ?? ""),
    action: normalizeAIAction(record.action),
    status:
      record.status === AIRunStatus.ERROR
        ? AIRunStatus.ERROR
        : AIRunStatus.SUCCESS,
    input_excerpt: String(record.input_excerpt ?? ""),
    output_text: String(record.output_text ?? ""),
    selection_text: record.selection_text ? String(record.selection_text) : null,
    source_id: record.source_id ? String(record.source_id) : null,
    error_message: record.error_message ? String(record.error_message) : null,
    created_at: String(record.created_at ?? new Date(0).toISOString()),
  };
}

export function buildInputExcerpt(input: string, limit = 180) {
  const trimmed = input.trim().replace(/\s+/g, " ");

  if (trimmed.length <= limit) {
    return trimmed;
  }

  return `${trimmed.slice(0, limit)}...`;
}

export function buildMarkdownExportFilename(title: string) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${normalized || "draftdeck-draft"}.md`;
}

export function getAIActionLabel(action: AIActionType) {
  switch (action) {
    case AIActionType.SUMMARIZE:
      return "요약";
    case AIActionType.DEVELOPER_REWRITE:
      return "개발자 톤 정리";
    case AIActionType.TRANSLATE:
      return "번역";
    case AIActionType.SOURCE_TO_DRAFT:
      return "자료에서 초안 생성";
    default:
      return action;
  }
}

export function getRevisionTriggerLabel(trigger: DraftRevisionTrigger) {
  switch (trigger) {
    case DraftRevisionTrigger.CREATE:
      return "새 문서";
    case DraftRevisionTrigger.AUTOSAVE:
      return "수정 저장";
    case DraftRevisionTrigger.AI_APPLY:
      return "AI 결과 덮어쓰기";
    case DraftRevisionTrigger.AI_APPEND:
      return "AI 결과 이어붙이기";
    case DraftRevisionTrigger.SOURCE_IMPORT:
      return "자료 기반 초안";
    default:
      return trigger;
  }
}

function normalizeRevisionTrigger(value: unknown): DraftRevisionTrigger {
  if (
    value === DraftRevisionTrigger.CREATE ||
    value === DraftRevisionTrigger.AI_APPLY ||
    value === DraftRevisionTrigger.AI_APPEND ||
    value === DraftRevisionTrigger.SOURCE_IMPORT
  ) {
    return value;
  }

  return DraftRevisionTrigger.AUTOSAVE;
}

const CHECKPOINT_MIN_CHAR_DELTA = 80;
const CHECKPOINT_MIN_CHANGE_RATIO = 0.18;
const CHECKPOINT_MIN_SMALL_EDIT_DELTA = 24;
const INITIAL_CHECKPOINT_MIN_CONTENT_LENGTH = 60;

export function getUniqueCheckpointRevisions(revisions: DraftRevision[]) {
  const seen = new Set<number>();

  return revisions.filter((revision) => {
    if (seen.has(revision.revision_number)) {
      return false;
    }

    seen.add(revision.revision_number);
    return true;
  });
}

export function getCheckpointRevisionCount(revisions: DraftRevision[]) {
  return getUniqueCheckpointRevisions(revisions).length;
}

export function normalizeDraftArtifacts(artifacts: DraftArtifacts): DraftArtifacts {
  return {
    ...artifacts,
    revisionCount:
      artifacts.revisionCount ?? getCheckpointRevisionCount(artifacts.revisions),
  };
}

export function shouldCreateAutosaveCheckpoint(input: {
  previousTitle: string;
  previousContent: string;
  nextTitle: string;
  nextContent: string;
}) {
  if (input.previousTitle.trim() !== input.nextTitle.trim()) {
    return true;
  }

  const previousContent = input.previousContent.trim();
  const nextContent = input.nextContent.trim();

  if (!previousContent && nextContent) {
    return nextContent.length >= INITIAL_CHECKPOINT_MIN_CONTENT_LENGTH;
  }

  const changedChars = estimateChangedCharacters(previousContent, nextContent);
  const baseline = Math.max(previousContent.length, nextContent.length, 1);

  return (
    changedChars >= CHECKPOINT_MIN_CHAR_DELTA ||
    (changedChars >= CHECKPOINT_MIN_SMALL_EDIT_DELTA &&
      changedChars / baseline >= CHECKPOINT_MIN_CHANGE_RATIO)
  );
}

function estimateChangedCharacters(previous: string, next: string) {
  if (previous === next) {
    return 0;
  }

  const sharedPrefix = getSharedPrefixLength(previous, next);
  const previousRemaining = previous.slice(sharedPrefix);
  const nextRemaining = next.slice(sharedPrefix);
  const sharedSuffix = getSharedSuffixLength(previousRemaining, nextRemaining);

  return Math.max(previousRemaining.length, nextRemaining.length) - sharedSuffix;
}

function getSharedPrefixLength(previous: string, next: string) {
  const length = Math.min(previous.length, next.length);
  let index = 0;

  while (index < length && previous[index] === next[index]) {
    index += 1;
  }

  return index;
}

function getSharedSuffixLength(previous: string, next: string) {
  const length = Math.min(previous.length, next.length);
  let index = 0;

  while (
    index < length &&
    previous[previous.length - 1 - index] === next[next.length - 1 - index]
  ) {
    index += 1;
  }

  return index;
}

function normalizeAIAction(value: unknown): AIActionType {
  if (
    value === AIActionType.SUMMARIZE ||
    value === AIActionType.DEVELOPER_REWRITE ||
    value === AIActionType.TRANSLATE ||
    value === AIActionType.SOURCE_TO_DRAFT
  ) {
    return value;
  }

  return AIActionType.SUMMARIZE;
}
