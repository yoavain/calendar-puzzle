import { rebuildGameState, updateBoardAndPieces } from "../../src/common/boardOperations";
import { initializeBoard } from "../../src/client/utils/initialize";
import type { Piece, PuzzleDate } from "../../src/common/types";
import { getPieceShape } from "../../src/common/pieceData";

describe("boardOperations", () => {
    const testDate: PuzzleDate = { month: 0, day: 1 }; // January 1st

    describe("rebuildGameState", () => {
        it("should create initial state with empty board when no pieces are placed", () => {
            const pieces: Piece[] = [
                {
                    id: 1,
                    position: null,
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                }
            ];

            const state = rebuildGameState(pieces, testDate, false);

            expect(state.pieces).toEqual(pieces);
            expect(state.currentDate).toEqual(testDate);
            expect(state.isSolved).toBe(false);
            expect(state.solutionRevealed).toBe(false);
            expect(state.selectedPieceId).toBe(null);
            expect(state.board).toBeDefined();

            // Verify board is not occupied except for highlighted cells
            const occupiedCells = state.board.flat().filter(cell => cell.isOccupied);
            expect(occupiedCells.length).toBe(0);
        });

        it("should reconstruct board with single placed piece", () => {
            const pieces: Piece[] = [
                {
                    id: 1,
                    position: { x: 0, y: 2 }, // Place below the month row
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                }
            ];

            const state = rebuildGameState(pieces, testDate, false);

            // Piece 1 shape (no transformation): [[T,F],[T,F],[T,T],[T,F]]
            // At position (0, 2), it should occupy: (0,2), (0,3), (0,4), (1,4), (0,5)
            expect(state.board[2][0].isOccupied).toBe(true);
            expect(state.board[3][0].isOccupied).toBe(true);
            expect(state.board[4][0].isOccupied).toBe(true);
            expect(state.board[4][1].isOccupied).toBe(true);
            expect(state.board[5][0].isOccupied).toBe(true);

            // Adjacent cells should not be occupied
            expect(state.board[2][1].isOccupied).toBe(false);
            expect(state.board[3][1].isOccupied).toBe(false);
        });

        it("should reconstruct board with multiple placed pieces", () => {
            const pieces: Piece[] = [
                {
                    id: 1,
                    position: { x: 0, y: 2 },
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                },
                {
                    id: 2,
                    position: { x: 3, y: 2 },
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                }
            ];

            const state = rebuildGameState(pieces, testDate, false);

            // Verify piece 1 occupies its cells
            expect(state.board[2][0].isOccupied).toBe(true);

            // Verify piece 2 occupies its cells
            // Piece 2 shape: [[T,T,T],[T,F,T]]
            // At position (3, 2), it should occupy: (3,2), (4,2), (5,2), (3,3), (5,3)
            expect(state.board[2][3].isOccupied).toBe(true);
            expect(state.board[2][4].isOccupied).toBe(true);
            expect(state.board[2][5].isOccupied).toBe(true);
            expect(state.board[3][3].isOccupied).toBe(true);
            expect(state.board[3][5].isOccupied).toBe(true);
        });

        it("should handle rotated pieces correctly", () => {
            const pieces: Piece[] = [
                {
                    id: 1,
                    position: { x: 0, y: 2 },
                    rotation: 90,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                }
            ];

            const state = rebuildGameState(pieces, testDate, false);

            // Piece 1 rotated 90° clockwise transforms the shape
            // Original: [[T,F],[T,F],[T,T],[T,F]] (4 rows, 2 cols)
            // After 90°: [[T,T,T,T],[F,T,F,F]] (2 rows, 4 cols)
            // At position (0, 2):
            // - Row 2: (0,2), (1,2), (2,2), (3,2) all true
            // - Row 3: only (1,3) is true
            expect(state.board[2][0].isOccupied).toBe(true);
            expect(state.board[2][1].isOccupied).toBe(true);
            expect(state.board[2][2].isOccupied).toBe(true);
            expect(state.board[2][3].isOccupied).toBe(true);
            expect(state.board[3][1].isOccupied).toBe(true);
            // Adjacent cells should not be occupied
            expect(state.board[3][0].isOccupied).toBe(false);
            expect(state.board[3][2].isOccupied).toBe(false);
        });

        it("should mark state as solved when isSolved is true", () => {
            const pieces: Piece[] = [
                {
                    id: 1,
                    position: { x: 0, y: 2 },
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                }
            ];

            const state = rebuildGameState(pieces, testDate, true);

            expect(state.isSolved).toBe(true);
        });

        it("should handle pieces that extend beyond board bounds gracefully", () => {
            const pieces: Piece[] = [
                {
                    id: 1,
                    position: { x: 6, y: 6 }, // Near bottom-right corner
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                }
            ];

            // Should not throw, but only mark cells that are within bounds
            expect(() => rebuildGameState(pieces, testDate, false)).not.toThrow();

            const state = rebuildGameState(pieces, testDate, false);

            // Only the cells within bounds should be marked
            expect(state.board[6][6].isOccupied).toBe(true);
            // Cells outside (6,7), (7,6), (7,7), etc. don't exist, so no error
        });
    });

    describe("updateBoardAndPieces", () => {
        let currentBoard: ReturnType<typeof initializeBoard>;
        let currentPieces: Piece[];

        beforeEach(() => {
            currentBoard = initializeBoard(testDate);
            currentPieces = [
                {
                    id: 1,
                    position: null,
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                },
                {
                    id: 2,
                    position: null,
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    isLocked: false
                }
            ];
        });

        it("should place a piece from null position to board", () => {
            const piece = currentPieces[0];
            const newPosition = { x: 0, y: 2 };

            const result = updateBoardAndPieces(piece, newPosition, currentBoard, currentPieces);

            // Check that the piece position is updated
            const updatedPiece = result.pieces.find(p => p.id === 1);
            expect(updatedPiece?.position).toEqual(newPosition);

            // Check that board cells are occupied
            expect(result.board[2][0].isOccupied).toBe(true);
            expect(result.board[3][0].isOccupied).toBe(true);

            // Original board should be unchanged (immutability)
            expect(currentBoard[2][0].isOccupied).toBe(false);
        });

        it("should move a piece from one position to another", () => {
            // First place the piece
            currentPieces[0].position = { x: 0, y: 2 };
            const { board: boardWithPiece } = updateBoardAndPieces(
                currentPieces[0],
                { x: 0, y: 2 },
                currentBoard,
                currentPieces
            );

            // Now move it
            const piece = { ...currentPieces[0], position: { x: 0, y: 2 } };
            const newPosition = { x: 2, y: 2 };

            const result = updateBoardAndPieces(piece, newPosition, boardWithPiece, currentPieces);

            // Old position should be cleared
            expect(result.board[2][0].isOccupied).toBe(false);
            expect(result.board[3][0].isOccupied).toBe(false);

            // New position should be occupied
            expect(result.board[2][2].isOccupied).toBe(true);
            expect(result.board[3][2].isOccupied).toBe(true);

            // Piece should have new position
            const updatedPiece = result.pieces.find(p => p.id === 1);
            expect(updatedPiece?.position).toEqual(newPosition);
        });

        it("should remove a piece from board when newPosition is null", () => {
            // First place the piece
            currentPieces[0].position = { x: 0, y: 2 };
            const { board: boardWithPiece } = updateBoardAndPieces(
                currentPieces[0],
                { x: 0, y: 2 },
                currentBoard,
                currentPieces
            );

            // Verify it's placed
            expect(boardWithPiece[2][0].isOccupied).toBe(true);

            // Now remove it
            const piece = { ...currentPieces[0], position: { x: 0, y: 2 } };
            const result = updateBoardAndPieces(piece, null, boardWithPiece, currentPieces);

            // Position should be cleared
            expect(result.board[2][0].isOccupied).toBe(false);
            expect(result.board[3][0].isOccupied).toBe(false);

            // Piece should have null position
            const updatedPiece = result.pieces.find(p => p.id === 1);
            expect(updatedPiece?.position).toBe(null);
        });

        it("should preserve transformation state when moving piece", () => {
            const piece: Piece = {
                id: 1,
                position: { x: 0, y: 2 },
                rotation: 90,
                isFlippedH: true,
                isFlippedV: false,
                isLocked: false
            };

            const newPosition = { x: 2, y: 2 };
            const result = updateBoardAndPieces(piece, newPosition, currentBoard, currentPieces);

            const updatedPiece = result.pieces.find(p => p.id === 1);
            expect(updatedPiece?.rotation).toBe(90);
            expect(updatedPiece?.isFlippedH).toBe(true);
            expect(updatedPiece?.isFlippedV).toBe(false);
            expect(updatedPiece?.isLocked).toBe(false);
        });

        it("should preserve locked state", () => {
            const piece: Piece = {
                id: 1,
                position: null,
                rotation: 0,
                isFlippedH: false,
                isFlippedV: false,
                isLocked: true // Locked piece (e.g., hint)
            };

            const newPosition = { x: 0, y: 2 };
            const result = updateBoardAndPieces(piece, newPosition, currentBoard, currentPieces);

            const updatedPiece = result.pieces.find(p => p.id === 1);
            expect(updatedPiece?.isLocked).toBe(true);
        });

        it("should not mutate original board", () => {
            const piece = currentPieces[0];
            const newPosition = { x: 0, y: 2 };

            // Store original state
            const originalCell = currentBoard[2][0].isOccupied;

            const result = updateBoardAndPieces(piece, newPosition, currentBoard, currentPieces);

            // Original board should be unchanged
            expect(currentBoard[2][0].isOccupied).toBe(originalCell);
            // New board should be updated
            expect(result.board[2][0].isOccupied).toBe(true);
            // They should be different objects
            expect(result.board).not.toBe(currentBoard);
        });

        it("should not mutate original pieces array", () => {
            const piece = currentPieces[0];
            const newPosition = { x: 0, y: 2 };

            const result = updateBoardAndPieces(piece, newPosition, currentBoard, currentPieces);

            // Original pieces should be unchanged
            expect(currentPieces[0].position).toBe(null);
            // New pieces should be updated
            expect(result.pieces[0].position).toEqual(newPosition);
            // They should be different arrays
            expect(result.pieces).not.toBe(currentPieces);
        });

        it("should only update the specified piece, not others", () => {
            // Place piece 2 first
            currentPieces[1].position = { x: 4, y: 2 };
            const { board: boardWithPiece2, pieces: piecesWithPiece2Placed } = updateBoardAndPieces(
                currentPieces[1],
                { x: 4, y: 2 },
                currentBoard,
                currentPieces
            );

            // Now update piece 1
            const piece1 = piecesWithPiece2Placed[0];
            const newPosition = { x: 0, y: 2 };
            const result = updateBoardAndPieces(piece1, newPosition, boardWithPiece2, piecesWithPiece2Placed);

            // Piece 2 should remain unchanged
            const piece2 = result.pieces.find(p => p.id === 2);
            expect(piece2?.position).toEqual({ x: 4, y: 2 });

            // Piece 2's cells should still be occupied
            expect(result.board[2][4].isOccupied).toBe(true);
        });

        it("should handle transformed piece placement correctly", () => {
            const piece: Piece = {
                id: 1,
                position: null,
                rotation: 90,
                isFlippedH: false,
                isFlippedV: false,
                isLocked: false
            };

            const newPosition = { x: 0, y: 2 };
            const result = updateBoardAndPieces(piece, newPosition, currentBoard, currentPieces);

            // Piece 1 rotated 90° should occupy different cells than base shape
            expect(result.board[2][0].isOccupied).toBe(true);
            expect(result.board[2][1].isOccupied).toBe(true);
            expect(result.board[2][2].isOccupied).toBe(true);
            expect(result.board[2][3].isOccupied).toBe(true);
        });
    });
});
