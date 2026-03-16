"use client";

import { useEffect, useRef } from "react";

interface EditorProps {
  content: string;
  onChange?: (markdown: string) => void;
}

const Editor = ({ content, onChange }: EditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 글 내용 길이에 맞춰 높이 자동 조절
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 600)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        className="app-scrollbar w-full min-h-[52vh] resize-none border-none bg-transparent p-0 text-[1rem] leading-8 tracking-[-0.01em] text-[var(--app-ink)] placeholder:text-[color:rgba(102,112,133,0.56)] focus:outline-none md:min-h-[60vh] md:text-[1.04rem] md:leading-9"
        placeholder="마크다운으로 자유롭게 작성하세요... (수식 지원: $E=mc^2$)"
        value={content}
        onChange={(e) => {
          onChange?.(e.target.value);
          adjustHeight();
        }}
        spellCheck={false}
      />
    </div>
  );
};

export default Editor;
