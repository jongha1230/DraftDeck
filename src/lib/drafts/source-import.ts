export const SOURCE_IMPORT_LIMITS = {
  maxSourceFileSizeBytes: 1 * 1024 * 1024,
  supportedExtensions: [".txt", ".md"],
  supportedMimeTypes: ["text/plain", "text/markdown", "text/x-markdown"],
} as const;

export const SOURCE_IMPORT_MESSAGES = {
  invalidType: "가져올 수 있는 파일은 .txt 또는 .md 형식입니다.",
  tooLarge:
    "자료 파일이 너무 큽니다. 1MB 이하의 텍스트 파일을 선택해 주세요.",
  readError:
    "파일을 읽는 중 오류가 발생했습니다. 인코딩 또는 파일 내용을 확인해 주세요.",
} as const;

export type SourceImportFileLike = {
  name: string;
  size: number;
  type?: string | null;
};

type SourceImportValidationResult =
  | { ok: true }
  | { ok: false; message: string; title: string };

type SourceImportTextResult =
  | { ok: true; text: string }
  | { ok: false; message: string; title: string };

export function validateSourceImportFile(
  file: SourceImportFileLike,
): SourceImportValidationResult {
  const hasSupportedExtension = SOURCE_IMPORT_LIMITS.supportedExtensions.some(
    (extension) => file.name.toLowerCase().endsWith(extension),
  );
  const normalizedType = file.type?.trim().toLowerCase() ?? "";
  const hasSupportedMimeType =
    !normalizedType ||
    SOURCE_IMPORT_LIMITS.supportedMimeTypes.includes(
      normalizedType as (typeof SOURCE_IMPORT_LIMITS.supportedMimeTypes)[number],
    ) ||
    normalizedType === "application/octet-stream";

  if (!hasSupportedExtension || !hasSupportedMimeType) {
    return {
      ok: false,
      message: SOURCE_IMPORT_MESSAGES.invalidType,
      title: "지원하지 않는 파일 형식",
    };
  }

  if (file.size > SOURCE_IMPORT_LIMITS.maxSourceFileSizeBytes) {
    return {
      ok: false,
      message: SOURCE_IMPORT_MESSAGES.tooLarge,
      title: "파일 크기 제한",
    };
  }

  return { ok: true };
}

export function normalizeSourceImportText(
  value: string | ArrayBuffer | null | undefined,
): SourceImportTextResult {
  if (typeof value !== "string") {
    return {
      ok: false,
      message: SOURCE_IMPORT_MESSAGES.readError,
      title: "파일 읽기 실패",
    };
  }

  return {
    ok: true,
    text: value,
  };
}
