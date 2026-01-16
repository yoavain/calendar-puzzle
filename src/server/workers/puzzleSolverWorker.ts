import {parentPort} from 'worker_threads';
import pino from 'pino';
import {Piece, PuzzleDate} from '../../common/types.js';
import {findSolution} from '../../common/puzzleSolver.js';
import {initializeBoard, initializePieces} from '../utils/gameInit.js';

const logger = pino();

// SolverRequest matches PuzzleDate structure
type SolverRequest = PuzzleDate;

interface SolverResponse {
    success: boolean;
    pieces?: Piece[];
    error?: string;
}

// Handle messages from the main thread
if (parentPort) {
    parentPort.on('message', (puzzleDate: SolverRequest) => {
        try {
            // Initialize board and pieces using PuzzleDate
            const board = initializeBoard(puzzleDate);
            const pieces = initializePieces();
            
            // Find the solution
            const solution = findSolution(board, pieces, puzzleDate);
            
            if (solution) {
                parentPort!.postMessage({
                    success: true,
                    pieces: solution.pieces
                } as SolverResponse);
            } else {
                parentPort!.postMessage({
                    success: false,
                    error: 'No solution found for the given date'
                } as SolverResponse);
            }
        } catch (error) {
            // Log error details but return generic message
            logger.error(error, 'Solver worker error');
            parentPort!.postMessage({
                success: false,
                error: 'Failed to solve puzzle'
            } as SolverResponse);
        }
    });
}
