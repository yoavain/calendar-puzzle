import { test, expect } from "@playwright/test";
import { GamePage } from "./fixtures/gamePage";
import { dragPieceToBoard } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes } from "./helpers/testUtils";

/** Piece 4 (violet S-shape) - 5 filled cells. Matches drag-drop.spec.ts. */
const PIECE_ID = 4;
const PIECE_CELL_COUNT = 5;

// No clearStorage here: it runs on every load, and this test depends on what
// survives a reload. Each test already starts in a new, empty browser context.
test("the goal sentence shows until the first piece lands, and stays gone after a reload", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The flag is shared by all layouts");

    const layout = layoutFromProject(testInfo.project.name);
    await mockDate(page, new Date(2024, 0, 1));
    await mockApiRoutes(page);
    const game = new GamePage(page, layout);
    await game.goto();

    const hint = page.getByTestId("goal-hint");
    await expect(hint).toBeVisible();

    const before = await game.board().boundingBox();
    await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
    await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
    await expect(hint).toBeHidden();

    // The board must not jump under the piece that just landed.
    const after = await game.board().boundingBox();
    expect(after?.x).toBeCloseTo(before?.x ?? 0, 0);
    expect(after?.y).toBeCloseTo(before?.y ?? 0, 0);
    expect(after?.width).toBeCloseTo(before?.width ?? 0, 0);

    await page.reload();
    await page.waitForSelector("[data-testid='board']");
    await expect(hint).toHaveCount(0);
});
