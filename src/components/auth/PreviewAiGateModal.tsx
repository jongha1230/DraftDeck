"use client";

import LoginButton from "@/components/auth/LoginButton";
import CustomButton from "@/components/ui/CustomButton";
import { getAIActionLabel } from "@/lib/drafts/records";
import { AIActionType } from "@/types";
import { LockKeyhole, Sparkles, X } from "lucide-react";

interface PreviewAiGateModalProps {
  action: AIActionType | null;
  isOpen: boolean;
  onClose: () => void;
  onContinuePreview: () => void;
}

export default function PreviewAiGateModal({
  action,
  isOpen,
  onClose,
  onContinuePreview,
}: PreviewAiGateModalProps) {
  if (!isOpen || !action) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-[color:rgba(15,23,42,0.38)] p-0 md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="AI 사용 안내 닫기"
      />

      <div className="app-panel app-sheet-in relative z-10 flex w-full max-w-lg flex-col rounded-t-[32px] px-5 pb-5 pt-6 md:app-dialog-in md:rounded-[32px] md:px-6 md:pb-6">
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--app-line)] pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
              Real AI gate
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              실제 AI는 로그인 후 사용할 수 있습니다
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              지금 누른 작업은 <span className="font-medium text-[var(--app-ink)]">{getAIActionLabel(action)}</span>
              입니다. 게스트 데모에서는 예시 preview 결과로 체험하거나,
              로그인 후 실제 작업 화면으로 넘어갈 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-[var(--app-muted)] transition hover:bg-white hover:text-[var(--app-ink)]"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[22px] border border-[color:var(--app-line)] bg-[var(--app-surface-muted)] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--app-primary)]">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--app-ink)]">
                  예시 결과로 흐름만 먼저 확인
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                  데모에서는 저장과 revision 흐름은 그대로 보고, AI 출력만 preview 예시로 체험합니다.
                </p>
              </div>
            </div>
            <CustomButton
              variant="secondary"
              className="mt-4 w-full justify-center"
              onClick={onContinuePreview}
            >
              예시 결과로 계속 보기
            </CustomButton>
          </div>

          <div className="rounded-[22px] border border-[color:var(--app-line)] bg-white px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-primary)]">
                <LockKeyhole size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--app-ink)]">
                  로그인 후 실제 AI 시작
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                  Google 로그인 후 실제 문서 작업 화면으로 이동합니다.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <LoginButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
