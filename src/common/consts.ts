// Array of month names (January = 0, December = 11)
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Maximum days in each month (using 29 for February to handle leap years in the puzzle)
export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Layout of days on the board.
 * Each row corresponds to a row on the 7x7 grid (starting from row 2).
 */
export const DAYS_LAYOUT = [
    [1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28],
    [29, 30, 31]
];

/** Total playable cells that need to be covered (41 = 12 months + 31 days - 2 highlighted) */
export const TOTAL_PLAYABLE_CELLS = 41;

/** Width of the puzzle board (number of columns). */
export const BOARD_WIDTH = 7;
/** Height of the puzzle board (number of rows). */
export const BOARD_HEIGHT = 7;

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

export const SHARE_URL = "https://calendar-puzzle.yoavain.org";