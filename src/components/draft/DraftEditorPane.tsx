import Editor from "@/components/editor/Editor";
import CustomButton from "@/components/ui/CustomButton";
import { AIActionType, Post } from "@/types";
import {
  Languages,
  Loader2,
  Sparkles,
  TextCursorInput,
  Wand2,
} from "lucide-react";

interface DraftEditorPaneProps {
  post: Post;
  selectionText: string;
  isAiLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  onSelectionChange: (selection: string) => void;
  onContentChange: (content: string) => void;
  onRunSelectionAction: (action: AIActionType, selection?: string) => void;
}

export default function DraftEditorPane({
  post,
  selectionText,
  isAiLoading,
  isSaving,
  isDirty,
  onSelectionChange,
  onContentChange,
  onRunSelectionAction,
}: DraftEditorPaneProps) {
  const selectedLength = selectionText.trim().length;
  const hasSelection = selectedLength > 0;
  const statusLabel = isSaving
    ? "저장 중"
    : isDirty
      ? "저장 대기 중"
      : "자동 저장됨";

  return (
    <div className="space-y-4">
      <section className="px-1 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--app-muted)]">
            <span className="app-chip">본문</span>
            <span className="app-chip">
              <TextCursorInput size={14} />
              {hasSelection
                ? `${selectedLength.toLocaleString()}자 선택`
                : "선택 없음"}
            </span>
            <span className="app-chip">{post.content.length.toLocaleString()}자</span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
            <CustomButton
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 whitespace-nowrap px-2 text-[13px]"
              onClick={() =>
                onRunSelectionAction(AIActionType.SUMMARIZE, selectionText)
              }
              disabled={!hasSelection || isAiLoading}
            >
              <Sparkles size={14} />
              요약하기
            </CustomButton>
            <CustomButton
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 whitespace-nowrap px-2 text-[13px]"
              onClick={() =>
                onRunSelectionAction(
                  AIActionType.DEVELOPER_REWRITE,
                  selectionText,
                )
              }
              disabled={!hasSelection || isAiLoading}
            >
              <Wand2 size={14} />
              개발자 톤 정리
            </CustomButton>
            <CustomButton
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 whitespace-nowrap px-2 text-[13px]"
              onClick={() =>
                onRunSelectionAction(AIActionType.TRANSLATE, selectionText)
              }
              disabled={!hasSelection || isAiLoading}
            >
              <Languages size={14} />
              번역
            </CustomButton>
          </div>
        </div>
      </section>

      <section className="app-card overflow-hidden rounded-[28px]">
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--app-line)] px-5 py-4 md:px-6">
          <p className="text-sm font-semibold text-[var(--app-ink)]">편집 캔버스</p>

          <div className="hidden items-center gap-2 text-xs text-[var(--app-muted)] sm:flex">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span
                className={`h-2 w-2 rounded-full ${
                  isSaving ? "bg-[var(--app-primary)]" : "bg-emerald-500"
                }`}
              />
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  {statusLabel}
                </>
              ) : (
                statusLabel
              )}
            </span>
            <span className="h-3.5 w-px bg-[var(--app-line)]" />
            <span className="whitespace-nowrap">v{post.revision_number}</span>
          </div>
        </div>

        <div className="px-5 py-6 md:px-6 md:py-7">
          <div className="mx-auto w-full max-w-[58rem]">
            <Editor
              key={post.id}
              content={post.content}
              onSelectionChange={onSelectionChange}
              onChange={(markdown) => onContentChange(markdown)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
