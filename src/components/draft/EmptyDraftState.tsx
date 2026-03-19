import CustomButton from "@/components/ui/CustomButton";
import { FilePlus2, PanelLeft } from "lucide-react";

const NEXT_ACTIONS = [
  "왼쪽에서 최근 문서를 다시 열 수 있습니다.",
  "새 문서를 만들면 바로 편집 화면으로 들어갑니다.",
  "문서를 연 뒤 자료 import, AI 리라이트, Markdown export가 이어집니다.",
];

interface EmptyDraftStateProps {
  onCreatePost: () => void;
  onBrowseDrafts: () => void;
}

export default function EmptyDraftState({
  onCreatePost,
  onBrowseDrafts,
}: EmptyDraftStateProps) {
  return (
    <section className="app-card rounded-[28px] px-6 py-7 md:px-8 md:py-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--app-ink)] md:text-4xl">
          기술 글 초안을 시작하거나 최근 문서를 이어서 작성하세요
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--app-muted)] md:text-base">
          DraftDeck은 소개 카드보다 실제 작성 흐름을 우선합니다. 문서를 열면
          곧바로 자료, AI 실행 기록, revision이 연결된 편집 화면으로 들어갑니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <CustomButton size="sm" className="gap-2" onClick={onCreatePost}>
            <FilePlus2 size={15} />
            새 문서 만들기
          </CustomButton>
          <CustomButton
            size="sm"
            variant="outline"
            className="gap-2 xl:hidden"
            onClick={onBrowseDrafts}
          >
            <PanelLeft size={15} />
            문서 목록 보기
          </CustomButton>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {NEXT_ACTIONS.map((action) => (
            <div
              key={action}
              className="rounded-[22px] border border-[color:var(--app-line)] bg-[var(--app-surface-muted)] px-4 py-4"
            >
              <p className="text-sm leading-7 text-[var(--app-ink)]">{action}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
