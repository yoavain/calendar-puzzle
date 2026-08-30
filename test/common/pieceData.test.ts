import { PIECE_DATA, PIECE_IDS, getPieceShape } from "../../src/common/pieceData";

describe("pieceData", () => {
    it("should define all 8 piece IDs", () => {
        expect(PIECE_IDS).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("should have PIECE_DATA entries for all 8 IDs", () => {
        for (const id of PIECE_IDS) {
            expect(PIECE_DATA[id]).toBeDefined();
            expect(PIECE_DATA[id].shape).toBeDefined();
        }
    });

    it("should have non-empty 2D boolean arrays for each shape", () => {
        for (const id of PIECE_IDS) {
            const shape = PIECE_DATA[id].shape;
            expect(shape.length).toBeGreaterThan(0);
            for (const row of shape) {
                expect(row.length).toBeGreaterThan(0);
                for (const cell of row) {
                    expect(typeof cell).toBe("boolean");
                }
            }
        }
    });

    it("should have at least one true cell in each shape", () => {
        for (const id of PIECE_IDS) {
            const hasTrueCell = PIECE_DATA[id].shape.some(row => row.some(cell => cell));
            expect(hasTrueCell).toBe(true);
        }
    });

    it("getPieceShape should return the correct shape for each ID", () => {
        for (const id of PIECE_IDS) {
            expect(getPieceShape(id)).toBe(PIECE_DATA[id].shape);
        }
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
