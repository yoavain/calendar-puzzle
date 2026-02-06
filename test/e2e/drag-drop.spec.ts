import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { GamePage, type LayoutKind } from "./fixtures/gamePage";
import { dragPieceToBoard, dragPieceToBoardWithPause } from "./helpers/dragHelpers";

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

// ─── Layout detection ────────────────────────────────────────

function layoutFromProject(projectName: string | undefined): LayoutKind {
    if (projectName?.includes("portrait")) {
        return "mobile-portrait";
    }
    if (projectName?.includes("landscape")) {
        return "mobile-landscape";
    }
    return "desktop";
}

// ─── Date mocking via addInitScript ──────────────────────────

/**
 * Mock `new Date()` and `Date.now()` to return a fixed date WITHOUT
 * interfering with setTimeout / setInterval / requestAnimationFrame.
 *
 * This is safer than `page.clock.install()` which freezes all timers
 * and breaks React rendering & @dnd-kit activation delays.
 */
async function mockDate(page: Page, fakeDate: Date) {
    const ts = fakeDate.getTime();
    await page.addInitScript((timestamp: number) => {
        const RealDate = globalThis.Date;

         
        function FakeDate(this: any, ...args: any[]) {
            if (new.target) {
                // Called with `new Date(...)`
                if (args.length === 0) {
                    return new RealDate(timestamp);
                }
                // @ts-expect-error – spread into constructor
                return new RealDate(...args);
            }
            // Called as `Date()` without new
            return new RealDate(timestamp).toString();
        }

        FakeDate.prototype = RealDate.prototype;
        FakeDate.now = () => timestamp;
        FakeDate.parse = RealDate.parse.bind(RealDate);
        FakeDate.UTC = RealDate.UTC.bind(RealDate);

         
        (globalThis as any).Date = FakeDate;
    }, ts);
}

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

        // Mock all /api/* routes so the app doesn't hit the real backend
        await page.route("**/api/**", async (route) => {
            const url = route.request().url();
            if (url.includes("/api/auth/me")) {
                // Not logged in
                await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Unauthorized" }) });
            }
            else if (url.includes("/api/auth/csrf-token")) {
                await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ csrfToken: "mock-csrf" }) });
            }
            else if (url.includes("/api/auth/public-key")) {
                await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ publicKey: "" }) });
            }
            else if (url.includes("/api/log")) {
                await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
            }
            else {
                // Fallback: 200 with empty JSON for any other API call
                await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
            }
        });

        // Clear any saved session / localStorage to prevent stale state
        await page.addInitScript(() => {
            try {
                localStorage.clear(); 
            }
            catch { /* noop */ }
            try {
                sessionStorage.clear(); 
            }
            catch { /* noop */ }
        });
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

            // ── STAGE 2b: Overlay-shadow offset must be < 0.5 cells ──
            // Only check on mobile — desktop uses HTML5 DnD (no @dnd-kit overlay).
            if (layout !== "desktop") {
                const overlayCount = await page.locator("[style*='position: fixed']").count();
                if (overlayCount > 0) {
                    const overlayBox = await page.locator("[style*='position: fixed']").first().boundingBox();
                    const shadowRects = await page.$$eval("[data-drag-over='true']", els =>
                        els.map(el => {
                            const r = el.getBoundingClientRect();
                            return { px: r.left, py: r.top, pw: r.width };
                        })
                    );
                    if (overlayBox && shadowRects.length > 0) {
                        const cellSizePx = shadowRects[0].pw; // visual cell size
                        const firstShadow = shadowRects[0];
                        // First shadow cell = piece local (1, 0) → overlay at (1*cell, 0*cell)
                        const overlayFirstCellX = overlayBox.x + 1 * cellSizePx;
                        const overlayFirstCellY = overlayBox.y + 0 * cellSizePx;
                        const offsetX = Math.abs(overlayFirstCellX - firstShadow.px) / cellSizePx;
                        const offsetY = Math.abs(overlayFirstCellY - firstShadow.py) / cellSizePx;
                        expect(offsetX).toBeLessThan(0.5);
                        expect(offsetY).toBeLessThan(0.5);
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
