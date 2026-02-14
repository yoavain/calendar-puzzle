import type { Board, Piece, PuzzleDate } from "../../src/common/types";
import { toPuzzleDate } from "../../src/common/types";
import { puzzleSolvedForDate } from "../../src/common/gameLogic";
import { findSolution } from "../../src/common/puzzleSolver";
import { initializeBoard, initializePieces } from "../../src/client/utils/initialize";

describe("puzzleSolver", () => {
    describe("findSolution", () => {
        const solvesFor = (date: PuzzleDate) => {
            const board: Board = initializeBoard(date);
            const pieces: Piece[] = initializePieces();
            const solution = findSolution(board, pieces, date);

            expect(solution).not.toBeNull();
            const solvedDate = puzzleSolvedForDate(solution!.pieces);
            expect(solvedDate).toEqual(date);
        };

        it("should find a solution for March 1st", () => {
            solvesFor(toPuzzleDate(new Date(2025, 2, 1)));
        });

        it("should find a solution for January 1st", () => {
            solvesFor({ month: 0, day: 1 });
        });

        it("should find a solution for December 31st", () => {
            solvesFor({ month: 11, day: 31 });
        });

        it("should find a solution for February 29th", () => {
            solvesFor({ month: 1, day: 29 });
        });

        it("should find a solution for June 15th", () => {
            solvesFor({ month: 5, day: 15 });
        });
    });
});
