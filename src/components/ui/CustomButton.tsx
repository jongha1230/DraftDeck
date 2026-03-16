import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export default function CustomButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-2xl border border-transparent font-medium tracking-[-0.01em] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-[var(--app-primary)] text-[var(--primary-foreground)] shadow-[0_14px_32px_-24px_rgba(37,87,214,0.65)] hover:bg-[var(--app-primary-strong)]",
    secondary:
      "bg-[var(--app-surface-muted)] text-[var(--app-ink)] hover:bg-white",
    ghost:
      "bg-transparent text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]",
    outline:
      "border-[color:var(--app-line)] bg-white text-[var(--app-ink)] hover:border-[color:var(--app-line-strong)] hover:bg-[var(--app-surface-muted)]",
    danger:
      "bg-[var(--app-danger)] text-white shadow-[0_14px_32px_-24px_rgba(194,65,60,0.75)] hover:bg-[#a83431]",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs",
    md: "px-4.5 py-2.5 text-sm",
    lg: "px-5.5 py-3 text-sm sm:text-base",
    icon: "p-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
      {children}
    </button>
  );
}
