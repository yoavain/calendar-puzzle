/**
 * Pure game board operations.
 *
 * This module contains pure functions for manipulating game board state.
 * All functions are side-effect-free and testable.
 */

import type { Board, Piece, Position, PuzzleDate } from "./types";
import { getTransformedShape, clearPieceFromBoard } from "./gameLogic";
import { initializeBoard } from "./initialize";

/**
 * Rebuild game state from saved pieces.
 * Reconstructs the board by placing each piece at its saved position.
 *
 * This is a pure function that creates a new board state based on piece positions.
 * Used when restoring from session storage or applying hints/solutions.
 *
 * @param pieces - Array of pieces with their positions
 * @param date - The puzzle date (determines which cells are highlighted)
 * @param isSolved - Whether the puzzle is in a solved state
 * @returns Complete game state with reconstructed board
 */
export const rebuildGameState = (pieces: Piece[], date: PuzzleDate, isSolved: boolean) => {
    const board = initializeBoard(date);

    // Place each piece on the board
    for (const piece of pieces) {
        if (piece.position) {
            const shape = getTransformedShape(piece);
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        const boardY = piece.position.y + y;
                        const boardX = piece.position.x + x;
                        if (boardY < board.length && boardX < board[boardY].length) {
                            board[boardY][boardX].isOccupied = true;
                        }
                    }
                }
            }
        }
    }

    return {
        board,
        pieces: pieces.map((p) => ({ ...p, isLocked: p.isLocked ?? false })),
        selectedPieceId: null,
        currentDate: date,
        isSolved,
        solutionRevealed: false
    };
};

/**
 * Rebuild the board so it holds exactly the given hints, locked, in hint order.
 *
 * Hints are only requested on a board that holds nothing but hints, so every
 * other piece goes back to the pool. Used when a hint arrives and when the
 * hints for a date are restored from the server.
 */
export const applyHintPieces = (date: PuzzleDate, pieces: Piece[], hintPieces: Piece[]) => {
    const hintOrder = new Map(hintPieces.map((hint, index) => [hint.id, { hint, seq: index + 1 }]));

    const nextPieces = pieces.map((piece): Piece => {
        const entry = hintOrder.get(piece.id);
        if (!entry) {
            return { ...piece, position: null, isLocked: false, placedSeq: undefined };
        }
        return {
            ...piece,
            position: entry.hint.position,
            rotation: entry.hint.rotation,
            isFlippedH: entry.hint.isFlippedH,
            isFlippedV: entry.hint.isFlippedV,
            isLocked: true,
            placedSeq: entry.seq
        };
    });

    const { board, pieces: rebuilt } = rebuildGameState(nextPieces, date, false);
    return { board, pieces: rebuilt };
};

/**
 * Update board and pieces when moving a piece to a new position.
 *
 * This pure function:
 * 1. Creates a deep copy of the board
 * 2. Clears the piece's old position (if any)
 * 3. Places the piece at the new position (if provided) and stamps its placement sequence
 * 4. Returns updated board and pieces array
 *
 * @param piece - The piece to move (with its current transformation state)
 * @param newPosition - Target position (null to remove from board)
 * @param currentBoard - Current board state
 * @param currentPieces - Current pieces array
 * @returns Updated board and pieces
 */
export const updateBoardAndPieces = (
    piece: Piece,
    newPosition: Position | null,
    currentBoard: Board,
    currentPieces: Piece[]
): { board: Board; pieces: Piece[] } => {
    // Create new board - deep clone cells to avoid mutating the original state
    let newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

    // Clear old position if exists
    if (piece.position) {
        clearPieceFromBoard(newBoard, piece);
    }

    // Place in new position if provided
    if (newPosition) {
        const transformedShape = getTransformedShape(piece);
        for (let y = 0; y < transformedShape.length; y++) {
            for (let x = 0; x < transformedShape[y].length; x++) {
                if (transformedShape[y][x]) {
                    const boardY = newPosition.y + y;
                    const boardX = newPosition.x + x;
                    if (boardY < newBoard.length && boardX < newBoard[boardY].length) {
                        newBoard[boardY][boardX].isOccupied = true;
                    }
                }
            }
        }
    }

    // The newest placement gets the next sequence number, so the progress bar
    // can show pieces in the order they went onto the board. Moving a piece
    // to another cell counts as a new placement.
    const placedSeq = newPosition
        ? Math.max(0, ...currentPieces
            .filter(p => p.id !== piece.id && p.position !== null)
            .map(p => p.placedSeq ?? 0)) + 1
        : undefined;

    // Update pieces array
    const newPieces = currentPieces.map(p =>
        p.id === piece.id
            ? {
                ...p,
                position: newPosition,
                rotation: piece.rotation,
                isFlippedH: piece.isFlippedH,
                isFlippedV: piece.isFlippedV,
                isLocked: piece.isLocked ?? false,
                placedSeq
            }
            : p
    );

    return { board: newBoard, pieces: newPieces };
};
