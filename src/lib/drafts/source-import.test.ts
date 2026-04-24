import { describe, expect, it } from "vitest";
import {
  SOURCE_IMPORT_LIMITS,
  SOURCE_IMPORT_MESSAGES,
  normalizeSourceImportText,
  validateSourceImportFile,
} from "./source-import";

describe("validateSourceImportFile", () => {
  it("accepts supported markdown files", () => {
    expect(
      validateSourceImportFile({
        name: "notes.md",
        size: 512,
        type: "text/markdown",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects unsupported extensions", () => {
    expect(
      validateSourceImportFile({
        name: "notes.pdf",
        size: 512,
        type: "application/pdf",
      }),
    ).toEqual({
      ok: false,
      message: SOURCE_IMPORT_MESSAGES.invalidType,
      title: "지원하지 않는 파일 형식",
    });
  });

  it("rejects oversized files", () => {
    expect(
      validateSourceImportFile({
        name: "notes.txt",
        size: SOURCE_IMPORT_LIMITS.maxSourceFileSizeBytes + 1,
        type: "text/plain",
      }),
    ).toEqual({
      ok: false,
      message: SOURCE_IMPORT_MESSAGES.tooLarge,
      title: "파일 크기 제한",
    });
  });

  it("allows octet-stream uploads when the extension is supported", () => {
    expect(
      validateSourceImportFile({
        name: "notes.txt",
        size: 128,
        type: "application/octet-stream",
      }),
    ).toEqual({ ok: true });
  });
});

describe("normalizeSourceImportText", () => {
  it("returns text when FileReader succeeds", () => {
    expect(normalizeSourceImportText("불러온 텍스트")).toEqual({
      ok: true,
      text: "불러온 텍스트",
    });
  });

  it("returns a user-facing error for non-string reader results", () => {
    expect(normalizeSourceImportText(new ArrayBuffer(8))).toEqual({
      ok: false,
      message: SOURCE_IMPORT_MESSAGES.readError,
      title: "파일 읽기 실패",
    });
  });
});
