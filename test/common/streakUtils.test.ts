import {
    calculateStreaks,
    getDayOfYear,
    getRandomPuzzleDate,
    hasCompletedAllDates,
    isConsecutive,
    findLastUnsolvedDate
} from "../../src/common/streakUtils";
import { DAYS_IN_MONTH, TOTAL_DATES } from "../../src/common/consts";
import type { PuzzleDate } from "../../src/common/types";

/** Every date on the calendar, Jan 1 -> Dec 31. */
const allDates = (): PuzzleDate[] => {
    const dates: PuzzleDate[] = [];
    for (let month = 0; month < DAYS_IN_MONTH.length; month++) {
        for (let day = 1; day <= DAYS_IN_MONTH[month]; day++) {
            dates.push({ month, day });
        }
    }
    return dates;
};

describe("streakUtils", () => {
    describe("calculateStreaks", () => {
        // Mock Date to control "today"
        beforeAll(() => {
            jest.useFakeTimers();
            // Setting "today" to Jan 23, 2026 (Friday) as per system prompt
            jest.setSystemTime(new Date(2026, 0, 23).getTime());
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it("should return { current: 0, max: 0 } for empty history", () => {
            const result = calculateStreaks([]);
            expect(result).toEqual({ current: 0, max: 0 });
        });

        it("should calculate simple max streak correctly", () => {
            const history: PuzzleDate[] = [
                { month: 0, day: 1 },
                { month: 0, day: 2 },
                { month: 0, day: 3 }
            ];
            const result = calculateStreaks(history);
            expect(result.max).toBe(3);
        });

        it("should handle year wrap-around for max streak (Dec 31 to Jan 1)", () => {
            const history: PuzzleDate[] = [
                { month: 11, day: 30 },
                { month: 11, day: 31 },
                { month: 0, day: 1 },
                { month: 0, day: 2 }
            ];
            const result = calculateStreaks(history);
            expect(result.max).toBe(4);
        });

        it("should handle leap year transition (Feb 28 to Mar 1) even if Feb 29 is missing", () => {
            const history: PuzzleDate[] = [
                { month: 1, day: 28 },
                { month: 2, day: 1 }
            ];
            const result = calculateStreaks(history);
            expect(result.max).toBe(2);
        });

        it("should handle leap year transition correctly when Feb 29 is present", () => {
            const history: PuzzleDate[] = [
                { month: 1, day: 28 },
                { month: 1, day: 29 },
                { month: 2, day: 1 }
            ];
            const result = calculateStreaks(history);
            expect(result.max).toBe(3);
        });

        it("should cap max streak at 366", () => {
            // Create a history with all 366 days (simplified for test)
            const history: PuzzleDate[] = [];
            for (let m = 0; m < 12; m++) {
                for (let d = 1; d <= 31; d++) {
                    history.push({ month: m, day: d });
                }
            }
            // This will have more than 366 entries due to 31 days in all months
            const result = calculateStreaks(history);
            expect(result.max).toBeLessThanOrEqual(366);
        });

        it("should calculate current streak correctly (including today)", () => {
            // Today is Jan 23
            const history: PuzzleDate[] = [
                { month: 0, day: 23 },
                { month: 0, day: 22 },
                { month: 0, day: 21 }
            ];
            const result = calculateStreaks(history);
            expect(result.current).toBe(3);
        });

        it("should calculate current streak correctly (starting from yesterday)", () => {
            // Today is Jan 23, yesterday is Jan 22
            const history: PuzzleDate[] = [
                { month: 0, day: 22 },
                { month: 0, day: 21 }
            ];
            const result = calculateStreaks(history);
            expect(result.current).toBe(2);
        });

        it("should return 0 current streak if last solved was 2 days ago", () => {
            // Today is Jan 23, last solved was Jan 21
            const history: PuzzleDate[] = [
                { month: 0, day: 21 },
                { month: 0, day: 20 }
            ];
            const result = calculateStreaks(history);
            expect(result.current).toBe(0);
        });

        it("should handle circular current streak (Jan 2 to Dec 31)", () => {
            // Mock today to be Jan 2
            jest.setSystemTime(new Date(2026, 0, 2).getTime());
            const history: PuzzleDate[] = [
                { month: 0, day: 2 },
                { month: 0, day: 1 },
                { month: 11, day: 31 },
                { month: 11, day: 30 }
            ];
            const result = calculateStreaks(history);
            expect(result.current).toBe(4);
            // Reset to Jan 23 for other tests
            jest.setSystemTime(new Date(2026, 0, 23).getTime());
        });

        it("should handle end of month transition (Jan 31 to Feb 1)", () => {
            const history: PuzzleDate[] = [
                { month: 0, day: 31 },
                { month: 1, day: 1 }
            ];
            const result = calculateStreaks(history);
            expect(result.max).toBe(2);
        });

        it("should handle end of month transition for 30-day months (Apr 30 to May 1)", () => {
            const history: PuzzleDate[] = [
                { month: 3, day: 30 },
                { month: 4, day: 1 }
            ];
            const result = calculateStreaks(history);
            expect(result.max).toBe(2);
        });
    });

    describe("getDayOfYear", () => {
        it("should return 1 for January 1st", () => {
            expect(getDayOfYear({ month: 0, day: 1 })).toBe(1);
        });

        it("should return 31 for January 31st", () => {
            expect(getDayOfYear({ month: 0, day: 31 })).toBe(31);
        });

        it("should return 32 for February 1st", () => {
            expect(getDayOfYear({ month: 1, day: 1 })).toBe(32);
        });

        it("should return 59 for February 28th", () => {
            expect(getDayOfYear({ month: 1, day: 28 })).toBe(59);
        });

        it("should return 60 for February 29th", () => {
            expect(getDayOfYear({ month: 1, day: 29 })).toBe(60);
        });

        it("should return 61 for March 1st", () => {
            expect(getDayOfYear({ month: 2, day: 1 })).toBe(61);
        });

        it("should return 366 for December 31st", () => {
            expect(getDayOfYear({ month: 11, day: 31 })).toBe(366);
        });

        it("should handle each month boundary correctly", () => {
            // Cumulative days: Jan=31, Feb=29, Mar=31, Apr=30, May=31, Jun=30, Jul=31, Aug=31, Sep=30, Oct=31, Nov=30, Dec=31
            const monthStarts = [1, 32, 61, 92, 122, 153, 183, 214, 245, 275, 306, 336];
            for (let m = 0; m < 12; m++) {
                expect(getDayOfYear({ month: m, day: 1 })).toBe(monthStarts[m]);
            }
        });
    });

    describe("findLastUnsolvedDate", () => {
        it("should return the day before beforeDate when no dates are completed", () => {
            const result = findLastUnsolvedDate([], { month: 0, day: 3 });
            expect(result).toEqual({ month: 0, day: 2 }); // Jan 2
        });

        it("should skip consecutive solved dates and find the first unsolved one", () => {
            // Jan 1-5 solved, searching before Jan 6
            const completed = [
                { month: 0, day: 1 },
                { month: 0, day: 2 },
                { month: 0, day: 3 },
                { month: 0, day: 4 },
                { month: 0, day: 5 }
            ];
            const result = findLastUnsolvedDate(completed, { month: 0, day: 6 });
            // Starts at Jan 5 (solved), then Jan 4 (solved), ... Jan 1 (solved), then Dec 31 (unsolved)
            expect(result).toEqual({ month: 11, day: 31 });
        });

        it("should handle year wrap-around (Dec 31 -> Jan 1)", () => {
            // Jan 1-3 solved, Dec 31 solved, searching before Jan 4
            const completed = [
                { month: 11, day: 31 },
                { month: 0, day: 1 },
                { month: 0, day: 2 },
                { month: 0, day: 3 }
            ];
            const result = findLastUnsolvedDate(completed, { month: 0, day: 4 });
            // Jan 3 (solved), Jan 2 (solved), Jan 1 (solved), Dec 31 (solved), Dec 30 (unsolved)
            expect(result).toEqual({ month: 11, day: 30 });
        });

        it("should return Feb 29 if it is unsolved", () => {
            // Feb 28 and Mar 1 solved, searching before Mar 2
            const completed = [
                { month: 1, day: 28 },
                { month: 2, day: 1 }
            ];
            const result = findLastUnsolvedDate(completed, { month: 2, day: 2 });
            // Mar 1 (solved), Feb 29 (unsolved)
            expect(result).toEqual({ month: 1, day: 29 });
        });

        it("should return null if all 366 dates are completed", () => {
            const completed: { month: number; day: number }[] = [];
            const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            for (let m = 0; m < 12; m++) {
                for (let d = 1; d <= daysInMonth[m]; d++) {
                    completed.push({ month: m, day: d });
                }
            }
            const result = findLastUnsolvedDate(completed, { month: 5, day: 15 });
            expect(result).toBeNull();
        });

        it("should not skip beforeDate itself (only searches before it)", () => {
            // beforeDate itself is unsolved, but we should look at the day before
            const result = findLastUnsolvedDate([], { month: 5, day: 15 });
            expect(result).toEqual({ month: 5, day: 14 }); // Jun 14, not Jun 15
        });
    });

    describe("isConsecutive", () => {
        it("should return true for standard consecutive days", () => {
            expect(isConsecutive(2, 1)).toBe(true);
            expect(isConsecutive(100, 99)).toBe(true);
        });

        it("should return false for same day", () => {
            expect(isConsecutive(5, 5)).toBe(false);
        });

        it("should return false for non-consecutive days", () => {
            expect(isConsecutive(5, 3)).toBe(false);
            expect(isConsecutive(10, 7)).toBe(false);
        });

        it("should return true for year wrap-around (Jan 1 after Dec 31)", () => {
            expect(isConsecutive(1, 366)).toBe(true);
        });

        it("should return true for leap year transition (Mar 1 after Feb 28, skipping Feb 29)", () => {
            expect(isConsecutive(61, 59)).toBe(true);
        });

        it("should return false for reversed order", () => {
            expect(isConsecutive(1, 2)).toBe(false);
        });
    });

    describe("hasCompletedAllDates", () => {
        it("should return false for an empty history", () => {
            expect(hasCompletedAllDates([])).toBe(false);
        });

        it("should return true when every date is present", () => {
            expect(hasCompletedAllDates(allDates())).toBe(true);
        });

        it("should return false when one date is missing", () => {
            const oneShort = allDates().filter(d => !(d.month === 1 && d.day === 29));
            expect(oneShort).toHaveLength(TOTAL_DATES - 1);
            expect(hasCompletedAllDates(oneShort)).toBe(false);
        });

        it("should not let duplicates inflate the count", () => {
            const withDupes = allDates().slice(0, TOTAL_DATES - 1);
            expect(hasCompletedAllDates([...withDupes, ...withDupes])).toBe(false);
        });
    });

    describe("getRandomPuzzleDate", () => {
        it("should always return a valid calendar date", () => {
            for (let i = 0; i < 500; i++) {
                const date = getRandomPuzzleDate();
                expect(date.month).toBeGreaterThanOrEqual(0);
                expect(date.month).toBeLessThan(DAYS_IN_MONTH.length);
                expect(date.day).toBeGreaterThanOrEqual(1);
                expect(date.day).toBeLessThanOrEqual(DAYS_IN_MONTH[date.month]);
            }
        });

        it("should never return the excluded date", () => {
            const exclude: PuzzleDate = { month: 6, day: 25 };
            for (let i = 0; i < 1000; i++) {
                const date = getRandomPuzzleDate(exclude);
                expect(getDayOfYear(date)).not.toBe(getDayOfYear(exclude));
            }
        });

        it("should be able to reach every day of the year", () => {
            const seen = new Set<number>();
            // Deterministic sweep across the whole [0, 1) range Math.random covers.
            const spy = jest.spyOn(Math, "random");
            for (let i = 0; i < TOTAL_DATES; i++) {
                // Mid-bucket, so float rounding can't land on a neighbour.
                spy.mockReturnValue((i + 0.5) / TOTAL_DATES);
                seen.add(getDayOfYear(getRandomPuzzleDate()));
            }
            spy.mockRestore();
            expect(seen.size).toBe(TOTAL_DATES);
        });

        it("should still cover every remaining day when one is excluded", () => {
            const exclude: PuzzleDate = { month: 0, day: 1 }; // day 1
            const seen = new Set<number>();
            const spy = jest.spyOn(Math, "random");
            for (let i = 0; i < TOTAL_DATES - 1; i++) {
                spy.mockReturnValue((i + 0.5) / (TOTAL_DATES - 1));
                seen.add(getDayOfYear(getRandomPuzzleDate(exclude)));
            }
            spy.mockRestore();
            expect(seen.size).toBe(TOTAL_DATES - 1);
            expect(seen.has(1)).toBe(false);
        });
    });

    describe("findLastUnsolvedDate at full completion", () => {
        it("should return null once every date is solved", () => {
            expect(findLastUnsolvedDate(allDates(), { month: 6, day: 25 })).toBeNull();
        });

        it("should still find the single remaining gap", () => {
            const oneShort = allDates().filter(d => !(d.month === 3 && d.day === 12));
            expect(findLastUnsolvedDate(oneShort, { month: 6, day: 25 }))
                .toEqual({ month: 3, day: 12 });
        });
    });
});
