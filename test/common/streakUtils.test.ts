import { calculateStreaks } from "../../src/common/streakUtils";
import type { PuzzleDate } from "../../src/common/types";

describe("streakUtils", () => {
    describe("calculateStreaks", () => {
        // Mock Date to control "today"
        beforeAll(() => {
            jest.useFakeTimers();
            // Setting "today" to Jan 23, 2026 (Friday) as per system prompt
            jest.setSystemTime(new Date(2026, 0, 23));
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
            // EXPECTED: 4 (currently fails because it doesn't wrap)
            expect(result.max).toBe(4);
        });

        it("should handle leap year transition (Feb 28 to Mar 1) even if Feb 29 is missing", () => {
            const history: PuzzleDate[] = [
                { month: 1, day: 28 },
                { month: 2, day: 1 }
            ];
            const result = calculateStreaks(history);
            // EXPECTED: 2 (currently fails because Feb 29 is day 60, Mar 1 is 61)
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
            jest.setSystemTime(new Date(2026, 0, 2));
            const history: PuzzleDate[] = [
                { month: 0, day: 2 },
                { month: 0, day: 1 },
                { month: 11, day: 31 },
                { month: 11, day: 30 }
            ];
            const result = calculateStreaks(history);
            // EXPECTED: 4 (currently fails due to no wrap-around)
            expect(result.current).toBe(4);
            // Reset to Jan 23 for other tests
            jest.setSystemTime(new Date(2026, 0, 23));
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
});
