/**
 * Pure shape analysis utilities.
 *
 * This module contains pure functions for analyzing piece shapes.
 * These are shape-analysis functions with NO DOM dependencies.
 */


/**
 * Find the first filled cell (top-left-most) in a piece's transformed shape.
 *
 * This is used to calculate the offset for accurate drop positioning.
 * The function scans the shape from top-left to bottom-right and returns
 * the coordinates of the first filled cell.
 *
 * @param shape - A 2D boolean array representing the piece shape
 * @returns Coordinates of the first filled cell, or {0, 0} if none found
 */
export function findFirstFilledCell(shape: boolean[][]): { x: number; y: number } {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                return { x, y };
            }
        }
    }
    return { x: 0, y: 0 };
}

/**
 * When the user starts a drag from an empty (false) cell of the piece
 * grid, find the nearest filled cell to snap to.
 *
 * This prevents the drag from being cancelled when the touch lands on a
 * transparent gap between filled cells.
 *
 * Uses Manhattan distance; ties broken by top-left preference.
 *
 * @param shape - A 2D boolean array representing the piece shape
 * @param fromX - X coordinate of the starting cell
 * @param fromY - Y coordinate of the starting cell
 * @returns Coordinates of the nearest filled cell, or null if none found
 */
export function findNearestFilledCell(
    shape: boolean[][],
    fromX: number,
    fromY: number
): { x: number; y: number } | null {
    let minDist = Infinity;
    let nearest: { x: number; y: number } | null = null;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < (shape[y]?.length ?? 0); x++) {
            if (shape[y][x]) {
                const dist = Math.abs(x - fromX) + Math.abs(y - fromY);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = { x, y };
                }
            }
        }
    }
    return nearest;
}
