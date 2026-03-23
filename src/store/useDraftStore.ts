import { AppToast, DraftArtifacts, DraftSource, DraftRevision, AIRun, AIResultState, Post, ToastTone } from "@/types";
import {
  getCheckpointRevisionCount,
  normalizeDraftArtifacts,
} from "@/lib/drafts/records";
import { create } from "zustand";

interface DraftState {
  posts: Post[];
  deletedPosts: Post[];
  activePostId: string | null;
  artifactsByPostId: Record<string, DraftArtifacts>;
  loadedArtifactPostIds: Record<string, boolean>;
  hasHydratedSession: boolean;
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
  replacePost: (previousPostId: string, post: Post) => void;
  removePost: (postId: string, nextActivePostId?: string | null) => void;
  upsertPost: (post: Post) => void;
  markPostDeleted: (post: Post) => void;
  restoreDeletedPost: (
    post: Post,
    artifacts?: DraftArtifacts,
    isArtifactsLoaded?: boolean,
  ) => void;
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
  revisionCount: 0,
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
    hasHydratedSession: false,
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
    }) => {
      const normalizedArtifacts = Object.fromEntries(
        Object.entries(artifactsByPostId).map(([postId, artifacts]) => [
          postId,
          normalizeDraftArtifacts(artifacts),
        ]),
      );

      set({
        posts,
        deletedPosts,
        activePostId,
        artifactsByPostId: normalizedArtifacts,
        loadedArtifactPostIds: Object.fromEntries(
          Object.keys(normalizedArtifacts).map((postId) => [postId, true]),
        ),
        hasHydratedSession: true,
        isDirty: false,
        isSaving: false,
        isAiLoading: false,
        aiResult: null,
      });
    },

    setPosts: (posts) => set({ posts }),
    prependPost: (post) =>
      set((state) => ({
        posts: [post, ...state.posts],
        activePostId: post.id,
      })),
    replacePost: (previousPostId, post) =>
      set((state) => {
        const previousArtifacts = state.artifactsByPostId[previousPostId];
        const previousLoaded = state.loadedArtifactPostIds[previousPostId];
        const nextPosts = state.posts.map((item) =>
          item.id === previousPostId ? post : item,
        );
        const { [previousPostId]: removedArtifacts, ...restArtifacts } =
          state.artifactsByPostId;
        const { [previousPostId]: removedLoaded, ...restLoaded } =
          state.loadedArtifactPostIds;
        void removedArtifacts;
        void removedLoaded;

        return {
          posts: nextPosts,
          activePostId:
            state.activePostId === previousPostId ? post.id : state.activePostId,
          artifactsByPostId: previousArtifacts
            ? {
                ...restArtifacts,
                [post.id]: previousArtifacts,
              }
            : restArtifacts,
          loadedArtifactPostIds: previousLoaded
            ? {
                ...restLoaded,
                [post.id]: previousLoaded,
              }
            : restLoaded,
        };
      }),
    removePost: (postId, nextActivePostId = null) =>
      set((state) => {
        const nextPosts = state.posts.filter((item) => item.id !== postId);
        const { [postId]: removedArtifacts, ...restArtifacts } =
          state.artifactsByPostId;
        const { [postId]: removedLoaded, ...restLoaded } =
          state.loadedArtifactPostIds;
        void removedArtifacts;
        void removedLoaded;

        return {
          posts: nextPosts,
          activePostId:
            state.activePostId === postId
              ? nextActivePostId ?? nextPosts[0]?.id ?? null
              : state.activePostId,
          artifactsByPostId: restArtifacts,
          loadedArtifactPostIds: restLoaded,
        };
      }),
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
    restoreDeletedPost: (post, artifacts, isArtifactsLoaded = false) =>
      set((state) => ({
        posts: [post, ...state.posts.filter((item) => item.id !== post.id)],
        deletedPosts: state.deletedPosts.filter((item) => item.id !== post.id),
        activePostId: post.id,
        artifactsByPostId: artifacts
          ? {
              ...state.artifactsByPostId,
              [post.id]: normalizeDraftArtifacts(artifacts),
            }
          : state.artifactsByPostId,
        loadedArtifactPostIds: isArtifactsLoaded
          ? {
              ...state.loadedArtifactPostIds,
              [post.id]: true,
            }
          : state.loadedArtifactPostIds,
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
          [postId]: normalizeDraftArtifacts(artifacts),
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
      set((state) => {
        const currentArtifacts = state.artifactsByPostId[postId] ?? emptyArtifacts();
        const currentRevisionCount =
          currentArtifacts.revisionCount ??
          getCheckpointRevisionCount(currentArtifacts.revisions);
        const hasExistingRevision = currentArtifacts.revisions.some(
          (item) =>
            item.id === revision.id ||
            item.revision_number === revision.revision_number,
        );
        const revisions = [
          revision,
          ...currentArtifacts.revisions.filter(
            (item) =>
              item.id !== revision.id &&
              item.revision_number !== revision.revision_number,
          ),
        ].slice(0, 6);

        return {
          artifactsByPostId: {
            ...state.artifactsByPostId,
            [postId]: {
              ...currentArtifacts,
              revisions,
              revisionCount: hasExistingRevision
                ? currentRevisionCount
                : currentRevisionCount + 1,
            },
          },
          loadedArtifactPostIds: {
            ...state.loadedArtifactPostIds,
            [postId]: true,
          },
        };
      }),
    removeRevision: (postId, revisionId) =>
      set((state) => {
        const currentArtifacts = state.artifactsByPostId[postId] ?? emptyArtifacts();
        const revisions = currentArtifacts.revisions.filter(
          (revision) => revision.id !== revisionId,
        );
        const didRemove = revisions.length !== currentArtifacts.revisions.length;
        const currentRevisionCount =
          currentArtifacts.revisionCount ??
          getCheckpointRevisionCount(currentArtifacts.revisions);

        return {
          artifactsByPostId: {
            ...state.artifactsByPostId,
            [postId]: {
              ...currentArtifacts,
              revisions,
              revisionCount:
                didRemove && currentRevisionCount > 0
                  ? currentRevisionCount - 1
                  : currentRevisionCount,
            },
          },
          loadedArtifactPostIds: {
            ...state.loadedArtifactPostIds,
            [postId]: true,
          },
        };
      }),
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
