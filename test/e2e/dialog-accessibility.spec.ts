import { test, expect } from "@playwright/test";
import { GamePage } from "./fixtures/gamePage";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";

// The dev server mounts portals twice, in the same place. A production build shows one.
// So these tests read the first match, and drive the keyboard through whichever has focus.
test.describe("Dialog accessibility", () => {
    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "These dialogs share one component across layouts");
        await mockApiRoutes(page);
        await clearStorage(page);
        await mockDate(page, new Date(2024, 0, 1));
        await new GamePage(page, layoutFromProject(testInfo.project.name)).goto();
    });

    test("the QR code enlarges and closes by keyboard, and focus comes back", async ({ page }) => {
        await page.getByRole("button", { name: "Share" }).first().click();

        const enlarge = page.getByRole("button", { name: "Enlarge QR code" }).last();
        await enlarge.focus();
        await page.keyboard.press("Enter");

        await expect(page.getByAltText("QR code enlarged").last()).toBeInViewport();
        await expect(page.locator(":focus")).toHaveAccessibleName(/^(Close|Enlarged QR code)$/);

        await page.keyboard.press("Escape");
        await expect(page.locator(":focus")).toHaveAccessibleName("Enlarge QR code");
    });

    test("the Share address can be selected", async ({ page }) => {
        await page.getByRole("button", { name: "Share" }).first().click();

        const address = page.getByRole("dialog").last().getByText("calendar-puzzle.yoavain.org");
        await expect(address).toHaveCSS("user-select", "text");
    });

    test("Help's piece rests in place under reduced motion", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.getByRole("button", { name: "How to play" }).click();

        const piece = page.getByRole("dialog").last().locator(".scaling-container > :last-child");
        await expect(piece).toHaveCSS("animation-name", "none");
    });

    test("Help's piece animates without that preference", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.getByRole("button", { name: "How to play" }).click();

        const piece = page.getByRole("dialog").last().locator(".scaling-container > :last-child");
        await expect(piece).not.toHaveCSS("animation-name", "none");
    });
});
