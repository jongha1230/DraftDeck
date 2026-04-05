"use client";

import { runAIAction } from "@/app/actions";
import { createPreviewAIResult, createPreviewAIRun } from "@/lib/ui-preview";
import { useDraftStore } from "@/store/useDraftStore";
import {
  AIActionType,
  DraftRevisionTrigger,
  Post,
  SaveDraftOptions,
  ToastTone,
} from "@/types";
import { useCallback, useState } from "react";

interface UseDraftAiFlowParams {
  isPreview: boolean;
  activePost: Post | null;
  activePostId: string | null;
  selectionText: string;
  sourceInput: string;
  handleCreatePost: () => Promise<void>;
  recordCurrentSource: (postId: string) => Promise<string | null>;
  handleCloseImport: () => void;
  queueSave: (postId: string, options: SaveDraftOptions) => void;
  updatePostLocally: (postId: string, updates: Partial<Post>) => void;
  syncSelectionText: (nextSelection: string) => void;
  pushNotification: (message: string, tone?: ToastTone, title?: string) => void;
}

export function useDraftAiFlow({
  isPreview,
  activePost,
  activePostId,
  selectionText,
  sourceInput,
  handleCreatePost,
  recordCurrentSource,
  handleCloseImport,
  queueSave,
  updatePostLocally,
  syncSelectionText,
  pushNotification,
}: UseDraftAiFlowParams) {
  const isAiLoading = useDraftStore((state) => state.isAiLoading);
  const aiResult = useDraftStore((state) => state.aiResult);
  const prependAIRun = useDraftStore((state) => state.prependAIRun);
  const setAiLoading = useDraftStore((state) => state.setAiLoading);
  const setAiResult = useDraftStore((state) => state.setAiResult);
  const resetAiState = useDraftStore((state) => state.resetAiState);

  const [isPreviewAiGateOpen, setIsPreviewAiGateOpen] = useState(false);
  const [hasPreviewAiConsent, setHasPreviewAiConsent] = useState(false);
  const [pendingPreviewAiAction, setPendingPreviewAiAction] = useState<{
    action: AIActionType;
    selection?: string;
  } | null>(null);

  const runAIActionFlow = useCallback(
    async (action: AIActionType, selection?: string) => {
      if (isAiLoading) return;

      let targetPostId = activePost?.id ?? null;

      if (action === AIActionType.SOURCE_TO_DRAFT && !targetPostId) {
        await handleCreatePost();
        targetPostId = useDraftStore.getState().activePostId;
      }

      const currentPost = targetPostId
        ? useDraftStore.getState().posts.find((post) => post.id === targetPostId) ??
          null
        : null;

      if (action !== AIActionType.SOURCE_TO_DRAFT && !currentPost) {
        return;
      }

      setAiLoading(true);
      setAiResult(null);

      try {
        const inputText =
          action === AIActionType.SOURCE_TO_DRAFT
            ? sourceInput
            : selection || currentPost?.content || "";

        let recordedSourceId: string | null = null;

        if (action === AIActionType.SOURCE_TO_DRAFT && targetPostId) {
          recordedSourceId = await recordCurrentSource(targetPostId);
        }

        if (isPreview) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 320);
          });

          const text = createPreviewAIResult(action, inputText);
          const run = createPreviewAIRun({
            action,
            postId: targetPostId,
            text: inputText,
            outputText: text,
            selectionText:
              action === AIActionType.SOURCE_TO_DRAFT ? null : selectionText,
            sourceId: recordedSourceId,
          });

          if (targetPostId) {
            prependAIRun(targetPostId, run);
          }

          setAiResult({
            text,
            action,
            runId: run.id,
            sourceId: recordedSourceId,
          });

          if (action === AIActionType.SOURCE_TO_DRAFT) {
            handleCloseImport();
          }

          return;
        }

        const result = await runAIAction({
          action,
          text: inputText,
          postId: targetPostId,
          selectionText:
            action === AIActionType.SOURCE_TO_DRAFT ? null : selectionText,
          sourceId: recordedSourceId,
        });

        if (result.run?.post_id) {
          prependAIRun(result.run.post_id, result.run);
        }

        if (!result.success) {
          throw new Error(result.error || "AI 응답 실패");
        }

        setAiResult({
          text: result.text,
          action,
          runId: result.run?.id ?? null,
          sourceId: recordedSourceId,
        });

        if (action === AIActionType.SOURCE_TO_DRAFT) {
          handleCloseImport();
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "요청 처리 중 오류가 발생했습니다.";
        pushNotification(message, "error", "AI 요청 실패");
      } finally {
        setAiLoading(false);
      }
    },
    [
      activePost,
      handleCloseImport,
      handleCreatePost,
      isAiLoading,
      isPreview,
      prependAIRun,
      pushNotification,
      recordCurrentSource,
      selectionText,
      setAiLoading,
      setAiResult,
      sourceInput,
    ],
  );

  const handleAIAction = useCallback(
    async (action: AIActionType, selection?: string) => {
      if (isPreview && !hasPreviewAiConsent) {
        setPendingPreviewAiAction({ action, selection });
        setIsPreviewAiGateOpen(true);
        return;
      }

      await runAIActionFlow(action, selection);
    },
    [hasPreviewAiConsent, isPreview, runAIActionFlow],
  );

  const handleClosePreviewAiGate = useCallback(() => {
    setPendingPreviewAiAction(null);
    setIsPreviewAiGateOpen(false);
  }, []);

  const handleContinuePreviewAi = useCallback(async () => {
    const pendingAction = pendingPreviewAiAction;
    if (!pendingAction) {
      return;
    }

    setHasPreviewAiConsent(true);
    setPendingPreviewAiAction(null);
    setIsPreviewAiGateOpen(false);
    await runAIActionFlow(pendingAction.action, pendingAction.selection);
  }, [pendingPreviewAiAction, runAIActionFlow]);

  const handleApplyAIResult = useCallback(
    (text: string) => {
      if (!activePostId || !aiResult) return;

      const nextTrigger =
        aiResult.action === AIActionType.SOURCE_TO_DRAFT
          ? DraftRevisionTrigger.SOURCE_IMPORT
          : DraftRevisionTrigger.AI_APPLY;

      updatePostLocally(activePostId, { content: text });
      syncSelectionText("");
      queueSave(activePostId, {
        trigger: nextTrigger,
        aiRunId: aiResult.runId,
        sourceId: aiResult.sourceId,
      });
      resetAiState();
    },
    [
      activePostId,
      aiResult,
      queueSave,
      resetAiState,
      syncSelectionText,
      updatePostLocally,
    ],
  );

  const handleAppendAIResult = useCallback(
    (text: string) => {
      if (!activePost || !activePostId || !aiResult) return;

      const nextTrigger =
        aiResult.action === AIActionType.SOURCE_TO_DRAFT
          ? DraftRevisionTrigger.SOURCE_IMPORT
          : DraftRevisionTrigger.AI_APPEND;

      updatePostLocally(activePostId, {
        content: `${activePost.content}\n\n${text}`,
      });
      syncSelectionText("");
      queueSave(activePostId, {
        trigger: nextTrigger,
        aiRunId: aiResult.runId,
        sourceId: aiResult.sourceId,
      });
      resetAiState();
    },
    [
      activePost,
      activePostId,
      aiResult,
      queueSave,
      resetAiState,
      syncSelectionText,
      updatePostLocally,
    ],
  );

  const handleCloseAIResult = useCallback(() => {
    resetAiState();
  }, [resetAiState]);

  return {
    handleAIAction,
    handleApplyAIResult,
    handleAppendAIResult,
    handleCloseAIResult,
    handleClosePreviewAiGate,
    handleContinuePreviewAi,
    isPreviewAiGateOpen,
    pendingPreviewAiAction: pendingPreviewAiAction?.action ?? null,
  };
}
