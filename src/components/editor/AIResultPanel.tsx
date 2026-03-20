"use client";

import CustomButton from "@/components/ui/CustomButton";
import { Check, Copy, FileEdit, FilePlus, Sparkles, X } from "lucide-react";
import React, { useState } from "react";

interface AIResultPanelProps {
  text: string;
  isStreaming: boolean;
  onApply: (text: string) => void;
  onAppend: (text: string) => void;
  onClose: () => void;
}

const AIResultPanel: React.FC<AIResultPanelProps> = ({
  text,
  isStreaming,
  onApply,
  onAppend,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;

    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!text && isStreaming) {
    return (
      <div className="rounded-[24px] border border-[color:var(--app-line)] bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-primary)]">
          <Sparkles size={16} className="animate-spin" />
          AI 제안을 준비하는 중
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 rounded-full bg-[var(--app-surface-muted)]" />
          <div className="h-3 w-5/6 rounded-full bg-[var(--app-surface-muted)]" />
          <div className="h-3 w-4/6 rounded-full bg-[var(--app-surface-muted)]" />
        </div>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div className="rounded-[24px] border border-[color:var(--app-line)] bg-white p-5 shadow-[var(--app-shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-primary)]">
            <Sparkles size={16} className={isStreaming ? "animate-spin" : ""} />
            {isStreaming ? "AI 생성 중..." : "AI 제안"}
          </div>
          <p className="mt-2 text-sm leading-7 text-[var(--app-muted)]">
            제안을 검토한 뒤 전체 덮어쓰기 또는 본문 뒤에 이어붙이기를 선택할
            수 있다. 적용하면 새 리비전으로 기록된다.
          </p>
        </div>

        {!isStreaming ? (
          <div className="flex shrink-0 items-center gap-2 self-start">
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 whitespace-nowrap"
            >
              {copied ? (
                <Check size={14} className="text-[var(--app-primary)]" />
              ) : (
                <Copy size={14} />
              )}
              {copied ? "복사됨" : "복사"}
            </CustomButton>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-2 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
              aria-label="결과 닫기"
            >
              <X size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="app-scrollbar mt-4 max-h-[24rem] overflow-y-auto rounded-[20px] border border-[color:var(--app-line)] bg-[var(--app-surface-muted)] p-4 text-sm leading-7 whitespace-pre-wrap text-[var(--app-ink)]">
        {text}
        {isStreaming ? (
          <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-[var(--app-accent-strong)]" />
        ) : null}
      </div>

      {!isStreaming ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <CustomButton
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onApply(text)}
          >
            <FileEdit size={14} />
            본문 덮어쓰기
          </CustomButton>
          <CustomButton
            variant="primary"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onAppend(text)}
          >
            <FilePlus size={14} />
            문단 뒤에 이어붙이기
          </CustomButton>
        </div>
      ) : null}
    </div>
  );
};

export default AIResultPanel;
