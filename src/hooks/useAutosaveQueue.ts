"use client";

import { saveDraftAction } from "@/app/actions";
import {
  EMPTY_DRAFT_ARTIFACTS,
  getUniqueCheckpointRevisions,
  shouldCreateAutosaveCheckpoint,
} from "@/lib/drafts/records";
import { createPreviewRevision } from "@/lib/ui-preview";
import { useDraftStore } from "@/store/useDraftStore";
import {
  DraftRevisionTrigger,
  Post,
  type DraftRevision,
  type SaveDraftOptions,
  type ToastTone,
} from "@/types";
import { useCallback, useEffect, useRef } from "react";

interface UseAutosaveQueueParams {
  isPreview: boolean;
  prependRevision: (postId: string, revision: DraftRevision) => void;
  pushNotification: (
    message: string,
    tone?: ToastTone,
    title?: string,
  ) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  upsertPost: (post: Post) => void;
}

const SAVE_DEBOUNCE_MS = 900;

export function useAutosaveQueue({
  isPreview,
  prependRevision,
  pushNotification,
  setIsDirty,
  setIsSaving,
  upsertPost,
}: UseAutosaveQueueParams) {
  const saveTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const saveIntentsRef = useRef(new Map<string, SaveDraftOptions>());
  const savingPostIdsRef = useRef(new Set<string>());
  const queuedAfterSaveRef = useRef(new Map<string, SaveDraftOptions>());

  const flushSave = useCallback(
    async (postId: string) => {
      const intent = saveIntentsRef.current.get(postId);
      saveTimersRef.current.delete(postId);

      if (!intent) {
        setIsSaving(false);
        return;
      }

      if (savingPostIdsRef.current.has(postId)) {
        queuedAfterSaveRef.current.set(
          postId,
          mergeSaveIntent(queuedAfterSaveRef.current.get(postId), intent),
        );
        return;
      }

      const latestPost = useDraftStore
        .getState()
        .posts.find((post) => post.id === postId);

      if (!latestPost) {
        saveIntentsRef.current.delete(postId);
        return;
      }

      const requestSnapshot = latestPost;
      const resolvedIntent =
        intent.trigger === DraftRevisionTrigger.AUTOSAVE
          ? {
              ...intent,
              createCheckpoint: shouldCreateClientAutosaveCheckpoint(
                useDraftStore.getState().artifactsByPostId[postId] ??
                  EMPTY_DRAFT_ARTIFACTS,
                requestSnapshot.title,
                requestSnapshot.content,
              ),
            }
          : intent;

      savingPostIdsRef.current.add(postId);
      saveIntentsRef.current.delete(postId);

      try {
        if (isPreview) {
          const latestRevisionNumber = Math.max(
            latestPost.revision_number,
            (useDraftStore.getState().artifactsByPostId[postId]?.revisions ?? []).reduce(
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

        const result = await saveDraftAction(
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
            upsertPost(result.post);
            setIsDirty(false);
            pushNotification(result.message, "error", "저장 충돌");
            return;
          }

          pushNotification(result.message, "error", "저장 실패");
          return;
        }

        const livePost = useDraftStore
          .getState()
          .posts.find((post) => post.id === postId);
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
        pushNotification(message, "error", "저장 실패");
      } finally {
        savingPostIdsRef.current.delete(postId);
        const queuedIntent = queuedAfterSaveRef.current.get(postId);
        queuedAfterSaveRef.current.delete(postId);

        if (queuedIntent) {
          saveIntentsRef.current.set(postId, queuedIntent);
          window.setTimeout(() => {
            void flushSave(postId);
          }, 0);
        } else {
          setIsSaving(false);
        }
      }
    },
    [isPreview, prependRevision, pushNotification, setIsDirty, setIsSaving, upsertPost],
  );

  const queueSave = useCallback(
    (postId: string, options: SaveDraftOptions) => {
      const mergedIntent = mergeSaveIntent(saveIntentsRef.current.get(postId), options);
      saveIntentsRef.current.set(postId, mergedIntent);

      const existingTimer = saveTimersRef.current.get(postId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        void flushSave(postId);
      }, SAVE_DEBOUNCE_MS);

      saveTimersRef.current.set(postId, timer);
      setIsDirty(true);
      setIsSaving(true);
    },
    [flushSave, setIsDirty, setIsSaving],
  );

  useEffect(() => {
    const timers = saveTimersRef.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return {
    queueSave,
  };
}

function mergeSaveIntent(
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

function shouldCreateClientAutosaveCheckpoint(
  artifacts: typeof EMPTY_DRAFT_ARTIFACTS,
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
