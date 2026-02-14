import { test, expect } from "@playwright/test";
import { GamePage, type LayoutKind } from "./fixtures/gamePage";
import { dragPieceToBoard, dragPieceToBoardWithPause } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";

// ─── Constants ───────────────────────────────────────────────

/** Piece 4 (violet S-shape) – the most asymmetric piece.  5 filled cells. */
const PIECE_ID = 4;
/** 0-based index of piece 4 in the carousel (pieces are 1–8). */
const PIECE_CAROUSEL_INDEX = 3;
const PIECE_CELL_COUNT = 5;

/**
 * Expected board cells occupied when piece 4 (rotation 0) is dropped
 * onto target cell (2, 2).
 *
 * Piece 4 shape (col, row):
 *   .X   → (1, 0)  ← firstFilledCell
 *   .X   → (1, 1)
 *   XX   → (0, 2), (1, 2)
 *   X.   → (0, 3)
 *
 * firstFilledCell = (1, 0), so:
 *   piece position = (targetX - 1, targetY - 0) = (1, 2)
 *
 * Position (1, 2) → absolute cells:
 *   (1+1, 2+0) = (2, 2)
 *   (1+1, 2+1) = (2, 3)
 *   (1+0, 2+2) = (1, 4)
 *   (1+1, 2+2) = (2, 4)
 *   (1+0, 2+3) = (1, 5)
 */
const EXPECTED_CELLS: { x: number; y: number }[] = [
    { x: 2, y: 2 },
    { x: 2, y: 3 },
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 1, y: 5 }
];

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Get the target board cell for the drag.
 *
 * - Desktop: HTML5 DnD resolves cellOffset from the initial element rect,
 *            so the piece lands relative to the drag start. Targeting (2, 2)
 *            gives hoverPosition = (2, 2).
 * - Mobile:  CDP touch events are used; cellOffset is computed from the
 *            DOM element found by querySelector at drag start. The exact
 *            cellOffset varies slightly with carousel positioning, so we
 *            target a cell in the middle of the board. The test dynamically
 *            reads the actual shadow cells.
 */
function targetCell(game: GamePage) {
    // Target cell (2, 2) on the board for all layouts. The exact hover
    // position depends on the cellOffset (which cell of the piece the
    // pointer is on). On desktop with HTML5 DnD, cellOffset yields
    // hoverPosition = (2, 2). On mobile with CDP touch, cellOffset
    // varies with carousel positioning, so the test reads shadow cells
    // dynamically.
    return game.boardCell(2, 2);
}

// ─── Tests ───────────────────────────────────────────────────

test.describe("Drag and drop – deterministic", () => {
    let game: GamePage;
    let layout: LayoutKind;

    test.beforeEach(async ({ page }, testInfo) => {
        layout = layoutFromProject(testInfo.project.name);
        await mockApiRoutes(page);
        await clearStorage(page);
    });

    // ── Happy path (Jan 1) ───────────────────────────────────

    test("drag piece 4 to center of board succeeds (Jan 1)", async ({ page }) => {
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
        await game.goto();

        // Scroll carousel to piece 4 (index 3) for mobile layouts
        if (layout !== "desktop") {
            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        }

        const piece = game.carouselPiece(PIECE_ID);
        const target = targetCell(game);

        // We'll capture the actual shadow cells during mid-drag for
        // mobile layouts (since cellOffset depends on carousel state).
        let actualShadowCells: { x: number; y: number }[] = EXPECTED_CELLS;

        await dragPieceToBoardWithPause(page, piece, target, layout, async (pointerPos) => {
            // ── DEBUG: screenshot mid-drag ─────────────────────────
            await page.screenshot({ path: `test-results/mid-drag-${layout}.png` });

            // ── STAGE 1: Pointer vs anchor cell ───────────────────
            // The pointer must be within the board bounds during drag.
            const board = game.board();
            const boardBox = await board.boundingBox();
            expect(boardBox).toBeTruthy();
            expect(pointerPos.x).toBeGreaterThanOrEqual(boardBox!.x);
            expect(pointerPos.y).toBeGreaterThanOrEqual(boardBox!.y);

            // ── STAGE 2: Hover preview matches piece shape ────────
            if (layout === "desktop") {
                // Desktop has deterministic cellOffset – check exact cells.
                await game.expectDragOverAt(EXPECTED_CELLS);
            }
            else {
                // Mobile cellOffset depends on carousel position. Verify
                // the correct NUMBER of shadow cells and capture their
                // positions for the post-drop assertion.
                const dragOverCells = game.dragOverCells();
                await expect(dragOverCells).toHaveCount(PIECE_CELL_COUNT, { timeout: 3_000 });

                // Read the actual shadow cell positions from the DOM.
                actualShadowCells = await page.$$eval(
                    "[data-drag-over='true']",
                    els => els.map(el => ({
                        x: parseInt(el.getAttribute("data-cell-x") ?? "0", 10),
                        y: parseInt(el.getAttribute("data-cell-y") ?? "0", 10)
                    }))
                );
            }

            // ── STAGE 2b: Overlay tracks the pointer smoothly ──
            // The overlay follows the finger (smooth), while the shadow snaps
            // to the nearest board cell. We verify the grabbed cell CENTER in
            // the overlay is close to the pointer (< 0.5 cells).
            // Only check on mobile — desktop uses HTML5 DnD (no @dnd-kit overlay).
            if (layout !== "desktop") {
                // Find the DragOverlay by its high z-index (9999), not the @dnd-kit
                // accessibility live region (which is also position: fixed but 1px wide).
                const overlayBox = await page.evaluate(() => {
                    const els = Array.from(document.querySelectorAll<HTMLElement>("div"));
                    for (const el of els) {
                        const s = window.getComputedStyle(el);
                        if (s.position === "fixed" && parseInt(s.zIndex) > 100 && el.children.length > 0 && el.innerHTML.length > 50) {
                            const r = el.getBoundingClientRect();
                            if (r.width > 10) {
                                return { x: r.left, y: r.top, width: r.width, height: r.height };
                            }
                        }
                    }
                    return null;
                });
                if (overlayBox) {
                    const shadowRects = await page.$$eval("[data-drag-over='true']", els =>
                        els.map(el => {
                            const r = el.getBoundingClientRect();
                            return { px: r.left, py: r.top, pw: r.width, ph: r.height };
                        })
                    );
                    if (shadowRects.length > 0) {
                        // Use board cell size as reference unit. The overlay
                        // renders cells at approximately the same scale.
                        const cellSizePx = shadowRects[0].pw;

                        // The overlay's visual cell size ≈ scaledCellSize.
                        // We can approximate from the overlay wrapper: piece 4
                        // is 2 cols × 4 rows, and the wrapper width matches
                        // the unscaled piece. The visual cell size ≈ wrapper
                        // width / cols (for untransformed pieces, the wrapper
                        // width ≈ visual width because boardScale ≈ scaledCellSize
                        // / baseCellSize). For a robust measurement, compute
                        // the visual cell height from the shadow (same scale).
                        const overlayCellSize = shadowRects[0].ph; // board cell height ≈ overlay cell size

                        // Center of grabbed cell (1, 2) in the overlay.
                        // The overlay top-left is the piece (0,0) top-left.
                        const grabbedCellCenterX = overlayBox.x + (1 + 0.5) * overlayCellSize;
                        const grabbedCellCenterY = overlayBox.y + (2 + 0.5) * overlayCellSize;

                        // The grabbed cell center should be close to the pointer
                        const pointerOffsetX = Math.abs(grabbedCellCenterX - pointerPos.x) / cellSizePx;
                        const pointerOffsetY = Math.abs(grabbedCellCenterY - pointerPos.y) / cellSizePx;

                        expect(pointerOffsetX).toBeLessThan(0.5);
                        expect(pointerOffsetY).toBeLessThan(0.5);
                    }
                }
            }
        });

        // ── STAGE 3: Final placement ─────────────────────────────
        // After drop, piece 4 should occupy exactly the expected cells.
        const pieceCells = game.pieceCellsOnBoard(PIECE_ID);
        await expect(pieceCells).toHaveCount(PIECE_CELL_COUNT, { timeout: 5_000 });
        await game.expectPieceAt(PIECE_ID, actualShadowCells);
    });

    // ── Failing path (Oct 11) ────────────────────────────────

    test("drag piece 4 to center of board blocked (Oct 11)", async ({ page }) => {
        // Mock date to Oct 11:
        //   Month "Oct" = index 9  → cell (3, 1) is highlighted
        //   Day 11 is in DAYS_LAYOUT[1][3] → cell (3, 3) is highlighted
        //
        // firstFilledCell for piece 4 = (1, 0).
        // Desktop targets cell (3, 2) → position = (3-1, 2-0) = (2, 2).
        //   Piece cells include (2+1, 2+1) = (3, 3) → collides with day 11.
        // Mobile targets cell (3, 2) as well; cellOffset varies but the
        //   piece always collides with either OCT at (3, 1) or day 11 at (3, 3).
        await mockDate(page, new Date(2024, 9, 11));

        game = new GamePage(page, layout);
        await game.goto();

        // Scroll carousel to piece 4 (index 3) for mobile layouts
        if (layout !== "desktop") {
            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        }

        const piece = game.carouselPiece(PIECE_ID);
        // Target cell (3, 2) so piece position = (2, 2) and cell (3, 3) conflicts
        const target = game.boardCell(3, 2);

        await dragPieceToBoard(page, piece, target, layout);

        // Piece should NOT be placed — day 11's cell (3, 3) is highlighted/blocked.
        const pieceCells = game.pieceCellsOnBoard(PIECE_ID);
        await expect(pieceCells).toHaveCount(0, { timeout: 5_000 });

        // Piece should still be available in the carousel / piece pool
        if (layout !== "desktop") {
            const carouselPiece = game.carouselPiece(PIECE_ID);
            await expect(carouselPiece).toBeAttached();
        }
    });
});
