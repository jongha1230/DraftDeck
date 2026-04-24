import { AIActionType, AIRunStatus } from "@/types";
import { describe, expect, it, vi } from "vitest";
import { createAIActionExecutor } from "./service";

function createMockSupabaseClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: userId ? { id: userId } : null,
        },
      }),
    },
  };
}

describe("createAIActionExecutor", () => {
  it("returns login required when auth is missing", async () => {
    const executeAIAction = createAIActionExecutor({
      createSupabaseClient: vi
        .fn()
        .mockResolvedValue(createMockSupabaseClient(null) as never),
    });

    await expect(
      executeAIAction({
        action: AIActionType.SUMMARIZE,
        text: "테스트",
      }),
    ).resolves.toEqual({
      success: false,
      error: "로그인이 필요합니다.",
      run: null,
    });
  });

  it("returns a user-facing error for empty input", async () => {
    const executeAIAction = createAIActionExecutor({
      createSupabaseClient: vi
        .fn()
        .mockResolvedValue(createMockSupabaseClient("user-1") as never),
    });

    await expect(
      executeAIAction({
        action: AIActionType.SUMMARIZE,
        text: "   ",
      }),
    ).resolves.toEqual({
      success: false,
      error: "입력 텍스트가 비어 있습니다.",
      run: null,
    });
  });

  it("returns a user-facing error for over-limit input", async () => {
    const executeAIAction = createAIActionExecutor({
      createSupabaseClient: vi
        .fn()
        .mockResolvedValue(createMockSupabaseClient("user-1") as never),
    });

    const result = await executeAIAction({
      action: AIActionType.SUMMARIZE,
      text: "a".repeat(20_001),
    });

    expect(result).toEqual({
      success: false,
      error: "입력 텍스트가 너무 깁니다. 20,000자 이하로 줄여주세요.",
      run: null,
    });
  });

  it("returns a user-facing error when the rate limit is exceeded", async () => {
    const countRecentAIRunsFn = vi.fn().mockResolvedValue(24);
    const executeAIAction = createAIActionExecutor({
      countRecentAIRunsFn,
      createSupabaseClient: vi
        .fn()
        .mockResolvedValue(createMockSupabaseClient("user-1") as never),
    });

    const result = await executeAIAction({
      action: AIActionType.SUMMARIZE,
      text: "요약할 텍스트",
    });

    expect(result).toEqual({
      success: false,
      error: "AI 요청이 많아 잠시 제한했습니다. 한 시간 정도 뒤에 다시 시도해 주세요.",
      run: null,
    });
    expect(countRecentAIRunsFn).toHaveBeenCalledWith("user-1", 60);
  });

  it("records an error when the AI output is blank", async () => {
    const recordAIRunFn = vi.fn().mockResolvedValue({
      id: "run-blank",
      post_id: null,
      user_id: "user-1",
      action: AIActionType.SUMMARIZE,
      status: AIRunStatus.ERROR,
      input_excerpt: "요약할 텍스트",
      output_text: "",
      selection_text: null,
      source_id: null,
      error_message: "AI 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.",
      created_at: "2026-04-24T00:00:00.000Z",
    });

    const executeAIAction = createAIActionExecutor({
      countRecentAIRunsFn: vi.fn().mockResolvedValue(0),
      createModel: () => ({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => "   ",
          },
        }),
      }),
      createSupabaseClient: vi
        .fn()
        .mockResolvedValue(createMockSupabaseClient("user-1") as never),
      recordAIRunFn,
    });

    const result = await executeAIAction({
      action: AIActionType.SUMMARIZE,
      text: "요약할 텍스트",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("expected blank-output failure");
    }
    expect(result.error).toBe("AI 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
    expect(recordAIRunFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AIRunStatus.ERROR,
        errorMessage: "AI 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.",
        outputText: "",
      }),
    );
  });

  it("records an error when the model call fails", async () => {
    const recordAIRunFn = vi.fn().mockResolvedValue({
      id: "run-error",
      post_id: null,
      user_id: "user-1",
      action: AIActionType.SUMMARIZE,
      status: AIRunStatus.ERROR,
      input_excerpt: "요약할 텍스트",
      output_text: "",
      selection_text: null,
      source_id: null,
      error_message: "Gemini offline",
      created_at: "2026-04-24T00:00:00.000Z",
    });

    const executeAIAction = createAIActionExecutor({
      countRecentAIRunsFn: vi.fn().mockResolvedValue(0),
      createModel: () => ({
        generateContent: vi.fn().mockRejectedValue(new Error("Gemini offline")),
      }),
      createSupabaseClient: vi
        .fn()
        .mockResolvedValue(createMockSupabaseClient("user-1") as never),
      recordAIRunFn,
    });

    const result = await executeAIAction({
      action: AIActionType.SUMMARIZE,
      text: "요약할 텍스트",
      selectionText: "선택 영역",
    });

    expect(result).toEqual({
      success: false,
      error: "Gemini offline",
      run: expect.objectContaining({
        id: "run-error",
        status: AIRunStatus.ERROR,
      }),
    });
    expect(recordAIRunFn).toHaveBeenCalledWith(
      expect.objectContaining({
        selectionText: "선택 영역",
        status: AIRunStatus.ERROR,
      }),
    );
  });
});
