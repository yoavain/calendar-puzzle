import type { PuzzleDate } from "./types.js";

/**
 * Maps a PuzzleDate to a day of year (1-366).
 * Feb 29 is always day 60.
 */
export const getDayOfYear = (d: PuzzleDate): number => {
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let day = d.day;
    for (let i = 0; i < d.month; i++) {
        day += daysInMonth[i];
    }
    return day;
};

export const calculateStreaks = (history: PuzzleDate[]) => {
    if (history.length === 0) {
        return { current: 0, max: 0 };
    }

    // Convert to absolute day of year for easier streak calculation
    // Note: This is a simplified version that doesn't account for years/leap years perfectly
    // but works for the current month/day structure.
    const getDayOfYearInternal = (d: PuzzleDate) => {
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let day = d.day;
        for (let i = 0; i < d.month; i++) {
            day += daysInMonth[i];
        }
        return day;
    };

    const sortedDays = [...new Set(history.map(getDayOfYearInternal))].sort((a, b) => b - a);
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Today's day of year
    const now = new Date();
    const todayDay = getDayOfYearInternal({ month: now.getMonth(), day: now.getDate() });
    const yesterdayDay = todayDay - 1;

    // Current streak (must include today or yesterday)
    if (sortedDays[0] === todayDay || sortedDays[0] === yesterdayDay) {
        currentStreak = 1;
        for (let i = 0; i < sortedDays.length - 1; i++) {
            if (sortedDays[i] - sortedDays[i + 1] === 1) {
                currentStreak++;
            }
            else {
                break;
            }
        }
    }

    // Max streak
    if (sortedDays.length > 0) {
        tempStreak = 1;
        maxStreak = 1;
        const ascDays = [...sortedDays].sort((a, b) => a - b);
        for (let i = 0; i < ascDays.length - 1; i++) {
            if (ascDays[i + 1] - ascDays[i] === 1) {
                tempStreak++;
            }
            else {
                maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 1;
            }
        }
        maxStreak = Math.max(maxStreak, tempStreak);
    }

    return { current: currentStreak, max: maxStreak };
};
