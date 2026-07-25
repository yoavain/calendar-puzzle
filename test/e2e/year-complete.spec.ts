import { test, expect } from "@playwright/test";
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
 * twice, so every dialog node has a twin. This is pre-existing behaviour — the
 * older PlayAnotherDialog duplicates identically — so these tests assert on the
 * first match rather than working around it per-assertion.
 */
const TITLE = "Every date on the calendar";

test.describe("Year complete", () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
        await mockDate(page, TODAY);
        await mockApiRoutes(page, { authMe: COMPLETED_SESSION });
    });

    test("shows the year-complete screen instead of suggesting another date", async ({ page }, testInfo) => {
        const gamePage = new GamePage(page, layoutFromProject(testInfo.project.name));
        await gamePage.goto();

        const dialog = page.getByRole("dialog").first();
        await expect(dialog.getByText(TITLE)).toBeVisible();
        await expect(dialog.getByText(`${TOTAL_DATES} / ${TOTAL_DATES}`)).toBeVisible();
        await expect(dialog.getByRole("button", { name: "Play a random date" })).toBeVisible();

        // The "play another?" prompt must not appear — there is no date to suggest.
        await expect(page.getByText("Want to play another puzzle?")).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Let's go!" })).toHaveCount(0);
    });

    test("'Play a random date' loads a date other than today", async ({ page }, testInfo) => {
        const gamePage = new GamePage(page, layoutFromProject(testInfo.project.name));
        await gamePage.goto();

        // The controller mirrors the current date into document.title, which is
        // the only place all three layouts agree — on mobile the date button
        // lives inside a closed drawer. mockDate pins today to 25 Jul.
        await expect(page).toHaveTitle("Calendar Puzzle - 25/07");

        await expect(page.getByText(TITLE).first()).toBeVisible();
        await page.getByRole("button", { name: "Play a random date" }).first().click();

        // The live dialog closes, but its StrictMode twin lingers in the dev
        // server's DOM, so the date change — not the dialog's absence — is what
        // can be asserted reliably here.
        await expect(page).not.toHaveTitle("Calendar Puzzle - 25/07");
        await expect(page).toHaveTitle(/^Calendar Puzzle - \d{2}\/\d{2}$/);
    });
});
