import CustomButton from "@/components/ui/CustomButton";
import { AIActionType } from "@/types";
import { Languages, Sparkles, Wand2 } from "lucide-react";

interface EditorToolbarProps {
  onAction: (action: AIActionType) => void;
  isLoading: boolean;
  hasSelection: boolean; // 선택된 텍스트가 있는지 여부
}

export default function EditorToolbar({
  onAction,
  isLoading,
  hasSelection,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 mb-4 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto">
      <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">
        AI Tools
      </span>
      <div className="h-4 w-px bg-slate-300 mx-1" />

      <CustomButton
        variant="ghost"
        size="sm"
        onClick={() => onAction(AIActionType.SUMMARIZE)}
        disabled={isLoading || !hasSelection}
        className="text-xs gap-1.5"
        title={!hasSelection ? "텍스트를 먼저 선택하세요" : ""}
      >
        <Sparkles size={14} className="text-indigo-500" />
        요약하기
      </CustomButton>

      <CustomButton
        variant="ghost"
        size="sm"
        onClick={() => onAction(AIActionType.DEVELOPER_REWRITE)}
        disabled={isLoading || !hasSelection}
        className="text-xs gap-1.5"
      >
        <Wand2 size={14} className="text-pink-500" />
        개발자 톤앤매너
      </CustomButton>

      <CustomButton
        variant="ghost"
        size="sm"
        onClick={() => onAction(AIActionType.TRANSLATE)}
        disabled={isLoading || !hasSelection}
        className="text-xs gap-1.5"
      >
        <Languages size={14} className="text-blue-500" />
        번역하기
      </CustomButton>
    </div>
  );
}
