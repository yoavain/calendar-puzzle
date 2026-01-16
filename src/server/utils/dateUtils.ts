import { PuzzleDate } from '../../common/types.js';

/**
 * Validate and parse MM-DD date format to PuzzleDate
 * Returns PuzzleDate with 0-indexed month (0-11) to match JavaScript Date.getMonth()
 */
export function parseDate(dateStr: string): PuzzleDate | null {
    const match = dateStr.match(/^(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const monthInput = parseInt(match[1], 10); // 1-indexed from URL
    const day = parseInt(match[2], 10);

    // Validate month (1-12 in input)
    if (monthInput < 1 || monthInput > 12) {
        return null;
    }

    // Validate day (1-31, with month-specific validation)
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day < 1 || day > daysInMonth[monthInput - 1]) {
        return null;
    }

    // Convert to 0-indexed month for PuzzleDate
    return { month: monthInput - 1, day };
}
