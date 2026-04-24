import { EMPTY_DRAFT_ARTIFACTS, getUniqueCheckpointRevisions, shouldCreateAutosaveCheckpoint } from "@/lib/drafts/records";
import { createPreviewRevision } from "@/lib/ui-preview";
import {
  DraftArtifacts,
  DraftRevision,
  DraftRevisionTrigger,
  Post,
  SaveDraftOptions,
  SaveDraftResult,
  ToastTone,
} from "@/types";

export const SAVE_DEBOUNCE_MS = 900;
const CONFLICT_NOTIFICATION_MESSAGE =
  "다른 변경이 먼저 저장되었습니다. 현재 편집 내용은 유지합니다. 내용을 검토한 뒤 다시 저장해 주세요.";

type ScheduledTask = () => void | Promise<void>;

interface AutosaveControllerDependencies {
  getArtifacts: (postId: string) => DraftArtifacts | undefined;
  getPost: (postId: string) => Post | null;
  isPreview: boolean;
  prependRevision: (postId: string, revision: DraftRevision) => void;
  pushNotification: (
    message: string,
    tone?: ToastTone,
    title?: string,
  ) => void;
  saveDraft: (
    input: {
      postId: string;
      title: string;
      content: string;
      expectedRevision: number;
    },
    options: SaveDraftOptions,
  ) => Promise<SaveDraftResult>;
  schedule: (task: ScheduledTask, delay: number) => unknown;
  cancelScheduled: (handle: unknown) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  upsertPost: (post: Post) => void;
}

export function createAutosaveController({
  getArtifacts,
  getPost,
  isPreview,
  prependRevision,
  pushNotification,
  saveDraft,
  schedule,
  cancelScheduled,
  setIsDirty,
  setIsSaving,
  upsertPost,
}: AutosaveControllerDependencies) {
  const saveTimers = new Map<string, unknown>();
  const saveIntents = new Map<string, SaveDraftOptions>();
  const savingPostIds = new Set<string>();
  const queuedAfterSave = new Map<string, SaveDraftOptions>();
  let isDisposed = false;

  async function flushSave(postId: string) {
    if (isDisposed) {
      return;
    }

    const intent = saveIntents.get(postId);
    saveTimers.delete(postId);

    if (!intent) {
      setIsSaving(false);
      return;
    }

    if (savingPostIds.has(postId)) {
      queuedAfterSave.set(
        postId,
        mergeSaveIntent(queuedAfterSave.get(postId), intent),
      );
      return;
    }

    const latestPost = getPost(postId);

    if (!latestPost) {
      saveIntents.delete(postId);
      setIsSaving(false);
      return;
    }

    const requestSnapshot = latestPost;
    const resolvedIntent =
      intent.trigger === DraftRevisionTrigger.AUTOSAVE
        ? {
            ...intent,
            createCheckpoint: shouldCreateClientAutosaveCheckpoint(
              getArtifacts(postId) ?? EMPTY_DRAFT_ARTIFACTS,
              requestSnapshot.title,
              requestSnapshot.content,
            ),
          }
        : intent;

    savingPostIds.add(postId);
    saveIntents.delete(postId);

    try {
      if (isPreview) {
        const latestRevisionNumber = Math.max(
          latestPost.revision_number,
          (getArtifacts(postId)?.revisions ?? []).reduce(
            (max, revision) => Math.max(max, revision.revision_number),
            0,
          ),
        );
        const previewPost = {
          ...requestSnapshot,
          updated_at: new Date().toISOString(),
          revision_number: latestRevisionNumber + 1,
        };

        upsertPost(previewPost);
        const shouldCreateRevision =
          resolvedIntent.trigger !== DraftRevisionTrigger.AUTOSAVE ||
          resolvedIntent.createCheckpoint !== false;

        if (shouldCreateRevision) {
          prependRevision(
            postId,
            createPreviewRevision({
              post: previewPost,
              trigger: resolvedIntent.trigger,
              aiRunId: resolvedIntent.aiRunId ?? null,
              sourceId: resolvedIntent.sourceId ?? null,
            }),
          );
        }
        setIsDirty(false);
        return;
      }

      const result = await saveDraft(
        {
          postId,
          title: requestSnapshot.title,
          content: requestSnapshot.content,
          expectedRevision: requestSnapshot.revision_number,
        },
        resolvedIntent,
      );

      if (!result.ok) {
        if (result.reason === "conflict") {
          const currentDraft = getPost(postId) ?? requestSnapshot;
          upsertPost({
            ...currentDraft,
            revision_number: result.post.revision_number,
            updated_at: result.post.updated_at,
          });
          setIsDirty(true);
          pushNotification(
            CONFLICT_NOTIFICATION_MESSAGE,
            "error",
            "저장 충돌",
          );
          return;
        }

        setIsDirty(true);
        pushNotification(result.message, "error", "저장 실패");
        return;
      }

      const livePost = getPost(postId);
      const hasLocalChangesAfterRequest =
        !!livePost &&
        (livePost.title !== requestSnapshot.title ||
          livePost.content !== requestSnapshot.content);

      upsertPost(
        hasLocalChangesAfterRequest && livePost
          ? {
              ...livePost,
              revision_number: result.post.revision_number,
              updated_at: result.post.updated_at,
            }
          : result.post,
      );
      if (result.revision) {
        prependRevision(postId, result.revision);
      }
      setIsDirty(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "자동 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setIsDirty(true);
      pushNotification(message, "error", "저장 실패");
    } finally {
      savingPostIds.delete(postId);
      const queuedIntent = queuedAfterSave.get(postId);
      queuedAfterSave.delete(postId);

      if (queuedIntent) {
        saveIntents.set(postId, queuedIntent);
        schedule(() => flushSave(postId), 0);
      } else {
        setIsSaving(false);
      }
    }
  }

  function queueSave(postId: string, options: SaveDraftOptions) {
    if (isDisposed) {
      return;
    }

    const mergedIntent = mergeSaveIntent(saveIntents.get(postId), options);
    saveIntents.set(postId, mergedIntent);

    const existingTimer = saveTimers.get(postId);
    if (existingTimer) {
      cancelScheduled(existingTimer);
    }

    const timer = schedule(() => flushSave(postId), SAVE_DEBOUNCE_MS);
    saveTimers.set(postId, timer);
    setIsDirty(true);
    setIsSaving(true);
  }

  function dispose() {
    isDisposed = true;
    saveTimers.forEach((timer) => cancelScheduled(timer));
    saveTimers.clear();
    saveIntents.clear();
    queuedAfterSave.clear();
    savingPostIds.clear();
  }

  return {
    dispose,
    flushSave,
    queueSave,
  };
}

export function mergeSaveIntent(
  previous: SaveDraftOptions | undefined,
  next: SaveDraftOptions,
): SaveDraftOptions {
  if (!previous) {
    return next;
  }

  if (
    next.trigger === DraftRevisionTrigger.AUTOSAVE &&
    previous.trigger !== DraftRevisionTrigger.AUTOSAVE
  ) {
    return previous;
  }

  return {
    ...previous,
    ...next,
    createCheckpoint:
      previous.createCheckpoint === true || next.createCheckpoint === true
        ? true
        : next.createCheckpoint ?? previous.createCheckpoint,
  };
}

export function shouldCreateClientAutosaveCheckpoint(
  artifacts: DraftArtifacts,
  nextTitle: string,
  nextContent: string,
) {
  const latestCheckpoint = getUniqueCheckpointRevisions(artifacts.revisions)[0];

  return shouldCreateAutosaveCheckpoint({
    previousTitle: latestCheckpoint?.title ?? "",
    previousContent: latestCheckpoint?.content ?? "",
    nextTitle,
    nextContent,
  });
}
