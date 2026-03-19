"use client";

import AssistantPanel from "@/components/draft/AssistantPanel";
import DraftEditorPane from "@/components/draft/DraftEditorPane";
import DraftHeader from "@/components/draft/DraftHeader";
import EmptyDraftState from "@/components/draft/EmptyDraftState";
import SourceImportModal from "@/components/draft/SourceImportModal";
import PreviewModal from "@/components/editor/PreviewModal";
import Sidebar from "@/components/layout/Sidebar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ToastViewport from "@/components/ui/ToastViewport";
import { useDraftPageController } from "@/hooks/useDraftPageController";
import { PreviewUser } from "@/lib/ui-preview";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { AIActionType, Post } from "@/types";

interface ClientPageProps {
  initialPosts: Post[];
  isPreview?: boolean;
  previewUser?: PreviewUser;
}

export default function ClientPage({
  initialPosts,
  isPreview = false,
  previewUser,
}: ClientPageProps) {
  const {
    posts,
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
    assistantPanelMode,
    isSourceModalOpen,
    isPreviewOpen,
    previewMode,
    pendingDeletePost,
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
    requestDeletePost,
    cancelDeletePost,
    confirmDeletePost,
    handlePreviewOpen,
    handlePreviewClose,
    handleAIAction,
    handleApplyAIResult,
    handleAppendAIResult,
    handleTitleChange,
    handleContentChange,
    handleFileUpload,
    handleOpenImport,
    handleCloseImport,
    handleCloseAIResult,
    handleExportMarkdown,
  } = useDraftPageController({ initialPosts, isPreview });

  useUnsavedChanges();

  return (
    <div className="app-shell">
      <div className="flex min-h-screen">
        <Sidebar
          posts={posts}
          activePostId={activePostId}
          isOpen={isSidebarOpen}
          isPreview={isPreview}
          onClose={closeSidebar}
          onPostSelect={handlePostSelect}
          onPostCreate={() => void handleCreatePost()}
          onPostDelete={requestDeletePost}
          previewUser={previewUser}
        />

        <div className="flex min-w-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col">
            <DraftHeader
              title={activePost?.title || ""}
              hasActivePost={!!activePost}
              isSaving={isSaving}
              isDirty={isDirty}
              isAiLoading={isAiLoading}
              isAssistantOpen={isAssistantOpen}
              revisionNumber={activePost?.revision_number ?? null}
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

            <div className="flex min-h-0 flex-1">
              <section
                ref={contentScrollRef}
                className="app-scrollbar min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-5 md:px-6 md:pb-8 xl:px-10"
              >
                <div className="mx-auto w-full max-w-5xl">
                  {activePost ? (
                    <DraftEditorPane
                      post={activePost}
                      selectionText={selectionText}
                      isAssistantOpen={isAssistantOpen}
                      onOpenAssistant={() =>
                        openAssistantPanel(
                          selectionText ? "selection" : assistantPanelMode,
                        )
                      }
                      onContentChange={handleContentChange}
                    />
                  ) : (
                    <EmptyDraftState
                      onCreatePost={() => void handleCreatePost()}
                      onBrowseDrafts={toggleSidebar}
                    />
                  )}
                </div>
              </section>

              {activePost ? (
                <AssistantPanel
                  isOpen={isAssistantOpen}
                  mode={assistantPanelMode}
                  artifacts={activeArtifacts}
                  revisionNumber={activePost.revision_number}
                  selectionText={selectionText}
                  isAiLoading={isAiLoading}
                  isArtifactsLoading={isArtifactsLoading}
                  aiResultText={aiResultText}
                  onClose={closeAssistantPanel}
                  onOpenImport={handleOpenImport}
                  onOpenPreview={() => handlePreviewOpen("preview")}
                  onExportMarkdown={handleExportMarkdown}
                  onRunAction={(action, selection) =>
                    void handleAIAction(action, selection)
                  }
                  onApplyAIResult={handleApplyAIResult}
                  onAppendAIResult={handleAppendAIResult}
                  onCloseAIResult={handleCloseAIResult}
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

      {isPreviewOpen && activePost ? (
        <PreviewModal
          title={activePost.title}
          content={activePost.content}
          mode={previewMode}
          onModeChange={setPreviewMode}
          onClose={handlePreviewClose}
        />
      ) : null}

      <ConfirmDialog
        open={!!pendingDeletePost}
        title="이 초안을 삭제할까요?"
        description={`"${pendingDeletePost?.title || "제목 없는 초안"}"는 삭제 후 복구할 수 없습니다.`}
        confirmLabel="삭제하기"
        onConfirm={() => void confirmDeletePost()}
        onCancel={cancelDeletePost}
      />

      <ToastViewport items={notifications} onDismiss={dismissNotification} />
    </div>
  );
}
