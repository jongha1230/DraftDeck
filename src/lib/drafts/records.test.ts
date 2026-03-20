import { describe, expect, it } from "vitest";
import { shouldCreateAutosaveCheckpoint } from "./records";

describe("shouldCreateAutosaveCheckpoint", () => {
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
});
