import { toPuzzleDate } from "../../src/common/types";

describe("toPuzzleDate", () => {
    it("should convert January 1 correctly", () => {
        const date = new Date(2025, 0, 1); // January 1
        expect(toPuzzleDate(date)).toEqual({ month: 0, day: 1 });
    });

    it("should convert December 31 correctly", () => {
        const date = new Date(2025, 11, 31); // December 31
        expect(toPuzzleDate(date)).toEqual({ month: 11, day: 31 });
    });

    it("should convert Feb 29 (leap year) correctly", () => {
        const date = new Date(2024, 1, 29); // Feb 29, 2024 is a leap year
        expect(toPuzzleDate(date)).toEqual({ month: 1, day: 29 });
    });

    it("should convert a mid-year date correctly", () => {
        const date = new Date(2025, 5, 15); // June 15
        expect(toPuzzleDate(date)).toEqual({ month: 5, day: 15 });
    });
});
