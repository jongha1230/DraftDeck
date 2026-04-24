import { EMPTY_DRAFT_ARTIFACTS } from "@/lib/drafts/records";
import {
  DraftRevisionTrigger,
  type DraftRevision,
  type DraftSaveInput,
  type Post,
  type SaveDraftOptions,
  type SaveDraftResult,
} from "@/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAutosaveController } from "./autosave-controller";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

function createScheduler() {
  let nextId = 0;
  const tasks = new Map<number, () => void | Promise<void>>();

  return {
    schedule(task: () => void | Promise<void>) {
      nextId += 1;
      tasks.set(nextId, task);
      return nextId;
    },
    cancel(handle: unknown) {
      tasks.delete(handle as number);
    },
    async runAll() {
      const entries = Array.from(tasks.entries());
      tasks.clear();

      for (const [, task] of entries) {
        await task();
      }
    },
  };
}

function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-1",
    user_id: "user-1",
    title: "초안",
    content: "현재 초안 내용",
    is_published: false,
    revision_number: 1,
    deleted_at: null,
    created_at: "2026-04-24T00:00:00.000Z",
    updated_at: "2026-04-24T00:00:00.000Z",
    ...overrides,
  };
}

function createRevision(revisionNumber: number): DraftRevision {
  return {
    id: `revision-${revisionNumber}`,
    post_id: "post-1",
    user_id: "user-1",
    revision_number: revisionNumber,
    title: "초안",
    content: `revision-${revisionNumber}`,
    trigger: DraftRevisionTrigger.AUTOSAVE,
    ai_run_id: null,
    source_id: null,
    created_at: "2026-04-24T00:00:00.000Z",
  };
}

function setupController(
  saveDraft: (
    input: DraftSaveInput,
    options: SaveDraftOptions,
  ) => Promise<SaveDraftResult>,
) {
  let currentPost = createPost();
  const scheduler = createScheduler();
  const pushNotification = vi.fn();
  const prependRevision = vi.fn();
  const setIsDirty = vi.fn();
  const setIsSaving = vi.fn();
  const upsertPost = vi.fn((post: Post) => {
    currentPost = post;
  });

  const controller = createAutosaveController({
    getArtifacts: () => EMPTY_DRAFT_ARTIFACTS,
    getPost: () => currentPost,
    isPreview: false,
    prependRevision,
    pushNotification,
    saveDraft,
    schedule: (task) => scheduler.schedule(task),
    cancelScheduled: (handle) => scheduler.cancel(handle),
    setIsDirty,
    setIsSaving,
    upsertPost,
  });

  return {
    controller,
    getCurrentPost: () => currentPost,
    prependRevision,
    pushNotification,
    scheduler,
    setCurrentPost: (post: Post) => {
      currentPost = post;
    },
    setIsDirty,
    setIsSaving,
    upsertPost,
  };
}

describe("createAutosaveController", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("applies a successful save and clears dirty state", async () => {
    const saveDraft = vi.fn().mockResolvedValue({
      ok: true,
      post: createPost({
        revision_number: 2,
        updated_at: "2026-04-24T01:00:00.000Z",
      }),
      revision: createRevision(2),
    });

    const { controller, getCurrentPost, prependRevision, setIsDirty, setIsSaving } =
      setupController(saveDraft);

    controller.queueSave("post-1", { trigger: DraftRevisionTrigger.AUTOSAVE });
    await controller.flushSave("post-1");

    expect(saveDraft).toHaveBeenCalledWith(
      {
        postId: "post-1",
        title: "초안",
        content: "현재 초안 내용",
        expectedRevision: 1,
      },
      expect.objectContaining({
        trigger: DraftRevisionTrigger.AUTOSAVE,
      }),
    );
    expect(getCurrentPost().revision_number).toBe(2);
    expect(prependRevision).toHaveBeenCalledWith("post-1", createRevision(2));
    expect(setIsDirty).toHaveBeenLastCalledWith(false);
    expect(setIsSaving).toHaveBeenLastCalledWith(false);
  });

  it("keeps the draft dirty when save fails", async () => {
    const saveDraft = vi.fn().mockResolvedValue({
      ok: false,
      reason: "error",
      message: "DB down",
    });

    const { controller, pushNotification, setIsDirty } = setupController(saveDraft);

    controller.queueSave("post-1", { trigger: DraftRevisionTrigger.AUTOSAVE });
    await controller.flushSave("post-1");

    expect(pushNotification).toHaveBeenCalledWith("DB down", "error", "저장 실패");
    expect(setIsDirty).toHaveBeenLastCalledWith(true);
  });

  it("surfaces conflicts without discarding local text", async () => {
    const saveDraft = vi.fn().mockResolvedValue({
      ok: false,
      reason: "conflict",
      message: "다른 변경이 먼저 저장되었습니다. 현재 편집 내용은 유지합니다. 내용을 검토한 뒤 다시 저장해 주세요.",
      post: createPost({
        title: "서버 제목",
        content: "서버 본문",
        revision_number: 3,
        updated_at: "2026-04-24T01:00:00.000Z",
      }),
    });

    const { controller, getCurrentPost, pushNotification, setCurrentPost, setIsDirty } =
      setupController(saveDraft);

    setCurrentPost(
      createPost({
        title: "로컬 제목",
        content: "로컬 본문",
      }),
    );

    controller.queueSave("post-1", { trigger: DraftRevisionTrigger.AUTOSAVE });
    await controller.flushSave("post-1");

    expect(getCurrentPost()).toMatchObject({
      title: "로컬 제목",
      content: "로컬 본문",
      revision_number: 3,
      updated_at: "2026-04-24T01:00:00.000Z",
    });
    expect(pushNotification).toHaveBeenCalledWith(
      "다른 변경이 먼저 저장되었습니다. 현재 편집 내용은 유지합니다. 내용을 검토한 뒤 다시 저장해 주세요.",
      "error",
      "저장 충돌",
    );
    expect(setIsDirty).toHaveBeenLastCalledWith(true);
  });

  it("queues a follow-up save when edits happen during an in-flight save", async () => {
    const firstSave = createDeferred<SaveDraftResult>();
    const saveDraft = vi
      .fn<
        (
          input: DraftSaveInput,
          options: SaveDraftOptions,
        ) => Promise<SaveDraftResult>
      >()
      .mockImplementationOnce(() => firstSave.promise)
      .mockResolvedValueOnce({
        ok: true,
        post: createPost({
          revision_number: 3,
          content: "두 번째 저장 내용",
          updated_at: "2026-04-24T02:00:00.000Z",
        }),
        revision: createRevision(3),
      });

    const { controller, getCurrentPost, scheduler, setCurrentPost } =
      setupController(saveDraft);

    controller.queueSave("post-1", { trigger: DraftRevisionTrigger.AUTOSAVE });
    const inFlightFlush = controller.flushSave("post-1");

    setCurrentPost(
      createPost({
        content: "두 번째 저장 내용",
      }),
    );
    controller.queueSave("post-1", { trigger: DraftRevisionTrigger.AUTOSAVE });

    firstSave.resolve({
      ok: true,
      post: createPost({
        revision_number: 2,
        content: "현재 초안 내용",
        updated_at: "2026-04-24T01:00:00.000Z",
      }),
      revision: createRevision(2),
    });

    await inFlightFlush;
    await scheduler.runAll();

    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(saveDraft.mock.calls[1]?.[0]).toEqual({
      postId: "post-1",
      title: "초안",
      content: "두 번째 저장 내용",
      expectedRevision: 2,
    });
    expect(getCurrentPost().revision_number).toBe(3);
    expect(getCurrentPost().content).toBe("두 번째 저장 내용");
  });

  it("cancels pending timers on dispose", async () => {
    const saveDraft = vi.fn().mockResolvedValue({
      ok: true,
      post: createPost({
        revision_number: 2,
      }),
    });

    const { controller, scheduler } = setupController(saveDraft);

    controller.queueSave("post-1", { trigger: DraftRevisionTrigger.AUTOSAVE });
    controller.dispose();
    await scheduler.runAll();

    expect(saveDraft).not.toHaveBeenCalled();
  });
});
