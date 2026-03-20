import { DraftRevisionTrigger } from "@/types";
import { describe, expect, it } from "vitest";
import {
  getCheckpointRevisionCount,
  shouldCreateAutosaveCheckpoint,
} from "./records";

describe("shouldCreateAutosaveCheckpoint", () => {
  it("skips a checkpoint for tiny first-draft input", () => {
    expect(
      shouldCreateAutosaveCheckpoint({
        previousTitle: "새 문서",
        previousContent: "",
        nextTitle: "새 문서",
        nextContent: "1",
      }),
    ).toBe(false);
  });

  it("creates a checkpoint when the title changes", () => {
    expect(
      shouldCreateAutosaveCheckpoint({
        previousTitle: "초안",
        previousContent: "같은 본문",
        nextTitle: "초안 수정",
        nextContent: "같은 본문",
      }),
    ).toBe(true);
  });

  it("skips a checkpoint for very small autosave edits", () => {
    expect(
      shouldCreateAutosaveCheckpoint({
        previousTitle: "초안",
        previousContent: "짧은 메모를 조금 수정했습니다.",
        nextTitle: "초안",
        nextContent: "짧은 메모를 조금 수정했습니다!!",
      }),
    ).toBe(false);
  });

  it("creates a checkpoint for a meaningful body rewrite", () => {
    expect(
      shouldCreateAutosaveCheckpoint({
        previousTitle: "초안",
        previousContent:
          "현재 구조는 동작하지만 상태와 서버 경계가 한 곳에 뭉쳐 있어서 추적이 어렵습니다.",
        nextTitle: "초안",
        nextContent:
          "현재 구조는 기능은 동작하지만 상태 관리와 서버 경계가 밀집돼 있어 추적이 어렵고, 후속 확장 비용도 커집니다. 이번 라운드에서는 쓰기 흐름을 유지하면서 경계를 다시 분리합니다.",
      }),
    ).toBe(true);
  });

  it("creates a checkpoint when a long draft accumulates a large absolute change", () => {
    const previousContent = "a".repeat(900);
    const nextContent = `${previousContent}${"b".repeat(85)}`;

    expect(
      shouldCreateAutosaveCheckpoint({
        previousTitle: "초안",
        previousContent,
        nextTitle: "초안",
        nextContent,
      }),
    ).toBe(true);
  });
});

describe("getCheckpointRevisionCount", () => {
  it("counts unique checkpoint revisions by revision number", () => {
    expect(
      getCheckpointRevisionCount([
        {
          id: "revision-4",
          post_id: "post-1",
          user_id: "user-1",
          revision_number: 4,
          title: "초안",
          content: "넷",
          trigger: DraftRevisionTrigger.AI_APPLY,
          ai_run_id: null,
          source_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: "revision-4-duplicate",
          post_id: "post-1",
          user_id: "user-1",
          revision_number: 4,
          title: "초안",
          content: "넷",
          trigger: DraftRevisionTrigger.AI_APPLY,
          ai_run_id: null,
          source_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: "revision-3",
          post_id: "post-1",
          user_id: "user-1",
          revision_number: 3,
          title: "초안",
          content: "셋",
          trigger: DraftRevisionTrigger.AUTOSAVE,
          ai_run_id: null,
          source_id: null,
          created_at: new Date().toISOString(),
        },
      ]),
    ).toBe(2);
  });
});
