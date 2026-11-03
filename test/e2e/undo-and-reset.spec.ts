import { test, expect } from "@playwright/test";
import { GamePage } from "./fixtures/gamePage";
import { dragPieceToBoard } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";

/** Piece 4 (violet S-shape) - 5 filled cells. Matches drag-drop.spec.ts. */
const PIECE_ID = 4;
const PIECE_CAROUSEL_INDEX = 3;
const PIECE_CELL_COUNT = 5;

// Each layout wires its own toolbar buttons, so this flow runs on all of them.
test("Undo brings the board back after Reset, and Redo clears it again", async ({ page }, testInfo) => {
    const layout = layoutFromProject(testInfo.project.name);
    await mockApiRoutes(page);
    await clearStorage(page);
    await mockDate(page, new Date(2024, 0, 1));
    const game = new GamePage(page, layout);
    await game.goto();

    if (layout !== "desktop") {
        await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
    }
    await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
    await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);

    await page.getByRole("button", { name: "Redo" }).click();
    await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);
});
