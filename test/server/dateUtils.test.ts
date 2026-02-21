import { hashString } from "../../src/server/utils/dateUtils";

// Same logic as the private toDateKey in src/server/service/solverService.ts
const toDateKey = (month: number, day: number): string =>
    `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

describe("hashString – piece index per date", () => {
    it("maps every valid date to a piece index (0-7)", () => {
        const result: Record<string, number> = {};

        for (let month = 0; month < 12; month++) {
            for (let day = 1; day <= DAYS_IN_MONTH[month]; day++) {
                const dateKey = toDateKey(month, day);
                const pieceIndex = hashString(dateKey) % 8;
                result[dateKey] = pieceIndex;
            }
        }

        expect(result).toMatchSnapshot();
    });
});
