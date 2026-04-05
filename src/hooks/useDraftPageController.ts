"use client";

import {
  deleteDraftRevisionAction,
  getDraftArtifactsAction,
} from "@/app/actions";
import {
  EMPTY_DRAFT_ARTIFACTS,
  buildMarkdownExportFilename,
} from "@/lib/drafts/records";
import { type PreviewSessionVariant } from "@/lib/ui-preview";
import { useAutosaveQueue } from "@/hooks/useAutosaveQueue";
import { useDraftAiFlow } from "@/hooks/useDraftAiFlow";
import { useDraftPostLifecycle } from "@/hooks/useDraftPostLifecycle";
import { useDraftSourceImportFlow } from "@/hooks/useDraftSourceImportFlow";
import { usePreviewSession } from "@/hooks/usePreviewSession";
import { useDraftStore } from "@/store/useDraftStore";
import { DraftRevisionTrigger, Post, PreviewMode } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseDraftPageControllerParams {
  initialPosts: Post[];
  initialDeletedPosts?: Post[];
  isPreview?: boolean;
  previewSessionVariant?: PreviewSessionVariant;
}

export function useDraftPageController({
  initialPosts,
  initialDeletedPosts = [],
  isPreview = false,
  previewSessionVariant = "ui-preview",
}: UseDraftPageControllerParams) {
  const {
    posts,
    deletedPosts,
    activePostId,
    artifactsByPostId,
    loadedArtifactPostIds,
    hasHydratedSession,
    isSaving,
    isDirty,
    isAiLoading,
    aiResult,
    notifications,
    hydrateSession,
    upsertPost,
    setActivePostId,
    setArtifacts,
    prependRevision,
    removeRevision,
    setIsSaving,
    setIsDirty,
    pushNotification,
    dismissNotification,
  } = useDraftStore();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("preview");
  const [selectionText, setSelectionText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isArtifactsLoading, setIsArtifactsLoading] = useState(false);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  const {
    resolvedPosts,
    resolvedDeletedPosts,
    resolvedActivePostId,
    resolvedArtifactsByPostId,
  } = usePreviewSession({
    initialPosts,
    initialDeletedPosts,
    isPreview,
    posts,
    deletedPosts,
    activePostId,
    artifactsByPostId,
    hasHydratedSession,
    hydrateSession,
    previewSessionVariant,
  });

  const activePost = useMemo(
    () => resolvedPosts.find((post) => post.id === resolvedActivePostId) ?? null,
    [resolvedPosts, resolvedActivePostId],
  );

  const activeArtifacts = resolvedActivePostId
    ? resolvedArtifactsByPostId[resolvedActivePostId] ?? EMPTY_DRAFT_ARTIFACTS
    : EMPTY_DRAFT_ARTIFACTS;

  const { queueSave } = useAutosaveQueue({
    isPreview,
    prependRevision,
    pushNotification,
    setIsDirty,
    setIsSaving,
    upsertPost,
  });

  const syncSelectionText = useCallback((nextSelection: string) => {
    const text = nextSelection.trim();
    setSelectionText(text);
  }, []);

  const loadArtifacts = useCallback(
    async (postId: string) => {
      if (isPreview || loadedArtifactPostIds[postId]) {
        return;
      }

      setIsArtifactsLoading(true);

      try {
        const artifacts = await getDraftArtifactsAction(postId);
        setArtifacts(postId, artifacts);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "문서 기록을 불러오지 못했습니다.";
        pushNotification(message, "error", "기록 불러오기 실패");
      } finally {
        setIsArtifactsLoading(false);
      }
    },
    [isPreview, loadedArtifactPostIds, pushNotification, setArtifacts],
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      setIsAssistantOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!resolvedActivePostId) {
      return;
    }

    void loadArtifacts(resolvedActivePostId);
  }, [loadArtifacts, resolvedActivePostId]);

  useEffect(() => {
    syncSelectionText("");
  }, [resolvedActivePostId, syncSelectionText]);

  const openAssistantPanel = () => {
    setIsAssistantOpen(true);
  };

  const closeAssistantPanel = () => setIsAssistantOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const {
    handleCreatePost,
    handleDeletePost,
    handleRestoreDeletedPost,
    handlePermanentlyDeletePost,
    isPendingCreatePostId,
  } = useDraftPostLifecycle({
    isPreview,
    resolvedDeletedPosts,
    resolvedActivePostId,
    closeSidebar,
    queueSave,
  });

  const handlePostSelect = (id: string) => {
    setActivePostId(id);
    closeSidebar();
  };

  const handlePreviewOpen = (mode: PreviewMode = "preview") => {
    setPreviewMode(mode);
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => setIsPreviewOpen(false);

  const updatePostLocally = useCallback(
    (postId: string, updates: Partial<Post>) => {
      const currentPost = useDraftStore
        .getState()
        .posts.find((post) => post.id === postId);

      if (!currentPost) return;

      upsertPost({
        ...currentPost,
        ...updates,
        updated_at: new Date().toISOString(),
      });
    },
    [upsertPost],
  );

  const {
    canApplySourceToCurrent,
    handleApplySourceToCurrent,
    handleCloseImport,
    handleCloseSourcePreview,
    handleFileUpload,
    handleOpenImport,
    handleOpenSourcePreview,
    isSourceModalOpen,
    recordCurrentSource,
    setSourceInput,
    sourceInput,
    sourceKind,
    sourceLabel,
    sourcePreview,
  } = useDraftSourceImportFlow({
    isPreview,
    activePost,
    activePostId,
    activeArtifacts,
    isPendingCreatePostId,
    queueSave,
    updatePostLocally,
    pushNotification,
    openAssistantPanel,
  });

  const {
    handleAIAction,
    handleApplyAIResult,
    handleAppendAIResult,
    handleCloseAIResult,
    handleClosePreviewAiGate,
    handleContinuePreviewAi,
    isPreviewAiGateOpen,
    pendingPreviewAiAction,
  } = useDraftAiFlow({
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
  });

  const handleTitleChange = (title: string) => {
    if (!activePostId) return;
    updatePostLocally(activePostId, { title });
    if (isPendingCreatePostId(activePostId)) {
      setIsDirty(true);
      return;
    }
    queueSave(activePostId, { trigger: DraftRevisionTrigger.AUTOSAVE });
  };

  const handleContentChange = (content: string) => {
    if (!activePostId) return;
    updatePostLocally(activePostId, { content });
    if (isPendingCreatePostId(activePostId)) {
      setIsDirty(true);
      return;
    }
    queueSave(activePostId, { trigger: DraftRevisionTrigger.AUTOSAVE });
  };

  const handleExportMarkdown = () => {
    if (!activePost) return;

    const blob = new Blob([activePost.content], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildMarkdownExportFilename(activePost.title);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreRevision = (revisionId: string) => {
    if (!activePostId) return;

    const revision = activeArtifacts.revisions.find((item) => item.id === revisionId);
    if (!revision) return;

    updatePostLocally(activePostId, {
      title: revision.title,
      content: revision.content,
    });
    queueSave(activePostId, { trigger: DraftRevisionTrigger.AUTOSAVE });
    syncSelectionText("");
    pushNotification(
      `v${revision.revision_number} 내용을 현재 문서로 되돌렸습니다.`,
      "success",
      "버전 복원",
    );
  };

  const handleDeleteRevision = async (revisionId: string) => {
    if (!activePostId) return;

    try {
      if (!isPreview) {
        await deleteDraftRevisionAction(revisionId);
      }

      removeRevision(activePostId, revisionId);
      pushNotification("최근 버전을 기록 목록에서 제거했습니다.", "success", "버전 삭제");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "버전을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "버전 삭제 실패");
    }
  };

  return {
    posts: resolvedPosts,
    deletedPosts: resolvedDeletedPosts,
    notifications,
    activePostId: resolvedActivePostId,
    activePost,
    activeArtifacts,
    isSaving,
    isDirty,
    isAiLoading,
    aiResultText: aiResult?.text ?? "",
    currentAIRunId: aiResult?.runId ?? null,
    currentAISourceId: aiResult?.sourceId ?? null,
    selectionText,
    sourceInput,
    sourceLabel,
    sourceKind,
    canApplySourceToCurrent,
    isSidebarOpen,
    isAssistantOpen,
    isArtifactsLoading,
    isSourceModalOpen,
    isPreviewAiGateOpen,
    pendingPreviewAiAction,
    sourcePreview,
    isPreviewOpen,
    previewMode,
    contentScrollRef,
    setSourceInput,
    setPreviewMode,
    dismissNotification,
    openAssistantPanel,
    closeAssistantPanel,
    toggleSidebar,
    closeSidebar,
    handlePostSelect,
    handleCreatePost,
    handleDeletePost,
    handleRestoreDeletedPost,
    handlePermanentlyDeletePost,
    handlePreviewOpen,
    handlePreviewClose,
    handleAIAction,
    handleApplyAIResult,
    handleAppendAIResult,
    handleEditorSelectionChange: syncSelectionText,
    handleTitleChange,
    handleContentChange,
    handleFileUpload,
    handleOpenImport,
    handleCloseImport,
    handleClosePreviewAiGate,
    handleContinuePreviewAi,
    handleApplySourceToCurrent,
    handleOpenSourcePreview,
    handleCloseSourcePreview,
    handleCloseAIResult,
    handleRestoreRevision,
    handleDeleteRevision,
    handleExportMarkdown,
  };
}
