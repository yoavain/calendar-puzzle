import { test, expect } from "@playwright/test";
import { GamePage } from "./fixtures/gamePage";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";
import { SOLVE_COPY } from "../../src/client/copy/solveCopy";

const JUL_25 = { month: 6, day: 25 };

// The dev server mounts portals twice, in the same place. A production build shows one.
// So these tests read the first match and click the last, which is the one on top.

const sessionWith = (settings: { tokenIntroSeen?: boolean }) => ({
    user: { id: "e2e-returning", isAdmin: false, name: "Returning" },
    completedDates: [JUL_25],
    playedDates: [JUL_25],
    settings
});

test.describe("Opening the game with today already solved", () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
        await mockDate(page, new Date(2026, JUL_25.month, JUL_25.day));
    });

    test("shows a notice that leaves the board usable, and offers the next date", async ({ page }, testInfo) => {
        await mockApiRoutes(page, { authMe: sessionWith({ tokenIntroSeen: true }) });
        await new GamePage(page, layoutFromProject(testInfo.project.name)).goto();

        // In the viewport, not only visible: on desktop it once sat below the fold.
        await expect(page.getByText(SOLVE_COPY.solvedTodayNotice).first()).toBeInViewport();
        await expect(page.getByRole("dialog")).toHaveCount(0);

        await page.getByRole("button", { name: "Play Jul 24" }).last().click();
        await expect(page).toHaveTitle("Calendar Puzzle - 24/07");
    });

    test("waits for the token intro, so the two never show together", async ({ page }, testInfo) => {
        await mockApiRoutes(page, { authMe: sessionWith({}) });
        await new GamePage(page, layoutFromProject(testInfo.project.name)).goto();

        await expect(page.getByRole("dialog").first()).toBeVisible();
        await expect(page.getByText(SOLVE_COPY.solvedTodayNotice)).toHaveCount(0);

        await page.getByRole("button", { name: "Got it" }).first().click();
        await expect(page.getByText(SOLVE_COPY.solvedTodayNotice).first()).toBeInViewport();
    });
});
