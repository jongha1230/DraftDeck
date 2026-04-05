"use client";

import { recordDraftSourceAction } from "@/app/actions";
import { createPreviewSource } from "@/lib/ui-preview";
import { useDraftStore } from "@/store/useDraftStore";
import {
  DraftArtifacts,
  DraftRevisionTrigger,
  DraftSourceKind,
  Post,
  SaveDraftOptions,
  ToastTone,
} from "@/types";
import {
  type ChangeEvent,
  useCallback,
  useMemo,
  useState,
} from "react";

const DEFAULT_SOURCE_LABEL = "붙여넣은 자료";
const FILE_SOURCE_LABEL = "업로드한 파일";

interface UseDraftSourceImportFlowParams {
  isPreview: boolean;
  activePost: Post | null;
  activePostId: string | null;
  activeArtifacts: DraftArtifacts;
  isPendingCreatePostId: (postId: string | null | undefined) => boolean;
  queueSave: (postId: string, options: SaveDraftOptions) => void;
  updatePostLocally: (postId: string, updates: Partial<Post>) => void;
  pushNotification: (message: string, tone?: ToastTone, title?: string) => void;
  openAssistantPanel: () => void;
}

export function useDraftSourceImportFlow({
  isPreview,
  activePost,
  activePostId,
  activeArtifacts,
  isPendingCreatePostId,
  queueSave,
  updatePostLocally,
  pushNotification,
  openAssistantPanel,
}: UseDraftSourceImportFlowParams) {
  const prependSource = useDraftStore((state) => state.prependSource);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [sourcePreviewId, setSourcePreviewId] = useState<string | null>(null);
  const [sourceInput, setSourceInput] = useState("");
  const [sourceLabel, setSourceLabel] = useState(DEFAULT_SOURCE_LABEL);
  const [sourceKind, setSourceKind] = useState<DraftSourceKind>(
    DraftSourceKind.PASTE,
  );

  const sourcePreview = useMemo(
    () =>
      activeArtifacts.sources.find((source) => source.id === sourcePreviewId) ?? null,
    [activeArtifacts.sources, sourcePreviewId],
  );

  const resetSourceDraft = useCallback(() => {
    setSourceInput("");
    setSourceLabel(DEFAULT_SOURCE_LABEL);
    setSourceKind(DraftSourceKind.PASTE);
  }, []);

  const resolveSourceLabel = useCallback(
    () =>
      sourceLabel.trim() ||
      (sourceKind === DraftSourceKind.FILE
        ? FILE_SOURCE_LABEL
        : DEFAULT_SOURCE_LABEL),
    [sourceKind, sourceLabel],
  );

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

  const recordCurrentSource = useCallback(
    async (postId: string) => {
      if (!sourceInput.trim()) {
        return null;
      }

      return recordSourceForPost(
        postId,
        sourceInput,
        resolveSourceLabel(),
        sourceKind,
      );
    },
    [recordSourceForPost, resolveSourceLabel, sourceInput, sourceKind],
  );

  const handleSourceInputChange = useCallback(
    (value: string) => {
      setSourceInput(value);
      if (sourceKind !== DraftSourceKind.FILE) {
        setSourceLabel(DEFAULT_SOURCE_LABEL);
        setSourceKind(DraftSourceKind.PASTE);
      }
    },
    [sourceKind],
  );

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
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
    },
    [pushNotification],
  );

  const handleOpenImport = useCallback(() => {
    setIsSourceModalOpen(true);
    openAssistantPanel();
  }, [openAssistantPanel]);

  const handleCloseImport = useCallback(() => {
    setIsSourceModalOpen(false);
    resetSourceDraft();
  }, [resetSourceDraft]);

  const handleOpenSourcePreview = useCallback(
    (sourceId: string) => {
      setSourcePreviewId(sourceId);
      openAssistantPanel();
    },
    [openAssistantPanel],
  );

  const handleCloseSourcePreview = useCallback(() => {
    setSourcePreviewId(null);
  }, []);

  const canApplySourceToCurrent =
    Boolean(activePost) && !isPendingCreatePostId(activePostId);

  const handleApplySourceToCurrent = useCallback(async () => {
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
      const sourceId = await recordCurrentSource(activePostId);

      updatePostLocally(activePostId, { content: sourceInput });
      queueSave(activePostId, {
        trigger: DraftRevisionTrigger.SOURCE_IMPORT,
        sourceId,
      });
      pushNotification(
        "가져온 자료를 현재 문서에 반영했습니다.",
        "success",
        "자료 적용",
      );
      handleCloseImport();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "자료를 현재 문서에 적용하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "자료 적용 실패");
    }
  }, [
    activePost,
    activePostId,
    handleCloseImport,
    isPendingCreatePostId,
    pushNotification,
    queueSave,
    recordCurrentSource,
    sourceInput,
    updatePostLocally,
  ]);

  return {
    canApplySourceToCurrent,
    handleApplySourceToCurrent,
    handleCloseImport,
    handleCloseSourcePreview,
    handleFileUpload,
    handleOpenImport,
    handleOpenSourcePreview,
    isSourceModalOpen,
    recordCurrentSource,
    setSourceInput: handleSourceInputChange,
    sourceInput,
    sourceKind,
    sourceLabel,
    sourcePreview,
  };
}
