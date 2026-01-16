// Validate and parse MM-DD date format
export function parseDate(dateStr: string): { month: number; day: number } | null {
    const match = dateStr.match(/^(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);

    // Validate month (1-12)
    if (month < 1 || month > 12) {
        return null;
    }

    // Validate day (1-31, with month-specific validation)
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day < 1 || day > daysInMonth[month - 1]) {
        return null;
    }

    return { month, day };
}
