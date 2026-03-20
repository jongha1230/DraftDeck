import { AppToast, DraftArtifacts, DraftSource, DraftRevision, AIRun, AIResultState, Post, ToastTone } from "@/types";
import { create } from "zustand";

interface DraftState {
  posts: Post[];
  deletedPosts: Post[];
  activePostId: string | null;
  artifactsByPostId: Record<string, DraftArtifacts>;
  loadedArtifactPostIds: Record<string, boolean>;
  isSaving: boolean;
  isDirty: boolean;
  isAiLoading: boolean;
  aiResult: AIResultState | null;
  notifications: AppToast[];

  hydrateSession: (input: {
    posts: Post[];
    deletedPosts?: Post[];
    activePostId: string | null;
    artifactsByPostId?: Record<string, DraftArtifacts>;
  }) => void;
  setPosts: (posts: Post[]) => void;
  prependPost: (post: Post) => void;
  upsertPost: (post: Post) => void;
  markPostDeleted: (post: Post) => void;
  restoreDeletedPost: (post: Post) => void;
  removeDeletedPost: (postId: string) => void;
  setActivePostId: (id: string | null) => void;
  setArtifacts: (postId: string, artifacts: DraftArtifacts) => void;
  markArtifactsLoaded: (postId: string) => void;
  prependSource: (postId: string, source: DraftSource) => void;
  prependRevision: (postId: string, revision: DraftRevision) => void;
  removeRevision: (postId: string, revisionId: string) => void;
  prependAIRun: (postId: string, run: AIRun) => void;
  setIsSaving: (saving: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  setAiLoading: (loading: boolean) => void;
  setAiResult: (result: AIResultState | null) => void;
  resetAiState: () => void;
  pushNotification: (
    message: string,
    tone?: ToastTone,
    title?: string,
  ) => void;
  dismissNotification: (id: string) => void;
}

const notificationTimers = new Map<string, ReturnType<typeof setTimeout>>();

const createNotificationId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyArtifacts = (): DraftArtifacts => ({
  sources: [],
  revisions: [],
  aiRuns: [],
});

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
    deletedPosts: [],
    activePostId: null,
    artifactsByPostId: {},
    loadedArtifactPostIds: {},
    isSaving: false,
    isDirty: false,
    isAiLoading: false,
    aiResult: null,
    notifications: [],

    hydrateSession: ({
      posts,
      deletedPosts = [],
      activePostId,
      artifactsByPostId = {},
    }) =>
      set({
        posts,
        deletedPosts,
        activePostId,
        artifactsByPostId,
        loadedArtifactPostIds: Object.fromEntries(
          Object.keys(artifactsByPostId).map((postId) => [postId, true]),
        ),
        isDirty: false,
        isSaving: false,
        isAiLoading: false,
        aiResult: null,
      }),

    setPosts: (posts) => set({ posts }),
    prependPost: (post) =>
      set((state) => ({
        posts: [post, ...state.posts],
        activePostId: post.id,
      })),
    upsertPost: (post) =>
      set((state) => ({
        posts: state.posts.some((item) => item.id === post.id)
          ? state.posts.map((item) => (item.id === post.id ? post : item))
          : [post, ...state.posts],
      })),
    markPostDeleted: (post) =>
      set((state) => {
        const nextPosts = state.posts.filter((item) => item.id !== post.id);
        const { [post.id]: removedArtifacts, ...restArtifacts } =
          state.artifactsByPostId;
        const { [post.id]: removedLoaded, ...restLoaded } =
          state.loadedArtifactPostIds;
        void removedArtifacts;
        void removedLoaded;

        return {
          posts: nextPosts,
          deletedPosts: [post, ...state.deletedPosts.filter((item) => item.id !== post.id)].slice(
            0,
            3,
          ),
          activePostId:
            state.activePostId === post.id
              ? nextPosts[0]?.id ?? null
              : state.activePostId,
          artifactsByPostId: restArtifacts,
          loadedArtifactPostIds: restLoaded,
          isDirty: false,
        };
      }),
    restoreDeletedPost: (post) =>
      set((state) => ({
        posts: [post, ...state.posts.filter((item) => item.id !== post.id)],
        deletedPosts: state.deletedPosts.filter((item) => item.id !== post.id),
        activePostId: post.id,
      })),
    removeDeletedPost: (postId) =>
      set((state) => ({
        deletedPosts: state.deletedPosts.filter((item) => item.id !== postId),
      })),
    setActivePostId: (id) =>
      set({
        activePostId: id,
        aiResult: null,
        isAiLoading: false,
      }),
    setArtifacts: (postId, artifacts) =>
      set((state) => ({
        artifactsByPostId: {
          ...state.artifactsByPostId,
          [postId]: artifacts,
        },
        loadedArtifactPostIds: {
          ...state.loadedArtifactPostIds,
          [postId]: true,
        },
      })),
    markArtifactsLoaded: (postId) =>
      set((state) => ({
        loadedArtifactPostIds: {
          ...state.loadedArtifactPostIds,
          [postId]: true,
        },
      })),
    prependSource: (postId, source) =>
      set((state) => ({
        artifactsByPostId: {
          ...state.artifactsByPostId,
          [postId]: {
            ...(state.artifactsByPostId[postId] ?? emptyArtifacts()),
            sources: [
              source,
              ...(state.artifactsByPostId[postId]?.sources ?? []),
            ].slice(0, 5),
          },
        },
        loadedArtifactPostIds: {
          ...state.loadedArtifactPostIds,
          [postId]: true,
        },
      })),
    prependRevision: (postId, revision) =>
      set((state) => ({
        artifactsByPostId: {
          ...state.artifactsByPostId,
          [postId]: {
            ...(state.artifactsByPostId[postId] ?? emptyArtifacts()),
            revisions: [
              revision,
              ...(state.artifactsByPostId[postId]?.revisions ?? []),
            ].slice(0, 6),
          },
        },
        loadedArtifactPostIds: {
          ...state.loadedArtifactPostIds,
          [postId]: true,
        },
      })),
    removeRevision: (postId, revisionId) =>
      set((state) => ({
        artifactsByPostId: {
          ...state.artifactsByPostId,
          [postId]: {
            ...(state.artifactsByPostId[postId] ?? emptyArtifacts()),
            revisions: (state.artifactsByPostId[postId]?.revisions ?? []).filter(
              (revision) => revision.id !== revisionId,
            ),
          },
        },
        loadedArtifactPostIds: {
          ...state.loadedArtifactPostIds,
          [postId]: true,
        },
      })),
    prependAIRun: (postId, run) =>
      set((state) => ({
        artifactsByPostId: {
          ...state.artifactsByPostId,
          [postId]: {
            ...(state.artifactsByPostId[postId] ?? emptyArtifacts()),
            aiRuns: [run, ...(state.artifactsByPostId[postId]?.aiRuns ?? [])].slice(
              0,
              6,
            ),
          },
        },
        loadedArtifactPostIds: {
          ...state.loadedArtifactPostIds,
          [postId]: true,
        },
      })),
    setIsSaving: (saving) => set({ isSaving: saving }),
    setIsDirty: (dirty) => set({ isDirty: dirty }),
    setAiLoading: (loading) => set({ isAiLoading: loading }),
    setAiResult: (result) => set({ aiResult: result }),
    resetAiState: () => set({ isAiLoading: false, aiResult: null }),
    pushNotification,
    dismissNotification,
  };
});
