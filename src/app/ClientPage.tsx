"use client";

import AssistantPanel from "@/components/draft/AssistantPanel";
import DraftEditorPane from "@/components/draft/DraftEditorPane";
import DraftHeader from "@/components/draft/DraftHeader";
import EmptyDraftState from "@/components/draft/EmptyDraftState";
import SourcePreviewModal from "@/components/draft/SourcePreviewModal";
import AIResultModal from "@/components/editor/AIResultModal";
import SourceImportModal from "@/components/draft/SourceImportModal";
import PreviewModal from "@/components/editor/PreviewModal";
import Sidebar from "@/components/layout/Sidebar";
import ToastViewport from "@/components/ui/ToastViewport";
import { useDraftPageController } from "@/hooks/useDraftPageController";
import { getCheckpointRevisionCount } from "@/lib/drafts/records";
import { PreviewUser } from "@/lib/ui-preview";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { AIActionType, Post } from "@/types";

interface ClientPageProps {
  initialPosts: Post[];
  initialDeletedPosts?: Post[];
  isPreview?: boolean;
  previewUser?: PreviewUser;
}

export default function ClientPage({
  initialPosts,
  initialDeletedPosts = [],
  isPreview = false,
  previewUser,
}: ClientPageProps) {
  const {
    posts,
    deletedPosts,
    notifications,
    activePostId,
    activePost,
    activeArtifacts,
    isSaving,
    isDirty,
    isAiLoading,
    aiResultText,
    selectionText,
    sourceInput,
    sourceLabel,
    isSidebarOpen,
    isAssistantOpen,
    isArtifactsLoading,
    isSourceModalOpen,
    sourcePreview,
    isPreviewOpen,
    previewMode,
    contentScrollRef,
    setSourceInput,
    setPreviewMode,
    dismissNotification,
    openAssistantPanel,
    closeAssistantPanel,
    toggleSidebar,
    closeSidebar,
    handlePostSelect,
    handleCreatePost,
    handleDeletePost,
    handleRestoreDeletedPost,
    handlePermanentlyDeletePost,
    handlePreviewOpen,
    handlePreviewClose,
    handleAIAction,
    handleApplyAIResult,
    handleAppendAIResult,
    handleEditorSelectionChange,
    handleTitleChange,
    handleContentChange,
    handleFileUpload,
    handleOpenImport,
    handleCloseImport,
    handleOpenSourcePreview,
    handleCloseSourcePreview,
    handleCloseAIResult,
    handleRestoreRevision,
    handleDeleteRevision,
    handleExportMarkdown,
  } = useDraftPageController({ initialPosts, initialDeletedPosts, isPreview });

  useUnsavedChanges();

  const displayRevisionNumber =
    activeArtifacts.revisionCount ??
    (getCheckpointRevisionCount(activeArtifacts.revisions) || 1);

  return (
    <div className="app-shell">
      <div className="flex h-full min-h-0">
        <Sidebar
          posts={posts}
          activePostId={activePostId}
          deletedPosts={deletedPosts}
          isOpen={isSidebarOpen}
          isPreview={isPreview}
          onClose={closeSidebar}
          onPostSelect={handlePostSelect}
          onPostCreate={() => void handleCreatePost()}
          onPostDelete={(post) => void handleDeletePost(post)}
          onPostRestore={(postId) => void handleRestoreDeletedPost(postId)}
          onPostPurge={(postId) => void handlePermanentlyDeletePost(postId)}
          previewUser={previewUser}
        />

        <div className="flex min-w-0 flex-1">
          <main className="flex h-full min-w-0 flex-1 flex-col">
            <DraftHeader
              title={activePost?.title || ""}
              hasActivePost={!!activePost}
              isAiLoading={isAiLoading}
              isAssistantOpen={isAssistantOpen}
              onTitleChange={handleTitleChange}
              onPreviewOpen={() => handlePreviewOpen("preview")}
              onExportMarkdown={handleExportMarkdown}
              onSidebarToggle={toggleSidebar}
              onAssistantToggle={() =>
                isAssistantOpen
                  ? closeAssistantPanel()
                  : openAssistantPanel()
              }
            />

            <div className="relative flex min-h-0 flex-1 overflow-hidden">
              <section
                ref={contentScrollRef}
                className="app-scrollbar min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-6 md:pb-8 xl:px-8 2xl:px-10"
              >
                <div className="mx-auto flex min-h-full w-full max-w-[78rem] xl:gap-6 2xl:max-w-[80rem] 2xl:gap-8">
                  <div className="min-w-0 flex-1">
                    {activePost ? (
                      <DraftEditorPane
                        post={activePost}
                        selectionText={selectionText}
                        isAiLoading={isAiLoading}
                        isSaving={isSaving}
                        isDirty={isDirty}
                        displayRevisionNumber={displayRevisionNumber}
                        onSelectionChange={handleEditorSelectionChange}
                        onContentChange={handleContentChange}
                        onRunSelectionAction={(action, selection) =>
                          void handleAIAction(action, selection)
                        }
                      />
                    ) : (
                      <EmptyDraftState
                        onCreatePost={() => void handleCreatePost()}
                        onBrowseDrafts={toggleSidebar}
                      />
                    )}
                  </div>

                  {activePost ? (
                    <div
                      aria-hidden="true"
                      className="hidden shrink-0 xl:block xl:w-[18.5rem] 2xl:w-[19rem]"
                    />
                  ) : null}
                </div>
              </section>

              {activePost ? (
                <AssistantPanel
                  isOpen={isAssistantOpen}
                  artifacts={activeArtifacts}
                  displayRevisionNumber={displayRevisionNumber}
                  isArtifactsLoading={isArtifactsLoading}
                  onToggle={() =>
                    isAssistantOpen
                      ? closeAssistantPanel()
                      : openAssistantPanel()
                  }
                  onOpenImport={handleOpenImport}
                  onOpenSourcePreview={handleOpenSourcePreview}
                  onRestoreRevision={handleRestoreRevision}
                  onDeleteRevision={handleDeleteRevision}
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>

      <SourceImportModal
        isOpen={isSourceModalOpen}
        sourceInput={sourceInput}
        sourceLabel={sourceLabel}
        isAiLoading={isAiLoading}
        onSourceInputChange={setSourceInput}
        onClose={handleCloseImport}
        onFileUpload={handleFileUpload}
        onGenerate={() => void handleAIAction(AIActionType.SOURCE_TO_DRAFT)}
      />

      <SourcePreviewModal
        source={sourcePreview}
        onClose={handleCloseSourcePreview}
      />

      {isPreviewOpen && activePost ? (
        <PreviewModal
          title={activePost.title}
          content={activePost.content}
          mode={previewMode}
          onModeChange={setPreviewMode}
          onClose={handlePreviewClose}
        />
      ) : null}

      <AIResultModal
        text={aiResultText}
        isStreaming={isAiLoading}
        onApply={handleApplyAIResult}
        onAppend={handleAppendAIResult}
        onClose={handleCloseAIResult}
      />

      <ToastViewport items={notifications} onDismiss={dismissNotification} />
    </div>
  );
}
