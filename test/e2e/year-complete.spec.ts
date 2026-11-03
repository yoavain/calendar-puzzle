import { test, expect } from "@playwright/test";
import { SOLVE_COPY } from "../../src/client/copy/solveCopy";
import { GamePage } from "./fixtures/gamePage";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";
import { DAYS_IN_MONTH, TOTAL_DATES } from "../../src/common/consts";
import type { PuzzleDate } from "../../src/common/types";

/** Every date on the calendar, as the /api/auth/me payload would return them. */
function allPuzzleDates(): PuzzleDate[] {
    const dates: PuzzleDate[] = [];
    for (let month = 0; month < DAYS_IN_MONTH.length; month++) {
        for (let day = 1; day <= DAYS_IN_MONTH[month]; day++) {
            dates.push({ month, day });
        }
    }
    return dates;
}

const TODAY = new Date(2026, 6, 25);

const COMPLETED_SESSION = {
    user: { id: "e2e-completionist", isAdmin: false, name: "Completionist" },
    completedDates: allPuzzleDates(),
    playedDates: allPuzzleDates()
};

/**
 * Under the Vite dev server React StrictMode mounts each MUI Dialog portal
 * twice, so every dialog node has a twin. This test asserts on the first match
 * rather than working around it per-assertion.
 */
const TITLE = "Every date on the calendar";

test("the year-complete screen replaces the next-date offer, and 'Play a random date' loads another date", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The dialog is the same component in every layout");

    await clearStorage(page);
    await mockDate(page, TODAY);
    await mockApiRoutes(page, { authMe: COMPLETED_SESSION });
    await new GamePage(page, layoutFromProject(testInfo.project.name)).goto();

    const dialog = page.getByRole("dialog").first();
    await expect(dialog.getByRole("heading", { name: new RegExp(TITLE) })).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(`${TOTAL_DATES} / ${TOTAL_DATES}`);

    // The "solved today" notice must not appear: there is no date to suggest.
    await expect(page.getByText(SOLVE_COPY.solvedTodayNotice)).toHaveCount(0);

    // The controller mirrors the current date into document.title. mockDate pins today to 25 Jul.
    await expect(page).toHaveTitle("Calendar Puzzle - 25/07");

    await page.getByRole("button", { name: "Play a random date" }).first().click();

    // The live dialog closes, but its StrictMode twin lingers in the dev
    // server's DOM, so the date change, not the dialog's absence, is what
    // can be asserted reliably here.
    await expect(page).not.toHaveTitle("Calendar Puzzle - 25/07");
    await expect(page).toHaveTitle(/^Calendar Puzzle - \d{2}\/\d{2}$/);
});
