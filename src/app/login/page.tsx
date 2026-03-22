import LoginButton from "@/components/auth/LoginButton";
import { CheckCircle2, FileText } from "lucide-react";

const CARD_POINTS = [
  "붙여넣은 자료와 파일을 초안 시작점으로 남길 수 있습니다.",
  "선택한 문장만 요약, 번역, 리라이트하고 실행 기록을 확인할 수 있습니다.",
  "자동 저장, revision 기록, Markdown export가 한 흐름 안에 있습니다.",
];

const DESKTOP_FLOW = [
  {
    label: "Flow 01",
    title: "자료에서 시작",
    description:
      "메모와 파일을 초안 시작점으로 남기고 첫 구조를 빠르게 세웁니다.",
  },
  {
    label: "Flow 02",
    title: "문장 단위로 다듬기",
    description:
      "선택한 문장만 요약, 번역, 리라이트해서 포트폴리오 글의 밀도를 올립니다.",
  },
  {
    label: "Flow 03",
    title: "기록을 남기며 마무리",
    description: "revision 기록과 export가 같은 작업 화면 안에서 이어집니다.",
  },
] as const;

export default function LoginPage() {
  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center xl:gap-12">
          <section className="hidden lg:block">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
                DraftDeck
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">
                포트폴리오용 기술 글 초안을 빠르게 시작합니다
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--app-muted)]">
                로그인 후에는 자료를 붙여넣고 초안 구조를 세운 뒤, 선택 기반
                리라이트와 Markdown export까지 한 흐름으로 이어집니다.
              </p>
            </div>

            <div className="mt-10 max-w-2xl rounded-[28px] border border-[color:var(--app-line)] bg-white/90 px-6 py-5 shadow-[var(--app-shadow-sm)]">
              <div className="flex items-center justify-between gap-4 border-b border-[color:var(--app-line)] pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">
                    Workflow
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
                    로그인 후 바로 이어지는 3단계
                  </h3>
                </div>
                <p className="text-sm text-[var(--app-muted)]">
                  포트폴리오 초안 기준
                </p>
              </div>

              <div className="divide-y divide-[color:var(--app-line)]">
                {DESKTOP_FLOW.map((item, index) => (
                  <div
                    key={item.label}
                    className={`grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-4 ${
                      index === DESKTOP_FLOW.length - 1 ? "pb-1" : ""
                    }`}
                  >
                    <p className="pt-0.5 text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">
                      {item.label}
                    </p>
                    <div>
                      <p className="text-base font-semibold text-[var(--app-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-[var(--app-muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="app-panel mx-auto w-full max-w-xl rounded-[30px] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-[var(--primary-foreground)]">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">
                  DraftDeck
                </p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  기술 글 초안 워크플로우
                </p>
              </div>
            </div>

            <h2 className="mt-8 text-3xl font-semibold tracking-[-0.04em] text-[var(--app-ink)] sm:text-4xl">
              바로 시작
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--app-muted)] sm:text-base">
              Google 계정으로 로그인하면 초안 시작, 선택 리라이트, revision
              확인이 있는 작업 화면으로 바로 들어갑니다.
            </p>

            <div className="mt-8 space-y-3 rounded-[26px] border border-[color:var(--app-line)] bg-white p-5">
              {CARD_POINTS.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-[20px] bg-[var(--app-surface-muted)] px-4 py-3"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-[var(--app-primary)]"
                  />
                  <p className="text-sm leading-6 text-[var(--app-ink)]">{point}</p>
                </div>
              ))}

              <div className="pt-2">
                <LoginButton />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
