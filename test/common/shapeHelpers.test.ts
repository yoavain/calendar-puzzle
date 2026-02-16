import { findFirstFilledCell, findNearestFilledCell, findFirstFilledCellOfPiece } from "../../src/common/utils/shapeHelpers";
import type { Piece } from "../../src/common/types";

describe("shapeHelpers", () => {
    describe("findFirstFilledCell", () => {
        it("should return (0,0) when first cell is filled", () => {
            const shape = [
                [true, false],
                [false, true]
            ];
            expect(findFirstFilledCell(shape)).toEqual({ x: 0, y: 0 });
        });

        it("should return correct position when first filled cell is not at origin", () => {
            const shape = [
                [false, false],
                [false, true]
            ];
            expect(findFirstFilledCell(shape)).toEqual({ x: 1, y: 1 });
        });

        it("should return {0,0} for all-false shape", () => {
            const shape = [
                [false, false],
                [false, false]
            ];
            expect(findFirstFilledCell(shape)).toEqual({ x: 0, y: 0 });
        });

        it("should handle single-cell shape", () => {
            expect(findFirstFilledCell([[true]])).toEqual({ x: 0, y: 0 });
            expect(findFirstFilledCell([[false]])).toEqual({ x: 0, y: 0 });
        });

        it("should scan left-to-right, top-to-bottom", () => {
            const shape = [
                [false, true, false],
                [true, false, false]
            ];
            // (1,0) comes before (0,1) in scan order
            expect(findFirstFilledCell(shape)).toEqual({ x: 1, y: 0 });
        });
    });

    describe("findNearestFilledCell", () => {
        it("should return same cell when starting from a filled cell (distance 0)", () => {
            const shape = [
                [true, false],
                [false, true]
            ];
            expect(findNearestFilledCell(shape, 0, 0)).toEqual({ x: 0, y: 0 });
        });

        it("should find nearest filled cell from adjacent empty cell", () => {
            const shape = [
                [false, true],
                [false, false]
            ];
            expect(findNearestFilledCell(shape, 0, 0)).toEqual({ x: 1, y: 0 });
        });

        it("should break ties by top-left preference (scan order)", () => {
            // Two equidistant cells: (0,0) and (2,0), starting from (1,0)
            const shape = [
                [true, false, true]
            ];
            const result = findNearestFilledCell(shape, 1, 0);
            // Both are distance 1, but (0,0) is scanned first
            expect(result).toEqual({ x: 0, y: 0 });
        });

        it("should return null for all-false shape", () => {
            const shape = [
                [false, false],
                [false, false]
            ];
            expect(findNearestFilledCell(shape, 0, 0)).toBeNull();
        });

        it("should handle coordinates outside shape bounds", () => {
            const shape = [
                [true, false],
                [false, true]
            ];
            // Starting from (5, 5) which is outside the 2x2 shape
            const result = findNearestFilledCell(shape, 5, 5);
            // Should still find the nearest filled cell
            expect(result).not.toBeNull();
            // (1,1) is closest at Manhattan distance |5-1|+|5-1|=8
            expect(result).toEqual({ x: 1, y: 1 });
        });

        it("should pick the closer cell among multiple", () => {
            const shape = [
                [true, false, false],
                [false, false, false],
                [false, false, true]
            ];
            // From (1, 0): (0,0) is distance 1, (2,2) is distance 3
            expect(findNearestFilledCell(shape, 1, 0)).toEqual({ x: 0, y: 0 });
        });
    });

    describe("findFirstFilledCellOfPiece", () => {
        const makePiece = (overrides: Partial<Piece> = {}): Piece => ({
            id: 1,
            position: null,
            rotation: 0,
            isFlippedH: false,
            isFlippedV: false,
            ...overrides
        });

        it("should return (0,0) for piece 1 at rotation 0", () => {
            // Piece 1 shape: [T,F], [T,F], [T,T], [T,F] - first filled is (0,0)
            const result = findFirstFilledCellOfPiece(makePiece());
            expect(result).toEqual({ x: 0, y: 0 });
        });

        it("should return different result for different rotations", () => {
            // Piece 4 at rotation 0: [F,T], [F,T], [T,T], [T,F]
            // First filled cell is (1, 0)
            const result0 = findFirstFilledCellOfPiece(makePiece({ id: 4, rotation: 0 }));
            expect(result0).toEqual({ x: 1, y: 0 });

            // Piece 4 at rotation 90 - shape changes, first filled cell changes
            const result90 = findFirstFilledCellOfPiece(makePiece({ id: 4, rotation: 90 }));
            expect(result90).toEqual({ x: 0, y: 0 });
        });

        it("should delegate to findFirstFilledCell correctly", () => {
            // Piece 5: [F,T], [T,T], [T,T] - first filled is (1, 0)
            const result = findFirstFilledCellOfPiece(makePiece({ id: 5 }));
            expect(result).toEqual({ x: 1, y: 0 });
        });
    });
});
