import CustomButton from "@/components/ui/CustomButton";
import { Download, Eye, Loader2, PanelLeft, PanelRight } from "lucide-react";

interface DraftHeaderProps {
  title: string;
  hasActivePost: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isAiLoading: boolean;
  isAssistantOpen: boolean;
  revisionNumber: number | null;
  onTitleChange: (value: string) => void;
  onPreviewOpen: () => void;
  onExportMarkdown: () => void;
  onSidebarToggle: () => void;
  onAssistantToggle: () => void;
}

export default function DraftHeader({
  title,
  hasActivePost,
  isSaving,
  isDirty,
  isAiLoading,
  isAssistantOpen,
  revisionNumber,
  onTitleChange,
  onPreviewOpen,
  onExportMarkdown,
  onSidebarToggle,
  onAssistantToggle,
}: DraftHeaderProps) {
  return (
    <header className="border-b border-[color:var(--app-line)] bg-white/80">
      <div className="px-4 py-4 md:px-6 xl:px-8">
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

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
                작업 공간
              </p>
              <p className="truncate text-sm font-medium text-[var(--app-ink)]">
                DraftDeck
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={onPreviewOpen}
              disabled={!hasActivePost || isAiLoading}
              className="gap-2"
            >
              <Eye size={15} />
              미리보기
            </CustomButton>
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={onExportMarkdown}
              disabled={!hasActivePost || isAiLoading}
              className="gap-2"
            >
              <Download size={15} />
              Markdown 내보내기
            </CustomButton>

            <CustomButton
              size="sm"
              variant={isAssistantOpen ? "secondary" : "ghost"}
              className="gap-2"
              onClick={onAssistantToggle}
              disabled={!hasActivePost && !isAssistantOpen}
            >
              <PanelRight size={15} />
              {isAssistantOpen ? "도우미 숨기기" : "도우미"}
            </CustomButton>
          </div>
        </div>

        {hasActivePost ? (
          <div className="mt-5">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="제목 없는 문서"
              className="w-full bg-transparent text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--app-ink)] placeholder:text-[color:rgba(102,112,133,0.56)] focus:outline-none md:text-[2.8rem]"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--app-muted)]">
              <span className="inline-flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isSaving ? "bg-[var(--app-primary)]" : "bg-emerald-500"
                  }`}
                />
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    저장 중
                  </>
                ) : (
                  isDirty ? "저장 대기 중" : "자동 저장됨"
                )}
              </span>
              <span className="hidden h-4 w-px bg-[var(--app-line)] sm:block" />
              <span>v{revisionNumber ?? 1}</span>
              <span className="hidden h-4 w-px bg-[var(--app-line)] sm:block" />
              <span>자료, AI 기록, 리비전을 오른쪽 패널에서 함께 확인합니다.</span>
            </div>
          </div>
        ) : (
          <div className="mt-5">
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
