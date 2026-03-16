import LoginButton from "@/components/auth/LoginButton";
import { CheckCircle2, FileText } from "lucide-react";

const POINTS = [
  "최근 문서를 바로 이어서 작성할 수 있습니다.",
  "선택한 문장만 요약, 번역, 리라이트할 수 있습니다.",
  "자동 저장과 미리보기가 같은 흐름 안에 있습니다.",
];

export default function LoginPage() {
  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <section className="hidden lg:block">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
                DraftDeck
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">
                로그인 후 바로 문서 작성으로 들어갑니다
              </h1>
              <p className="mt-5 text-base leading-8 text-[var(--app-muted)]">
                소개 화면보다 작업 화면이 먼저 보이도록 구성했습니다. 최근 문서,
                본문 편집, 보조 도구가 한 흐름 안에서 이어집니다.
              </p>
            </div>

            <div className="mt-10 grid max-w-3xl gap-3">
              {POINTS.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-[24px] border border-[color:var(--app-line)] bg-white px-4 py-4"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-[var(--app-primary)]"
                  />
                  <p className="text-sm leading-7 text-[var(--app-ink)]">{point}</p>
                </div>
              ))}
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
                  개인 문서 작업 공간
                </p>
              </div>
            </div>

            <h2 className="mt-8 text-3xl font-semibold tracking-[-0.04em] text-[var(--app-ink)] sm:text-4xl">
              바로 시작
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--app-muted)] sm:text-base">
              Google 계정으로 로그인하면 최근 문서와 새 초안 작성 화면으로 바로
              들어갑니다.
            </p>

            <div className="mt-8 space-y-3 rounded-[26px] border border-[color:var(--app-line)] bg-white p-5">
              {POINTS.map((point) => (
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
