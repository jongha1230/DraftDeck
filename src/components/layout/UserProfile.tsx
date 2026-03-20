"use client";

import { signOut } from "@/app/auth/actions";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { useTransition } from "react";

interface UserProfileProps {
  email: string;
  avatarUrl?: string;
  isPreview?: boolean;
}

export default function UserProfile({
  email,
  avatarUrl,
  isPreview = false,
}: UserProfileProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(() => {
      void signOut();
    });
  };

  return (
    <div className="rounded-[20px] border border-[color:var(--app-line)] bg-[var(--app-surface-muted)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {avatarUrl ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[color:var(--app-line)]">
              <Image
                src={avatarUrl}
                alt="User Avatar"
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-primary-soft)] text-xs font-semibold text-[var(--app-primary)]">
              {email.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p
              className="truncate text-sm font-medium text-[var(--app-ink)]"
              title={email}
            >
              {email}
            </p>
            <p className="mt-0.5 text-xs text-[var(--app-muted)]">
              Personal Studio
            </p>
          </div>
        </div>

        {isPreview ? (
          <span className="rounded-full border border-[color:var(--app-line)] bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--app-muted)]">
            Preview
          </span>
        ) : (
          <form onSubmit={handleLogout}>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl p-2 text-[var(--app-muted)] transition hover:bg-white hover:text-[var(--app-danger)] disabled:opacity-50"
              title="로그아웃"
            >
              <LogOut size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
