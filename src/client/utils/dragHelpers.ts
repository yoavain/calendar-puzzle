/**
 * DOM-aware drag-and-drop utilities.
 *
 * This module contains functions that interact with the DOM for drag-and-drop operations.
 * These belong in the client layer, NOT in common (which should be pure).
 */

import type { Position } from "../../common/types";

/**
 * Find the PieceGrid's visual bounding rect within a draggable element.
 *
 * The PieceGrid uses CSS transforms (rotate / flip) that are purely visual —
 * they do NOT change the element's layout dimensions. So the wrapper div's
 * `getBoundingClientRect()` returns the pre-transform (layout) rect, which
 * can differ from the actual visual dimensions after rotation.
 *
 * This helper locates the inner CSS Grid element (display: grid) and returns
 * its `getBoundingClientRect()`, which accounts for CSS transforms and gives
 * the correct visual dimensions.
 *
 * @param containerEl - The container element to search within
 * @returns The visual rect, or null if not found
 */
export function findVisualPieceRect(
    containerEl: Element
): { left: number; top: number; width: number; height: number } | null {
    const descendants = containerEl.querySelectorAll("*");
    for (const el of descendants) {
        if (window.getComputedStyle(el).display === "grid") {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                return { left: r.left, top: r.top, width: r.width, height: r.height };
            }
        }
    }
    return null;
}

/**
 * Calculate the cell position from pointer coordinates, accounting for board scale.
 *
 * @param pointerX - Pointer X coordinate in screen space
 * @param pointerY - Pointer Y coordinate in screen space
 * @param boardElement - The board DOM element
 * @param scale - Board scale factor
 * @param cellSize - Base cell size (before scaling)
 * @param gridOrigin - Optional pre-computed origin of cell (0,0). When supplied,
 *                     the pointer is measured relative to this origin instead of
 *                     the board container edge. This is important because the
 *                     BoardContainer has padding + border that shift the grid
 *                     inward by ~1 cell.
 * @returns Cell position, or null if outside bounds
 */
export function calculateCellFromPointer(
    pointerX: number,
    pointerY: number,
    boardElement: HTMLElement,
    scale: number,
    cellSize: number,
    gridOrigin?: { left: number; top: number }
): Position | null {
    // Use the grid origin (cell 0,0 position) when available, otherwise
    // fall back to the board container rect (less accurate if padding exists).
    let originX: number;
    let originY: number;
    if (gridOrigin) {
        originX = gridOrigin.left;
        originY = gridOrigin.top;
    }
    else {
        const boardRect = boardElement.getBoundingClientRect();
        originX = boardRect.left;
        originY = boardRect.top;
    }

    // Calculate position relative to the grid origin
    const relativeX = pointerX - originX;
    const relativeY = pointerY - originY;

    // The cell size in screen pixels (scaled)
    const scaledCellSize = cellSize * scale;

    // Calculate cell coordinates
    const cellX = Math.floor(relativeX / scaledCellSize);
    const cellY = Math.floor(relativeY / scaledCellSize);

    // Validate bounds (board is 7x7 playable area)
    if (cellX < 0 || cellX > 6 || cellY < 0 || cellY > 6) {
        return null;
    }

    return { x: cellX, y: cellY };
}
