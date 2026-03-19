import CustomButton from "@/components/ui/CustomButton";
import { type ChangeEvent } from "react";
import { FileUp, X } from "lucide-react";

interface SourceImportModalProps {
  isOpen: boolean;
  sourceInput: string;
  sourceLabel: string;
  isAiLoading: boolean;
  onSourceInputChange: (value: string) => void;
  onClose: () => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
}

export default function SourceImportModal({
  isOpen,
  sourceInput,
  sourceLabel,
  isAiLoading,
  onSourceInputChange,
  onClose,
  onFileUpload,
  onGenerate,
}: SourceImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-[color:rgba(15,23,42,0.32)] p-0 md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="자료 가져오기 닫기"
      />

      <div className="app-panel relative flex w-full max-w-2xl flex-col rounded-t-[32px] px-5 pb-5 pt-6 md:rounded-[32px] md:px-6 md:pb-6">
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--app-line)] pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
              Source import
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              외부 텍스트를 초안 시작점으로 가져오기
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              메모나 Markdown 파일을 붙여넣으면 초안 뼈대를 빠르게 만들 수
              있습니다. 생성에 사용한 자료는 문서 기록에도 남깁니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isAiLoading}
            className="rounded-2xl p-2 text-[var(--app-muted)] transition hover:bg-white hover:text-[var(--app-ink)]"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-3 rounded-[18px] border border-[color:var(--app-line)] bg-[var(--app-surface-muted)] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">
              기록 이름
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--app-ink)]">
              {sourceLabel}
            </p>
          </div>
          <textarea
            className="app-scrollbar h-56 w-full resize-none rounded-[28px] border border-[color:var(--app-line)] bg-white p-5 text-sm leading-7 text-[var(--app-ink)] placeholder:text-[color:rgba(102,112,133,0.58)] focus:outline-none"
            placeholder="기존 메모나 자료를 붙여넣으세요. 예: 글 목적, 핵심 논점, 섹션 순서, 인용 메모"
            value={sourceInput}
            onChange={(event) => onSourceInputChange(event.target.value)}
            disabled={isAiLoading}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <input
              type="file"
              accept=".txt,.md"
              onChange={onFileUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={isAiLoading}
            />
            <CustomButton variant="outline" size="sm" className="gap-2">
              <FileUp size={15} />
              파일 불러오기 (.txt, .md)
            </CustomButton>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <CustomButton
              variant="ghost"
              onClick={onClose}
              disabled={isAiLoading}
            >
              취소
            </CustomButton>
            <CustomButton
              onClick={onGenerate}
              disabled={isAiLoading || !sourceInput.trim()}
              loading={isAiLoading}
            >
              초안 생성
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
}
