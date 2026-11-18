import { PIECE_DATA, PIECE_IDS } from "../../src/common/pieceData";

describe("pieceData", () => {
    it("should define all 8 piece IDs", () => {
        expect(PIECE_IDS).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("each piece should have 5 or 6 filled cells", () => {
        // Calendar puzzle pieces have either 5 or 6 cells
        for (const id of PIECE_IDS) {
            const cellCount = PIECE_DATA[id].shape.flat().filter(Boolean).length;
            expect(cellCount).toBeGreaterThanOrEqual(5);
            expect(cellCount).toBeLessThanOrEqual(6);
        }
    });
});
