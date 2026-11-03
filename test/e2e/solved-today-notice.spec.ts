import { test, expect } from "@playwright/test";
import { GamePage } from "./fixtures/gamePage";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";
import { SOLVE_COPY } from "../../src/client/copy/solveCopy";

const JUL_25 = { month: 6, day: 25 };

const SESSION = {
    user: { id: "e2e-returning", isAdmin: false, name: "Returning" },
    completedDates: [JUL_25],
    playedDates: [JUL_25],
    settings: { tokenIntroSeen: true }
};

test("opening with today solved shows a notice that leaves the board usable, and offers the next date", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The notice is the same component in every layout");

    await clearStorage(page);
    await mockDate(page, new Date(2026, JUL_25.month, JUL_25.day));
    await mockApiRoutes(page, { authMe: SESSION });
    await new GamePage(page, layoutFromProject(testInfo.project.name)).goto();

    // The dev server mounts portals twice, in the same place. A production build shows one.
    // So this reads the first match and clicks the last, which is the one on top.
    // In the viewport, not only visible: on desktop it once sat below the fold.
    await expect(page.getByText(SOLVE_COPY.solvedTodayNotice).first()).toBeInViewport();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Play Jul 24" }).last().click();
    await expect(page).toHaveTitle("Calendar Puzzle - 24/07");
});
