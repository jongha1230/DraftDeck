const LIST_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
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

export function formatRecordDate(value: string) {
  return RECORD_DATE_FORMATTER.format(new Date(value));
}
