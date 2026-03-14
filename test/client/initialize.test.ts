import { initializeBoard, initializePieces } from "../../src/common/initialize";
import type { PuzzleDate } from "../../src/common/types";
import { MONTHS } from "../../src/common/consts";

describe("initializeBoard", () => {
    const testDate: PuzzleDate = { month: 0, day: 1 }; // January 1st

    it("should create a 7x7 board", () => {
        const board = initializeBoard(testDate);
        expect(board.length).toBe(7);
        board.forEach(row => expect(row.length).toBe(7));
    });

    it("should highlight exactly 2 cells for a given date", () => {
        const board = initializeBoard(testDate);
        const highlighted = board.flat().filter(cell => cell.isHighlighted);
        expect(highlighted.length).toBe(2);
    });

    it("should highlight the correct month cell for January", () => {
        const board = initializeBoard({ month: 0, day: 15 });
        // January is month index 0, which is row 0, col 0
        expect(board[0][0].isHighlighted).toBe(true);
        expect(board[0][0].content).toBe("Jan");
    });

    it("should highlight the correct month cell for December", () => {
        const board = initializeBoard({ month: 11, day: 15 });
        // December is month index 11, which is row 1, col 5
        expect(board[1][5].isHighlighted).toBe(true);
        expect(board[1][5].content).toBe("Dec");
    });

    it("should highlight the correct day cell", () => {
        const board = initializeBoard({ month: 0, day: 15 });
        // Day 15 is in row 4 (index 2 + 2 = 4), col 0
        expect(board[4][0].isHighlighted).toBe(true);
        expect(board[4][0].content).toBe("15");
    });

    it("should mark non-playable cells correctly for row 0, col 6", () => {
        const board = initializeBoard(testDate);
        expect(board[0][6].isPlayable).toBe(false);
    });

    it("should mark non-playable cells correctly for row 1, col 6", () => {
        const board = initializeBoard(testDate);
        expect(board[1][6].isPlayable).toBe(false);
    });

    it("should mark non-playable cells in row 6 cols 3-6", () => {
        const board = initializeBoard(testDate);
        expect(board[6][3].isPlayable).toBe(false);
        expect(board[6][4].isPlayable).toBe(false);
        expect(board[6][5].isPlayable).toBe(false);
        expect(board[6][6].isPlayable).toBe(false);
    });

    it("should have playable cells in row 6 cols 0-2 (days 29-31)", () => {
        const board = initializeBoard(testDate);
        expect(board[6][0].isPlayable).toBe(true);
        expect(board[6][1].isPlayable).toBe(true);
        expect(board[6][2].isPlayable).toBe(true);
    });

    it("should contain all 12 month labels", () => {
        const board = initializeBoard(testDate);
        const monthCells = [
            board[0][0], board[0][1], board[0][2], board[0][3], board[0][4], board[0][5],
            board[1][0], board[1][1], board[1][2], board[1][3], board[1][4], board[1][5]
        ];
        const labels = monthCells.map(c => c.content);
        expect(labels).toEqual(MONTHS);
    });

    it("should contain day numbers 1-31", () => {
        const board = initializeBoard(testDate);
        const dayNumbers: number[] = [];
        for (let y = 2; y <= 6; y++) {
            for (let x = 0; x < 7; x++) {
                if (board[y][x].isPlayable) {
                    dayNumbers.push(parseInt(board[y][x].content));
                }
            }
        }
        expect(dayNumbers).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    });

    it("should mark all month cells as playable", () => {
        const board = initializeBoard(testDate);
        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 6; x++) {
                expect(board[y][x].isPlayable).toBe(true);
            }
        }
    });
});

describe("initializePieces", () => {
    it("should return 8 pieces", () => {
        const pieces = initializePieces();
        expect(pieces.length).toBe(8);
    });

    it("should have IDs 1-8", () => {
        const pieces = initializePieces();
        expect(pieces.map(p => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("should have all pieces with null position", () => {
        const pieces = initializePieces();
        pieces.forEach(p => expect(p.position).toBeNull());
    });

    it("should have all pieces with 0 rotation", () => {
        const pieces = initializePieces();
        pieces.forEach(p => expect(p.rotation).toBe(0));
    });

    it("should have all pieces with no flips", () => {
        const pieces = initializePieces();
        pieces.forEach(p => {
            expect(p.isFlippedH).toBe(false);
            expect(p.isFlippedV).toBe(false);
        });
    });
});
