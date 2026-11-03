import { test, expect } from "@playwright/test";
import { GamePage } from "./fixtures/gamePage";
import { dragPieceToBoard } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";

/**
 * Regression coverage for the global keydown listener in
 * `useKeyboardShortcuts`, which reads its props through a `useEffectEvent`
 * and subscribes exactly once.
 *
 * Why undo/redo is the load-bearing case: `canUndo` and `canRedo` are both
 * false on mount and only flip once a piece is placed. A handler that
 * captured its props at subscribe time would therefore see `canUndo === false`
 * forever, and Ctrl+Z would silently do nothing. Pressing undo AFTER a
 * placement proves the handler reads the current render's values.
 */

/** Piece 4 (violet S-shape) – 5 filled cells. Matches drag-drop.spec.ts. */
const PIECE_ID = 4;
const PIECE_CELL_COUNT = 5;

test.describe("Keyboard shortcuts", () => {
    let game: GamePage;

    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Touch layouts have no keyboard");
        const layout = layoutFromProject(testInfo.project.name);
        await mockApiRoutes(page);
        await clearStorage(page);
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
        await game.goto();

        await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
    });

    test("Ctrl+Z undoes a placement and Ctrl+Y redoes it", async ({ page }) => {
        // canUndo flipped false -> true after the placement in beforeEach.
        await page.keyboard.press("Control+z");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);
        await game.expectPieceInCarousel(PIECE_ID);

        // canRedo flipped false -> true after the undo above.
        await page.keyboard.press("Control+y");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);

        // A second undo proves the handler is still reading fresh values
        // rather than a snapshot taken at subscribe time.
        await page.keyboard.press("Control+z");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);
    });

    test("Esc clears the selection, and a stray Esc never wipes the board", async ({ page }) => {
        const selected = page.locator("[aria-pressed=\"true\"]");

        await game.carouselPiece(PIECE_ID + 1).first().click();
        await expect(selected).toHaveCount(1);

        await page.keyboard.press("Escape");
        await expect(selected).toHaveCount(0);

        await page.keyboard.press("Escape");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
    });
});
