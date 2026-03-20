import CustomButton from "@/components/ui/CustomButton";
import { Download, Eye, PanelLeft, PanelRight } from "lucide-react";

interface DraftHeaderProps {
  title: string;
  hasActivePost: boolean;
  isAiLoading: boolean;
  isAssistantOpen: boolean;
  onTitleChange: (value: string) => void;
  onPreviewOpen: () => void;
  onExportMarkdown: () => void;
  onSidebarToggle: () => void;
  onAssistantToggle: () => void;
}

export default function DraftHeader({
  title,
  hasActivePost,
  isAiLoading,
  isAssistantOpen,
  onTitleChange,
  onPreviewOpen,
  onExportMarkdown,
  onSidebarToggle,
  onAssistantToggle,
}: DraftHeaderProps) {
  return (
    <header className="border-b border-[color:var(--app-line)] bg-white/80">
      <div className="px-4 py-3 md:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onSidebarToggle}
              className="rounded-2xl border border-[color:var(--app-line)] bg-white p-2.5 text-[var(--app-muted)] transition hover:border-[color:var(--app-line-strong)] hover:text-[var(--app-ink)] xl:hidden"
              aria-label="문서 목록 열기"
            >
              <PanelLeft size={18} />
            </button>

            <p className="hidden text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)] sm:block">
              DraftDeck
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={onPreviewOpen}
              disabled={!hasActivePost || isAiLoading}
              className="gap-2 px-2.5 sm:px-3"
              aria-label="미리보기"
            >
              <Eye size={15} />
              <span className="hidden sm:inline">미리보기</span>
            </CustomButton>
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={onExportMarkdown}
              disabled={!hasActivePost || isAiLoading}
              className="gap-2 px-2.5 sm:px-3"
              aria-label="Markdown 내보내기"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Markdown 내보내기</span>
            </CustomButton>

            <CustomButton
              size="sm"
              variant={isAssistantOpen ? "secondary" : "ghost"}
              className="gap-2 px-2.5 sm:px-3 xl:hidden"
              onClick={onAssistantToggle}
              disabled={!hasActivePost && !isAssistantOpen}
              aria-label={isAssistantOpen ? "패널 숨기기" : "패널 열기"}
            >
              <PanelRight size={15} />
              <span className="hidden sm:inline">
                {isAssistantOpen ? "패널 숨기기" : "패널 열기"}
              </span>
            </CustomButton>
          </div>
        </div>

        {hasActivePost ? (
          <div className="mt-3">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="제목 없는 문서"
              className="w-full bg-transparent text-[1.8rem] font-semibold leading-none tracking-[-0.05em] text-[var(--app-ink)] placeholder:text-[color:rgba(102,112,133,0.56)] focus:outline-none md:text-[2.3rem]"
            />
          </div>
        ) : (
          <div className="mt-4">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--app-ink)] md:text-4xl">
              시작할 문서를 선택하세요
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              최근 초안을 열거나 새 문서를 만들어 바로 작성할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
