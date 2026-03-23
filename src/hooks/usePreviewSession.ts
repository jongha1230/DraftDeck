"use client";

import {
  createDefaultPreviewSession,
  type PreviewSessionVariant,
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
  previewSessionVariant?: PreviewSessionVariant;
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
  previewSessionVariant = "ui-preview",
  hydrateSession,
}: UsePreviewSessionParams) {
  const fallbackState = useMemo(
    () =>
      isPreview
        ? createDefaultPreviewSession(previewSessionVariant)
        : {
            posts: initialPosts,
            deletedPosts: initialDeletedPosts,
            activePostId: initialPosts[0]?.id ?? null,
            artifactsByPostId: {},
          },
    [initialDeletedPosts, initialPosts, isPreview, previewSessionVariant],
  );

  useEffect(() => {
    if (hasHydratedSession) {
      return;
    }

    const sessionState = isPreview
      ? readPreviewSession(previewSessionVariant)
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
    previewSessionVariant,
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
    }, previewSessionVariant);
  }, [
    activePostId,
    artifactsByPostId,
    deletedPosts,
    hasHydratedSession,
    isPreview,
    posts,
    previewSessionVariant,
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
