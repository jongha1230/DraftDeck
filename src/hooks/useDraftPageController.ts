"use client";

import { runAIAction } from "@/app/actions";
import { createPreviewAIResult } from "@/lib/ui-preview";
import { useDraftStore } from "@/store/useDraftStore";
import {
  AIActionType,
  AssistantPanelMode,
  Post,
  PreviewMode,
} from "@/types";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

interface UseDraftPageControllerParams {
  initialPosts: Post[];
  isPreview?: boolean;
}

export function useDraftPageController({
  initialPosts,
  isPreview = false,
}: UseDraftPageControllerParams) {
  const {
    posts,
    activePostId,
    isSaving,
    isAiLoading,
    aiResultText,
    notifications,
    setPosts,
    setActivePostId,
    createPost,
    updatePost,
    deletePost,
    setAiLoading,
    setAiResultText,
    resetAiState,
    pushNotification,
    dismissNotification,
  } = useDraftStore();

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("preview");
  const [sourceInput, setSourceInput] = useState("");
  const [selectionText, setSelectionText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPanelMode, setAssistantPanelMode] =
    useState<AssistantPanelMode>("overview");
  const [pendingDeletePost, setPendingDeletePost] = useState<Post | null>(null);
  const [hasInitializedStore, setHasInitializedStore] = useState(false);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const hasHydratedInitialPosts = useRef(false);
  const fallbackActivePostId = initialPosts[0]?.id ?? null;
  const resolvedPosts = hasInitializedStore ? posts : initialPosts;
  const resolvedActivePostId = hasInitializedStore
    ? activePostId
    : fallbackActivePostId;

  const activePost = useMemo(
    () => resolvedPosts.find((post) => post.id === resolvedActivePostId),
    [resolvedPosts, resolvedActivePostId],
  );

  useEffect(() => {
    if (hasHydratedInitialPosts.current) return;

    setPosts(initialPosts);
    if (initialPosts.length > 0) {
      setActivePostId(initialPosts[0].id);
    }

    hasHydratedInitialPosts.current = true;
    setHasInitializedStore(true);
  }, [initialPosts, setPosts, setActivePostId]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      setIsAssistantOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      const text = window.getSelection()?.toString().trim() || "";
      setSelectionText(text);

      if (text) {
        setAssistantPanelMode("selection");
      } else if (!aiResultText) {
        setAssistantPanelMode("overview");
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [aiResultText]);

  useEffect(() => {
    if (aiResultText) {
      setAssistantPanelMode("result");
      setIsAssistantOpen(true);
    }
  }, [aiResultText]);

  const openAssistantPanel = (mode?: AssistantPanelMode) => {
    if (mode) {
      setAssistantPanelMode(mode);
    } else if (aiResultText) {
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
    await createPost();
    closeSidebar();
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

    await deletePost(pendingDeletePost.id);
    setPendingDeletePost(null);
  };

  const handleAIAction = async (action: AIActionType, selection?: string) => {
    if (isAiLoading) return;
    if (action !== AIActionType.SOURCE_TO_DRAFT && !activePost) return;

    setAiLoading(true);
    setAiResultText("");

    try {
      const inputText =
        action === AIActionType.SOURCE_TO_DRAFT
          ? sourceInput
          : selection || activePost?.content || "";

      if (isPreview) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 320);
        });

        setAiResultText(createPreviewAIResult(action, inputText));
        setAssistantPanelMode("result");
        setIsAssistantOpen(true);

        if (action === AIActionType.SOURCE_TO_DRAFT) {
          setIsSourceModalOpen(false);
          setSourceInput("");
        }

        return;
      }

      const result = await runAIAction(action, inputText);

      if (!result.success) {
        throw new Error(result.error || "AI 응답 실패");
      }

      setAiResultText(result.text);
      setAssistantPanelMode("result");
      setIsAssistantOpen(true);

      if (action === AIActionType.SOURCE_TO_DRAFT) {
        setIsSourceModalOpen(false);
        setSourceInput("");
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

  const handleApplyAIResult = (text: string) => {
    if (!activePostId) return;
    void updatePost(activePostId, { content: text });
    resetAiState();
    setAssistantPanelMode(selectionText ? "selection" : "overview");
  };

  const handleAppendAIResult = (text: string) => {
    if (!activePost || !activePostId) return;
    void updatePost(activePostId, { content: `${activePost.content}\n\n${text}` });
    resetAiState();
    setAssistantPanelMode(selectionText ? "selection" : "overview");
  };

  const handleTitleChange = (title: string) => {
    if (!activePostId) return;
    void updatePost(activePostId, { title });
  };

  const handleContentChange = (content: string) => {
    if (!activePostId) return;
    void updatePost(activePostId, { content });
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
  };

  const handleCloseAIResult = () => {
    resetAiState();
    setAssistantPanelMode(selectionText ? "selection" : "overview");
  };

  return {
    posts: resolvedPosts,
    notifications,
    activePostId: resolvedActivePostId,
    activePost,
    isSaving,
    isAiLoading,
    aiResultText,
    selectionText,
    sourceInput,
    isSidebarOpen,
    isAssistantOpen,
    assistantPanelMode,
    isSourceModalOpen,
    isPreviewOpen,
    previewMode,
    pendingDeletePost,
    contentScrollRef,
    setSourceInput,
    setIsSourceModalOpen,
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
  };
}
