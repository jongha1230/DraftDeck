import { createClient } from "@/lib/supabase/server";
import { countRecentAIRunsRecord, recordAIRunRecord } from "@/lib/drafts/persistence";
import { buildInputExcerpt } from "@/lib/drafts/records";
import {
  AI_LIMITS,
  buildAIActionPrompt,
  validateAIInput,
  validateAIOutput,
} from "@/lib/ai/prompt-builder";
import {
  AIRun,
  AIRunStatus,
  RunAIActionInput,
} from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIActionResult =
  | { success: true; text: string; run: AIRun | null }
  | { success: false; error: string; run: AIRun | null };

type AIResponseLike = {
  response: {
    text(): string;
  };
};

type GenerativeModelLike = {
  generateContent(prompt: string): Promise<AIResponseLike>;
};

type AIServiceDependencies = {
  apiKey?: string;
  buildInputExcerptFn?: typeof buildInputExcerpt;
  countRecentAIRunsFn?: typeof countRecentAIRunsRecord;
  createModel?: () => GenerativeModelLike;
  createSupabaseClient?: typeof createClient;
  recordAIRunFn?: typeof recordAIRunRecord;
};

function createDefaultModel(apiKey: string): GenerativeModelLike {
  if (!apiKey) {
    throw new Error("Server API Key Not Found");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export function createAIActionExecutor({
  apiKey = process.env.GEMINI_API_KEY || "",
  buildInputExcerptFn = buildInputExcerpt,
  countRecentAIRunsFn = countRecentAIRunsRecord,
  createModel = () => createDefaultModel(apiKey),
  createSupabaseClient = createClient,
  recordAIRunFn = recordAIRunRecord,
}: AIServiceDependencies = {}) {
  return async function executeAIAction(
    input: RunAIActionInput,
  ): Promise<AIActionResult> {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "로그인이 필요합니다.", run: null };
    }

    const validation = validateAIInput(input.text, AI_LIMITS.maxInputLength);
    if (!validation.ok) {
      return { success: false, error: validation.error, run: null };
    }

    const recentRuns = await countRecentAIRunsFn(
      user.id,
      AI_LIMITS.rateLimitWindowMinutes,
    );

    if (recentRuns !== null && recentRuns >= AI_LIMITS.rateLimitMaxRequests) {
      return {
        success: false,
        error: "AI 요청이 많아 잠시 제한했습니다. 한 시간 정도 뒤에 다시 시도해 주세요.",
        run: null,
      };
    }

    const inputExcerpt = buildInputExcerptFn(validation.text);

    try {
      const result = await createModel().generateContent(
        buildAIActionPrompt({
          action: input.action,
          text: validation.text,
          selectionText: input.selectionText,
        }),
      );
      const outputValidation = validateAIOutput(result.response.text());

      if (!outputValidation.ok) {
        throw new Error(outputValidation.error);
      }

      const run = await recordAIRunFn({
        action: input.action,
        postId: input.postId ?? null,
        inputExcerpt,
        outputText: outputValidation.text,
        selectionText: input.selectionText ?? null,
        sourceId: input.sourceId ?? null,
        status: AIRunStatus.SUCCESS,
      });

      return { success: true, text: outputValidation.text, run };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "AI 요청 중 오류가 발생했습니다.";
      const run = await recordAIRunFn({
        action: input.action,
        postId: input.postId ?? null,
        inputExcerpt,
        outputText: "",
        selectionText: input.selectionText ?? null,
        sourceId: input.sourceId ?? null,
        status: AIRunStatus.ERROR,
        errorMessage: message,
      });

      return { success: false, error: message, run };
    }
  };
}

export const executeAIAction = createAIActionExecutor();
