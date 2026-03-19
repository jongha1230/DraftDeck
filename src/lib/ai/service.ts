import { createClient } from "@/lib/supabase/server";
import { countRecentAIRunsRecord, recordAIRunRecord } from "@/lib/drafts/persistence";
import { buildInputExcerpt } from "@/lib/drafts/records";
import {
  AIRun,
  AIRunStatus,
  AIActionType,
  RunAIActionInput,
} from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const MAX_INPUT_LENGTH = 20_000;
const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX_REQUESTS = 24;

const STRICT_MARKDOWN_RULES = `
[STRICT MARKDOWN RULES]
1. NEVER escape markdown characters. (Use "### Title" NOT "\\### Title")
2. NEVER escape dollar signs for math. (Use "$E=mc^2$" NOT "\\$E=mc^2\\$")
3. Use DOUBLE NEWLINES before and after any block element (headings, lists, math blocks).
4. Use standard GFM (GitHub Flavored Markdown).
5. Do NOT wrap the response in a markdown code block (no \`\`\`markdown).
`;

const SYSTEM_PROMPTS = {
  [AIActionType.SUMMARIZE]: `Role: expert technical editor. Task: Summarize the text. ${STRICT_MARKDOWN_RULES} Response in Korean.`,
  [AIActionType.DEVELOPER_REWRITE]: `Role: senior tech blogger. Task: Rewrite professionally. ${STRICT_MARKDOWN_RULES} Response in Korean.`,
  [AIActionType.TRANSLATE]: `Role: technical translator. Task: Natural Korean translation. ${STRICT_MARKDOWN_RULES}`,
  [AIActionType.SOURCE_TO_DRAFT]: `Role: professional ghostwriter. Task: Create a technical article draft with clear title, sections, and next steps. ${STRICT_MARKDOWN_RULES} Response in Korean.`,
};

export type AIActionResult =
  | { success: true; text: string; run: AIRun | null }
  | { success: false; error: string; run: AIRun | null };

export async function executeAIAction(
  input: RunAIActionInput,
): Promise<AIActionResult> {
  if (!apiKey) {
    throw new Error("Server API Key Not Found");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다.", run: null };
  }

  const trimmedInput = input.text.trim();

  if (!trimmedInput) {
    return { success: false, error: "입력 텍스트가 비어 있습니다.", run: null };
  }

  if (trimmedInput.length > MAX_INPUT_LENGTH) {
    return {
      success: false,
      error: `입력 텍스트가 너무 깁니다. ${MAX_INPUT_LENGTH.toLocaleString()}자 이하로 줄여주세요.`,
      run: null,
    };
  }

  const recentRuns = await countRecentAIRunsRecord(
    user.id,
    RATE_LIMIT_WINDOW_MINUTES,
  );

  if (recentRuns !== null && recentRuns >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      success: false,
      error: "AI 요청이 많아 잠시 제한했습니다. 한 시간 정도 뒤에 다시 시도해 주세요.",
      run: null,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `${SYSTEM_PROMPTS[input.action]}\n\n[INPUT TEXT]:\n${trimmedInput}\n\n[OUTPUT]:`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const run = await recordAIRunRecord({
      action: input.action,
      postId: input.postId ?? null,
      inputExcerpt: buildInputExcerpt(trimmedInput),
      outputText: text,
      selectionText: input.selectionText ?? null,
      sourceId: input.sourceId ?? null,
      status: AIRunStatus.SUCCESS,
    });

    return { success: true, text, run };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "AI 요청 중 오류가 발생했습니다.";
    const run = await recordAIRunRecord({
      action: input.action,
      postId: input.postId ?? null,
      inputExcerpt: buildInputExcerpt(trimmedInput),
      outputText: "",
      selectionText: input.selectionText ?? null,
      sourceId: input.sourceId ?? null,
      status: AIRunStatus.ERROR,
      errorMessage: message,
    });

    return { success: false, error: message, run };
  }
}
