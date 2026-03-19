import {
  buildInputExcerpt,
  buildMarkdownExportFilename,
  normalizePostRecord,
} from "./records";

describe("draft record helpers", () => {
  it("normalizes posts and defaults revision number to 1", () => {
    const post = normalizePostRecord({
      id: "post-1",
      user_id: "user-1",
      title: "초안",
      content: "본문",
      is_published: false,
      created_at: "2026-03-19T00:00:00.000Z",
      updated_at: "2026-03-19T00:00:00.000Z",
    });

    expect(post.revision_number).toBe(1);
    expect(post.title).toBe("초안");
  });

  it("builds a safe markdown filename", () => {
    expect(buildMarkdownExportFilename("기술 설계 초안 v1")).toBe(
      "기술-설계-초안-v1.md",
    );
  });

  it("creates a trimmed input excerpt", () => {
    const excerpt = buildInputExcerpt("   alpha    beta   gamma   ", 12);

    expect(excerpt).toBe("alpha beta g...");
  });
});
