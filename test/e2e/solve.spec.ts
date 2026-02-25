import type { Page, Locator } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { GamePage, type LayoutKind } from "./fixtures/gamePage";
import { dragPieceToBoard } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";
import { initializeBoard, initializePieces } from "../../src/client/utils/initialize";
import { findSolution } from "../../src/common/puzzleSolver";
import { getTransformedShape } from "../../src/common/gameLogic";
import { findFirstFilledCell } from "../../src/common/utils/shapeHelpers";
import type { PuzzleDate } from "../../src/common/types";

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Compute the number of CW-rotate-button clicks needed to reach
 * `targetRotation` from rotation 0, given the current flip state.
 *
 * The CW button adds +90 when no flips or both flips are active,
 * but adds -90 when exactly one flip is active (XOR).
 */
function computeRotationClicks(targetRotation: number, isFlippedH: boolean, isFlippedV: boolean): number {
    if (targetRotation === 0) {
        return 0;
    }
    const oneFlipActive = isFlippedH !== isFlippedV;
    return oneFlipActive
        ? ((360 - targetRotation) % 360) / 90
        : targetRotation / 90;
}

/**
 * Find the filled cell closest to the center of the piece shape.
 * Used as the touch anchor for mobile drag operations, ensuring
 * the touch point lands on a visible part of the piece (the center
 * is always visible in the carousel, unlike the top-left which may
 * be clipped by the toolbar in landscape mode).
 */
function findCenterAnchorCell(shape: boolean[][]): { x: number; y: number } {
    const shapeRows = shape.length;
    const shapeCols = shape[0].length;
    const centerRow = (shapeRows - 1) / 2;
    const centerCol = (shapeCols - 1) / 2;

    let bestCell = { x: 0, y: 0 };
    let bestDist = Infinity;
    for (let row = 0; row < shapeRows; row++) {
        for (let col = 0; col < shapeCols; col++) {
            if (!shape[row][col]) {
                continue;
            }
            const dist = Math.abs(row - centerRow) + Math.abs(col - centerCol);
            if (dist < bestDist) {
                bestDist = dist;
                bestCell = { x: col, y: row };
            }
        }
    }
    return bestCell;
}

/**
 * Mobile drag from a specific cell within the piece to a board cell.
 *
 * Unlike the generic mobileDrag (which starts from the element center),
 * this starts from a known filled cell (the anchor) of the transformed
 * piece shape. This ensures the @dnd-kit cellOffset matches the anchor,
 * making the drop position deterministic.
 *
 * The target board cell is computed as `position + anchorCell` so the
 * piece lands at the correct solver-computed position.
 */
async function mobileDragFromCell(
    page: Page,
    pieceLocator: Locator,
    shape: boolean[][],
    anchorCell: { x: number; y: number },
    game: GamePage,
    position: { x: number; y: number }
): Promise<void> {
    const pieceBox = await pieceLocator.boundingBox();
    if (!pieceBox) {
        throw new Error("Piece element has no bounding box");
    }

    // Target board cell = piece position + anchor offset
    const targetLocator = game.boardCell(position.x + anchorCell.x, position.y + anchorCell.y);
    const targetBox = await targetLocator.boundingBox();
    if (!targetBox) {
        throw new Error("Target element has no bounding box");
    }

    // The DraggablePiece div spans the full carousel slide width (~257px), but
    // DndProvider.handleDragStart uses findVisualPieceRect (the inner PieceGrid's
    // actual dimensions) for pieceCellW. Use the same reference here so the touch
    // coordinates map to the same cellOffset that DndProvider computes.
    const gridBox = await pieceLocator.locator("[data-testid='piece-grid']").boundingBox();
    const rectForCells = gridBox ?? pieceBox;

    // Compute pixel position of anchor cell center within the piece element
    const shapeCols = shape[0].length;
    const shapeRows = shape.length;
    const cellW = rectForCells.width / shapeCols;
    const cellH = rectForCells.height / shapeRows;
    const srcX = rectForCells.x + (anchorCell.x + 0.5) * cellW;
    const srcY = rectForCells.y + (anchorCell.y + 0.5) * cellH;

    // Target: center of the board cell
    const dstX = targetBox.x + targetBox.width / 2;
    const dstY = targetBox.y + targetBox.height / 2;

    const cdp = await page.context().newCDPSession(page);

    // 1. Touch start on the anchor cell of the piece
    await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: srcX, y: srcY }]
    });

    // 2. Hold still to exceed the 200ms TouchSensor activation delay
    await page.waitForTimeout(300);

    // 3. Move in small steps toward the target
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
        const x = srcX + ((dstX - srcX) * i) / steps;
        const y = srcY + ((dstY - srcY) * i) / steps;
        await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x, y }]
        });
        await page.waitForTimeout(20);
    }

    // Small pause so @dnd-kit processes the final position
    await page.waitForTimeout(200);

    // 4. Release
    await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: []
    });

    try {
        await cdp.detach();
    }
    catch { /* session may already be closed */ }

    // Allow React state updates
    await page.waitForTimeout(200);
}

/**
 * Apply rotation and flip transforms to a piece via UI controls.
 *
 * Desktop: each piece in the pool has its own PieceControls; we
 *          scope buttons to the piece's wrapper.
 * Mobile:  controls live inside the carousel slide; we scope to
 *          the slide ancestor.
 */
async function transformPiece(
    page: Page,
    game: GamePage,
    layout: LayoutKind,
    pieceId: number,
    carouselIndex: number,
    targetRotation: number,
    targetIsFlippedH: boolean,
    targetIsFlippedV: boolean
): Promise<void> {
    const noTransformNeeded = targetRotation === 0 && !targetIsFlippedH && !targetIsFlippedV;
    if (noTransformNeeded) {
        return;
    }

    if (layout === "desktop") {
        // Scope controls to the piece's PiecePoolWrapper
        const pieceEl = game.carouselPiece(pieceId);
        const wrapper = pieceEl.locator("xpath=ancestor::div[contains(@class,'PiecePoolWrapper')]");
        // Fallback: go up two levels if styled-component class doesn't match
        const container = (await wrapper.count()) > 0
            ? wrapper
            : pieceEl.locator("..");

        if (targetIsFlippedH) {
            await container.locator("[data-testid='flip-h-button']").click();
            await page.waitForTimeout(150);
        }
        if (targetIsFlippedV) {
            await container.locator("[data-testid='flip-v-button']").click();
            await page.waitForTimeout(150);
        }

        const clicks = computeRotationClicks(targetRotation, targetIsFlippedH, targetIsFlippedV);
        for (let i = 0; i < clicks; i++) {
            await container.locator("[data-testid='rotate-button']").click();
            await page.waitForTimeout(150);
        }
    }
    else {
        // Mobile: navigate carousel and use slide-local controls
        await game.scrollCarouselToPiece(carouselIndex);
        const pieceEl = game.carouselPiece(pieceId).first();
        await expect(pieceEl).toBeVisible({ timeout: 5_000 });
        const slide = pieceEl.locator("xpath=ancestor::div[@role='listitem']");

        if (targetIsFlippedH) {
            await slide.locator("[aria-label='Flip horizontal']").click();
            await page.waitForTimeout(150);
        }
        if (targetIsFlippedV) {
            await slide.locator("[aria-label='Flip vertical']").click();
            await page.waitForTimeout(150);
        }

        const clicks = computeRotationClicks(targetRotation, targetIsFlippedH, targetIsFlippedV);
        for (let i = 0; i < clicks; i++) {
            await slide.locator("[aria-label='Rotate clockwise']").click();
            await page.waitForTimeout(150);
        }
    }
}

// ─── Tests ───────────────────────────────────────────────────

test.describe("Solve puzzle via UI", () => {
    let game: GamePage;
    let layout: LayoutKind;

    test.beforeEach(async ({ page }, testInfo) => {
        layout = layoutFromProject(testInfo.project.name);
        await mockApiRoutes(page);
        await clearStorage(page);
    });

    test("solve Jan 1 puzzle end-to-end", async ({ page }) => {
        test.setTimeout(180_000); // 8 sequential piece operations can take a while

        // 1. Pick a date and run the solver in Node.js
        const puzzleDate: PuzzleDate = { month: 0, day: 1 };
        const board = initializeBoard(puzzleDate);
        const pieces = initializePieces();
        const solution = findSolution(board, pieces, puzzleDate);
        expect(solution, "Solver should find a solution for Jan 1").toBeTruthy();
        expect(solution!.isSolved).toBe(true);

        // 2. Navigate to the game
        await mockDate(page, new Date(2024, puzzleDate.month, puzzleDate.day));
        game = new GamePage(page, layout);
        await game.goto();

        // 3. For each piece, apply transforms and drag to solved position
        // Track placed piece IDs to compute correct carousel index
        const placedPieceIds: number[] = [];

        for (const solvedPiece of solution!.pieces) {
            if (solvedPiece.position === null) {
                continue;
            }

            const pieceId = solvedPiece.id;
            const { rotation, isFlippedH, isFlippedV, position } = solvedPiece;

            // The carousel only shows unplaced pieces. Compute the
            // current index of this piece in the filtered carousel.
            const carouselIndex = solution!.pieces
                .filter(p => p.position !== null)
                .filter(p => !placedPieceIds.includes(p.id))
                .sort((a, b) => a.id - b.id)
                .findIndex(p => p.id === pieceId);

            // 3a. Apply rotation/flip transforms
            await transformPiece(page, game, layout, pieceId, carouselIndex, rotation, isFlippedH, isFlippedV);

            // 3b. Compute drag target cell
            // The solver gives `position` = top-left of the transformed bounding box.
            // We drag to the cell where firstFilledCell should land.
            const shape = getTransformedShape(solvedPiece);
            const firstFilled = findFirstFilledCell(shape);
            const targetCell = {
                x: position.x + firstFilled.x,
                y: position.y + firstFilled.y
            };

            // 3c. Ensure piece is visible for drag
            if (layout !== "desktop") {
                await game.scrollCarouselToPiece(carouselIndex);
                await page.waitForTimeout(500);
            }

            // 3d. Drag piece to board
            // Use .first() because Embla loop mode can duplicate slides
            const pieceLocator = game.carouselPiece(pieceId).first();
            await expect(pieceLocator).toBeVisible({ timeout: 5_000 });

            if (layout === "desktop") {
                const targetLocator = game.boardCell(targetCell.x, targetCell.y);
                await dragPieceToBoard(page, pieceLocator, targetLocator, layout);
            }
            else {
                // Mobile: use center-most filled cell as touch anchor to avoid
                // clipping by toolbar (especially in landscape mode).
                const anchorCell = findCenterAnchorCell(shape);
                await mobileDragFromCell(page, pieceLocator, shape, anchorCell, game, position);
            }

            // 3e. Verify piece was placed
            const cellCount = shape.flat().filter(Boolean).length;
            const placedCells = game.pieceCellsOnBoard(pieceId);
            await expect(placedCells).toHaveCount(cellCount, { timeout: 5_000 });

            placedPieceIds.push(pieceId);
        }

        // 4. Assert "Puzzle Solved!" dialog appears
        await expect(page.getByText("Puzzle Solved!")).toBeVisible({ timeout: 10_000 });
    });
});
