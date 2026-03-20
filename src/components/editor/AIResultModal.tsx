"use client";

import AIResultPanel from "@/components/editor/AIResultPanel";

interface AIResultModalProps {
  text: string;
  isStreaming: boolean;
  onApply: (text: string) => void;
  onAppend: (text: string) => void;
  onClose: () => void;
}

export default function AIResultModal({
  text,
  isStreaming,
  onApply,
  onAppend,
  onClose,
}: AIResultModalProps) {
  if (!text && !isStreaming) return null;

  return (
    <div className="fixed inset-0 z-[82] bg-[color:rgba(15,23,42,0.36)] p-4 md:p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="AI 결과 닫기"
      />

      <div
        className="relative mx-auto flex h-full w-full max-w-3xl items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-panel w-full max-h-full overflow-hidden rounded-[32px] p-4 md:p-5">
          <AIResultPanel
            text={text}
            isStreaming={isStreaming}
            onApply={onApply}
            onAppend={onAppend}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
