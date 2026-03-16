import AIResultPanel from "@/components/editor/AIResultPanel";
import CustomButton from "@/components/ui/CustomButton";
import { AIActionType, AssistantPanelMode } from "@/types";
import {
  FileInput,
  Languages,
  PanelRightClose,
  ScanText,
  Sparkles,
  Wand2,
} from "lucide-react";

interface AssistantPanelProps {
  isOpen: boolean;
  mode: AssistantPanelMode;
  selectionText: string;
  isAiLoading: boolean;
  aiResultText: string;
  onClose: () => void;
  onOpenImport: () => void;
  onOpenPreview: () => void;
  onRunAction: (action: AIActionType, selection?: string) => void;
  onApplyAIResult: (text: string) => void;
  onAppendAIResult: (text: string) => void;
  onCloseAIResult: () => void;
}

const TITLES: Record<AssistantPanelMode, string> = {
  overview: "도구",
  selection: "선택한 문장",
  result: "생성 결과",
};

export default function AssistantPanel({
  isOpen,
  mode,
  selectionText,
  isAiLoading,
  aiResultText,
  onClose,
  onOpenImport,
  onOpenPreview,
  onRunAction,
  onApplyAIResult,
  onAppendAIResult,
  onCloseAIResult,
}: AssistantPanelProps) {
  const hasSelection = selectionText.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="도우미 패널 닫기"
        className={`fixed inset-0 z-30 bg-[color:rgba(15,23,42,0.24)] transition-opacity xl:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`app-scrollbar fixed inset-y-0 right-0 z-40 flex w-full max-w-[20rem] flex-col overflow-y-auto border-y-0 border-l border-r-0 border-[color:var(--app-line)] bg-[rgba(250,251,253,0.98)] px-4 py-5 transition-transform duration-300 xl:static xl:w-[18.5rem] xl:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full xl:hidden"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
              {TITLES[mode]}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
              본문 작업을 방해하지 않는 선에서 필요한 기능만 둡니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-[var(--app-muted)] transition hover:bg-white hover:text-[var(--app-ink)] xl:hidden"
            aria-label="도우미 닫기"
          >
            <PanelRightClose size={18} />
          </button>
        </div>

        <div className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          <p className="text-sm font-semibold text-[var(--app-ink)]">가져오기</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onOpenImport}
            >
              <FileInput size={14} />
              자료 가져오기
            </CustomButton>
            <CustomButton
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={onOpenPreview}
            >
              <ScanText size={14} />
              미리보기
            </CustomButton>
          </div>
        </div>

        <div className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--app-ink)]">
              선택한 문장
            </p>
            <span className="text-xs text-[var(--app-muted)]">
              {hasSelection ? `${selectionText.trim().length}자` : "선택 없음"}
            </span>
          </div>

          <div className="mt-3 rounded-[18px] border border-[color:var(--app-line)] bg-white px-4 py-3">
            <p className="text-sm leading-7 text-[var(--app-ink)]">
              {hasSelection
                ? selectionText
                : "편집 중 필요한 문장만 선택해서 요약, 번역, 톤 정리를 실행합니다."}
            </p>
          </div>

          <div className="mt-3 grid gap-2">
            <CustomButton
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => onRunAction(AIActionType.SUMMARIZE, selectionText)}
              disabled={!hasSelection || isAiLoading}
            >
              <Sparkles size={14} />
              요약
            </CustomButton>
            <CustomButton
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() =>
                onRunAction(AIActionType.DEVELOPER_REWRITE, selectionText)
              }
              disabled={!hasSelection || isAiLoading}
            >
              <Wand2 size={14} />
              개발자 톤 정리
            </CustomButton>
            <CustomButton
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => onRunAction(AIActionType.TRANSLATE, selectionText)}
              disabled={!hasSelection || isAiLoading}
            >
              <Languages size={14} />
              번역
            </CustomButton>
          </div>
        </div>

        <div className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          <p className="text-sm font-semibold text-[var(--app-ink)]">문서 전체</p>
          <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
            구조 정리나 톤 정리가 필요할 때만 전체 리라이트를 실행합니다.
          </p>
          <div className="mt-3">
            <CustomButton
              variant="outline"
              size="sm"
              className="w-full justify-center gap-2"
              onClick={() => onRunAction(AIActionType.DEVELOPER_REWRITE)}
              disabled={isAiLoading}
            >
              <Wand2 size={14} />
              전체 초안 다듬기
            </CustomButton>
          </div>
        </div>

        <div className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          {aiResultText || isAiLoading ? (
            <AIResultPanel
              text={aiResultText}
              isStreaming={isAiLoading}
              onApply={onApplyAIResult}
              onAppend={onAppendAIResult}
              onClose={onCloseAIResult}
            />
          ) : (
            <div className="rounded-[18px] border border-dashed border-[color:var(--app-line-strong)] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[var(--app-ink)]">
                결과 대기 중
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                액션을 실행하면 이곳에 결과가 나타납니다.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
