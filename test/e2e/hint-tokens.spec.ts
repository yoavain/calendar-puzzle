import { test, expect } from "@playwright/test";
import { mockApiRoutes, mockDate, clearStorage } from "./helpers/testUtils";
import { HINT_TOKEN_COPY } from "../../src/client/copy/hintTokenCopy";
import { readFileSync } from "node:fs";
import type { Piece } from "../../src/common/types";

const solution0101 = JSON.parse(readFileSync(new URL("../common/resources/01-01.json", import.meta.url), "utf8")) as { pieces: Piece[] };
const hintPieces = solution0101.pieces.filter(p => p.position !== null);

test.describe("Hint tokens", () => {
    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "The Hint button is inside the drawer on mobile");
        await clearStorage(page);
        await mockDate(page, new Date(2024, 0, 1, 12));
        await mockApiRoutes(page, {
            authMe: {
                user: { id: "e2e-user", isAdmin: false },
                completedDates: [{ month: 0, day: 2 }],
                playedDates: [{ month: 0, day: 2 }],
                tokenBalance: 1,
                settings: { tokenIntroSeen: true }
            }
        });
    });

    test("free hint, then a confirmed token hint, then no tokens left", async ({ page }) => {
        const hintRequests: number[] = [];
        const settingsBodies: unknown[] = [];

        // Registered after mockApiRoutes, so these win for their URLs
        await page.route("**/api/hint/*/state", route =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ pieces: [] }) }));
        await page.route("**/api/hint", async (route) => {
            const { hintNumber } = route.request().postDataJSON() as { hintNumber: number };
            hintRequests.push(hintNumber);
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ pieces: hintPieces.slice(0, hintNumber), tokenBalance: hintNumber === 1 ? 1 : 0 })
            });
        });
        await page.route("**/api/user/settings", async (route) => {
            settingsBodies.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ settings: { tokenIntroSeen: true, skipTokenConfirm: true } })
            });
        });

        await page.goto("/");

        const hintButton = page.getByRole("button", { name: /^Hint/ });
        await expect(hintButton).toBeEnabled();
        await hintButton.click();
        await expect.poll(() => hintRequests).toEqual([1]);

        await expect(hintButton).toBeEnabled();
        await hintButton.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByText(HINT_TOKEN_COPY.confirm.title)).toBeVisible();
        await dialog.getByRole("checkbox", { name: HINT_TOKEN_COPY.confirm.dontAskAgain }).check();
        await dialog.getByRole("button", { name: HINT_TOKEN_COPY.confirm.confirm }).click();

        await expect.poll(() => hintRequests).toEqual([1, 2]);
        await expect.poll(() => settingsBodies).toEqual([{ skipTokenConfirm: true }]);
        await expect(page.locator("[data-token-target]").first()).toHaveText("0");
        await expect(hintButton).toBeDisabled();
    });
});
