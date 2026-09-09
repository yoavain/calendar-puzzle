import { test, expect } from "@playwright/test";
import { GamePage, type LayoutKind } from "./fixtures/gamePage";
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
/** 0-based index of piece 4 in the carousel (pieces are 1–8). */
const PIECE_CAROUSEL_INDEX = 3;
const PIECE_CELL_COUNT = 5;

test.describe("Keyboard shortcuts", () => {
    let game: GamePage;
    let layout: LayoutKind;

    test.beforeEach(async ({ page }, testInfo) => {
        layout = layoutFromProject(testInfo.project.name);
        await mockApiRoutes(page);
        await clearStorage(page);
    });

    test("Ctrl+Z undoes a placement and Ctrl+Y redoes it", async ({ page }) => {
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
        await game.goto();

        if (layout !== "desktop") {
            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        }

        await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);

        // canUndo flipped false -> true after the placement above.
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

    test("Ctrl+Shift+Z redoes a placement", async ({ page }) => {
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
        await game.goto();

        if (layout !== "desktop") {
            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        }

        await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);

        await page.keyboard.press("Control+z");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);

        await page.keyboard.press("Control+Shift+z");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
    });

    test("a spare Ctrl+Z with nothing left to undo does not corrupt redo", async ({ page }) => {
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
        await game.goto();

        if (layout !== "desktop") {
            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        }

        await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);

        await page.keyboard.press("Control+z");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);

        // Nothing is left to undo. The guard must swallow this press.
        await page.keyboard.press("Control+z");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);

        // The real assertion. A spare undo that pushed onto the redo stack would
        // make this redo restore the wrong state.
        await page.keyboard.press("Control+y");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
    });
});
