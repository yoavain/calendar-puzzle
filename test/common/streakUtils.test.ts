import { calculateStreaks, getDayOfYear, isConsecutive, findLastUnsolvedDate } from "../../src/common/streakUtils";
import type { PuzzleDate } from "../../src/common/types";

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
});
