import {
  createPostAction,
  deletePostAction,
  updatePostAction,
} from "@/app/actions";
import { UI_PREVIEW_ENABLED, createPreviewPost } from "@/lib/ui-preview";
import { AppToast, Post, ToastTone } from "@/types";
import { create } from "zustand";

interface DraftState {
  posts: Post[];
  activePostId: string | null;
  isSaving: boolean;
  isDirty: boolean;
  isAiLoading: boolean;
  aiResultText: string;
  notifications: AppToast[];

  setPosts: (posts: Post[]) => void;
  setActivePostId: (id: string | null) => void;
  setIsDirty: (dirty: boolean) => void;

  createPost: () => Promise<void>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  setAiLoading: (loading: boolean) => void;
  setAiResultText: (text: string) => void;
  resetAiState: () => void;
  pushNotification: (
    message: string,
    tone?: ToastTone,
    title?: string,
  ) => void;
  dismissNotification: (id: string) => void;
}

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const notificationTimers = new Map<string, ReturnType<typeof setTimeout>>();

const createNotificationId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useDraftStore = create<DraftState>((set) => {
  const dismissNotification = (id: string) => {
    const timer = notificationTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      notificationTimers.delete(id);
    }

    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    }));
  };

  const pushNotification = (
    message: string,
    tone: ToastTone = "info",
    title?: string,
  ) => {
    const id = createNotificationId();

    set((state) => ({
      notifications: [...state.notifications, { id, message, tone, title }],
    }));

    const timer = setTimeout(() => {
      dismissNotification(id);
    }, 4200);

    notificationTimers.set(id, timer);
  };

  return {
    posts: [],
    activePostId: null,
    isSaving: false,
    isDirty: false,
    isAiLoading: false,
    aiResultText: "",
    notifications: [],

    setPosts: (posts) => set({ posts }),

    setActivePostId: (id) => {
      set({
        activePostId: id,
        aiResultText: "",
        isAiLoading: false,
        isDirty: false,
      });
    },

    setIsDirty: (dirty) => set({ isDirty: dirty }),

    createPost: async () => {
      try {
        set({ isSaving: true });

        if (UI_PREVIEW_ENABLED) {
          const newPost = createPreviewPost();

          set((state) => ({
            posts: [newPost, ...state.posts],
            activePostId: newPost.id,
            isDirty: false,
            isSaving: false,
            aiResultText: "",
            isAiLoading: false,
          }));

          pushNotification(
            "preview 모드에서 새 문서를 로컬 상태로 만들었습니다.",
            "success",
            "UI preview",
          );
          return;
        }

        const newPost = (await createPostAction()) as Post;

        set((state) => ({
          posts: [newPost, ...state.posts],
          activePostId: newPost.id,
          isDirty: false,
          isSaving: false,
          aiResultText: "",
          isAiLoading: false,
        }));
      } catch (e) {
        console.error(e);
        pushNotification(
          "새 문서를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.",
          "error",
          "문서 생성 실패",
        );
        set({ isSaving: false });
      }
    },

    updatePost: async (id, updates) => {
      set({ isSaving: true, isDirty: true });
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id
            ? { ...p, ...updates, updated_at: new Date().toISOString() }
            : p,
        ),
      }));

      const prevTimer = saveTimers.get(id);
      if (prevTimer) {
        clearTimeout(prevTimer);
      }

      const timer = setTimeout(async () => {
        try {
          if (UI_PREVIEW_ENABLED) {
            set({ isSaving: false, isDirty: false });
            return;
          }

          await updatePostAction(id, updates);
          set({ isSaving: false, isDirty: false });
        } catch (e) {
          console.error("저장 실패:", e);
          set({ isSaving: false });
          pushNotification(
            "자동 저장에 실패했습니다. 네트워크 연결과 로그인 상태를 확인해 주세요.",
            "error",
            "저장 실패",
          );
        } finally {
          saveTimers.delete(id);
        }
      }, 1000);

      saveTimers.set(id, timer);
    },

    deletePost: async (id) => {
      const timer = saveTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        saveTimers.delete(id);
      }

      try {
        if (!UI_PREVIEW_ENABLED) {
          await deletePostAction(id);
        }

        set((state) => {
          const newPosts = state.posts.filter((p) => p.id !== id);
          return {
            posts: newPosts,
            activePostId:
              state.activePostId === id
                ? newPosts[0]?.id || null
                : state.activePostId,
            isDirty: false,
          };
        });

        pushNotification(
          UI_PREVIEW_ENABLED
            ? "preview 모드에서 초안을 로컬 목록에서 제거했습니다."
            : "초안을 목록에서 제거했습니다.",
          "success",
          "문서 삭제 완료",
        );
      } catch (e) {
        console.error(e);
        pushNotification(
          "초안을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          "error",
          "삭제 실패",
        );
      }
    },

    setAiLoading: (loading) => set({ isAiLoading: loading }),
    setAiResultText: (text) => set({ aiResultText: text }),
    resetAiState: () => set({ isAiLoading: false, aiResultText: "" }),
    pushNotification,
    dismissNotification,
  };
});
