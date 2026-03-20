const LIST_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

const SIDEBAR_DATE_TIME_PARTS_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

const RECORD_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Seoul",
});

export function formatListDate(value: string) {
  return LIST_DATE_FORMATTER.format(new Date(value));
}

export function formatSidebarDateTime(value: string) {
  const parts = SIDEBAR_DATE_TIME_PARTS_FORMATTER.formatToParts(new Date(value));
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";

  return `${month}.${day} ${hour}:${minute}`;
}

export function formatRecordDate(value: string) {
  return RECORD_DATE_FORMATTER.format(new Date(value));
}
