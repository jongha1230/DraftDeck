"use client";

import { useCallback, useEffect, useRef } from "react";

interface EditorProps {
  content: string;
  onChange?: (markdown: string) => void;
  onSelectionChange?: (selection: string) => void;
}

const Editor = ({ content, onChange, onSelectionChange }: EditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionFrameRef = useRef<number | null>(null);
  const isPointerSelectingRef = useRef(false);

  const notifySelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selection =
      textarea.selectionStart !== textarea.selectionEnd
        ? textarea.value
            .slice(textarea.selectionStart, textarea.selectionEnd)
            .trim()
        : "";

    onSelectionChange?.(selection);
  }, [onSelectionChange]);

  const commitSelection = useCallback(() => {
    if (typeof window === "undefined") return;

    if (selectionFrameRef.current !== null) {
      window.cancelAnimationFrame(selectionFrameRef.current);
    }

    selectionFrameRef.current = window.requestAnimationFrame(() => {
      selectionFrameRef.current = null;
      notifySelectionChange();
    });
  }, [notifySelectionChange]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && selectionFrameRef.current !== null) {
        window.cancelAnimationFrame(selectionFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (!isPointerSelectingRef.current) return;
      isPointerSelectingRef.current = false;
      commitSelection();
    };

    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => window.removeEventListener("pointerup", handleWindowPointerUp);
  }, [commitSelection]);

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        aria-label="문서 본문"
        className="app-scrollbar h-[clamp(28rem,62vh,44rem)] w-full resize-none overflow-y-auto border-none bg-transparent p-0 pr-2 text-[1rem] leading-8 tracking-[-0.01em] text-[var(--app-ink)] placeholder:text-[color:rgba(102,112,133,0.56)] focus:outline-none md:text-[1.04rem] md:leading-9"
        placeholder="마크다운으로 자유롭게 작성하세요... (수식 지원: $E=mc^2$)"
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
        onPointerDown={() => {
          isPointerSelectingRef.current = true;
        }}
        onPointerUp={commitSelection}
        onSelect={commitSelection}
        onKeyUp={commitSelection}
        spellCheck={false}
      />
    </div>
  );
};

export default Editor;
