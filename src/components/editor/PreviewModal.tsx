"use client";

import CustomButton from "@/components/ui/CustomButton";
import { PreviewMode } from "@/types";
import { Check, Code, Copy, Eye, X } from "lucide-react";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

interface PreviewModalProps {
  title: string;
  content: string;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  title,
  content,
  mode,
  onModeChange,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[color:rgba(15,23,42,0.36)] p-0 md:p-5">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="미리보기 닫기"
      />

      <div
        className="app-panel relative mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-none md:h-[calc(100vh-2.5rem)] md:rounded-[34px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--app-line)] bg-white/84 px-5 py-4 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-muted)]">
              Preview
            </p>
            <h3 className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em] text-[var(--app-ink)] md:text-3xl">
              {title || "제목 없는 초안"}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-[color:var(--app-line)] bg-[var(--app-surface-muted)] p-1">
              <button
                type="button"
                onClick={() => onModeChange("preview")}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "preview"
                    ? "bg-[var(--app-primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                }`}
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                type="button"
                onClick={() => onModeChange("raw")}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "raw"
                    ? "bg-[var(--app-primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                }`}
              >
                <Code size={14} />
                Markdown
              </button>
            </div>

            <CustomButton
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <Check size={16} className="text-[var(--app-primary)]" />
              ) : (
                <Copy size={16} />
              )}
              {copied ? "복사됨" : "본문 복사"}
            </CustomButton>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-2 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="app-scrollbar flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
          {mode === "preview" ? (
            <article className="markdown-preview prose prose-slate mx-auto max-w-4xl">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {content}
              </ReactMarkdown>
            </article>
          ) : (
            <pre className="mx-auto max-w-4xl whitespace-pre-wrap rounded-[28px] border border-[color:var(--app-line)] bg-white p-6 font-mono text-sm leading-7 text-[var(--app-ink)]">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
