// puzzleSolverWorker.ts
import { Piece, Position, Board } from '../types/types';
import { getTransformedShape, isPuzzleSolved, isValidPlacement } from '../utils/gameLogic';
import { MONTHS } from '../utils/initialize';

interface SolverPiece extends Piece {
    tried: {
        position: Position | null;
        rotation: number;
        isFlippedH: boolean;
        isFlippedV: boolean;
    }[];
}

// Message types for worker communication
interface SolverRequest {
    board: Board;
    pieces: Piece[];
    currentDate: string; // Date serialized as ISO string
}

interface SolverResponse {
    solution: Piece[] | null;
    error?: string;
}

interface SolverMessage {
    board: Board;
    pieces: Piece[];
    currentDate: Date;
}

/**
 * Attempts to find a solution for the puzzle given the current date
 * Returns array of pieces with their solved positions and orientations
 */
function findSolution(
    initialBoard: Board,
    pieces: Piece[],
    currentDate: Date
): Piece[] | null {
    // Convert pieces to solver pieces with tracking of tried positions
    const solverPieces: SolverPiece[] = pieces.map(piece => ({
        ...piece,
        tried: []
    }));

    // Start with empty board
    const board = initialBoard.map(row => 
        row.map(cell => ({ 
            ...cell, 
            isOccupied: false // Ensure all cells start unoccupied
        }))
    );

    // Try to solve
    if (solve(board, solverPieces, currentDate)) {
        // Update the initial board with the solution
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                initialBoard[y][x].isOccupied = board[y][x].isOccupied;
            }
        }

        // Return pieces with their solved positions
        return solverPieces.map(({ id, position, rotation, isFlippedH, isFlippedV }) => ({
            id,
            position,
            rotation,
            isFlippedH,
            isFlippedV,
            shape: pieces.find(p => p.id === id)!.shape
        }));
    }

    return null;
}

/**
 * Recursive backtracking solver
 */
function solve(
    board: Board,
    remainingPieces: SolverPiece[],
    currentDate: Date
): boolean {
    // If no pieces left, we've found a solution
    if (remainingPieces.length === 0) {
        // Check if the solution is valid for the current date
        if (isPuzzleSolved(board, currentDate)) {
            console.log('🎉 Found a solution that satisfies the date requirements!');
            return true;
        } else {
            console.log('❌ Solution found but does not satisfy date requirements');
            return false;
        }
    }

    // Get the month and day cells that should remain uncovered
    const month = currentDate.getMonth(); // 0-11
    const day = currentDate.getDate(); // 1-31 (1-based)

    // Find the coordinates of the month and day cells
    let monthCell: { x: number, y: number } | null = null;
    let dayCell: { x: number, y: number } | null = null;

    // Find month cell (in first two rows)
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x].content === MONTHS[month]) {
                monthCell = { x, y };
                break;
            }
        }
        if (monthCell) break;
    }

    // Find day cell (in rows 2-6)
    for (let y = 2; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (parseInt(board[y][x].content) === day) {
                dayCell = { x, y };
                break;
            }
        }
        if (dayCell) break;
    }

    // Try each piece
    for (let i = 0; i < remainingPieces.length; i++) {
        const piece = remainingPieces[i];
        const otherPieces = remainingPieces.filter((_, index) => index !== i);

        // Try each position on the board
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[0].length; x++) {
                const position = { x, y };

                // Skip if this would cover the month or day cell
                if (monthCell && position.x === monthCell.x && position.y === monthCell.y) {
                    continue;
                }
                if (dayCell && position.x === dayCell.x && position.y === dayCell.y) {
                    continue;
                }

                // Try each rotation
                for (const rotation of [0, 90, 180, 270] as const) {
                    // Try each flip combination
                    for (const isFlippedH of [false, true]) {
                        for (const isFlippedV of [false, true]) {
                            // Skip if we've already tried this configuration
                            const alreadyTried = piece.tried.some(
                                t => t.position?.x === position.x &&
                                    t.position?.y === position.y &&
                                    t.rotation === rotation &&
                                    t.isFlippedH === isFlippedH &&
                                    t.isFlippedV === isFlippedV
                            );

                            if (alreadyTried) {
                                continue;
                            }

                            // Try this configuration
                            const testPiece = {
                                ...piece,
                                position,
                                rotation,
                                isFlippedH,
                                isFlippedV
                            };

                            // Record this attempt
                            piece.tried.push({
                                position,
                                rotation,
                                isFlippedH,
                                isFlippedV
                            });

                            // Create a copy of the current board state
                            const boardCopy = board.map(row => row.map(cell => ({ ...cell })));

                            // Check if this placement is valid using the game's validation function
                            if (isValidPlacement(boardCopy, testPiece, position)) {
                                // Place the piece using the transformed shape
                                const transformedShape = getTransformedShape(testPiece);

                                // Check if this piece would cover the month or day cell
                                let coversMonthOrDay = false;
                                for (let py = 0; py < transformedShape.length && !coversMonthOrDay; py++) {
                                    for (let px = 0; px < transformedShape[py].length && !coversMonthOrDay; px++) {
                                        if (transformedShape[py][px]) {
                                            const boardY = position.y + py;
                                            const boardX = position.x + px;

                                            // Check if this covers the month cell
                                            if (monthCell && boardX === monthCell.x && boardY === monthCell.y) {
                                                coversMonthOrDay = true;
                                                break;
                                            }

                                            // Check if this covers the day cell
                                            if (dayCell && boardX === dayCell.x && boardY === dayCell.y) {
                                                coversMonthOrDay = true;
                                                break;
                                            }

                                            // Mark as occupied on the board copy
                                            if (boardY < boardCopy.length && boardX < boardCopy[boardY].length) {
                                                boardCopy[boardY][boardX].isOccupied = true;
                                            }
                                        }
                                    }
                                }

                                // Skip if this piece would cover the month or day cell
                                if (coversMonthOrDay) {
                                    continue;
                                }

                                // Update piece with new position
                                piece.position = position;
                                piece.rotation = rotation;
                                piece.isFlippedH = isFlippedH;
                                piece.isFlippedV = isFlippedV;

                                // Recursively try to solve with remaining pieces and the updated board
                                if (solve(boardCopy, otherPieces, currentDate)) {
                                    // Copy the successful board state back
                                    for (let y = 0; y < board.length; y++) {
                                        for (let x = 0; x < board[y].length; x++) {
                                            board[y][x].isOccupied = boardCopy[y][x].isOccupied;
                                        }
                                    }
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return false;
}

// Set up the worker message handler
// Disable ESLint for the next line to allow use of 'self'
// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent<SolverRequest>) => {
    try {
        const { board, pieces, currentDate } = event.data;

        // Convert ISO string back to Date
        const date = new Date(currentDate);

        // Find solution
        const solution = findSolution(board, pieces, date);

        // Send result back to main thread
        ctx.postMessage({ solution } as SolverResponse);
    } catch (error) {
        ctx.postMessage({ 
            solution: null, 
            error: error instanceof Error ? error.message : String(error) 
        } as SolverResponse);
    }
};

// TypeScript needs this to recognize this file as a module
export {};
