import { BOARD_WIDTH, BOARD_HEIGHT, DAYS_LAYOUT } from "./consts";

/**
 * Single source of truth for board geometry: which (x, y) cells are part of the
 * playable region. Used by both board initialization and solved-state validation
 * to avoid two independent encodings of the layout.
 */
export const isCellPlayable = (x: number, y: number): boolean => {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
        return false;
    }
    // Rows 0-1: month cells (cols 0-5)
    if (y < 2) {
        return x < 6;
    }
    // Rows 2-6: day cells, width per row defined by DAYS_LAYOUT
    const dayRowIndex = y - 2;
    return dayRowIndex < DAYS_LAYOUT.length && x < DAYS_LAYOUT[dayRowIndex].length;
};
