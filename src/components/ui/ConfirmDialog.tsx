"use client";

import CustomButton from "@/components/ui/CustomButton";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "취소",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[color:rgba(15,23,42,0.34)] p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onCancel}
        aria-label="대화상자 닫기"
      />

      <div className="relative w-full max-w-md rounded-[28px] border border-[color:var(--app-line)] bg-[var(--app-panel-solid)] p-6 shadow-[var(--app-shadow-md)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[rgba(194,65,60,0.08)] p-2 text-[var(--app-danger)]">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--app-ink)]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-1 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <CustomButton
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </CustomButton>
          <CustomButton
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
