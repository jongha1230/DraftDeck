import Editor from "@/components/editor/Editor";
import CustomButton from "@/components/ui/CustomButton";
import { Post } from "@/types";
import { PanelRight, TextCursorInput } from "lucide-react";

interface DraftEditorPaneProps {
  post: Post;
  selectionText: string;
  isAssistantOpen: boolean;
  onOpenAssistant: () => void;
  onContentChange: (content: string) => void;
}

export default function DraftEditorPane({
  post,
  selectionText,
  isAssistantOpen,
  onOpenAssistant,
  onContentChange,
}: DraftEditorPaneProps) {
  const selectedLength = selectionText.trim().length;

  return (
    <div className="space-y-4">
      <section className="app-card rounded-[26px] px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--app-muted)]">
            <span className="app-chip">본문</span>
            <span className="app-chip">
              <TextCursorInput size={14} />
              {selectedLength > 0
                ? `${selectedLength.toLocaleString()}자 선택`
                : "선택 없음"}
            </span>
            <span className="app-chip">{post.content.length.toLocaleString()}자</span>
            <span className="app-chip">v{post.revision_number}</span>
          </div>

          <CustomButton
            type="button"
            variant={isAssistantOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={onOpenAssistant}
            className="gap-2"
          >
            <PanelRight size={15} />
            {isAssistantOpen ? "도우미 보기" : "도우미 열기"}
          </CustomButton>
        </div>

        {selectedLength > 0 ? (
          <div className="mt-4 rounded-[20px] border border-[color:var(--app-line)] bg-[var(--app-surface-emphasis)] px-4 py-3.5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-primary)]">
              선택한 문장
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--app-ink)]">
              {selectionText}
            </p>
          </div>
        ) : null}
      </section>

      <section className="app-card overflow-hidden rounded-[28px]">
        <div className="border-b border-[color:var(--app-line)] px-5 py-4 md:px-6">
          <p className="text-sm font-semibold text-[var(--app-ink)]">편집 캔버스</p>
        </div>

        <div className="px-5 py-6 md:px-6 md:py-7">
          <div className="mx-auto max-w-[52rem]">
            <Editor
              key={post.id}
              content={post.content}
              onChange={(markdown) => onContentChange(markdown)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
