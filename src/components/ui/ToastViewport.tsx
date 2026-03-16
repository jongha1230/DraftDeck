"use client";

import { AppToast } from "@/types";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

interface ToastViewportProps {
  items: AppToast[];
  onDismiss: (id: string) => void;
}

const TONE_STYLES = {
  info: {
    icon: Info,
    iconClass: "text-[var(--app-accent-strong)]",
    ringClass: "border-[color:rgba(37,87,214,0.16)]",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-[var(--app-primary)]",
    ringClass: "border-[color:rgba(37,87,214,0.12)]",
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-[var(--app-danger)]",
    ringClass: "border-[color:rgba(194,65,60,0.18)]",
  },
} as const;

const DEFAULT_TITLES = {
  info: "안내",
  success: "완료",
  error: "문제가 발생했습니다",
} as const;

export default function ToastViewport({
  items,
  onDismiss,
}: ToastViewportProps) {
  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[90] flex flex-col gap-3 md:left-auto md:right-6 md:w-full md:max-w-sm">
      {items.map((item) => {
        const tone = TONE_STYLES[item.tone];
        const Icon = tone.icon;

        return (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-[22px] border bg-white/96 p-4 shadow-[var(--app-shadow-sm)] ${tone.ringClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[var(--app-surface-muted)] p-2">
                <Icon size={16} className={tone.iconClass} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--app-ink)]">
                  {item.title ?? DEFAULT_TITLES[item.tone]}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(item.id)}
                className="rounded-xl p-1 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
                aria-label="알림 닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
