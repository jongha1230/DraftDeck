import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const BASE_URL = process.env.DRAFTDECK_CAPTURE_BASE_URL ?? "http://localhost:3000";
const assetDir = path.resolve("docs/assets");

await mkdir(assetDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
});

const desktop = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  locale: "ko-KR",
  colorScheme: "light",
});
const page = await desktop.newPage();

await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await page.screenshot({
  path: path.join(assetDir, "login.png"),
  fullPage: true,
});

await page.goto(`${BASE_URL}/?draftdeck-preview=1`, { waitUntil: "networkidle" });
await page.getByRole("textbox", { name: "" }).first().waitFor();
await page.screenshot({
  path: path.join(assetDir, "workspace.png"),
  fullPage: true,
});

await page.getByRole("button", { name: "자료 가져오기" }).click();
await page.getByPlaceholder("기존 메모나 자료를 붙여넣으세요. 예: 글 목적, 핵심 논점, 섹션 순서, 인용 메모").fill(
  "서비스 경계를 다시 정리하려면 현재 구조의 병목, autosave 기준점, revision 기록 요구사항을 먼저 적는다.",
);
await page.screenshot({
  path: path.join(assetDir, "source-import.png"),
  fullPage: true,
});

await page.getByRole("button", { name: "초안 생성" }).click();
await page.getByText("AI 제안", { exact: false }).waitFor();
await page.screenshot({
  path: path.join(assetDir, "ai-result.png"),
  fullPage: true,
});

await page.getByRole("button", { name: "본문 덮어쓰기" }).click();
await page.waitForTimeout(900);
await page.locator("aside").last().evaluate((element) => {
  element.scrollTop = element.scrollHeight;
});
await page.screenshot({
  path: path.join(assetDir, "revision-history.png"),
  fullPage: true,
});

const tablet = await browser.newContext({
  viewport: { width: 768, height: 1024 },
  locale: "ko-KR",
  colorScheme: "light",
});
const tabletPage = await tablet.newPage();
await tabletPage.goto(`${BASE_URL}/?draftdeck-preview=1`, {
  waitUntil: "networkidle",
});
await tabletPage.screenshot({
  path: path.join(assetDir, "workspace-tablet.png"),
  fullPage: true,
});

const mobile = await browser.newContext({
  ...devices["iPhone 13"],
  locale: "ko-KR",
  colorScheme: "light",
});
const mobilePage = await mobile.newPage();
await mobilePage.goto(`${BASE_URL}/?draftdeck-preview=1`, {
  waitUntil: "networkidle",
});
await mobilePage.screenshot({
  path: path.join(assetDir, "workspace-mobile.png"),
  fullPage: true,
});

await mobile.close();
await tablet.close();
await desktop.close();
await browser.close();
