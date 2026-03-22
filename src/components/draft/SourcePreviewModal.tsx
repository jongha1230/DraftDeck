"use client";

import CustomButton from "@/components/ui/CustomButton";
import { formatRecordDate } from "@/lib/date-format";
import { DraftSource } from "@/types";
import { Check, Copy, FileText, X } from "lucide-react";
import { useState } from "react";

interface SourcePreviewModalProps {
  source: DraftSource | null;
  onClose: () => void;
}

export default function SourcePreviewModal({
  source,
  onClose,
}: SourcePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!source) return null;

  const handleCopy = async () => {
    if (!source.content) return;
    await navigator.clipboard.writeText(source.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[81] flex items-end justify-center bg-[color:rgba(15,23,42,0.36)] p-0 md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="원본 자료 닫기"
      />

      <div
        className="app-panel relative flex h-[88dvh] w-full max-w-3xl flex-col rounded-t-[32px] px-5 pb-5 pt-6 md:h-[min(80dvh,48rem)] md:rounded-[32px] md:px-6 md:pb-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--app-line)] pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
              <FileText size={14} />
              Source preview
            </div>
            <h3 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              {source.label}
            </h3>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              {formatRecordDate(source.created_at)} 불러온 원본
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void handleCopy()}
            >
              {copied ? (
                <Check size={15} className="text-[var(--app-primary)]" />
              ) : (
                <Copy size={15} />
              )}
              {copied ? "복사됨" : "원문 복사"}
            </CustomButton>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-2 text-[var(--app-muted)] transition hover:bg-white hover:text-[var(--app-ink)]"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1">
          <pre className="app-scrollbar h-full whitespace-pre-wrap break-words rounded-[28px] border border-[color:var(--app-line)] bg-white px-5 py-4 text-sm leading-7 text-[var(--app-ink)]">
            {source.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
