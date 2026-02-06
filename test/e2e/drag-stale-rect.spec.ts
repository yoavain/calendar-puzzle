import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { GamePage, type LayoutKind } from "./fixtures/gamePage";

/**
 * Regression test for stale draggable rect after CSS rotation.
 *
 * Piece rendering uses CSS `transform: rotate()` on the PieceGrid.
 * CSS transforms are visual-only and don't change layout dimensions.
 * The @dnd-kit draggable element's bounding rect retains the original
 * (pre-rotation) dimensions, creating a mismatch:
 *
 *   - Piece 1 base shape: 2-col × 4-row
 *   - After 90° CW CSS rotation: visually 4-col × 2-row
 *   - @dnd-kit draggable rect: still 2-col × 4-row
 *
 * When the user starts a drag from a filled cell that falls OUTSIDE
 * the stale 2-col rect (e.g. the leftmost or rightmost cell), the
 * cellOffset calculation produces out-of-bounds values and the drag
 * overlay is not shown. Instead, the original piece element (at 30%
 * opacity) is moved by @dnd-kit's transform, rendering behind the
 * board.
 */

const PIECE_ID = 1;
const PIECE_CAROUSEL_INDEX = 0;
const PIECE_CELL_COUNT = 5;

// ─── Helpers ──────────────────────────────────────────────────

function layoutFromProject(projectName: string | undefined): LayoutKind {
    if (projectName?.includes("portrait")) {
        return "mobile-portrait";
    }
    if (projectName?.includes("landscape")) {
        return "mobile-landscape";
    }
    return "desktop";
}

async function mockDate(page: Page, fakeDate: Date) {
    const ts = fakeDate.getTime();
    await page.addInitScript((timestamp: number) => {
        const RealDate = globalThis.Date;
        function FakeDate(this: any, ...args: any[]) {
            if (new.target) {
                if (args.length === 0) {
                    return new RealDate(timestamp);
                }
                // @ts-expect-error – spread into Date constructor
                return new RealDate(...args);
            }
            return new RealDate(timestamp).toString();
        }
        FakeDate.prototype = RealDate.prototype;
        FakeDate.now = () => timestamp;
        FakeDate.parse = RealDate.parse.bind(RealDate);
        FakeDate.UTC = RealDate.UTC.bind(RealDate);
        (globalThis as any).Date = FakeDate;
    }, ts);
}

// ─── Tests ────────────────────────────────────────────────────

test.describe("Drag stale rect – overlay position after rotation", () => {
    let game: GamePage;
    let layout: LayoutKind;

    test.beforeEach(async ({ page }, testInfo) => {
        layout = layoutFromProject(testInfo.project.name);

        // Skip non-mobile layouts — this bug only affects @dnd-kit touch drag
        test.skip(layout === "desktop", "Stale rect issue only affects mobile @dnd-kit layouts");

        await page.route("**/api/**", async (route) => {
            const url = route.request().url();
            if (url.includes("/api/auth/me")) {
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
                await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
            }
        });

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

    test("drag from outer cell after rotation: overlay must appear on top of board", async ({ page }) => {
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
        await game.goto();

        // Piece 1 is the first carousel slide — ensure it's visible
        await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        await page.waitForTimeout(500);

        // ── Take screenshot BEFORE rotation ──
        await page.screenshot({ path: `test-results/stale-rect-before-rotate-${layout}.png` });

        // ── Rotate piece 1 by 90° CW ──
        // Find the rotate button within the slide that contains piece 1.
        // We use the piece element to scope the button search, avoiding
        // Embla's DOM reordering issues.
        const pieceEl = game.carouselPiece(PIECE_ID);
        await expect(pieceEl).toBeVisible({ timeout: 5_000 });

        // The rotate button is a sibling of the PieceWrapper containing the piece.
        // Structure: CarouselSlide > PieceWrapper > DraggablePiece(piece-1)
        //            CarouselSlide > ControlsWrapper > [Rotate CW] [Rotate CCW] ...
        // So we go up to the CarouselSlide and find the rotate button within it.
        const slide = pieceEl.locator("xpath=ancestor::div[@role='listitem']");
        const rotateCWBtn = slide.locator("[aria-label='Rotate clockwise']");
        await expect(rotateCWBtn).toBeVisible({ timeout: 3_000 });
        await rotateCWBtn.click();
        await page.waitForTimeout(500);

        // ── Take screenshot AFTER rotation ──
        await page.screenshot({ path: `test-results/stale-rect-after-rotate-${layout}.png` });

        // ── Verify piece is rotated via the CSS transform ──
        const pieceRotation = await page.evaluate((pieceId) => {
            const pieceWrapper = document.querySelector(`[data-testid="carousel-piece-${pieceId}"]`);
            if (!pieceWrapper) {
                return { found: false };
            }
            // The PieceGrid is inside PieceWrapper > Piece > PieceWrapper(styled) > PieceGrid
            // Find the grid element with a CSS transform containing rotate
            const allDivs = pieceWrapper.querySelectorAll("div");
            for (const div of allDivs) {
                const transform = window.getComputedStyle(div).transform;
                if (transform && transform !== "none") {
                    const rect = div.getBoundingClientRect();
                    return {
                        found: true,
                        transform,
                        visualWidth: rect.width,
                        visualHeight: rect.height,
                        isWiderThanTall: rect.width > rect.height
                    };
                }
            }
            return { found: false };
        }, PIECE_ID);

        // After 90° CW rotation, the visual piece should be wider than tall
        expect(pieceRotation.found, "PieceGrid with CSS transform should exist").toBe(true);
        expect(pieceRotation.isWiderThanTall,
            "Rotated piece should be wider than tall. " +
            `Visual: ${pieceRotation.visualWidth?.toFixed(1)}×${pieceRotation.visualHeight?.toFixed(1)}, ` +
            `transform: ${pieceRotation.transform}`
        ).toBe(true);

        // ── Get the visual bounds of the piece grid and the draggable wrapper ──
        const rects = await page.evaluate((pieceId) => {
            const wrapper = document.querySelector(`[data-testid="carousel-piece-${pieceId}"]`) as HTMLElement;
            if (!wrapper) {
                return null;
            }
            const wrapperRect = wrapper.getBoundingClientRect();

            // Find the PieceGrid (the element with a CSS transform)
            const allDivs = wrapper.querySelectorAll("div");
            let gridRect: DOMRect | null = null;
            for (const div of allDivs) {
                const transform = window.getComputedStyle(div).transform;
                if (transform && transform !== "none") {
                    gridRect = div.getBoundingClientRect();
                    break;
                }
            }

            return {
                wrapper: { left: wrapperRect.left, top: wrapperRect.top, width: wrapperRect.width, height: wrapperRect.height },
                grid: gridRect ? { left: gridRect.left, top: gridRect.top, width: gridRect.width, height: gridRect.height } : null
            };
        }, PIECE_ID);

        expect(rects, "Should find piece wrapper and grid rects").toBeTruthy();
        expect(rects!.grid, "PieceGrid visual rect should exist").toBeTruthy();

        const gridRect = rects!.grid!;
        const wrapperRect = rects!.wrapper;

        // The grid's visual left edge should extend BEYOND the wrapper's left edge
        // (because CSS transform doesn't affect layout)
        console.log(`Wrapper rect: (${wrapperRect.left.toFixed(1)}, ${wrapperRect.top.toFixed(1)}) ${wrapperRect.width.toFixed(1)}×${wrapperRect.height.toFixed(1)}`);
        console.log(`Grid visual rect: (${gridRect.left.toFixed(1)}, ${gridRect.top.toFixed(1)}) ${gridRect.width.toFixed(1)}×${gridRect.height.toFixed(1)}`);

        // ── Get the board location ──
        const board = game.board();
        const boardBox = await board.boundingBox();
        expect(boardBox).toBeTruthy();

        // ── Drag from the LEFT-MOST cell of the VISUAL piece ──
        // This cell is OUTSIDE the wrapper's layout rect but inside the grid's visual rect.
        const dragStartX = gridRect.left + gridRect.width * 0.05; // near left edge of visual grid
        const dragStartY = gridRect.top + gridRect.height * 0.25; // middle of row 0 (the filled row)

        console.log(`Drag start: (${dragStartX.toFixed(1)}, ${dragStartY.toFixed(1)})`);
        console.log(`Wrapper left edge: ${wrapperRect.left.toFixed(1)}`);
        console.log(`Is drag start outside wrapper? ${dragStartX < wrapperRect.left}`);

        // Target: center of the board
        const targetX = boardBox!.x + boardBox!.width * 0.4;
        const targetY = boardBox!.y + boardBox!.height * 0.4;

        // ── Perform the touch drag via CDP ──
        const cdp = await page.context().newCDPSession(page);

        // 1. Touch start on the left edge of the visual piece
        await cdp.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: dragStartX, y: dragStartY }]
        });

        // 2. Hold for 300ms (exceed TouchSensor's 200ms activation delay)
        await page.waitForTimeout(300);

        // 3. Move toward the board in steps
        const steps = 12;
        for (let i = 1; i <= steps; i++) {
            const x = dragStartX + ((targetX - dragStartX) * i) / steps;
            const y = dragStartY + ((targetY - dragStartY) * i) / steps;
            await cdp.send("Input.dispatchTouchEvent", {
                type: "touchMove",
                touchPoints: [{ x, y }]
            });
            await page.waitForTimeout(20);
        }

        // Pause at the target for @dnd-kit to process
        await page.waitForTimeout(400);

        // ── Take a screenshot for visual debugging ──
        await page.screenshot({ path: `test-results/stale-rect-mid-drag-${layout}.png` });

        // ── ASSERTION 1: activePiece should NOT have been cancelled ──
        // Check that the DragOverlay has actual content (not just an empty container)
        const overlayInfo = await page.evaluate(() => {
            // Find all fixed-position elements with z-index (DragOverlay candidates)
            const fixedEls = Array.from(document.querySelectorAll<HTMLElement>("div"))
                .filter(el => {
                    const s = window.getComputedStyle(el);
                    return s.position === "fixed" && s.zIndex && parseInt(s.zIndex) > 100;
                });

            for (const el of fixedEls) {
                const hasContent = el.children.length > 0 && el.innerHTML.length > 100;
                if (hasContent) {
                    const rect = el.getBoundingClientRect();
                    return {
                        found: true,
                        hasContent: true,
                        width: rect.width,
                        height: rect.height,
                        left: rect.left,
                        top: rect.top,
                        zIndex: window.getComputedStyle(el).zIndex
                    };
                }
            }

            // Check if the original piece is being moved instead (the bug scenario)
            const originalPiece = document.querySelector("[data-testid='carousel-piece-1']") as HTMLElement;
            let originalPieceInfo = null;
            if (originalPiece) {
                const s = window.getComputedStyle(originalPiece);
                const rect = originalPiece.getBoundingClientRect();
                originalPieceInfo = {
                    opacity: s.opacity,
                    transform: s.transform,
                    top: rect.top,
                    left: rect.left
                };
            }

            return {
                found: false,
                hasContent: false,
                originalPieceInfo,
                fixedElCount: fixedEls.length
            };
        });

        console.log("Overlay info:", JSON.stringify(overlayInfo, null, 2));

        // The drag overlay MUST have content (the piece preview).
        // If it doesn't, it means our handleDragStart cancelled the drag
        // because cellOffset was out of bounds (the bug).
        expect(overlayInfo.found && overlayInfo.hasContent,
            "DragOverlay should have content during drag. " +
            `Found: ${overlayInfo.found}, hasContent: ${overlayInfo.hasContent}, ` +
            `fixedElCount: ${(overlayInfo as any).fixedElCount ?? "n/a"}. ` +
            "If false, handleDragStart likely cancelled because cellOffset was out of bounds " +
            "(stale wrapper rect vs rotated shape mismatch). " +
            `Original piece: ${JSON.stringify((overlayInfo as any).originalPieceInfo ?? {})}`
        ).toBe(true);

        // ── ASSERTION 2: Overlay should be over the board area ──
        if (overlayInfo.found) {
            const overlapX = overlayInfo.left! < boardBox!.x + boardBox!.width &&
                             overlayInfo.left! + overlayInfo.width! > boardBox!.x;
            const overlapY = overlayInfo.top! < boardBox!.y + boardBox!.height &&
                             overlayInfo.top! + overlayInfo.height! > boardBox!.y;
            expect(overlapX && overlapY,
                "DragOverlay should overlap the board area"
            ).toBe(true);
        }

        // ── ASSERTION 3: Hover preview cells on board ──
        const dragOverCells = game.dragOverCells();
        const dragOverCount = await dragOverCells.count();
        console.log(`Drag-over cell count: ${dragOverCount}`);
        expect(dragOverCount).toBe(PIECE_CELL_COUNT);

        // ── Release to complete the drag ──
        await cdp.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: []
        });
        await cdp.detach();
        await page.waitForTimeout(300);

        // ── Take post-drop screenshot ──
        await page.screenshot({ path: `test-results/stale-rect-after-drop-${layout}.png` });

        // ── Verify piece was placed on the board ──
        const placedCells = game.pieceCellsOnBoard(PIECE_ID);
        await expect(placedCells).toHaveCount(PIECE_CELL_COUNT, { timeout: 5_000 });
    });

    test("drag from empty cell after rotation: snaps to nearest filled cell", async ({ page }) => {
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
        await game.goto();

        await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
        await page.waitForTimeout(500);

        // Rotate piece 1 by 90° CW
        const pieceEl = game.carouselPiece(PIECE_ID);
        await expect(pieceEl).toBeVisible({ timeout: 5_000 });
        const slide = pieceEl.locator("xpath=ancestor::div[@role='listitem']");
        const rotateCWBtn = slide.locator("[aria-label='Rotate clockwise']");
        await expect(rotateCWBtn).toBeVisible({ timeout: 3_000 });
        await rotateCWBtn.click();
        await page.waitForTimeout(500);

        // Rotated piece 1 shape (4×2):
        //   row 0: X X X X   (all filled)
        //   row 1: . X . .   (mostly empty)
        // We'll drag from cell (0, 1) → EMPTY → should snap to nearest filled cell.

        const rects = await page.evaluate((pieceId) => {
            const wrapper = document.querySelector(`[data-testid="carousel-piece-${pieceId}"]`) as HTMLElement;
            if (!wrapper) {
                return null;
            }
            const allDivs = wrapper.querySelectorAll("div");
            for (const div of allDivs) {
                const transform = window.getComputedStyle(div).transform;
                if (transform && transform !== "none") {
                    const r = div.getBoundingClientRect();
                    return { left: r.left, top: r.top, width: r.width, height: r.height };
                }
            }
            return null;
        }, PIECE_ID);

        expect(rects, "PieceGrid visual rect should exist").toBeTruthy();
        const gridRect = rects!;

        // Touch at the BOTTOM-LEFT corner (row 1, col 0) → empty cell
        const dragStartX = gridRect.left + gridRect.width * 0.05; // col 0
        const dragStartY = gridRect.top + gridRect.height * 0.75; // row 1 (75% = middle of bottom half)

        const boardBox = await game.board().boundingBox();
        expect(boardBox).toBeTruthy();

        const targetX = boardBox!.x + boardBox!.width * 0.4;
        const targetY = boardBox!.y + boardBox!.height * 0.4;

        const cdp = await page.context().newCDPSession(page);

        await cdp.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: dragStartX, y: dragStartY }]
        });
        await page.waitForTimeout(300);

        const steps = 12;
        for (let i = 1; i <= steps; i++) {
            const x = dragStartX + ((targetX - dragStartX) * i) / steps;
            const y = dragStartY + ((targetY - dragStartY) * i) / steps;
            await cdp.send("Input.dispatchTouchEvent", {
                type: "touchMove",
                touchPoints: [{ x, y }]
            });
            await page.waitForTimeout(20);
        }
        await page.waitForTimeout(400);

        // The drag overlay must have content (snapped to nearest filled cell)
        const overlayInfo = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll<HTMLElement>("div"));
            for (const el of els) {
                const s = window.getComputedStyle(el);
                if (s.position === "fixed" && parseInt(s.zIndex) > 100 && el.children.length > 0 && el.innerHTML.length > 50) {
                    const r = el.getBoundingClientRect();
                    if (r.width > 10) {
                        return { found: true, hasContent: true };
                    }
                }
            }
            return { found: false, hasContent: false };
        });

        expect(overlayInfo.hasContent,
            "DragOverlay should have content even when starting from an empty cell (should snap to nearest filled cell)"
        ).toBe(true);

        // Hover preview cells should exist on the board
        const dragOverCells = game.dragOverCells();
        await expect(dragOverCells).toHaveCount(PIECE_CELL_COUNT, { timeout: 3_000 });

        // Release
        await cdp.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: []
        });
        await cdp.detach();
        await page.waitForTimeout(300);

        // Piece should be placed on the board
        const placedCells = game.pieceCellsOnBoard(PIECE_ID);
        await expect(placedCells).toHaveCount(PIECE_CELL_COUNT, { timeout: 5_000 });
    });
});
