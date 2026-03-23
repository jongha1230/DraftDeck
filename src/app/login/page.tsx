import Link from "next/link";
import LoginButton from "@/components/auth/LoginButton";
import { CheckCircle2, FileText, PlayCircle } from "lucide-react";

const POINTS = [
  "붙여넣은 자료와 파일을 초안 시작점으로 남길 수 있습니다.",
  "선택한 문장만 요약, 번역, 리라이트하고 실행 기록을 확인할 수 있습니다.",
  "자동 저장, revision 기록, Markdown export가 한 흐름 안에 있습니다.",
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
                기술 글 초안을 자료에서 바로 시작합니다
              </h1>
              <p className="mt-5 text-base leading-8 text-[var(--app-muted)]">
                DraftDeck은 범용 AI writer가 아니라 기술 글 초안 워크플로우에
                맞춘 작업 공간입니다. 자료 가져오기, 초안 생성, 선택 기반
                리라이트, 저장 기록 확인까지 같은 화면에서 이어집니다.
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
                  technical draft workflow
                </p>
              </div>
            </div>

            <h2 className="mt-8 text-3xl font-semibold tracking-[-0.04em] text-[var(--app-ink)] sm:text-4xl">
              바로 시작
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--app-muted)] sm:text-base">
              Google 계정으로 로그인하면 자료 기반 초안 생성, revision 기록,
              Markdown export가 있는 작업 화면으로 바로 들어갑니다.
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

              <div className="pt-1">
                <Link
                  href="/demo"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--app-line)] bg-white px-5 py-2.5 text-sm font-medium tracking-[-0.01em] text-[var(--app-ink)] transition-all duration-200 hover:border-[color:var(--app-line-strong)] hover:bg-[var(--app-surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  <PlayCircle size={16} />
                  게스트로 1회 체험
                </Link>
              </div>

              <p className="text-xs leading-6 text-[var(--app-muted)]">
                게스트 데모는 브라우저에만 저장되고 AI 결과는 예시 preview로
                동작합니다.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
