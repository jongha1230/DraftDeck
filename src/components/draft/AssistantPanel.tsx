import CustomButton from "@/components/ui/CustomButton";
import { formatRecordDate } from "@/lib/date-format";
import { getAIActionLabel, getRevisionTriggerLabel } from "@/lib/drafts/records";
import { DraftArtifacts, DraftRevisionTrigger } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  FileInput,
  FileText,
  History,
  PanelRightClose,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ReactNode, useMemo } from "react";

interface AssistantPanelProps {
  isOpen: boolean;
  artifacts: DraftArtifacts;
  displayRevisionNumber: number;
  isArtifactsLoading: boolean;
  onToggle: () => void;
  onOpenImport: () => void;
  onRestoreRevision: (revisionId: string) => void;
  onDeleteRevision: (revisionId: string) => void;
}

interface PanelSectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

function PanelSection({ icon, title, children }: PanelSectionProps) {
  return (
    <section className="mt-5 border-t border-[color:var(--app-line)] pt-5">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-[var(--app-ink)]">{title}</p>
      </div>
      {children}
    </section>
  );
}

export default function AssistantPanel({
  isOpen,
  artifacts,
  displayRevisionNumber,
  isArtifactsLoading,
  onToggle,
  onOpenImport,
  onRestoreRevision,
  onDeleteRevision,
}: AssistantPanelProps) {
  const recentRevisions = useMemo(() => {
    const seen = new Set<number>();

    return artifacts.revisions
      .filter((revision) => {
        if (seen.has(revision.revision_number)) {
          return false;
        }

        seen.add(revision.revision_number);
        return true;
      })
      .slice(0, 3);
  }, [artifacts.revisions]);

  const recentSources = artifacts.sources.slice(0, 2);
  const recentAIRuns = artifacts.aiRuns.slice(0, 2);

  const revisionDisplayMap = useMemo(() => {
    const map = new Map<string, number>();
    const total = recentRevisions.length;

    recentRevisions.forEach((revision, index) => {
      map.set(revision.id, total - index);
    });

    return map;
  }, [recentRevisions]);

  const revisionByAiRunId = useMemo(() => {
    const map = new Map<string, number>();

    for (const revision of recentRevisions) {
      if (revision.ai_run_id) {
        map.set(
          revision.ai_run_id,
          revisionDisplayMap.get(revision.id) ?? displayRevisionNumber,
        );
      }
    }

    return map;
  }, [displayRevisionNumber, recentRevisions, revisionDisplayMap]);

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label="보조 패널 닫기"
        className={`fixed inset-0 z-30 bg-[color:rgba(15,23,42,0.24)] transition-opacity xl:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? "도우미 패널 접기" : "도우미 패널 펼치기"}
        className={`absolute top-1/2 z-30 hidden h-12 w-7 -translate-y-1/2 items-center justify-center rounded-l-2xl border border-r-0 border-[color:var(--app-line)] bg-white text-[var(--app-muted)] shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] transition hover:text-[var(--app-ink)] xl:flex ${
          isOpen ? "right-[18.5rem] 2xl:right-[19rem]" : "right-0"
        }`}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[20rem] flex-col overflow-hidden border-y-0 border-l border-r-0 border-[color:var(--app-line)] bg-[rgba(250,251,253,0.98)] px-4 py-5 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.4)] transition-transform duration-300 xl:absolute xl:inset-y-0 xl:right-0 xl:z-20 xl:w-[18.5rem] xl:max-w-none 2xl:w-[19rem] ${
          isOpen
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
              도우미 패널
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
              현재 문서 v{displayRevisionNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="rounded-2xl p-2 text-[var(--app-muted)] transition hover:bg-white hover:text-[var(--app-ink)] xl:hidden"
            aria-label="패널 닫기"
          >
            <PanelRightClose size={18} />
          </button>
        </div>

        <section className="mt-5 border-t border-[color:var(--app-line)] pt-5">
          <CustomButton
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={onOpenImport}
          >
            <FileInput size={14} />
            자료 가져오기
          </CustomButton>
        </section>

        <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          <PanelSection
            icon={<FileText size={15} className="text-[var(--app-primary)]" />}
            title="최근 자료"
          >
            {isArtifactsLoading ? (
              <p className="mt-3 text-sm text-[var(--app-muted)]">기록 불러오는 중</p>
            ) : artifacts.sources.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                아직 가져온 자료가 없습니다.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentSources.map((source) => (
                  <div
                    key={source.id}
                    className="rounded-[18px] border border-[color:var(--app-line)] bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[var(--app-ink)]">
                        {source.label}
                      </p>
                      <span className="text-xs text-[var(--app-muted)]">
                        {formatRecordDate(source.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--app-muted)]">
                      {source.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </PanelSection>

          <PanelSection
            icon={<History size={15} className="text-[var(--app-primary)]" />}
            title="최근 버전"
          >
            {isArtifactsLoading ? (
              <p className="mt-3 text-sm text-[var(--app-muted)]">기록 불러오는 중</p>
            ) : artifacts.revisions.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                아직 저장 이력이 없습니다.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentRevisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="rounded-[18px] border border-[color:var(--app-line)] bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--app-ink)]">
                          v{revisionDisplayMap.get(revision.id) ?? displayRevisionNumber}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                          {getRevisionTriggerLabel(revision.trigger)}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--app-muted)]">
                        {formatRecordDate(revision.created_at)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onDeleteRevision(revision.id)}
                        className="inline-flex items-center gap-1 text-xs text-[var(--app-muted)] transition hover:text-[var(--app-danger)]"
                        aria-label={`v${revisionDisplayMap.get(revision.id) ?? displayRevisionNumber} 삭제`}
                        disabled={revision.trigger === DraftRevisionTrigger.CREATE}
                      >
                        <Trash2 size={13} />
                        삭제
                      </button>
                      <CustomButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-0 text-[var(--app-primary)] hover:bg-transparent hover:text-[var(--app-primary-strong)]"
                        onClick={() => onRestoreRevision(revision.id)}
                      >
                        이 버전으로 되돌리기
                      </CustomButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelSection>

          <PanelSection
            icon={<Sparkles size={15} className="text-[var(--app-primary)]" />}
            title="AI 실행 기록"
          >
            {isArtifactsLoading ? (
              <p className="mt-3 text-sm text-[var(--app-muted)]">기록 불러오는 중</p>
            ) : artifacts.aiRuns.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                아직 AI 실행 기록이 없습니다.
              </p>
            ) : (
              <div className="mt-3 space-y-1.5 pb-2">
                {recentAIRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--app-line)] bg-white px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Sparkles
                        size={13}
                        className="shrink-0 text-[var(--app-primary)]"
                      />
                      <p className="truncate text-sm font-medium text-[var(--app-ink)]">
                        {getAIActionLabel(run.action)}
                        {revisionByAiRunId.get(run.id)
                          ? ` · v${revisionByAiRunId.get(run.id)}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--app-muted)]">
                      {formatRecordDate(run.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </PanelSection>
        </div>
      </aside>
    </>
  );
}
