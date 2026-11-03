import { test, expect } from "@playwright/test";
import { GamePage, type LayoutKind } from "./fixtures/gamePage";
import { dragPieceToBoard } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes } from "./helpers/testUtils";

/** Piece 4 (violet S-shape) - 5 filled cells. Matches drag-drop.spec.ts. */
const PIECE_ID = 4;
const PIECE_CAROUSEL_INDEX = 3;
const PIECE_CELL_COUNT = 5;

// No clearStorage here: it runs on every load, and these tests depend on what
// survives a reload. Each test already starts in a new, empty browser context.
test.describe("First-visit goal sentence", () => {
    let game: GamePage;
    let layout: LayoutKind;

    const placePiece = async (page: Parameters<typeof dragPieceToBoard>[0]) => {
        if (layout !== "desktop") {
            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        }
        await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
    };

    test.beforeEach(async ({ page }, testInfo) => {
        layout = layoutFromProject(testInfo.project.name);
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
    });

    test("shows until the first piece lands, and stays gone after a reload", async ({ page }) => {
        await mockApiRoutes(page);
        await game.goto();
        const hint = page.getByTestId("goal-hint");
        await expect(hint).toBeVisible();

        const before = await game.board().boundingBox();
        await placePiece(page);
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

    test("stays gone after a reset and a reload", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Only the flag is under test, and it is shared by all layouts");
        await mockApiRoutes(page);
        await game.goto();
        await placePiece(page);
        await page.getByRole("button", { name: "Reset" }).click();
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(0);
        await expect(page.getByTestId("goal-hint")).toBeHidden();

        await page.reload();
        await page.waitForSelector("[data-testid='board']");
        await expect(page.getByTestId("goal-hint")).toHaveCount(0);
    });

    test("does not show to a guest who returns with placed pieces and no flag", async ({ page }) => {
        await mockApiRoutes(page);
        await game.goto();
        await placePiece(page);

        // A player from before the flag existed has a session but no flag.
        await page.evaluate(() => localStorage.removeItem("puzzle:goalSeen"));
        await page.reload();
        await page.waitForSelector("[data-testid='board']");
        await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
        await expect(page.getByTestId("goal-hint")).toHaveCount(0);
    });

    test("does not show to a signed-in player with play history", async ({ page }) => {
        await mockApiRoutes(page, {
            authMe: {
                user: { id: "e2e-user", isAdmin: false },
                completedDates: [],
                playedDates: [{ month: 0, day: 2 }],
                tokenBalance: 0,
                settings: { tokenIntroSeen: true }
            }
        });
        await game.goto();
        await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
        await expect(page.getByTestId("goal-hint")).toHaveCount(0);
    });
});
