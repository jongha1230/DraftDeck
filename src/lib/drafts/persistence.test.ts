import { DraftRevisionTrigger } from "@/types";
import { vi } from "vitest";
import { saveDraftRecord } from "./persistence";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("saveDraftRecord", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects stale revision saves with a conflict result", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "post-1",
        user_id: "user-1",
        title: "server title",
        content: "server content",
        is_published: false,
        revision_number: 3,
        created_at: "2026-03-19T00:00:00.000Z",
        updated_at: "2026-03-19T00:00:00.000Z",
      },
      error: null,
    });

    const eqChain = {
      eq: vi.fn().mockReturnThis(),
      single,
    };

    const selectChain = {
      select: vi.fn().mockReturnValue(eqChain),
    };

    const mockedClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue(selectChain),
    };

    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      mockedClient as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    const result = await saveDraftRecord(
      {
        postId: "post-1",
        title: "local title",
        content: "local content",
        expectedRevision: 2,
      },
      {
        trigger: DraftRevisionTrigger.AUTOSAVE,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok || result.reason !== "conflict") {
      throw new Error("expected conflict");
    }
    expect(result.reason).toBe("conflict");
    expect(result.post.revision_number).toBe(3);
    expect(mockedClient.from).toHaveBeenCalledWith("posts");
  });
});
