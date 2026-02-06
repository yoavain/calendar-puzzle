import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Detected layout type, matching the app's useLayout() hook output.
 */
export type LayoutKind = "desktop" | "mobile-portrait" | "mobile-landscape";

/**
 * Page Object Model for the Calendar Puzzle game.
 *
 * Abstracts board and piece selectors and provides helpers for
 * drag-and-drop actions and assertions across all three layouts.
 */
export class GamePage {
    readonly page: Page;
    readonly layout: LayoutKind;

    constructor(page: Page, layout: LayoutKind) {
        this.page = page;
        this.layout = layout;
    }

    // ─── Navigation ──────────────────────────────────────────────

    /** Navigate to the game and wait for the board to render. */
    async goto() {
        await this.page.goto("/client/");
        await this.page.waitForSelector("[data-testid='board']", { timeout: 15_000 });
    }

    // ─── Selectors ───────────────────────────────────────────────

    /** Locate a single board cell by its grid coordinates. */
    boardCell(x: number, y: number): Locator {
        return this.page.locator(`[data-cell-x="${x}"][data-cell-y="${y}"]`);
    }

    /** Locate the board container. */
    board(): Locator {
        return this.page.locator("[data-testid='board']");
    }

    /**
     * Locate an unplaced piece in the carousel / piece pool.
     * Desktop uses `data-testid="piece-{id}"` on the Piece wrapper.
     * Mobile uses `data-testid="carousel-piece-{id}"` on the DraggablePiece wrapper.
     */
    carouselPiece(pieceId: number): Locator {
        if (this.layout === "desktop") {
            return this.page.locator(`[data-testid="piece-${pieceId}"]`);
        }
        return this.page.locator(`[data-testid="carousel-piece-${pieceId}"]`);
    }

    /**
     * Locate all board cells that belong to a specific piece (via data-piece-id).
     * Scoped to elements that also have data-cell-x/data-cell-y to exclude carousel pieces.
     */
    pieceCellsOnBoard(pieceId: number): Locator {
        return this.page.locator(`[data-cell-x][data-cell-y][data-piece-id="${pieceId}"]`);
    }

    // ─── Assertions ──────────────────────────────────────────────

    /**
     * Assert that a piece occupies the given board cells.
     * @param pieceId  The piece identifier (1-8).
     * @param cells    Array of {x, y} board coordinates that should hold the piece.
     */
    async expectPieceAt(pieceId: number, cells: { x: number; y: number }[]) {
        const checks = cells.map(({ x, y }) => {
            const cell = this.boardCell(x, y);
            return expect(cell).toHaveAttribute("data-piece-id", String(pieceId));
        });
        await Promise.all(checks);
    }

    /**
     * Assert that a board cell is empty (no piece occupying it).
     */
    async expectCellEmpty(x: number, y: number) {
        const cell = this.boardCell(x, y);
        // data-piece-id should be absent or undefined
        const attr = await cell.getAttribute("data-piece-id");
        expect(!attr).toBeTruthy();
    }

    /**
     * Assert that a board cell is occupied by any piece.
     */
    async expectCellOccupied(x: number, y: number) {
        const cell = this.boardCell(x, y);
        const attr = await cell.getAttribute("data-piece-id");
        expect(attr).toBeTruthy();
    }

    /**
     * Assert that the piece is back in the carousel (unplaced).
     */
    async expectPieceInCarousel(pieceId: number) {
        const piece = this.carouselPiece(pieceId);
        await expect(piece).toBeVisible({ timeout: 5_000 });
    }

    /**
     * Assert that no board cell has the given piece id.
     */
    async expectPieceNotOnBoard(pieceId: number) {
        const cells = this.pieceCellsOnBoard(pieceId);
        await expect(cells).toHaveCount(0);
    }

    // ─── Carousel ─────────────────────────────────────────────────

    /**
     * Scroll the piece carousel so that the piece at `pieceIndex` (0-based)
     * becomes the active slide.  Clicks the indicator dot and waits for
     * the scroll animation to settle.
     */
    async scrollCarouselToPiece(pieceIndex: number) {
        const dot = this.page.locator("[role=\"tab\"]").nth(pieceIndex);
        await dot.click({ force: true });
        await this.page.waitForTimeout(400);
    }

    // ─── Drag-over assertions ─────────────────────────────────────

    /** Locate all board cells currently showing the drag-over hover preview. */
    dragOverCells(): Locator {
        return this.page.locator("[data-drag-over=\"true\"]");
    }

    /**
     * Assert that exactly the given cells show the hover preview during a drag.
     * @param cells  Array of {x, y} board coordinates that should have `data-drag-over="true"`.
     */
    async expectDragOverAt(cells: { x: number; y: number }[]) {
        const dragCells = this.dragOverCells();
        await expect(dragCells).toHaveCount(cells.length, { timeout: 3_000 });

        const checks = cells.map(({ x, y }) => {
            const cell = this.boardCell(x, y);
            return expect(cell).toHaveAttribute("data-drag-over", "true");
        });
        await Promise.all(checks);
    }
}
