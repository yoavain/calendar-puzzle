import type { Board, Piece } from '../../src/types/types';
import { initializeBoard, initializePieces } from '../../src/utils/initialize';
import { isPuzzleSolved } from '../../src/utils/gameLogic';
import { findSolution } from '../../src/utils/puzzleSolver';

describe('puzzleSolverWorker', () => {
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