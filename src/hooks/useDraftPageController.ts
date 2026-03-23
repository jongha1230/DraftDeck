"use client";

import {
  createPostAction,
  deleteDraftRevisionAction,
  deletePostAction,
  getDraftArtifactsAction,
  restoreDeletedPostAction,
  permanentlyDeletePostAction,
  recordDraftSourceAction,
  runAIAction,
} from "@/app/actions";
import {
  EMPTY_DRAFT_ARTIFACTS,
  buildMarkdownExportFilename,
} from "@/lib/drafts/records";
import {
  createPreviewAIResult,
  createPreviewAIRun,
  createPreviewPost,
  createPreviewRevision,
  createPreviewSource,
  type PreviewSessionVariant,
} from "@/lib/ui-preview";
import { useAutosaveQueue } from "@/hooks/useAutosaveQueue";
import { usePreviewSession } from "@/hooks/usePreviewSession";
import { useDraftStore } from "@/store/useDraftStore";
import {
  AIActionType,
  DraftRevisionTrigger,
  DraftSourceKind,
  Post,
  PreviewMode,
} from "@/types";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
    prependPost,
    replacePost,
    removePost,
    upsertPost,
    markPostDeleted,
    restoreDeletedPost,
    removeDeletedPost,
    setActivePostId,
    setArtifacts,
    prependSource,
    prependRevision,
    removeRevision,
    prependAIRun,
    setIsSaving,
    setIsDirty,
    setAiLoading,
    setAiResult,
    resetAiState,
    pushNotification,
    dismissNotification,
  } = useDraftStore();

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("preview");
  const [sourcePreviewId, setSourcePreviewId] = useState<string | null>(null);
  const [sourceInput, setSourceInput] = useState("");
  const [sourceLabel, setSourceLabel] = useState("붙여넣은 자료");
  const [sourceKind, setSourceKind] = useState<DraftSourceKind>(
    DraftSourceKind.PASTE,
  );
  const [selectionText, setSelectionText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isArtifactsLoading, setIsArtifactsLoading] = useState(false);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const pendingCreateIdsRef = useRef(new Set<string>());
  const deletedPostSnapshotsRef = useRef(
    new Map<
      string,
      {
        post: Post;
        artifacts?: (typeof artifactsByPostId)[string];
        isArtifactsLoaded: boolean;
      }
    >(),
  );

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
  const sourcePreview =
    activeArtifacts.sources.find((source) => source.id === sourcePreviewId) ?? null;

  useEffect(() => {
    if (sourcePreviewId && !sourcePreview) {
      setSourcePreviewId(null);
    }
  }, [sourcePreview, sourcePreviewId]);

  const { queueSave } = useAutosaveQueue({
    isPreview,
    prependRevision,
    pushNotification,
    setIsDirty,
    setIsSaving,
    upsertPost,
  });

  const isPendingCreatePostId = useCallback((postId: string | null | undefined) => {
    if (!postId) return false;
    return pendingCreateIdsRef.current.has(postId);
  }, []);

  const syncSelectionText = useCallback(
    (nextSelection: string) => {
      const text = nextSelection.trim();
      setSelectionText(text);
    },
    [],
  );

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

  const handlePostSelect = (id: string) => {
    setActivePostId(id);
    closeSidebar();
  };

  const handleCreatePost = async () => {
    const previousActivePostId = resolvedActivePostId;
    let optimisticPostId: string | null = null;

    try {
      setIsSaving(true);

      if (isPreview) {
        const newPost = createPreviewPost();
        prependPost(newPost);
        prependRevision(
          newPost.id,
          createPreviewRevision({
            post: newPost,
            trigger: DraftRevisionTrigger.CREATE,
          }),
        );
        closeSidebar();
        pushNotification(
          "UI preview에서 새 초안을 로컬 상태로 만들었습니다.",
          "success",
          "새 초안 생성",
        );
        return;
      }

      const optimisticPost = createOptimisticPost();
      optimisticPostId = optimisticPost.id;
      pendingCreateIdsRef.current.add(optimisticPost.id);
      prependPost(optimisticPost);
      closeSidebar();

      const { post, revision } = await createPostAction();
      const liveOptimisticPost = useDraftStore
        .getState()
        .posts.find((item) => item.id === optimisticPost.id);
      const hasLocalDraftChanges =
        !!liveOptimisticPost &&
        (liveOptimisticPost.title !== optimisticPost.title ||
          liveOptimisticPost.content !== optimisticPost.content);
      const replacedPost = liveOptimisticPost
        ? {
            ...post,
            title: liveOptimisticPost.title,
            content: liveOptimisticPost.content,
          }
        : post;

      replacePost(optimisticPost.id, replacedPost);
      if (revision) {
        prependRevision(post.id, revision);
      }

      pendingCreateIdsRef.current.delete(optimisticPost.id);

      if (hasLocalDraftChanges) {
        queueSave(post.id, { trigger: DraftRevisionTrigger.AUTOSAVE });
      }
    } catch (error: unknown) {
      if (optimisticPostId) {
        pendingCreateIdsRef.current.delete(optimisticPostId);
        removePost(optimisticPostId, previousActivePostId);
      }

      const message =
        error instanceof Error
          ? error.message
          : "새 문서를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "문서 생성 실패");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewOpen = (mode: PreviewMode = "preview") => {
    setPreviewMode(mode);
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => setIsPreviewOpen(false);

  const handleDeletePost = async (post: Post) => {
    const snapshotState = useDraftStore.getState();
    const snapshotArtifacts = snapshotState.artifactsByPostId[post.id];
    const snapshotLoaded = Boolean(snapshotState.loadedArtifactPostIds[post.id]);

    try {
      const deletedPost = isPreview
        ? {
            ...post,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            ...post,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

      deletedPostSnapshotsRef.current.set(post.id, {
        post,
        artifacts: snapshotArtifacts,
        isArtifactsLoaded: snapshotLoaded,
      });

      markPostDeleted(deletedPost);
      pushNotification("초안을 최근 삭제로 이동했습니다.", "success", "문서 삭제");

      if (!isPreview) {
        await deletePostAction(post.id);
      }
    } catch (error: unknown) {
      const snapshot = deletedPostSnapshotsRef.current.get(post.id);
      if (snapshot) {
        restoreDeletedPost(
          snapshot.post,
          snapshot.artifacts,
          snapshot.isArtifactsLoaded,
        );
      }

      const message =
        error instanceof Error
          ? error.message
          : "초안을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "삭제 실패");
    }
  };

  const handleRestoreDeletedPost = async (postId: string) => {
    const deletedPost = resolvedDeletedPosts.find((post) => post.id === postId);
    if (!deletedPost) return;
    const previousActivePostId = resolvedActivePostId;
    const snapshot = deletedPostSnapshotsRef.current.get(postId);

    try {
      const restoredPost = isPreview
        ? {
            ...deletedPost,
            deleted_at: null,
            updated_at: new Date().toISOString(),
          }
        : {
            ...deletedPost,
            deleted_at: null,
            updated_at: new Date().toISOString(),
          };

      restoreDeletedPost(
        restoredPost,
        snapshot?.artifacts,
        snapshot?.isArtifactsLoaded ?? false,
      );
      pushNotification("최근 삭제 문서를 복구했습니다.", "success", "문서 복구");

      if (!isPreview) {
        await restoreDeletedPostAction(postId);
      }
    } catch (error: unknown) {
      markPostDeleted(deletedPost);
      if (previousActivePostId && previousActivePostId !== deletedPost.id) {
        setActivePostId(previousActivePostId);
      }

      const message =
        error instanceof Error
          ? error.message
          : "문서를 복구하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "복구 실패");
    }
  };

  const handlePermanentlyDeletePost = async (postId: string) => {
    const deletedPost = resolvedDeletedPosts.find((post) => post.id === postId);
    if (!deletedPost) return;

    try {
      if (isPreview) {
        removeDeletedPost(postId);
      } else {
        await permanentlyDeletePostAction(postId);
        removeDeletedPost(postId);
      }

      deletedPostSnapshotsRef.current.delete(postId);

      pushNotification("최근 삭제 문서를 완전히 제거했습니다.", "success", "영구 삭제");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "문서를 완전히 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "영구 삭제 실패");
    }
  };

  const handleAIAction = async (action: AIActionType, selection?: string) => {
    if (isAiLoading) return;

    let targetPostId = activePost?.id ?? null;

    if (action === AIActionType.SOURCE_TO_DRAFT && !targetPostId) {
      await handleCreatePost();
      targetPostId = useDraftStore.getState().activePostId;
    }

    const currentPost = targetPostId
      ? useDraftStore.getState().posts.find((post) => post.id === targetPostId) ?? null
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
        const nextSourceLabel =
          sourceLabel.trim() ||
          (sourceKind === DraftSourceKind.FILE ? "업로드한 파일" : "붙여넣은 자료");

        recordedSourceId = await recordSourceForPost(
          targetPostId,
          inputText,
          nextSourceLabel,
          sourceKind,
        );
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
          selectionText: action === AIActionType.SOURCE_TO_DRAFT ? null : selectionText,
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
          setIsSourceModalOpen(false);
          setSourceInput("");
          setSourceLabel("붙여넣은 자료");
          setSourceKind(DraftSourceKind.PASTE);
        }

        return;
      }

      const result = await runAIAction({
        action,
        text: inputText,
        postId: targetPostId,
        selectionText: action === AIActionType.SOURCE_TO_DRAFT ? null : selectionText,
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
        setIsSourceModalOpen(false);
        setSourceInput("");
        setSourceLabel("붙여넣은 자료");
        setSourceKind(DraftSourceKind.PASTE);
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
  };

  const recordSourceForPost = useCallback(
    async (
      postId: string,
      inputText: string,
      nextSourceLabel: string,
      nextSourceKind: DraftSourceKind,
    ) => {
      if (isPreview) {
        const previewSource = createPreviewSource({
          postId,
          label: nextSourceLabel,
          content: inputText,
          kind: nextSourceKind,
        });
        prependSource(postId, previewSource);
        return previewSource.id;
      }

      const savedSource = await recordDraftSourceAction({
        postId,
        label: nextSourceLabel,
        kind: nextSourceKind,
        content: inputText,
      });
      prependSource(postId, savedSource);
      return savedSource.id;
    },
    [isPreview, prependSource],
  );

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

  const handleApplyAIResult = (text: string) => {
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
  };

  const handleAppendAIResult = (text: string) => {
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
  };

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

  const handleSourceInputChange = (value: string) => {
    setSourceInput(value);
    if (sourceKind !== DraftSourceKind.FILE) {
      setSourceLabel("붙여넣은 자료");
      setSourceKind(DraftSourceKind.PASTE);
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      pushNotification(
        "텍스트(.txt) 또는 마크다운(.md) 파일만 가져올 수 있습니다.",
        "error",
        "지원하지 않는 파일 형식",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result;
      if (typeof text === "string") {
        setSourceInput(text);
        setSourceLabel(file.name);
        setSourceKind(DraftSourceKind.FILE);
      }
    };
    reader.readAsText(file);
  };

  const handleOpenImport = () => {
    setIsSourceModalOpen(true);
    openAssistantPanel();
  };

  const handleCloseImport = () => {
    setIsSourceModalOpen(false);
    setSourceInput("");
    setSourceLabel("붙여넣은 자료");
    setSourceKind(DraftSourceKind.PASTE);
  };

  const handleOpenSourcePreview = (sourceId: string) => {
    setSourcePreviewId(sourceId);
    openAssistantPanel();
  };

  const handleCloseSourcePreview = () => {
    setSourcePreviewId(null);
  };

  const handleCloseAIResult = () => {
    resetAiState();
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

  const handleApplySourceToCurrent = async () => {
    if (!activePostId || !activePost || !sourceInput.trim()) return;
    if (isPendingCreatePostId(activePostId)) {
      pushNotification(
        "문서 생성이 끝난 뒤 다시 시도해 주세요.",
        "error",
        "문서 준비 중",
      );
      return;
    }

    try {
      const nextSourceLabel =
        sourceLabel.trim() ||
        (sourceKind === DraftSourceKind.FILE ? "업로드한 파일" : "붙여넣은 자료");
      const sourceId = await recordSourceForPost(
        activePostId,
        sourceInput,
        nextSourceLabel,
        sourceKind,
      );

      updatePostLocally(activePostId, { content: sourceInput });
      queueSave(activePostId, {
        trigger: DraftRevisionTrigger.SOURCE_IMPORT,
        sourceId,
      });
      pushNotification("가져온 자료를 현재 문서에 반영했습니다.", "success", "자료 적용");
      handleCloseImport();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "자료를 현재 문서에 적용하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "자료 적용 실패");
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
    canApplySourceToCurrent:
      Boolean(activePost) && !isPendingCreatePostId(activePostId),
    isSidebarOpen,
    isAssistantOpen,
    isArtifactsLoading,
    isSourceModalOpen,
    sourcePreview,
    isPreviewOpen,
    previewMode,
    contentScrollRef,
    setSourceInput: handleSourceInputChange,
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
    handleApplySourceToCurrent,
    handleOpenSourcePreview,
    handleCloseSourcePreview,
    handleCloseAIResult,
    handleRestoreRevision,
    handleDeleteRevision,
    handleExportMarkdown,
  };
}

function createOptimisticPost(): Post {
  const timestamp = new Date().toISOString();

  return {
    id: `optimistic-post-${crypto.randomUUID()}`,
    user_id: "local-pending-user",
    title: "새 문서",
    content: "",
    is_published: false,
    revision_number: 1,
    deleted_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
