"use client";

import {
  createPostAction,
  deletePostAction,
  getDraftArtifactsAction,
  recordDraftSourceAction,
  runAIAction,
  saveDraftAction,
} from "@/app/actions";
import {
  EMPTY_DRAFT_ARTIFACTS,
  buildMarkdownExportFilename,
} from "@/lib/drafts/records";
import {
  createDefaultPreviewSession,
  createPreviewAIResult,
  createPreviewAIRun,
  createPreviewPost,
  createPreviewRevision,
  createPreviewSource,
  readPreviewSession,
  writePreviewSession,
} from "@/lib/ui-preview";
import { useDraftStore } from "@/store/useDraftStore";
import {
  AIActionType,
  DraftRevisionTrigger,
  DraftSourceKind,
  Post,
  PreviewMode,
  type AssistantPanelMode,
  type SaveDraftOptions,
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
  isPreview?: boolean;
}

const SAVE_DEBOUNCE_MS = 900;

export function useDraftPageController({
  initialPosts,
  isPreview = false,
}: UseDraftPageControllerParams) {
  const {
    posts,
    activePostId,
    artifactsByPostId,
    loadedArtifactPostIds,
    isSaving,
    isDirty,
    isAiLoading,
    aiResult,
    notifications,
    hydrateSession,
    prependPost,
    upsertPost,
    removePost,
    setActivePostId,
    setArtifacts,
    prependSource,
    prependRevision,
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
  const [sourceInput, setSourceInput] = useState("");
  const [sourceLabel, setSourceLabel] = useState("붙여넣은 자료");
  const [sourceKind, setSourceKind] = useState<DraftSourceKind>(
    DraftSourceKind.PASTE,
  );
  const [selectionText, setSelectionText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPanelMode, setAssistantPanelMode] =
    useState<AssistantPanelMode>("overview");
  const [pendingDeletePost, setPendingDeletePost] = useState<Post | null>(null);
  const [hasInitializedStore, setHasInitializedStore] = useState(false);
  const [isArtifactsLoading, setIsArtifactsLoading] = useState(false);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const hasHydratedInitialState = useRef(false);
  const saveTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const saveIntentsRef = useRef(new Map<string, SaveDraftOptions>());
  const savingPostIdsRef = useRef(new Set<string>());
  const queuedAfterSaveRef = useRef(new Map<string, SaveDraftOptions>());

  const fallbackState = useMemo(
    () =>
      isPreview
        ? createDefaultPreviewSession()
        : {
            posts: initialPosts,
            activePostId: initialPosts[0]?.id ?? null,
            artifactsByPostId: {},
          },
    [initialPosts, isPreview],
  );

  const resolvedPosts = hasInitializedStore ? posts : fallbackState.posts;
  const resolvedActivePostId = hasInitializedStore
    ? activePostId
    : fallbackState.activePostId;
  const resolvedArtifactsByPostId = hasInitializedStore
    ? artifactsByPostId
    : fallbackState.artifactsByPostId;

  const activePost = useMemo(
    () => resolvedPosts.find((post) => post.id === resolvedActivePostId) ?? null,
    [resolvedPosts, resolvedActivePostId],
  );

  const activeArtifacts = resolvedActivePostId
    ? resolvedArtifactsByPostId[resolvedActivePostId] ?? EMPTY_DRAFT_ARTIFACTS
    : EMPTY_DRAFT_ARTIFACTS;

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

      savingPostIdsRef.current.add(postId);
      saveIntentsRef.current.delete(postId);

      try {
        if (isPreview) {
          const previewPost = {
            ...latestPost,
            updated_at: new Date().toISOString(),
            revision_number: latestPost.revision_number + 1,
          };

          upsertPost(previewPost);
          prependRevision(
            postId,
            createPreviewRevision({
              post: previewPost,
              trigger: intent.trigger,
              aiRunId: intent.aiRunId ?? null,
              sourceId: intent.sourceId ?? null,
            }),
          );
          setIsDirty(false);
          return;
        }

        const result = await saveDraftAction(
          {
            postId,
            title: latestPost.title,
            content: latestPost.content,
            expectedRevision: latestPost.revision_number,
          },
          intent,
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

        upsertPost(result.post);
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

  const hydrateInitialState = useCallback(() => {
    if (hasHydratedInitialState.current) {
      return;
    }

    const sessionState = isPreview
      ? readPreviewSession()
      : {
          posts: initialPosts,
          activePostId: initialPosts[0]?.id ?? null,
          artifactsByPostId: {},
        };

    hydrateSession(sessionState);
    hasHydratedInitialState.current = true;
    setHasInitializedStore(true);
  }, [hydrateSession, initialPosts, isPreview]);

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
    hydrateInitialState();
  }, [hydrateInitialState]);

  useEffect(() => {
    if (!isPreview || !hasInitializedStore) {
      return;
    }

    writePreviewSession({
      posts,
      activePostId,
      artifactsByPostId,
    });
  }, [activePostId, artifactsByPostId, hasInitializedStore, isPreview, posts]);

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
    const handleSelectionChange = () => {
      const text = window.getSelection()?.toString().trim() || "";
      setSelectionText(text);

      if (text) {
        setAssistantPanelMode("selection");
      } else if (!aiResult) {
        setAssistantPanelMode("overview");
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [aiResult]);

  useEffect(() => {
    if (aiResult) {
      setAssistantPanelMode("result");
      setIsAssistantOpen(true);
    }
  }, [aiResult]);

  useEffect(() => {
    const timers = saveTimersRef.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const openAssistantPanel = (mode?: AssistantPanelMode) => {
    if (mode) {
      setAssistantPanelMode(mode);
    } else if (aiResult) {
      setAssistantPanelMode("result");
    } else if (selectionText) {
      setAssistantPanelMode("selection");
    } else {
      setAssistantPanelMode("overview");
    }

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

      const { post, revision } = await createPostAction();
      prependPost(post);
      if (revision) {
        prependRevision(post.id, revision);
      }
      closeSidebar();
    } catch (error: unknown) {
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

  const requestDeletePost = (post: Post) => {
    setPendingDeletePost(post);
  };

  const cancelDeletePost = () => {
    setPendingDeletePost(null);
  };

  const confirmDeletePost = async () => {
    if (!pendingDeletePost) return;

    try {
      if (!isPreview) {
        await deletePostAction(pendingDeletePost.id);
      }

      removePost(pendingDeletePost.id);
      pushNotification("초안을 목록에서 제거했습니다.", "success", "문서 삭제 완료");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "초안을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "삭제 실패");
    } finally {
      setPendingDeletePost(null);
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
          sourceLabel.trim() || (sourceKind === DraftSourceKind.FILE ? "업로드한 파일" : "붙여넣은 자료");

        if (isPreview) {
          const previewSource = createPreviewSource({
            postId: targetPostId,
            label: nextSourceLabel,
            content: inputText,
            kind: sourceKind,
          });
          prependSource(targetPostId, previewSource);
          recordedSourceId = previewSource.id;
        } else {
          const savedSource = await recordDraftSourceAction({
            postId: targetPostId,
            label: nextSourceLabel,
            kind: sourceKind,
            content: inputText,
          });
          prependSource(targetPostId, savedSource);
          recordedSourceId = savedSource.id;
        }
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
      setAssistantPanelMode(selectionText ? "selection" : "overview");
    } finally {
      setAiLoading(false);
    }
  };

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
    queueSave(activePostId, {
      trigger: nextTrigger,
      aiRunId: aiResult.runId,
      sourceId: aiResult.sourceId,
    });
    resetAiState();
    setAssistantPanelMode(selectionText ? "selection" : "overview");
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
    queueSave(activePostId, {
      trigger: nextTrigger,
      aiRunId: aiResult.runId,
      sourceId: aiResult.sourceId,
    });
    resetAiState();
    setAssistantPanelMode(selectionText ? "selection" : "overview");
  };

  const handleTitleChange = (title: string) => {
    if (!activePostId) return;
    updatePostLocally(activePostId, { title });
    queueSave(activePostId, { trigger: DraftRevisionTrigger.AUTOSAVE });
  };

  const handleContentChange = (content: string) => {
    if (!activePostId) return;
    updatePostLocally(activePostId, { content });
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
    openAssistantPanel("overview");
  };

  const handleCloseImport = () => {
    setIsSourceModalOpen(false);
    setSourceInput("");
    setSourceLabel("붙여넣은 자료");
    setSourceKind(DraftSourceKind.PASTE);
  };

  const handleCloseAIResult = () => {
    resetAiState();
    setAssistantPanelMode(selectionText ? "selection" : "overview");
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

  return {
    posts: resolvedPosts,
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
    isSidebarOpen,
    isAssistantOpen,
    isArtifactsLoading,
    assistantPanelMode,
    isSourceModalOpen,
    isPreviewOpen,
    previewMode,
    pendingDeletePost,
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
    requestDeletePost,
    cancelDeletePost,
    confirmDeletePost,
    handlePreviewOpen,
    handlePreviewClose,
    handleAIAction,
    handleApplyAIResult,
    handleAppendAIResult,
    handleTitleChange,
    handleContentChange,
    handleFileUpload,
    handleOpenImport,
    handleCloseImport,
    handleCloseAIResult,
    handleExportMarkdown,
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
  };
}
