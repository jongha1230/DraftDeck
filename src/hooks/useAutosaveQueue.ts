"use client";

import { saveDraftAction } from "@/app/actions";
import { EMPTY_DRAFT_ARTIFACTS } from "@/lib/drafts/records";
import { createAutosaveController } from "@/hooks/autosave-controller";
import { useDraftStore } from "@/store/useDraftStore";
import {
  type DraftRevision,
  type Post,
  type ToastTone,
} from "@/types";
import { useEffect, useMemo } from "react";

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

export function useAutosaveQueue({
  isPreview,
  prependRevision,
  pushNotification,
  setIsDirty,
  setIsSaving,
  upsertPost,
}: UseAutosaveQueueParams) {
  const controller = useMemo(
    () =>
      createAutosaveController({
        getArtifacts: (postId) =>
          useDraftStore.getState().artifactsByPostId[postId] ??
          EMPTY_DRAFT_ARTIFACTS,
        getPost: (postId) =>
          useDraftStore.getState().posts.find((post) => post.id === postId) ?? null,
        isPreview,
        prependRevision,
        pushNotification,
        saveDraft: saveDraftAction,
        schedule: (task, delay) =>
          window.setTimeout(() => {
            void task();
          }, delay),
        cancelScheduled: (handle) => {
          clearTimeout(handle as ReturnType<typeof setTimeout>);
        },
        setIsDirty,
        setIsSaving,
        upsertPost,
      }),
    [
      isPreview,
      prependRevision,
      pushNotification,
      setIsDirty,
      setIsSaving,
      upsertPost,
    ],
  );

  useEffect(() => {
    return () => {
      controller.dispose();
    };
  }, [controller]);

  return {
    queueSave: controller.queueSave,
  };
}
