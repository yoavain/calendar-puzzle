import { test, expect, type Page } from "@playwright/test";
import { GamePage } from "./fixtures/gamePage";
import { dragPieceToBoard } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";

/** Piece 4 (violet S-shape) - 5 filled cells. Matches drag-drop.spec.ts. */
const PIECE_ID = 4;
const PIECE_CAROUSEL_INDEX = 3;
const PIECE_CELL_COUNT = 5;

const activeDotIndex = (page: Page) => page.locator("[role='tab']").evaluateAll(
    (tabs) => tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true")
);

/** Swipes along the carousel axis, starting on a neighbour's hidden controls. */
const swipeToNextPiece = async (page: Page, isVertical: boolean) => {
    const box = await page.locator("[aria-roledescription='carousel']").boundingBox();
    if (!box) {
        throw new Error("The carousel has no bounding box");
    }
    // In portrait the neighbour's controls sit at the bottom right of the carousel.
    // In landscape they sit below the active slide.
    const start = isVertical
        ? { x: box.x + box.width / 2, y: box.y + box.height - 8 }
        : { x: box.x + box.width - 8, y: box.y + box.height - 30 };
    const distance = (isVertical ? box.height : box.width) * 0.6;

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    for (let i = 1; i <= 10; i++) {
        const offset = (distance * i) / 10;
        const point = isVertical ? { x: start.x, y: start.y - offset } : { x: start.x - offset, y: start.y };
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
        await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
    await page.waitForTimeout(500);
};

test("a swipe still moves the carousel, and a drag still starts after it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "Desktop has no carousel");

    const layout = layoutFromProject(testInfo.project.name);
    await mockApiRoutes(page);
    await clearStorage(page);
    await mockDate(page, new Date(2024, 0, 1));
    const game = new GamePage(page, layout);
    await game.goto();

    await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX - 1);
    expect(await activeDotIndex(page)).toBe(PIECE_CAROUSEL_INDEX - 1);

    await swipeToNextPiece(page, layout === "mobile-landscape");
    expect(await activeDotIndex(page)).toBe(PIECE_CAROUSEL_INDEX);

    await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
    await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
});
