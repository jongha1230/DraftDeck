import ClientPage from "@/app/ClientPage";
import {
  GUEST_DEMO_USER,
  createDefaultPreviewSession,
} from "@/lib/ui-preview";

export default function DemoPage() {
  const demoSession = createDefaultPreviewSession("guest-demo");

  return (
    <ClientPage
      initialPosts={demoSession.posts}
      initialDeletedPosts={demoSession.deletedPosts}
      isPreview
      previewUser={GUEST_DEMO_USER}
      previewSessionVariant="guest-demo"
    />
  );
}
