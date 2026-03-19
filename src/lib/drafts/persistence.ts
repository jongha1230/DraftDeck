import { createClient } from "@/lib/supabase/server";
import {
  AIRun,
  AIActionType,
  AIRunStatus,
  DraftArtifacts,
  DraftRevision,
  DraftRevisionTrigger,
  DraftSource,
  Post,
  RecordDraftSourceInput,
  DraftSaveInput,
  SaveDraftOptions,
  SaveDraftResult,
} from "@/types";
import {
  EMPTY_DRAFT_ARTIFACTS,
  normalizeAIRunRecord,
  normalizeDraftRevisionRecord,
  normalizeDraftSourceRecord,
  normalizePostRecord,
} from "./records";

type UnknownRecord = Record<string, unknown>;

export async function createPostRecord() {
  const { supabase, user } = await getAuthenticatedContext();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title: "새 문서",
      content: "",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const post = normalizePostRecord(data as UnknownRecord);
  const revision = await insertDraftRevisionRecord(post, DraftRevisionTrigger.CREATE);

  return {
    post,
    revision,
  };
}

export async function saveDraftRecord(
  input: DraftSaveInput,
  options: SaveDraftOptions,
): Promise<SaveDraftResult> {
  const { supabase, user } = await getAuthenticatedContext();
  const currentPost = await getPostById(supabase, input.postId, user.id);

  if (currentPost.revision_number !== input.expectedRevision) {
    return {
      ok: false,
      reason: "conflict",
      post: currentPost,
      message:
        "다른 변경이 먼저 저장되어 최신 문서를 다시 불러왔습니다. 변경 내용을 검토한 뒤 다시 저장해 주세요.",
    };
  }

  const nextRevisionNumber = currentPost.revision_number + 1;
  const updatePayload = {
    title: input.title,
    content: input.content,
    updated_at: new Date().toISOString(),
    revision_number: nextRevisionNumber,
  };

  const revisionAwareResult = await supabase
    .from("posts")
    .update(updatePayload)
    .eq("id", input.postId)
    .eq("user_id", user.id)
    .eq("revision_number", currentPost.revision_number)
    .select("*")
    .single();

  let updatedPost: Post;

  if (!revisionAwareResult.error && revisionAwareResult.data) {
    updatedPost = normalizePostRecord(revisionAwareResult.data as UnknownRecord);
  } else if (isRevisionSchemaError(revisionAwareResult.error)) {
    const fallbackResult = await supabase
      .from("posts")
      .update({
        title: input.title,
        content: input.content,
        updated_at: updatePayload.updated_at,
      })
      .eq("id", input.postId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (fallbackResult.error || !fallbackResult.data) {
      return {
        ok: false,
        reason: "error",
        message:
          fallbackResult.error?.message ||
          "문서를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    updatedPost = normalizePostRecord(fallbackResult.data as UnknownRecord);
  } else if (isNoRowReturnedError(revisionAwareResult.error)) {
    const latestPost = await getPostById(supabase, input.postId, user.id);

    return {
      ok: false,
      reason: "conflict",
      post: latestPost,
      message:
        "다른 변경이 먼저 저장되어 최신 문서를 다시 불러왔습니다. 변경 내용을 검토한 뒤 다시 저장해 주세요.",
    };
  } else {
    return {
      ok: false,
      reason: "error",
      message:
        revisionAwareResult.error?.message ||
        "문서를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  const revision = await insertDraftRevisionRecord(updatedPost, options.trigger, {
    aiRunId: options.aiRunId,
    sourceId: options.sourceId,
  });

  return {
    ok: true,
    post: updatedPost,
    revision: revision ?? undefined,
  };
}

export async function getMyPostsRecord() {
  const { supabase, user } = await getAuthenticatedContext();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((record) => normalizePostRecord(record as UnknownRecord));
}

export async function deletePostRecord(postId: string) {
  const { supabase, user } = await getAuthenticatedContext();

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getDraftArtifactsRecord(postId: string): Promise<DraftArtifacts> {
  const { supabase, user } = await getAuthenticatedContext();
  const [sources, revisions, aiRuns] = await Promise.all([
    safeSelectSources(supabase, user.id, postId),
    safeSelectRevisions(supabase, user.id, postId),
    safeSelectAIRuns(supabase, user.id, postId),
  ]);

  return {
    sources,
    revisions,
    aiRuns,
  };
}

export async function recordDraftSourceRecord(
  input: RecordDraftSourceInput,
): Promise<DraftSource> {
  const { supabase, user } = await getAuthenticatedContext();

  const { data, error } = await supabase
    .from("draft_sources")
    .insert({
      post_id: input.postId,
      user_id: user.id,
      kind: input.kind,
      label: input.label,
      content: input.content,
      content_length: input.content.trim().length,
    })
    .select("*")
    .single();

  if (error) {
    if (isOptionalTableError(error)) {
      return createSyntheticDraftSource(user.id, input);
    }

    throw new Error(error.message);
  }

  return normalizeDraftSourceRecord(data as UnknownRecord);
}

export async function countRecentAIRunsRecord(userId: string, windowMinutes = 60) {
  const supabase = await createClient();
  const threshold = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { count, error } = await supabase
    .from("ai_runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", threshold);

  if (error) {
    if (isOptionalTableError(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function recordAIRunRecord(input: {
  action: AIActionType;
  postId?: string | null;
  inputExcerpt: string;
  outputText: string;
  selectionText?: string | null;
  sourceId?: string | null;
  status: AIRunStatus;
  errorMessage?: string | null;
}): Promise<AIRun | null> {
  const { supabase, user } = await getAuthenticatedContext();

  const { data, error } = await supabase
    .from("ai_runs")
    .insert({
      post_id: input.postId ?? null,
      user_id: user.id,
      action: input.action,
      status: input.status,
      input_excerpt: input.inputExcerpt,
      output_text: input.outputText,
      selection_text: input.selectionText ?? null,
      source_id: input.sourceId ?? null,
      error_message: input.errorMessage ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (isOptionalTableError(error)) {
      return createSyntheticAIRun(user.id, input);
    }

    throw new Error(error.message);
  }

  return normalizeAIRunRecord(data as UnknownRecord);
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  return { supabase, user };
}

async function getPostById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "문서를 찾을 수 없습니다.");
  }

  return normalizePostRecord(data as UnknownRecord);
}

async function insertDraftRevisionRecord(
  post: Post,
  trigger: DraftRevisionTrigger,
  options?: {
    aiRunId?: string | null;
    sourceId?: string | null;
  },
): Promise<DraftRevision | null> {
  const { supabase, user } = await getAuthenticatedContext();

  const { data, error } = await supabase
    .from("draft_revisions")
    .insert({
      post_id: post.id,
      user_id: user.id,
      revision_number: post.revision_number,
      title: post.title,
      content: post.content,
      trigger,
      ai_run_id: options?.aiRunId ?? null,
      source_id: options?.sourceId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (isOptionalTableError(error)) {
      return createSyntheticDraftRevision(user.id, post, trigger, options);
    }

    throw new Error(error.message);
  }

  return normalizeDraftRevisionRecord(data as UnknownRecord);
}

async function safeSelectSources(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  postId: string,
) {
  const { data, error } = await supabase
    .from("draft_sources")
    .select("*")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    if (isOptionalTableError(error)) {
      return EMPTY_DRAFT_ARTIFACTS.sources;
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((record) =>
    normalizeDraftSourceRecord(record as UnknownRecord),
  );
}

async function safeSelectRevisions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  postId: string,
) {
  const { data, error } = await supabase
    .from("draft_revisions")
    .select("*")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .order("revision_number", { ascending: false })
    .limit(6);

  if (error) {
    if (isOptionalTableError(error)) {
      return EMPTY_DRAFT_ARTIFACTS.revisions;
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((record) =>
    normalizeDraftRevisionRecord(record as UnknownRecord),
  );
}

async function safeSelectAIRuns(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  postId: string,
) {
  const { data, error } = await supabase
    .from("ai_runs")
    .select("*")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    if (isOptionalTableError(error)) {
      return EMPTY_DRAFT_ARTIFACTS.aiRuns;
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((record) => normalizeAIRunRecord(record as UnknownRecord));
}

function isOptionalTableError(error: { message?: string } | null) {
  if (!error?.message) {
    return false;
  }

  return (
    error.message.includes("Could not find the table") ||
    error.message.includes("relation") ||
    error.message.includes("column") ||
    error.message.includes("schema cache")
  );
}

function isRevisionSchemaError(error: { message?: string } | null) {
  if (!error?.message) {
    return false;
  }

  return (
    error.message.includes("revision_number") ||
    error.message.includes("schema cache")
  );
}

function isNoRowReturnedError(error: { message?: string } | null) {
  return error?.message?.includes("JSON object requested") ?? false;
}

function createSyntheticDraftSource(
  userId: string,
  input: RecordDraftSourceInput,
): DraftSource {
  return {
    id: crypto.randomUUID(),
    post_id: input.postId,
    user_id: userId,
    kind: input.kind,
    label: input.label,
    content: input.content,
    content_length: input.content.trim().length,
    created_at: new Date().toISOString(),
  };
}

function createSyntheticDraftRevision(
  userId: string,
  post: Post,
  trigger: DraftRevisionTrigger,
  options?: {
    aiRunId?: string | null;
    sourceId?: string | null;
  },
): DraftRevision {
  return {
    id: crypto.randomUUID(),
    post_id: post.id,
    user_id: userId,
    revision_number: post.revision_number,
    title: post.title,
    content: post.content,
    trigger,
    ai_run_id: options?.aiRunId ?? null,
    source_id: options?.sourceId ?? null,
    created_at: new Date().toISOString(),
  };
}

function createSyntheticAIRun(
  userId: string,
  input: {
    action: AIActionType;
    postId?: string | null;
    inputExcerpt: string;
    outputText: string;
    selectionText?: string | null;
    sourceId?: string | null;
    status: AIRunStatus;
    errorMessage?: string | null;
  },
): AIRun {
  return {
    id: crypto.randomUUID(),
    post_id: input.postId ?? null,
    user_id: userId,
    action: input.action,
    status: input.status,
    input_excerpt: input.inputExcerpt,
    output_text: input.outputText,
    selection_text: input.selectionText ?? null,
    source_id: input.sourceId ?? null,
    error_message: input.errorMessage ?? null,
    created_at: new Date().toISOString(),
  };
}
