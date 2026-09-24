import { getTransformedShape, puzzleSolvedForDate, isValidPlacement, clearPieceFromBoard, getPlacementOrder } from "../../src/common/gameLogic";
import solution0101 from "./resources/01-01.json";
import type { Board, Piece, PuzzleDate } from "../../src/common/types";
import type { PieceId } from "../../src/common/pieceData";
import { initializeBoard, initializePieces } from "../../src/common/initialize";

describe("gameLogic", () => {
    describe("puzzleSolvedForDate", () => {
        it("should return January 1st for the given piece configuration from JSON file", () => {
            // SETUP
            // Cast to Piece[] to satisfy TypeScript if the JSON structure is slightly different 
            // than the exact Piece interface (e.g. rotation being 0 instead of 0|90|180|270)
            const pieces = solution0101.pieces as Piece[];

            // ACT
            const result = puzzleSolvedForDate(pieces);

            // ASSERT
            expect(result).toEqual({ month: 0, day: 1 });
        });

        it("should return null if fewer than 8 pieces are placed", () => {
            const pieces: Piece[] = solution0101.pieces.slice(0, 7) as Piece[];
            const result = puzzleSolvedForDate(pieces);
            expect(result).toBeNull();
        });

        it("should return null if pieces overlap", () => {
            const pieces = structuredClone(solution0101.pieces) as Piece[];
            // Move piece 2 to overlap with piece 1
            pieces[1].position = { ...pieces[0].position! };
            const result = puzzleSolvedForDate(pieces);
            expect(result).toBeNull();
        });

        it("should return null if a piece is out of bounds", () => {
            const pieces = structuredClone(solution0101.pieces) as Piece[];
            pieces[0].position = { x: 10, y: 10 };
            const result = puzzleSolvedForDate(pieces);
            expect(result).toBeNull();
        });

        it("should return null if more than one month is visible", () => {
            // This is harder to mock without a valid partial configuration, 
            // but we can trust the logic for counting uncovered cells.
            // Let's just mock a case where we have a valid 01/01 solution 
            // but we move one piece to uncover another month.
            const pieces = structuredClone(solution0101.pieces) as Piece[];
            // Piece 5 is at 0,0 (rotated/flipped), covering Jan (0,0) and some others.
            // If we move it, Jan will be uncovered. If another month was already uncovered...
            // Actually, in a 8-piece solution, exactly 2 cells are uncovered.
            // If we move a piece, we either uncover more cells or overlap.
            
            // Move piece 5 away from the board
            pieces[4].position = { x: -5, y: -5 }; 
            // Now more cells are uncovered (at least 2 months or more days)
            const result = puzzleSolvedForDate(pieces);
            expect(result).toBeNull();
        });
    });

    describe("getTransformedShape", () => {
        // Piece 1 is highly asymmetric:
        // [T, F]
        // [T, F]
        // [T, T]
        // [T, F]
        const piece1Base: Piece = {
            id: 1,
            position: null,
            rotation: 0,
            isFlippedH: false,
            isFlippedV: false
        };

        const toString = (shape: boolean[][]) => shape.map(row => row.map(cell => cell ? "T" : "F").join(",")).join("\n");

        describe("Piece 1 - Rotations (No Flips)", () => {
            it("should return the original shape for 0 degrees", () => {
                const result = getTransformedShape({ ...piece1Base, rotation: 0 });
                expect(toString(result)).toBe(toString([
                    [true, false],
                    [true, false],
                    [true, true],
                    [true, false]
                ]));
            });

            it("should rotate 90 degrees clockwise", () => {
                const result = getTransformedShape({ ...piece1Base, rotation: 90 });
                expect(toString(result)).toBe(toString([
                    [true, true, true, true],
                    [false, true, false, false]
                ]));
            });

            it("should rotate 180 degrees", () => {
                const result = getTransformedShape({ ...piece1Base, rotation: 180 });
                expect(toString(result)).toBe(toString([
                    [false, true],
                    [true, true],
                    [false, true],
                    [false, true]
                ]));
            });

            it("should rotate 270 degrees clockwise", () => {
                const result = getTransformedShape({ ...piece1Base, rotation: 270 });
                expect(toString(result)).toBe(toString([
                    [false, false, true, false],
                    [true, true, true, true]
                ]));
            });
        });

        describe("Piece 1 - Flips (No Rotation)", () => {
            it("should flip horizontally", () => {
                const result = getTransformedShape({ ...piece1Base, isFlippedH: true });
                expect(toString(result)).toBe(toString([
                    [false, true],
                    [false, true],
                    [true, true],
                    [false, true]
                ]));
            });

            it("should flip vertically", () => {
                const result = getTransformedShape({ ...piece1Base, isFlippedV: true });
                expect(toString(result)).toBe(toString([
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, false]
                ]));
            });

            it("should flip both horizontally and vertically", () => {
                const result = getTransformedShape({ ...piece1Base, isFlippedH: true, isFlippedV: true });
                expect(toString(result)).toBe(toString([
                    [false, true],
                    [true, true],
                    [false, true],
                    [false, true]
                ]));
            });
        });

        describe("Piece 1 - Combinations (Rotation + Flips)", () => {
            it("should apply rotation then horizontal flip (90deg + H-Flip)", () => {
                // 90deg:
                // [T, T, T, T]
                // [F, T, F, F]
                // H-Flip (reverse each row):
                // [T, T, T, T]
                // [F, F, T, F]
                const result = getTransformedShape({ ...piece1Base, rotation: 90, isFlippedH: true });
                expect(toString(result)).toBe(toString([
                    [true, true, true, true],
                    [false, false, true, false]
                ]));
            });

            it("should apply rotation then vertical flip (90deg + V-Flip)", () => {
                // 90deg:
                // [T, T, T, T]
                // [F, T, F, F]
                // V-Flip (reverse row order):
                // [F, T, F, F]
                // [T, T, T, T]
                const result = getTransformedShape({ ...piece1Base, rotation: 90, isFlippedV: true });
                expect(toString(result)).toBe(toString([
                    [false, true, false, false],
                    [true, true, true, true]
                ]));
            });

            it("should apply all transformations (90deg + H-Flip + V-Flip)", () => {
                // 90deg:
                // [T, T, T, T]
                // [F, T, F, F]
                // H-Flip:
                // [T, T, T, T]
                // [F, F, T, F]
                // V-Flip:
                // [F, F, T, F]
                // [T, T, T, T]
                const result = getTransformedShape({ ...piece1Base, rotation: 90, isFlippedH: true, isFlippedV: true });
                expect(toString(result)).toBe(toString([
                    [false, false, true, false],
                    [true, true, true, true]
                ]));
            });
        });

        it("should produce 8 unique transformations for Piece 1", () => {
            const shapes = new Set<string>();
            const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
            const flips = [false, true];

            for (const rotation of rotations) {
                for (const isFlippedH of flips) {
                    for (const isFlippedV of flips) {
                        const result = getTransformedShape({ ...piece1Base, rotation, isFlippedH, isFlippedV });
                        shapes.add(toString(result));
                    }
                }
            }

            expect(shapes.size).toBe(8);
        });

        it("should produce 8 unique transformations for Piece 4", () => {
            const piece4Base: Piece = {
                id: 4,
                position: null,
                rotation: 0,
                isFlippedH: false,
                isFlippedV: false
            };
            const shapes = new Set<string>();
            const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
            const flips = [false, true];

            for (const rotation of rotations) {
                for (const isFlippedH of flips) {
                    for (const isFlippedV of flips) {
                        const result = getTransformedShape({ ...piece4Base, rotation, isFlippedH, isFlippedV });
                        shapes.add(toString(result));
                    }
                }
            }

            expect(shapes.size).toBe(8);
        });

        it("should produce 4 unique transformations for Piece 3", () => {
            const piece3Base: Piece = {
                id: 3,
                position: null,
                rotation: 0,
                isFlippedH: false,
                isFlippedV: false
            };
            const shapes = new Set<string>();
            const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
            const flips = [false, true];

            for (const rotation of rotations) {
                for (const isFlippedH of flips) {
                    for (const isFlippedV of flips) {
                        const result = getTransformedShape({ ...piece3Base, rotation, isFlippedH, isFlippedV });
                        shapes.add(toString(result));
                    }
                }
            }

            expect(shapes.size).toBe(4);
        });

        it("should produce 4 unique transformations for Piece 2", () => {
            const piece2Base: Piece = {
                id: 2,
                position: null,
                rotation: 0,
                isFlippedH: false,
                isFlippedV: false
            };
            const shapes = new Set<string>();
            const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
            const flips = [false, true];

            for (const rotation of rotations) {
                for (const isFlippedH of flips) {
                    for (const isFlippedV of flips) {
                        const result = getTransformedShape({ ...piece2Base, rotation, isFlippedH, isFlippedV });
                        shapes.add(toString(result));
                    }
                }
            }

            expect(shapes.size).toBe(4);
        });

        it("should produce 8 unique transformations for Piece 5", () => {
            const piece5Base: Piece = {
                id: 5,
                position: null,
                rotation: 0,
                isFlippedH: false,
                isFlippedV: false
            };
            const shapes = new Set<string>();
            const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
            const flips = [false, true];

            for (const rotation of rotations) {
                for (const isFlippedH of flips) {
                    for (const isFlippedV of flips) {
                        const result = getTransformedShape({ ...piece5Base, rotation, isFlippedH, isFlippedV });
                        shapes.add(toString(result));
                    }
                }
            }

            expect(shapes.size).toBe(8);
        });
    });

    describe("isValidPlacement", () => {
        const testDate: PuzzleDate = { month: 0, day: 1 }; // January 1st
        let board: Board;

        const makePiece = (overrides: Partial<Piece> = {}): Piece => ({
            id: 1,
            position: null,
            rotation: 0,
            isFlippedH: false,
            isFlippedV: false,
            ...overrides
        });

        beforeEach(() => {
            board = initializeBoard(testDate);
        });

        it("should return false for null piece", () => {
            expect(isValidPlacement(board, null as unknown as Piece, { x: 0, y: 0 })).toBe(false);
        });

        it("should return false for null position", () => {
            expect(isValidPlacement(board, makePiece(), null as unknown as { x: number; y: number })).toBe(false);
        });

        it("should return true for a valid placement on empty board", () => {
            // Piece 7 is a 2x3 rectangle, place at (0, 2) which is in the day area
            const piece = makePiece({ id: 7 });
            expect(isValidPlacement(board, piece, { x: 0, y: 2 })).toBe(true);
        });

        it("should return false when piece extends beyond right boundary", () => {
            const piece = makePiece({ id: 7 }); // 2-wide piece
            expect(isValidPlacement(board, piece, { x: 6, y: 2 })).toBe(false);
        });

        it("should return false when piece extends beyond bottom boundary", () => {
            const piece = makePiece({ id: 8 }); // 4-tall piece
            expect(isValidPlacement(board, piece, { x: 0, y: 4 })).toBe(false);
        });

        it("should throw or reject when piece extends beyond left boundary (negative x)", () => {
            const piece = makePiece({ id: 7 }); // 2x3 rectangle
            // Negative x causes undefined cell access - the function doesn't guard against it
            // This documents current behavior: it throws because board[y][-1] is undefined
            expect(() => isValidPlacement(board, piece, { x: -1, y: 2 })).toThrow();
        });

        it("should return false when overlapping with another piece", () => {
            // Place piece 7 at (0, 2), mark those cells as occupied
            const shape7 = [[true, true], [true, true], [true, true]];
            for (let dy = 0; dy < shape7.length; dy++) {
                for (let dx = 0; dx < shape7[0].length; dx++) {
                    if (shape7[dy][dx]) {
                        board[2 + dy][0 + dx].isOccupied = true;
                    }
                }
            }
            // Try to place another piece overlapping
            const piece = makePiece({ id: 5 }); // piece 5 occupies some cells
            expect(isValidPlacement(board, piece, { x: 0, y: 2 })).toBe(false);
        });

        it("should return false when overlapping with highlighted cells and checkHighlight is true", () => {
            // Jan 1st highlights month=0 (row 0, col 0) and day=1 (row 2, col 0)
            // Place a piece on the highlighted month cell
            const piece = makePiece({ id: 7 }); // 2x3 rectangle
            // Position (0, 0) would cover the highlighted Jan cell
            expect(isValidPlacement(board, piece, { x: 0, y: 0 }, true)).toBe(false);
        });

        it("should allow placement on highlighted cells when checkHighlight is false", () => {
            const piece = makePiece({ id: 7 }); // 2x3 rectangle
            // Position (0, 0) covers highlighted Jan cell, but checkHighlight is false (default)
            expect(isValidPlacement(board, piece, { x: 0, y: 0 })).toBe(true);
        });

        it("should return false when placing on non-playable cells", () => {
            // Row 0, col 6 is non-playable
            // Piece 7 is a 2x3 rectangle [T,T],[T,T],[T,T]
            // At position (5, 0), it covers cols 5-6, rows 0-2
            // Col 6 in row 0 is non-playable
            const piece = makePiece({ id: 7 });
            expect(isValidPlacement(board, piece, { x: 5, y: 0 })).toBe(false);
        });

        it("should ignore own current cells when moving a piece", () => {
            // Place piece at (0, 2) and mark cells as occupied
            const piece = makePiece({ id: 7, position: { x: 0, y: 2 } });
            const shape7 = [[true, true], [true, true], [true, true]];
            for (let dy = 0; dy < shape7.length; dy++) {
                for (let dx = 0; dx < shape7[0].length; dx++) {
                    if (shape7[dy][dx]) {
                        board[2 + dy][0 + dx].isOccupied = true;
                    }
                }
            }
            // Moving to the same position should be valid (ignores own cells)
            expect(isValidPlacement(board, piece, { x: 0, y: 2 })).toBe(true);
        });

        it("should handle rotated piece placement", () => {
            // Piece 8 rotated 90 degrees becomes a 1x4 horizontal + 1 cell
            const piece = makePiece({ id: 8, rotation: 90 });
            // Should fit in the day area
            expect(isValidPlacement(board, piece, { x: 0, y: 2 })).toBe(true);
        });

        it("should return false for placement on non-playable cells in last row", () => {
            // Row 6, cols 3-6 are non-playable
            const piece = makePiece({ id: 7 }); // 2x3 rectangle
            expect(isValidPlacement(board, piece, { x: 3, y: 4 })).toBe(false);
        });
    });

    describe("clearPieceFromBoard", () => {
        const testDate: PuzzleDate = { month: 0, day: 1 };

        const makePiece = (overrides: Partial<Piece> = {}): Piece => ({
            id: 7,
            position: null,
            rotation: 0,
            isFlippedH: false,
            isFlippedV: false,
            ...overrides
        });

        it("should be a no-op when piece has null position", () => {
            const board = initializeBoard(testDate);
            const piece = makePiece();
            // Mark a cell as occupied to verify it doesn't get cleared
            board[2][0].isOccupied = true;
            clearPieceFromBoard(board, piece);
            expect(board[2][0].isOccupied).toBe(true);
        });

        it("should clear occupied cells correctly", () => {
            const board = initializeBoard(testDate);
            // Piece 7 is 2x3 rectangle, place at (0, 2)
            const piece = makePiece({ position: { x: 0, y: 2 } });
            // Mark cells as occupied
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    board[2 + dy][0 + dx].isOccupied = true;
                }
            }
            clearPieceFromBoard(board, piece);
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    expect(board[2 + dy][0 + dx].isOccupied).toBe(false);
                }
            }
        });

        it("should skip cells outside bounds without crashing", () => {
            const board = initializeBoard(testDate);
            // Place piece near edge so some cells would be outside
            const piece = makePiece({ id: 8, position: { x: 6, y: 5 } });
            // Should not throw
            expect(() => clearPieceFromBoard(board, piece)).not.toThrow();
        });

        it("should be idempotent (clearing already-clear cells)", () => {
            const board = initializeBoard(testDate);
            const piece = makePiece({ position: { x: 0, y: 2 } });
            // Don't mark cells as occupied - they're already false
            clearPieceFromBoard(board, piece);
            // All cells should still be false
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    expect(board[2 + dy][0 + dx].isOccupied).toBe(false);
                }
            }
        });
    });

    describe("getPlacementOrder", () => {
        const makePiece = (id: PieceId, position: { x: number; y: number } | null, placedSeq?: number): Piece => ({
            id,
            position,
            rotation: 0,
            isFlippedH: false,
            isFlippedV: false,
            placedSeq
        });

        it("returns an empty list when nothing is placed", () => {
            expect(getPlacementOrder(initializePieces())).toEqual([]);
        });

        it("orders placed pieces by placedSeq, oldest first", () => {
            const pieces = [
                makePiece(1, { x: 0, y: 0 }, 3),
                makePiece(2, { x: 3, y: 0 }, 1),
                makePiece(3, { x: 0, y: 4 }, 2)
            ];
            expect(getPlacementOrder(pieces)).toEqual([2, 3, 1]);
        });

        it("leaves out pieces that are off the board", () => {
            const pieces = [makePiece(1, { x: 0, y: 0 }, 1), makePiece(2, null)];
            expect(getPlacementOrder(pieces)).toEqual([1]);
        });

        it("puts placed pieces without placedSeq first, by id (old sessions, revealed solutions)", () => {
            const pieces = [
                makePiece(5, { x: 0, y: 0 }, 2),
                makePiece(3, { x: 3, y: 0 }),
                makePiece(1, { x: 0, y: 4 })
            ];
            expect(getPlacementOrder(pieces)).toEqual([1, 3, 5]);
        });

        it("does not reorder the input array", () => {
            const pieces = [makePiece(2, { x: 0, y: 0 }, 2), makePiece(1, { x: 3, y: 0 }, 1)];
            getPlacementOrder(pieces);
            expect(pieces.map(p => p.id)).toEqual([2, 1]);
        });
    });
});
