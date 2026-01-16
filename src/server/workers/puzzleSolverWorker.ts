import {parentPort} from 'worker_threads';
import {Piece, PuzzleDate} from '../../common/types.js';
import {findSolution} from '../../common/puzzleSolver.js';
import {initializeBoard, initializePieces} from '../utils/gameInit.js';

interface SolverRequest {
    month: number; // 0-indexed (0-11)
    day: number;   // 1-indexed (1-31)
}

interface SolverResponse {
    success: boolean;
    pieces?: Piece[];
    error?: string;
}

// Handle messages from the main thread
if (parentPort) {
    parentPort.on('message', (request: SolverRequest) => {
        try {
            const { month, day } = request;
            
            // Create the puzzle date (month is 0-indexed internally)
            const puzzleDate: PuzzleDate = { month, day };
            
            // Initialize board and pieces
            const board = initializeBoard(month, day);
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
            parentPort!.postMessage({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            } as SolverResponse);
        }
    });
}
