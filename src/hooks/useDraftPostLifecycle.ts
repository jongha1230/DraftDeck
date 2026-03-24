"use client";

import {
  createPostAction,
  deletePostAction,
  permanentlyDeletePostAction,
  restoreDeletedPostAction,
} from "@/app/actions";
import { createPreviewPost, createPreviewRevision } from "@/lib/ui-preview";
import { useDraftStore } from "@/store/useDraftStore";
import { DraftRevisionTrigger, Post, SaveDraftOptions } from "@/types";
import { useCallback, useRef } from "react";

interface UseDraftPostLifecycleParams {
  isPreview: boolean;
  resolvedDeletedPosts: Post[];
  resolvedActivePostId: string | null;
  closeSidebar: () => void;
  queueSave: (postId: string, options: SaveDraftOptions) => void;
}

type DraftStoreState = ReturnType<typeof useDraftStore.getState>;
type DeletedPostSnapshot = {
  post: Post;
  artifacts?: DraftStoreState["artifactsByPostId"][string];
  isArtifactsLoaded: boolean;
};

export function useDraftPostLifecycle({
  isPreview,
  resolvedDeletedPosts,
  resolvedActivePostId,
  closeSidebar,
  queueSave,
}: UseDraftPostLifecycleParams) {
  const prependPost = useDraftStore((state) => state.prependPost);
  const replacePost = useDraftStore((state) => state.replacePost);
  const removePost = useDraftStore((state) => state.removePost);
  const markPostDeleted = useDraftStore((state) => state.markPostDeleted);
  const restoreDeletedPost = useDraftStore((state) => state.restoreDeletedPost);
  const removeDeletedPost = useDraftStore((state) => state.removeDeletedPost);
  const setActivePostId = useDraftStore((state) => state.setActivePostId);
  const prependRevision = useDraftStore((state) => state.prependRevision);
  const setIsSaving = useDraftStore((state) => state.setIsSaving);
  const pushNotification = useDraftStore((state) => state.pushNotification);

  const pendingCreateIdsRef = useRef(new Set<string>());
  const deletedPostSnapshotsRef = useRef(new Map<string, DeletedPostSnapshot>());

  const isPendingCreatePostId = useCallback((postId: string | null | undefined) => {
    if (!postId) return false;
    return pendingCreateIdsRef.current.has(postId);
  }, []);

  const handleCreatePost = useCallback(async () => {
    const previousActivePostId = resolvedActivePostId;
    let optimisticPostId: string | null = null;

    try {
      setIsSaving(true);

      if (isPreview) {
        const newPost = createPreviewPost();
        prependPost(newPost);
        prependRevision(
          newPost.id,
          createPreviewRevision({
            post: newPost,
            trigger: DraftRevisionTrigger.CREATE,
          }),
        );
        closeSidebar();
        pushNotification(
          "UI preview에서 새 초안을 로컬 상태로 만들었습니다.",
          "success",
          "새 초안 생성",
        );
        return;
      }

      const optimisticPost = createOptimisticPost();
      optimisticPostId = optimisticPost.id;
      pendingCreateIdsRef.current.add(optimisticPost.id);
      prependPost(optimisticPost);
      closeSidebar();

      const { post, revision } = await createPostAction();
      const liveOptimisticPost = useDraftStore
        .getState()
        .posts.find((item) => item.id === optimisticPost.id);
      const hasLocalDraftChanges =
        !!liveOptimisticPost &&
        (liveOptimisticPost.title !== optimisticPost.title ||
          liveOptimisticPost.content !== optimisticPost.content);
      const replacedPost = liveOptimisticPost
        ? {
            ...post,
            title: liveOptimisticPost.title,
            content: liveOptimisticPost.content,
          }
        : post;

      replacePost(optimisticPost.id, replacedPost);
      if (revision) {
        prependRevision(post.id, revision);
      }

      pendingCreateIdsRef.current.delete(optimisticPost.id);

      if (hasLocalDraftChanges) {
        queueSave(post.id, { trigger: DraftRevisionTrigger.AUTOSAVE });
      }
    } catch (error: unknown) {
      if (optimisticPostId) {
        pendingCreateIdsRef.current.delete(optimisticPostId);
        removePost(optimisticPostId, previousActivePostId);
      }

      const message =
        error instanceof Error
          ? error.message
          : "새 문서를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
      pushNotification(message, "error", "문서 생성 실패");
    } finally {
      setIsSaving(false);
    }
  }, [
    closeSidebar,
    isPreview,
    prependPost,
    prependRevision,
    pushNotification,
    queueSave,
    removePost,
    replacePost,
    resolvedActivePostId,
    setIsSaving,
  ]);

  const handleDeletePost = useCallback(
    async (post: Post) => {
      const snapshotState = useDraftStore.getState();
      const snapshotArtifacts = snapshotState.artifactsByPostId[post.id];
      const snapshotLoaded = Boolean(snapshotState.loadedArtifactPostIds[post.id]);

      try {
        const deletedPost = {
          ...post,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        deletedPostSnapshotsRef.current.set(post.id, {
          post,
          artifacts: snapshotArtifacts,
          isArtifactsLoaded: snapshotLoaded,
        });

        markPostDeleted(deletedPost);
        pushNotification("초안을 최근 삭제로 이동했습니다.", "success", "문서 삭제");

        if (!isPreview) {
          await deletePostAction(post.id);
        }
      } catch (error: unknown) {
        const snapshot = deletedPostSnapshotsRef.current.get(post.id);
        if (snapshot) {
          restoreDeletedPost(
            snapshot.post,
            snapshot.artifacts,
            snapshot.isArtifactsLoaded,
          );
        }

        const message =
          error instanceof Error
            ? error.message
            : "초안을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
        pushNotification(message, "error", "삭제 실패");
      }
    },
    [isPreview, markPostDeleted, pushNotification, restoreDeletedPost],
  );

  const handleRestoreDeletedPost = useCallback(
    async (postId: string) => {
      const deletedPost = resolvedDeletedPosts.find((post) => post.id === postId);
      if (!deletedPost) return;
      const previousActivePostId = resolvedActivePostId;
      const snapshot = deletedPostSnapshotsRef.current.get(postId);

      try {
        const restoredPost = {
          ...deletedPost,
          deleted_at: null,
          updated_at: new Date().toISOString(),
        };

        restoreDeletedPost(
          restoredPost,
          snapshot?.artifacts,
          snapshot?.isArtifactsLoaded ?? false,
        );
        pushNotification("최근 삭제 문서를 복구했습니다.", "success", "문서 복구");

        if (!isPreview) {
          await restoreDeletedPostAction(postId);
        }
      } catch (error: unknown) {
        markPostDeleted(deletedPost);
        if (previousActivePostId && previousActivePostId !== deletedPost.id) {
          setActivePostId(previousActivePostId);
        }

        const message =
          error instanceof Error
            ? error.message
            : "문서를 복구하지 못했습니다. 잠시 후 다시 시도해 주세요.";
        pushNotification(message, "error", "복구 실패");
      }
    },
    [
      isPreview,
      markPostDeleted,
      pushNotification,
      resolvedActivePostId,
      resolvedDeletedPosts,
      restoreDeletedPost,
      setActivePostId,
    ],
  );

  const handlePermanentlyDeletePost = useCallback(
    async (postId: string) => {
      const deletedPost = resolvedDeletedPosts.find((post) => post.id === postId);
      if (!deletedPost) return;

      try {
        if (isPreview) {
          removeDeletedPost(postId);
        } else {
          await permanentlyDeletePostAction(postId);
          removeDeletedPost(postId);
        }

        deletedPostSnapshotsRef.current.delete(postId);

        pushNotification("최근 삭제 문서를 완전히 제거했습니다.", "success", "영구 삭제");
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "문서를 완전히 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
        pushNotification(message, "error", "영구 삭제 실패");
      }
    },
    [isPreview, pushNotification, removeDeletedPost, resolvedDeletedPosts],
  );

  return {
    handleCreatePost,
    handleDeletePost,
    handleRestoreDeletedPost,
    handlePermanentlyDeletePost,
    isPendingCreatePostId,
  };
}

function createOptimisticPost(): Post {
  const timestamp = new Date().toISOString();

  return {
    id: `optimistic-post-${crypto.randomUUID()}`,
    user_id: "local-pending-user",
    title: "새 문서",
    content: "",
    is_published: false,
    revision_number: 1,
    deleted_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
