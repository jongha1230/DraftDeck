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
    const serverPost = {
      id: "post-1",
      user_id: "user-1",
      title: "server title",
      content: "server content",
      is_published: false,
      revision_number: 3,
      created_at: "2026-03-19T00:00:00.000Z",
      updated_at: "2026-03-19T00:00:00.000Z",
    };

    const selectSingle = vi.fn().mockResolvedValue({
      data: serverPost,
      error: null,
    });

    const updateSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "JSON object requested, multiple (or no) rows returned" },
    });

    const selectEqChain = {
      eq: vi.fn().mockReturnThis(),
      single: selectSingle,
    };

    const updateSelectChain = {
      single: updateSingle,
    };

    const updateEqChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnValue(updateSelectChain),
    };

    const selectChain = {
      select: vi.fn().mockReturnValue(selectEqChain),
    };

    const updateChain = {
      update: vi.fn().mockReturnValue(updateEqChain),
    };

    const from = vi
      .fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(selectChain);

    const mockedClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from,
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
    expect(from).toHaveBeenCalledWith("posts");
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "local title",
        content: "local content",
        revision_number: 4,
      }),
    );
  });
});
