import { test, expect, type Page } from "@playwright/test";
import { GamePage } from "./fixtures/gamePage";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";

const TOUCH_TARGET_PX = 44;

/** Scrolls the dialog's content to its end, and returns how far the content still runs past the visible area. */
const scrollContentToEnd = (page: Page) => page.getByRole("dialog").locator(".MuiDialogContent-root").evaluate((content) => {
    content.scrollTop = content.scrollHeight;
    return content.scrollHeight - content.clientHeight - content.scrollTop;
});

/** How far any part of the dialog's content runs past the dialog's right edge. */
const overflowPastRightEdge = (page: Page) => page.getByRole("dialog").evaluate((dialog) => {
    const edge = dialog.getBoundingClientRect().right;
    return Math.max(0, ...[...dialog.querySelectorAll("*")].map((element) => element.getBoundingClientRect().right - edge));
});

test.describe("Dialogs on small screens", () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await mockApiRoutes(page);
        await clearStorage(page);
        await mockDate(page, new Date(2024, 0, 1));
        await new GamePage(page, layoutFromProject(testInfo.project.name)).goto();
    });

    const openFromDrawer = async (page: Page, name: string) => {
        await page.getByRole("button", { name: "Open menu" }).click();
        await page.getByRole("button", { name }).click();
    };

    test("Help scrolls to its end on a small phone", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "mobile-portrait", "Portrait phone only");
        await page.setViewportSize({ width: 320, height: 568 });
        await openFromDrawer(page, "How to play");

        expect(await scrollContentToEnd(page)).toBeLessThanOrEqual(1);
        await expect(page.getByRole("dialog").locator(".scaling-container")).toBeInViewport();
        await expect(page.getByRole("button", { name: "Got it" })).toBeInViewport();
    });

    test("Help scrolls to its end in a short desktop window", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Desktop only");
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.getByRole("button", { name: "How to play" }).click();

        expect(await scrollContentToEnd(page)).toBeLessThanOrEqual(1);
        await expect(page.getByRole("dialog").locator(".scaling-container")).toBeInViewport();
        await expect(page.getByRole("button", { name: "Got it" })).toBeInViewport();
    });

    test("Help's sample board isn't cut by the clip that hides the animated piece", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Desktop only");
        await page.getByRole("button", { name: "How to play" }).click();

        const gap = await page.getByRole("dialog").locator(".scaling-container").evaluate((container) => {
            const clip = (container.parentElement as HTMLElement).getBoundingClientRect();
            return clip.bottom - (container.firstElementChild as HTMLElement).getBoundingClientRect().bottom;
        });
        expect(gap).toBeGreaterThanOrEqual(-1);
    });

    test("Share fits inside the dialog on a small phone", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "mobile-portrait", "Portrait phone only");
        await page.setViewportSize({ width: 320, height: 568 });
        await openFromDrawer(page, "Share");

        expect(await overflowPastRightEdge(page)).toBeLessThanOrEqual(0);
        await expect(page.getByAltText("QR code")).toBeInViewport({ ratio: 1 });
    });

    test("Dialog buttons reach the touch size on a phone", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "mobile-portrait", "Portrait phone only");
        await openFromDrawer(page, "How to play");

        const box = await page.getByRole("button", { name: "Got it" }).boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
    });

    test("Dialog buttons stay compact with a mouse", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Desktop only");
        await page.getByRole("button", { name: "How to play" }).click();

        const box = await page.getByRole("button", { name: "Got it" }).boundingBox();
        expect(box?.height).toBeLessThan(TOUCH_TARGET_PX);
    });
});
