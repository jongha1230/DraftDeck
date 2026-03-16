import CustomButton from "@/components/ui/CustomButton";
import { FilePlus2, PanelLeft } from "lucide-react";

const NEXT_ACTIONS = [
  "왼쪽에서 최근 문서를 다시 엽니다.",
  "새 문서를 만들면 바로 편집 화면으로 들어갑니다.",
  "문서를 연 뒤에만 보조 패널과 미리보기가 활성화됩니다.",
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
          새 초안을 시작하거나 최근 문서를 이어서 작성하세요
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--app-muted)] md:text-base">
          빈 상태에서는 다음 행동만 간결하게 보이게 두고, 실제 편집 화면은
          문서를 여는 즉시 전면에 나옵니다.
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
