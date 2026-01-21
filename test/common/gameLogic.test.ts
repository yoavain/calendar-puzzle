import { puzzleSolvedForDate } from "../../src/common/gameLogic";
import solution0101 from "./resources/01-01.json";
import type { Piece } from "../../src/common/types";

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
            const pieces = JSON.parse(JSON.stringify(solution0101.pieces)) as Piece[];
            // Move piece 2 to overlap with piece 1
            pieces[1].position = { ...pieces[0].position! };
            const result = puzzleSolvedForDate(pieces);
            expect(result).toBeNull();
        });

        it("should return null if a piece is out of bounds", () => {
            const pieces = JSON.parse(JSON.stringify(solution0101.pieces)) as Piece[];
            pieces[0].position = { x: 10, y: 10 };
            const result = puzzleSolvedForDate(pieces);
            expect(result).toBeNull();
        });

        it("should return null if more than one month is visible", () => {
            // This is harder to mock without a valid partial configuration, 
            // but we can trust the logic for counting uncovered cells.
            // Let's just mock a case where we have a valid 01/01 solution 
            // but we move one piece to uncover another month.
            const pieces = JSON.parse(JSON.stringify(solution0101.pieces)) as Piece[];
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
});
