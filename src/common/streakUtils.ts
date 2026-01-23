import type { PuzzleDate } from "./types.js";

/**
 * Helper to check if two day-of-year values are consecutive in a year-independent calendar.
 * Handles:
 * 1. Standard consecutive days (d1 - d2 === 1)
 * 2. Year wrap-around (Jan 1 is consecutive to Dec 31)
 * 3. Leap year transition (Mar 1 is consecutive to Feb 28, skipping Feb 29)
 * 
 * @param d1 The later day (1-366)
 * @param d2 The earlier day (1-366)
 */
export const isConsecutive = (d1: number, d2: number): boolean => {
    if (d1 === d2) {
        return false;
    }
    
    // Standard consecutive
    if (d1 - d2 === 1) {
        return true;
    }
    
    // Year wrap-around: Jan 1 (1) follows Dec 31 (366)
    if (d1 === 1 && d2 === 366) {
        return true;
    }
    
    // Leap year transition: Mar 1 (61) follows Feb 28 (59)
    // We give the user the benefit of the doubt and treat them as consecutive
    if (d1 === 61 && d2 === 59) {
        return true;
    }
    
    return false;
};

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

/**
 * Returns the day of year for "yesterday" in a year-independent calendar.
 * Handles the special leap year benefit of doubt (Mar 1 -> Feb 28).
 */
const getYesterday = (day: number): number => {
    if (day === 1) {
        return 366;
    }
    if (day === 61) {
        return 59;
    } // Skip Feb 29 benefit of doubt
    return day - 1;
};

export const calculateStreaks = (history: PuzzleDate[]) => {
    if (history.length === 0) {
        return { current: 0, max: 0 };
    }

    const uniqueDays = Array.from(new Set(history.map(getDayOfYear))).sort((a, b) => a - b);
    
    // If user has all possible dates, streak is 366
    if (uniqueDays.length === 366) {
        return { current: 366, max: 366 };
    }

    // Max Streak Calculation with wrap-around
    let maxStreak = 0;
    if (uniqueDays.length > 0) {
        let currentMax = 1;
        let streaks: { start: number, end: number, length: number }[] = [];
        let currentStart = uniqueDays[0];
        
        for (let i = 0; i < uniqueDays.length - 1; i++) {
            if (isConsecutive(uniqueDays[i + 1], uniqueDays[i])) {
                currentMax++;
            }
            else {
                streaks.push({ start: currentStart, end: uniqueDays[i], length: currentMax });
                currentStart = uniqueDays[i + 1];
                currentMax = 1;
            }
        }
        streaks.push({ start: currentStart, end: uniqueDays[uniqueDays.length - 1], length: currentMax });

        // Check if we can merge the last and first streak (wrap-around)
        if (streaks.length > 1 && isConsecutive(streaks[0].start, streaks[streaks.length - 1].end)) {
            const mergedLength = streaks[0].length + streaks[streaks.length - 1].length;
            maxStreak = Math.max(...streaks.map(s => s.length), mergedLength);
        }
        else {
            maxStreak = Math.max(...streaks.map(s => s.length));
        }
    }

    // Current Streak Calculation
    let currentStreak = 0;
    const now = new Date();
    const todayDay = getDayOfYear({ month: now.getMonth(), day: now.getDate() });
    
    const daySet = new Set(uniqueDays);
    let checkDay: number | null = null;
    
    if (daySet.has(todayDay)) {
        checkDay = todayDay;
    }
    else if (daySet.has(getYesterday(todayDay))) {
        checkDay = getYesterday(todayDay);
    }

    if (checkDay !== null) {
        currentStreak = 1;
        let prevDay = getYesterday(checkDay);
        // We use currentStreak < 366 as a safety break
        while (daySet.has(prevDay) && currentStreak < 366) {
            currentStreak++;
            checkDay = prevDay;
            prevDay = getYesterday(checkDay);
        }
    }

    return { current: currentStreak, max: Math.min(maxStreak, 366) };
};
