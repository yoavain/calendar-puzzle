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
