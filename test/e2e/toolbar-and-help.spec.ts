import { test, expect } from "@playwright/test";
import { GamePage, type LayoutKind } from "./fixtures/gamePage";
import { dragPieceToBoard } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";

/** Piece 4 (violet S-shape) - 5 filled cells. Matches drag-drop.spec.ts. */
const PIECE_ID = 4;
const PIECE_CAROUSEL_INDEX = 3;
const PIECE_CELL_COUNT = 5;

test.describe("Toolbar, Esc and Help", () => {
    let game: GamePage;
    let layout: LayoutKind;

    test.beforeEach(async ({ page }, testInfo) => {
        layout = layoutFromProject(testInfo.project.name);
        await mockApiRoutes(page);
        await clearStorage(page);
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
        await game.goto();
    });

    const placePiece = async (page: Parameters<typeof dragPieceToBoard>[0]) => {
        if (layout !== "desktop") {
            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        }
        await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
    };

    test("Esc with nothing selected leaves the board unchanged", async ({ page }) => {
        await placePiece(page);
        await page.keyboard.press("Escape");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
    });

    test("the Reset button still clears the board", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Mobile labels Reset through its icon button");
        await placePiece(page);
        await page.getByRole("button", { name: "Reset" }).click();
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);
    });

    test("Undo brings the board back after Reset, and Redo clears it again", async ({ page }) => {
        await placePiece(page);

        await page.getByRole("button", { name: "Reset" }).click();
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);

        await page.getByRole("button", { name: "Undo" }).click();
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);

        await page.getByRole("button", { name: "Redo" }).click();
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);
    });

    test("a toolbar tooltip appears on an enabled and on a disabled button", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "The icon toolbar is desktop only");

        await page.getByRole("button", { name: "Share" }).hover();
        await expect(page.getByRole("tooltip").filter({ hasText: "Share" })).toBeVisible();

        // A disabled button ignores the pointer, so the hover lands on its wrapper.
        // The previous tooltip may still be fading out, so match on the text.
        await page.getByRole("group", { name: "Sign in to see statistics" }).hover();
        await expect(page.getByRole("tooltip").filter({ hasText: "Sign in to see statistics" })).toBeVisible();
    });

    test("Help lists the shortcuts on keyboard devices only", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Help sits behind the mobile drawer; the mobile check is below");
        await page.getByRole("button", { name: "How to play" }).click();
        await expect(page.getByRole("heading", { name: "Keyboard shortcuts" })).toBeVisible();
        await expect(page.getByRole("dialog").getByText("Clear the selection")).toBeVisible();
        await expect(page.getByRole("button", { name: "Got it" })).toBeVisible();
    });

    test("Help hides the shortcuts on touch devices", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === "desktop", "Touch layouts only");
        await page.getByRole("button", { name: "Open menu" }).click();
        await page.getByRole("button", { name: "How to play" }).click();
        await expect(page.getByRole("button", { name: "Got it" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Keyboard shortcuts" })).toHaveCount(0);
    });
});
