"use client";

import {
  createDefaultPreviewSession,
  readPreviewSession,
  writePreviewSession,
} from "@/lib/ui-preview";
import { type DraftArtifacts, type Post } from "@/types";
import { useEffect, useMemo } from "react";

interface UsePreviewSessionParams {
  initialPosts: Post[];
  initialDeletedPosts: Post[];
  isPreview: boolean;
  posts: Post[];
  deletedPosts: Post[];
  activePostId: string | null;
  artifactsByPostId: Record<string, DraftArtifacts>;
  hasHydratedSession: boolean;
  hydrateSession: (input: {
    posts: Post[];
    deletedPosts?: Post[];
    activePostId: string | null;
    artifactsByPostId?: Record<string, DraftArtifacts>;
  }) => void;
}

export function usePreviewSession({
  initialPosts,
  initialDeletedPosts,
  isPreview,
  posts,
  deletedPosts,
  activePostId,
  artifactsByPostId,
  hasHydratedSession,
  hydrateSession,
}: UsePreviewSessionParams) {
  const fallbackState = useMemo(
    () =>
      isPreview
        ? createDefaultPreviewSession()
        : {
            posts: initialPosts,
            deletedPosts: initialDeletedPosts,
            activePostId: initialPosts[0]?.id ?? null,
            artifactsByPostId: {},
          },
    [initialDeletedPosts, initialPosts, isPreview],
  );

  useEffect(() => {
    if (hasHydratedSession) {
      return;
    }

    const sessionState = isPreview
      ? readPreviewSession()
      : {
          posts: initialPosts,
          deletedPosts: initialDeletedPosts,
          activePostId: initialPosts[0]?.id ?? null,
          artifactsByPostId: {},
        };

    hydrateSession(sessionState);
  }, [
    hasHydratedSession,
    hydrateSession,
    initialDeletedPosts,
    initialPosts,
    isPreview,
  ]);

  useEffect(() => {
    if (!isPreview || !hasHydratedSession) {
      return;
    }

    writePreviewSession({
      posts,
      deletedPosts,
      activePostId,
      artifactsByPostId,
    });
  }, [
    activePostId,
    artifactsByPostId,
    deletedPosts,
    hasHydratedSession,
    isPreview,
    posts,
  ]);

  return {
    resolvedPosts: hasHydratedSession ? posts : fallbackState.posts,
    resolvedDeletedPosts: hasHydratedSession
      ? deletedPosts
      : fallbackState.deletedPosts,
    resolvedActivePostId: hasHydratedSession
      ? activePostId
      : fallbackState.activePostId,
    resolvedArtifactsByPostId: hasHydratedSession
      ? artifactsByPostId
      : fallbackState.artifactsByPostId,
  };
}
