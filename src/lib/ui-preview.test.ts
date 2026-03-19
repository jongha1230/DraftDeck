import { vi } from "vitest";
import { AIActionType } from "@/types";
import {
  createDefaultPreviewSession,
  createPreviewAIResult,
  isServerUiPreviewEnabled,
} from "./ui-preview";

describe("ui preview helpers", () => {
  it("ships a seeded preview session with artifacts", () => {
    const session = createDefaultPreviewSession();

    expect(session.posts.length).toBeGreaterThan(0);
    expect(session.activePostId).toBe(session.posts[0]?.id ?? null);
    expect(
      session.artifactsByPostId[session.posts[0].id]?.revisions.length,
    ).toBeGreaterThan(0);
  });

  it("creates a structured preview draft result", () => {
    const text = createPreviewAIResult(
      AIActionType.SOURCE_TO_DRAFT,
      "문제 정의와 해결 접근을 정리한 기술 메모",
    );

    expect(text).toContain("# 초안 구조 제안");
    expect(text).toContain("## 권장 구성");
  });

  it("allows query preview on Vercel preview deployments", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");

    expect(isServerUiPreviewEnabled("1")).toBe(true);

    vi.unstubAllEnvs();
  });
});
