import { formatListDate } from "@/lib/date-format";
import { createClient } from "@/lib/supabase/client";
import { PreviewUser } from "@/lib/ui-preview";
import { Post } from "@/types";
import { User } from "@supabase/supabase-js";
import {
  Clock3,
  FileText,
  NotebookPen,
  PanelLeftClose,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import LoginButton from "../auth/LoginButton";
import Button from "../ui/CustomButton";
import UserProfile from "./UserProfile";

interface SidebarProps {
  posts: Post[];
  deletedPosts: Post[];
  activePostId: string | null;
  isOpen: boolean;
  isPreview?: boolean;
  onClose: () => void;
  onPostSelect: (id: string) => void;
  onPostCreate: () => void;
  onPostDelete: (post: Post) => void;
  onPostRestore: (postId: string) => void;
  onPostPurge: (postId: string) => void;
  previewUser?: PreviewUser;
}

const Sidebar: React.FC<SidebarProps> = ({
  posts,
  deletedPosts,
  activePostId,
  isOpen,
  isPreview = false,
  onClose,
  onPostSelect,
  onPostCreate,
  onPostDelete,
  onPostRestore,
  onPostPurge,
  previewUser,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDeletedTrayOpen, setIsDeletedTrayOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const resolvedUser = isPreview
    ? previewUser
      ? {
          email: previewUser.email,
          avatarUrl: previewUser.avatarUrl,
        }
      : null
    : user
      ? {
          email: user.email ?? "",
          avatarUrl: user.user_metadata?.avatar_url as string | undefined,
        }
      : null;

  useEffect(() => {
    if (isPreview) {
      return;
    }

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [isPreview, supabase]);

  return (
    <>
      <button
        type="button"
        aria-label="사이드바 닫기"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[color:rgba(15,23,42,0.24)] transition-opacity xl:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[15.25rem] flex-col overflow-hidden border-y-0 border-l-0 border-r border-[color:var(--app-line)] bg-[rgba(255,255,255,0.97)] px-3 py-4 transition-transform duration-300 xl:static xl:z-auto xl:w-[14.5rem] xl:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-[var(--primary-foreground)]">
              <NotebookPen size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">
                DraftDeck
              </p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
                문서
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)] xl:hidden"
            aria-label="패널 닫기"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="mt-5">
          <Button
            onClick={onPostCreate}
            className="w-full justify-center gap-2"
            variant="primary"
          >
            <Plus size={16} />
            새 초안
          </Button>
        </div>

        <div className="mt-7 flex min-h-0 flex-1 flex-col">
          <div className="px-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">
              최근 문서
            </p>
            <p className="mt-1 text-sm text-[var(--app-muted)]">{posts.length}개 문서</p>
          </div>

          <div className="app-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            {posts.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[color:var(--app-line-strong)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--app-muted)]">
                아직 문서가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => {
                const isActive = activePostId === post.id;

                return (
                  <div
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onPostSelect(post.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onPostSelect(post.id);
                      }
                    }}
                    className={`group flex cursor-pointer items-start gap-3 rounded-[20px] border px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                      isActive
                        ? "border-[color:rgba(37,87,214,0.18)] bg-[var(--app-surface-emphasis)]"
                        : "border-[color:var(--app-line)] bg-white hover:bg-[var(--app-surface-muted)]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${
                        isActive
                          ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
                          : "bg-[var(--app-surface-muted)] text-[var(--app-muted)]"
                      }`}
                    >
                      <FileText size={15} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          isActive ? "text-[var(--app-primary)]" : "text-[var(--app-ink)]"
                        }`}
                      >
                        {post.title || "제목 없는 초안"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--app-muted)]">
                        <Clock3 size={11} />
                        <span>{formatListDate(post.updated_at)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`rounded-xl p-1.5 text-[var(--app-muted)] transition hover:bg-[rgba(194,65,60,0.08)] hover:text-[var(--app-danger)] ${
                        isActive
                          ? "opacity-100"
                          : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onPostDelete(post);
                      }}
                      aria-label={`${post.title || "제목 없는 초안"} 삭제`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
                })}
              </div>
            )}

          </div>

          <div className="mt-4 border-t border-[color:var(--app-line)] pt-4">
            {deletedPosts.length > 0 ? (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setIsDeletedTrayOpen((current) => !current)}
                  className="flex w-full items-center justify-between rounded-[18px] border border-[color:var(--app-line)] bg-white px-3 py-2.5 text-left transition hover:border-[color:var(--app-line-strong)] hover:bg-[var(--app-surface-muted)]"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--app-ink)]">
                    <Trash2 size={14} className="text-[var(--app-muted)]" />
                    최근 삭제
                  </span>
                  <span className="text-xs text-[var(--app-muted)]">
                    {isDeletedTrayOpen ? "숨기기" : `${deletedPosts.length}개`}
                  </span>
                </button>

                {deletedPosts.length > 0 && isDeletedTrayOpen ? (
                  <div className="app-scrollbar mt-2 max-h-[14rem] space-y-2 overflow-y-auto pr-1">
                    {deletedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-[18px] border border-dashed border-[color:var(--app-line-strong)] bg-[var(--app-surface-muted)] px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--app-ink)]">
                              {post.title || "제목 없는 초안"}
                            </p>
                            <div className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-[var(--app-muted)]">
                              <Clock3 size={11} />
                              <span>{formatListDate(post.deleted_at || post.updated_at)}</span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="px-0 text-[var(--app-primary)] hover:bg-transparent hover:text-[var(--app-primary-strong)]"
                              onClick={() => onPostRestore(post.id)}
                            >
                              복구
                            </Button>
                            <button
                              type="button"
                              onClick={() => onPostPurge(post.id)}
                              className="rounded-xl p-1.5 text-[var(--app-muted)] transition hover:bg-[rgba(194,65,60,0.08)] hover:text-[var(--app-danger)]"
                              aria-label={`${post.title || "제목 없는 초안"} 영구 삭제`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {resolvedUser ? (
              <UserProfile
                email={resolvedUser.email}
                isPreview={isPreview}
                avatarUrl={resolvedUser.avatarUrl}
              />
            ) : (
              <div className="rounded-[20px] border border-[color:var(--app-line)] bg-[var(--app-surface-muted)] p-4">
                <p className="text-sm leading-6 text-[var(--app-muted)]">
                  로그인 후 계정별로 저장됩니다.
                </p>
                <div className="mt-3">
                  <LoginButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
