import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe("/demo smoke", () => {
  test("자료 import -> preview AI gate -> apply가 source/revision을 남긴다", async ({
    page,
  }) => {
    await page.goto("/demo");

    const editor = page.getByLabel("문서 본문");
    const assistantPanel = page.getByRole("complementary", { name: "도우미 패널" });

    await expect(editor).toHaveValue(/# 게스트 데모 초안/);

    await page.getByRole("button", { name: "자료 가져오기" }).click();
    await page.getByLabel("가져올 자료").fill(
      "오케스트레이션 경계를 다시 정리하려면 autosave, revision, AI apply를 각각 독립 흐름으로 나눠야 한다.",
    );
    await page.getByRole("button", { name: "초안 생성" }).click();

    await expect(page.getByText("실제 AI는 로그인 후 사용할 수 있습니다")).toBeVisible();
    await page.getByRole("button", { name: "예시 결과로 계속 보기" }).click();

    await expect(page.getByText("AI 제안")).toBeVisible();
    await expect(page.getByText("초안 구조 제안")).toBeVisible();

    await page.getByRole("button", { name: "본문 덮어쓰기" }).click();

    await expect(editor).toHaveValue(/# 초안 구조 제안/);
    await expect(assistantPanel).toContainText("붙여넣은 자료");
    await expectRevisionCount(assistantPanel, "자료 기반 초안", 1);
  });

  test("선택 영역 요약 -> append가 AI apply 흐름을 실제 편집 surface에 반영한다", async ({
    page,
  }) => {
    await page.goto("/demo");

    const editor = page.getByLabel("문서 본문");
    const assistantPanel = page.getByRole("complementary", { name: "도우미 패널" });
    const originalValue = await editor.inputValue();

    await selectText(editor, page, 0, 80);
    await expect(page.getByText(/자 선택/)).toBeVisible();

    await page.getByRole("button", { name: "요약하기" }).click();
    await expect(page.getByText("실제 AI는 로그인 후 사용할 수 있습니다")).toBeVisible();
    await page.getByRole("button", { name: "예시 결과로 계속 보기" }).click();

    await expect(page.getByText("AI 제안")).toBeVisible();
    await expect(page.getByText("핵심 요약")).toBeVisible();
    await page.getByRole("button", { name: "문단 뒤에 이어붙이기" }).click();

    await expect(editor).toHaveValue(new RegExp(escapeForRegex(originalValue)));
    await expect(editor).toHaveValue(/## 핵심 요약/);
    await expectRevisionCount(assistantPanel, "AI 결과 이어붙이기", 1);
  });

  test("autosave revision을 만든 뒤 이전 버전으로 복원할 수 있다", async ({ page }) => {
    await page.goto("/demo");

    const editor = page.getByLabel("문서 본문");
    const assistantPanel = page.getByRole("complementary", { name: "도우미 패널" });
    const initialValue = await editor.inputValue();
    const firstAutosaveValue = `${initialValue}

## Smoke autosave 1
이 변경은 autosave checkpoint가 새 리비전을 만들 만큼 충분히 길고 의미 있는 수정이다. 구조, 상태, 검증 경계를 다시 적는다.`;
    const secondAutosaveValue = `${firstAutosaveValue}

## Smoke autosave 2
두 번째 수정은 버전 복원 동작을 검증하기 위한 추가 변경이다. 이전 상태로 돌아가면 이 블록은 사라져야 한다.`;

    await editor.fill(firstAutosaveValue);
    await expectRevisionCount(assistantPanel, "수정 저장", 1);

    await editor.fill(secondAutosaveValue);
    await expectRevisionCount(assistantPanel, "수정 저장", 2);

    await assistantPanel
      .getByRole("button", { name: "이 버전으로 되돌리기" })
      .nth(1)
      .click();

    await expect(editor).toHaveValue(firstAutosaveValue);
    await expect(page.getByText("버전 복원")).toBeVisible();
  });
});

async function selectText(
  editor: Locator,
  page: Page,
  start: number,
  end: number,
) {
  await editor.evaluate(
    (element, range) => {
      const textarea = element as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(range.start, range.end);
      textarea.dispatchEvent(new Event("select", { bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Shift" }));
    },
    { start, end },
  );
  await page.waitForTimeout(100);
}

async function expectRevisionCount(
  assistantPanel: Locator,
  label: string,
  minimumCount: number,
) {
  await expect
    .poll(async () => {
      return await assistantPanel.getByText(label, { exact: true }).count();
    })
    .toBeGreaterThanOrEqual(minimumCount);
}

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
