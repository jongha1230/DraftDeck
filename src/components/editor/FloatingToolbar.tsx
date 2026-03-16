import { Languages, Sparkles, Wand2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AIActionType } from "../../types/index";

interface FloatingToolbarProps {
  selection: string;
  onAction: (action: AIActionType) => void;
  loading: boolean;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  selection,
  onAction,
  loading,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setPosition({
          top: rect.top + window.scrollY - 50,
          left: rect.left + window.scrollX + rect.width / 2,
        });
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Don't close if clicking inside the toolbar
      if ((e.target as HTMLElement).closest(".ai-floating-toolbar")) return;
      setIsVisible(false);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  if (!isVisible || !selection) return null;

  return (
    <div
      className="ai-floating-toolbar fixed z-50 -translate-x-1/2 transition-opacity duration-200"
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 flex items-center p-1 gap-1 overflow-hidden">
        <button
          onClick={() => onAction(AIActionType.SUMMARIZE)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded text-xs font-medium transition-colors"
          disabled={loading}
        >
          <Sparkles size={14} className="text-indigo-400" />
          Summarize
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button
          onClick={() => onAction(AIActionType.DEVELOPER_REWRITE)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded text-xs font-medium transition-colors"
          disabled={loading}
        >
          <Wand2 size={14} className="text-pink-400" />
          Technical Rewrite
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button
          onClick={() => onAction(AIActionType.TRANSLATE)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded text-xs font-medium transition-colors"
          disabled={loading}
        >
          <Languages size={14} className="text-blue-400" />
          Translate
        </button>
      </div>
      <div className="w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1.5 shadow-xl" />
    </div>
  );
};

export default FloatingToolbar;
