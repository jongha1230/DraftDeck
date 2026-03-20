// src/app/page.tsx
import { getMyPostsAction, getRecentDeletedPostsAction } from "@/app/actions";
import {
  PREVIEW_POSTS,
  PREVIEW_USER,
  UI_PREVIEW_QUERY_KEY,
  isServerUiPreviewEnabled,
} from "@/lib/ui-preview";
import { createClient } from "@/lib/supabase/server";
import { Post } from "@/types";
import { redirect } from "next/navigation";
import ClientPage from "./ClientPage";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (isServerUiPreviewEnabled(resolvedSearchParams?.[UI_PREVIEW_QUERY_KEY])) {
    return (
      <ClientPage
        initialPosts={PREVIEW_POSTS}
        isPreview
        previewUser={PREVIEW_USER}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initialPosts = await getMyPostsAction();
  const initialDeletedPosts = await getRecentDeletedPostsAction();

  return (
    <ClientPage
      initialPosts={initialPosts as Post[]}
      initialDeletedPosts={initialDeletedPosts as Post[]}
    />
  );
}
