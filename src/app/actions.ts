"use server";

import { createClient } from "@/lib/supabase/server";
import { AIActionType, Post } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const MAX_INPUT_LENGTH = 20000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

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
  [AIActionType.SOURCE_TO_DRAFT]: `Role: professional ghostwriter. Task: Create structured draft with title and headers. ${STRICT_MARKDOWN_RULES} Response in Korean.`,
};

type AIActionResult = { success: true; text: string } | { success: false; error: string };
type PostUpdateInput = Partial<Pick<Post, "title" | "content" | "is_published">>;

function checkRateLimit(userId: string): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  const bucket = rateLimitStore.get(userId);

  if (!bucket || now >= bucket.resetAt) {
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { ok: true };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." };
  }

  bucket.count += 1;
  rateLimitStore.set(userId, bucket);
  return { ok: true };
}

function sanitizePostUpdates(updates: PostUpdateInput): PostUpdateInput {
  const sanitized: PostUpdateInput = {};

  if (typeof updates.title === "string") {
    sanitized.title = updates.title;
  }
  if (typeof updates.content === "string") {
    sanitized.content = updates.content;
  }
  if (typeof updates.is_published === "boolean") {
    sanitized.is_published = updates.is_published;
  }

  return sanitized;
}

export async function runAIAction(action: AIActionType, text: string): Promise<AIActionResult> {
  if (!apiKey) throw new Error("Server API Key Not Found");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const limited = checkRateLimit(user.id);
  if (!limited.ok) {
    return { success: false, error: limited.error };
  }

  const input = text.trim();
  if (!input) {
    return { success: false, error: "입력 텍스트가 비어 있습니다." };
  }
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      success: false,
      error: `입력 텍스트가 너무 깁니다. ${MAX_INPUT_LENGTH.toLocaleString()}자 이하로 줄여주세요.`,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `${SYSTEM_PROMPTS[action]}\n\n[INPUT TEXT]:\n${input}\n\n[OUTPUT]:`;
    const result = await model.generateContent(prompt);
    return { success: true, text: result.response.text() };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI 요청 중 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

export async function createPostAction() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title: "새 문서",
      content: "",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePostAction(postId: string, updates: PostUpdateInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const sanitizedUpdates = sanitizePostUpdates(updates);
  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new Error("유효한 업데이트 필드가 없습니다.");
  }

  const { error } = await supabase
    .from("posts")
    .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return true;
}

export async function getMyPostsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deletePostAction(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return true;
}
