import type { Board, Piece } from '../../src/common/types';
import { isPuzzleSolved } from '../../src/common/gameLogic';
import { findSolution } from '../../src/common/puzzleSolver';
import { initializeBoard, initializePieces } from '../../src/client/utils/initialize';

describe('puzzleSolver', () => {
  describe('findSolution', () => {
    it('should find a solution for March 1st', () => {
      // SETUP
      const date = new Date(2025, 2, 1); // Month is 0-indexed, so 2 = March
      const board: Board = initializeBoard(date);
      const pieces: Piece[] = initializePieces();

      // ACT
      const solution = findSolution(board, pieces, date);

      // ASSERT
      expect(solution).not.toBeNull();
      expect(isPuzzleSolved(solution!.board, date)).toBe(true);
    });
  });
});
