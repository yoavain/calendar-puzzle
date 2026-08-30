import type { Locator, Page } from "@playwright/test";
import type { LayoutKind } from "../fixtures/gamePage";

// ─── Helpers ─────────────────────────────────────────────────

async function center(locator: Locator): Promise<{ x: number; y: number }> {
    const box = await locator.boundingBox();
    if (!box) {
        throw new Error("Element has no bounding box – is it visible?");
    }
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// ─── Desktop (HTML5 Drag & Drop) ─────────────────────────────

/**
 * Perform a drag using Playwright's built-in `dragTo` which fires native
 * HTML5 drag events (dragstart → dragover → drop → dragend).
 */
async function desktopDrag(from: Locator, to: Locator): Promise<void> {
    await from.dragTo(to, { force: true });
}

// ─── Mobile (Touch / @dnd-kit) ───────────────────────────────

/**
 * Simulate a touch-based drag for @dnd-kit.
 *
 * @dnd-kit's TouchSensor has a 200 ms activation delay with 5 px tolerance,
 * so we:
 *   1. Touch down on the source element.
 *   2. Hold for 250 ms without moving (exceed the 200 ms delay).
 *   3. Move incrementally to the target (multiple small steps for realism).
 *   4. Touch up at the target coordinates.
 *
 * Because @dnd-kit listens on pointer events (which are synthesised from
 * touch events in Playwright), we drive the interaction with
 * `page.touchscreen` as well as raw `dispatchEvent` for pointer events.
 */
async function mobileDrag(page: Page, from: Locator, to: Locator): Promise<void> {
    const src = await center(from);
    const dst = await center(to);

    // Use CDP Input.dispatchTouchEvent for real touch events.
    // @dnd-kit has TWO sensors: PointerSensor (distance 8px) and
    // TouchSensor (delay 200ms, tolerance 5px).  On touch-emulated
    // devices, the TouchSensor activates via `onTouchStart`.
    //
    // Sequence:
    //   1. touchStart on piece (fires touchstart → React onTouchStart → TouchSensor)
    //   2. Hold still 250ms (exceed the 200ms activation delay)
    //   3. touchMove toward target in small steps
    //   4. touchEnd to drop
    const cdp = await page.context().newCDPSession(page);

    // 1. Touch start — hold finger down on the piece
    await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: src.x, y: src.y }]
    });

    // 2. Hold still to exceed the 200ms TouchSensor activation delay
    await page.waitForTimeout(300);

    // 3. Move in small steps toward the target
    const steps = 10;
    for (let i = 1; i <= steps; i++) {  
        const x = src.x + ((dst.x - src.x) * i) / steps;
        const y = src.y + ((dst.y - src.y) * i) / steps;
        await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x, y }]
        });
        await page.waitForTimeout(20);
    }

    // Small pause so @dnd-kit processes the final position
    await page.waitForTimeout(100);

    // 4. Release — touchEnd
    await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: []
    });

    await cdp.detach();

    // Allow React state updates
    await page.waitForTimeout(200);
}

// ─── Desktop with pause ──────────────────────────────────────

/**
 * Desktop drag using in-page JavaScript to fire proper HTML5 DnD events
 * with a real DataTransfer object.  This allows React's synthetic event
 * handlers to run correctly (they need `e.dataTransfer`).
 *
 * Flow: dragstart on source → dragover steps on path → pause → drop → dragend
 */
async function desktopDragWithPause(
    page: Page,
    from: Locator,
    to: Locator,
    onMidDrag?: (pointerPos: { x: number; y: number }) => Promise<void>
): Promise<void> {
    const src = await center(from);
    const dst = await center(to);

    // 1. Fire dragstart on the source element with a real DataTransfer.
    //    The React handler (Piece.tsx handleDragStart) will call
    //    onDragStart(pieceId) and set dataTransfer data.
    await from.evaluate((el) => {
        const dt = new DataTransfer();
        const evt = new DragEvent("dragstart", {
            bubbles: true, cancelable: true, dataTransfer: dt
        });
        el.dispatchEvent(evt);
        // Persist the DataTransfer so subsequent events can reuse it.
        (window as any).__pw_dt = dt;
    });
    await page.waitForTimeout(100);

    // 2. Fire dragover events along the path toward the target.
    const steps = 5;
    for (let i = 1; i <= steps; i++) {  
        const x = src.x + ((dst.x - src.x) * i) / steps;
        const y = src.y + ((dst.y - src.y) * i) / steps;
        await page.evaluate(({ cx, cy }) => {
            const el = document.elementFromPoint(cx, cy);
            if (el) {
                const dt = (window as any).__pw_dt as DataTransfer;
                el.dispatchEvent(new DragEvent("dragover", {
                    bubbles: true, cancelable: true, clientX: cx, clientY: cy,
                    dataTransfer: dt
                }));
            }
        }, { cx: x, cy: y });
        await page.waitForTimeout(30);
    }

    // Pause at the target so the hover preview settles (React re-render)
    await page.waitForTimeout(200);

    // ── Mid-drag callback ──
    if (onMidDrag) {
        await onMidDrag(dst);
    }

    // 3. Complete the drop.
    await page.evaluate(({ cx, cy }) => {
        const dt = (window as any).__pw_dt as DataTransfer;
        const el = document.elementFromPoint(cx, cy);
        if (el) {
            el.dispatchEvent(new DragEvent("drop", {
                bubbles: true, cancelable: true, clientX: cx, clientY: cy,
                dataTransfer: dt
            }));
        }
        document.dispatchEvent(new DragEvent("dragend", {
            bubbles: true, dataTransfer: dt
        }));
        delete (window as any).__pw_dt;
    }, { cx: dst.x, cy: dst.y });

    await page.waitForTimeout(200);
}

// ─── Mobile with pause ───────────────────────────────────────

/**
 * Mobile drag with a mid-drag pause for assertions.
 * Same as `mobileDrag` but calls `onMidDrag` after reaching the target
 * and before releasing the pointer.
 */
async function mobileDragWithPause(
    page: Page,
    from: Locator,
    to: Locator,
    onMidDrag?: (pointerPos: { x: number; y: number }) => Promise<void>
): Promise<void> {
    const src = await center(from);
    const dst = await center(to);

    const cdp = await page.context().newCDPSession(page);

    // 1. Touch start
    await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: src.x, y: src.y }]
    });

    // 2. Hold to exceed 200ms TouchSensor delay
    await page.waitForTimeout(300);

    // 3. Move in small steps
    const steps = 10;
    for (let i = 1; i <= steps; i++) {  
        const x = src.x + ((dst.x - src.x) * i) / steps;
        const y = src.y + ((dst.y - src.y) * i) / steps;
        await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x, y }]
        });
        await page.waitForTimeout(20);
    }

    // Pause for @dnd-kit to process final position and React to re-render
    await page.waitForTimeout(300);

    // ── Mid-drag callback ──
    if (onMidDrag) {
        await onMidDrag(dst);
    }

    // 4. Release
    await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: []
    });

    await cdp.detach();

    // Allow React state updates
    await page.waitForTimeout(200);
}

// ─── Unified API ─────────────────────────────────────────────

/**
 * Drag one element onto another, using the appropriate strategy for the
 * current layout.
 *
 * @param page    Playwright Page instance.
 * @param from    Source locator (piece in carousel or board cell).
 * @param to      Target locator (board cell).
 * @param layout  Which layout is active.
 */
export async function dragElement(
    page: Page,
    from: Locator,
    to: Locator,
    layout: LayoutKind
): Promise<void> {
    if (layout === "desktop") {
        await desktopDrag(from, to);
    }
    else {
        await mobileDrag(page, from, to);
    }
}

/**
 * Drag a piece from the carousel / piece pool onto a specific board cell.
 *
 * @param page     Playwright Page instance.
 * @param piece    Locator for the unplaced piece.
 * @param target   Locator for the target board cell.
 * @param layout   Current layout kind.
 */
export async function dragPieceToBoard(
    page: Page,
    piece: Locator,
    target: Locator,
    layout: LayoutKind
): Promise<void> {
    await dragElement(page, piece, target, layout);
}

/**
 * Drag a piece from the carousel onto a board cell, pausing mid-drag
 * so the caller can run assertions (hover preview, pointer alignment, etc.).
 *
 * @param page       Playwright Page instance.
 * @param piece      Locator for the unplaced piece in the carousel.
 * @param target     Locator for the target board cell.
 * @param layout     Current layout kind.
 * @param onMidDrag  Async callback invoked while the piece is held over the
 *                   target. Receives the current pointer screen coordinates.
 */
export async function dragPieceToBoardWithPause(
    page: Page,
    piece: Locator,
    target: Locator,
    layout: LayoutKind,
    onMidDrag: (pointerPos: { x: number; y: number }) => Promise<void>
): Promise<void> {
    if (layout === "desktop") {
        await desktopDragWithPause(page, piece, target, onMidDrag);
    }
    else {
        await mobileDragWithPause(page, piece, target, onMidDrag);
    }
}

/**
 * Drag a placed piece from one board cell to another.
 *
 * @param page     Playwright Page instance.
 * @param fromCell Locator for the board cell to drag from.
 * @param toCell   Locator for the target board cell.
 * @param layout   Current layout kind.
 */
export async function dragBoardPiece(
    page: Page,
    fromCell: Locator,
    toCell: Locator,
    layout: LayoutKind
): Promise<void> {
    await dragElement(page, fromCell, toCell, layout);
}

/**
 * Drag a placed piece off the board (to remove it and return to carousel).
 *
 * @param page     Playwright Page instance.
 * @param fromCell Locator for the board cell to drag from.
 * @param layout   Current layout kind.
 */
export async function dragPieceOffBoard(
    page: Page,
    fromCell: Locator,
    layout: LayoutKind
): Promise<void> {
    // Move far below the board to ensure it drops outside
    const src = await center(fromCell);
    if (layout === "desktop") {
        // For desktop, drag the cell to an area well outside the board
        await fromCell.dispatchEvent("dragstart");
        await page.mouse.move(src.x, src.y + 500);
        await page.waitForTimeout(100);
        // Drop outside – the global drop handler returns piece to pile
        await page.evaluate(({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            if (el) {
                el.dispatchEvent(new DragEvent("drop", { bubbles: true, clientX: x, clientY: y }));
            }
            document.dispatchEvent(new DragEvent("dragend", { bubbles: true }));
        }, { x: src.x, y: src.y + 500 });
    }
    else {
        // Mobile: pointer drag outside the board area
        await page.mouse.move(src.x, src.y);
        await page.mouse.down();
        await page.waitForTimeout(300);
        // Move outside board
        await page.mouse.move(src.x, src.y + 500, { steps: 5 });
        await page.waitForTimeout(100);
        await page.mouse.up();
    }
    await page.waitForTimeout(200);
}
