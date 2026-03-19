import AIResultPanel from "@/components/editor/AIResultPanel";
import CustomButton from "@/components/ui/CustomButton";
import {
  getAIActionLabel,
  getRevisionTriggerLabel,
} from "@/lib/drafts/records";
import { AIActionType, DraftArtifacts, type AssistantPanelMode } from "@/types";
import {
  Download,
  FileInput,
  FileText,
  History,
  Languages,
  PanelRightClose,
  ScanText,
  Sparkles,
  Wand2,
} from "lucide-react";

interface AssistantPanelProps {
  isOpen: boolean;
  mode: AssistantPanelMode;
  artifacts: DraftArtifacts;
  revisionNumber: number;
  selectionText: string;
  isAiLoading: boolean;
  isArtifactsLoading: boolean;
  aiResultText: string;
  onClose: () => void;
  onOpenImport: () => void;
  onOpenPreview: () => void;
  onExportMarkdown: () => void;
  onRunAction: (action: AIActionType, selection?: string) => void;
  onApplyAIResult: (text: string) => void;
  onAppendAIResult: (text: string) => void;
  onCloseAIResult: () => void;
}

const TITLES: Record<AssistantPanelMode, string> = {
  overview: "작업 기록",
  selection: "선택한 문장",
  result: "생성 결과",
};

const formatTime = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AssistantPanel({
  isOpen,
  mode,
  artifacts,
  revisionNumber,
  selectionText,
  isAiLoading,
  isArtifactsLoading,
  aiResultText,
  onClose,
  onOpenImport,
  onOpenPreview,
  onExportMarkdown,
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
        className={`app-scrollbar fixed inset-y-0 right-0 z-40 flex w-full max-w-[22rem] flex-col overflow-y-auto border-y-0 border-l border-r-0 border-[color:var(--app-line)] bg-[rgba(250,251,253,0.98)] px-4 py-5 transition-transform duration-300 xl:static xl:w-[20rem] xl:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full xl:hidden"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
              {TITLES[mode]}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
              v{revisionNumber} 기준으로 자료, AI 실행, 저장 기록을 같이 본다.
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

        <section className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          <div className="grid gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={onOpenImport}
            >
              <FileInput size={14} />
              자료 가져오기
            </CustomButton>
            <CustomButton
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={onOpenPreview}
            >
              <ScanText size={14} />
              미리보기
            </CustomButton>
            <CustomButton
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={onExportMarkdown}
            >
              <Download size={14} />
              Markdown 내보내기
            </CustomButton>
          </div>
        </section>

        <section className="mt-5 border-t border-[color:var(--app-line)] pt-5">
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
        </section>

        <section className="mt-5 border-t border-[color:var(--app-line)] pt-5">
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
        </section>

        <section className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[var(--app-primary)]" />
            <p className="text-sm font-semibold text-[var(--app-ink)]">최근 자료</p>
          </div>
          {isArtifactsLoading ? (
            <p className="mt-3 text-sm text-[var(--app-muted)]">기록 불러오는 중</p>
          ) : artifacts.sources.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
              아직 가져온 자료가 없습니다.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {artifacts.sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-[18px] border border-[color:var(--app-line)] bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[var(--app-ink)]">
                      {source.label}
                    </p>
                    <span className="text-xs text-[var(--app-muted)]">
                      {formatTime(source.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--app-muted)]">
                    {source.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          <div className="flex items-center gap-2">
            <History size={15} className="text-[var(--app-primary)]" />
            <p className="text-sm font-semibold text-[var(--app-ink)]">리비전</p>
          </div>
          {isArtifactsLoading ? (
            <p className="mt-3 text-sm text-[var(--app-muted)]">기록 불러오는 중</p>
          ) : artifacts.revisions.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
              아직 저장 이력이 없습니다.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {artifacts.revisions.map((revision) => (
                <div
                  key={revision.id}
                  className="rounded-[18px] border border-[color:var(--app-line)] bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--app-ink)]">
                      v{revision.revision_number}
                    </p>
                    <span className="text-xs text-[var(--app-muted)]">
                      {formatTime(revision.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                    {getRevisionTriggerLabel(revision.trigger)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[var(--app-primary)]" />
            <p className="text-sm font-semibold text-[var(--app-ink)]">AI 실행 기록</p>
          </div>
          {isArtifactsLoading ? (
            <p className="mt-3 text-sm text-[var(--app-muted)]">기록 불러오는 중</p>
          ) : artifacts.aiRuns.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
              아직 AI 실행 기록이 없습니다.
            </p>
          ) : (
            <div className="mt-3 space-y-2 pb-2">
              {artifacts.aiRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-[18px] border border-[color:var(--app-line)] bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--app-ink)]">
                      {getAIActionLabel(run.action)}
                    </p>
                    <span className="text-xs text-[var(--app-muted)]">
                      {formatTime(run.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--app-muted)]">
                    {run.input_excerpt || "입력 요약 없음"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
    </>
  );
}
