/**
 * Constant data for puzzle pieces.
 * This module contains only the shape data (pure game logic).
 * Colors are in the client layer (src/client/utils/pieceColors.ts).
 */

export interface PieceData {
    shape: boolean[][];
}

export type PieceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * All piece IDs for iteration
 */
export const PIECE_IDS: PieceId[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Constant data for all 8 puzzle pieces.
 * Each piece has a unique shape.
 */
export const PIECE_DATA: Record<PieceId, PieceData> = {
    1: {
        shape: [
            [true, false],
            [true, false],
            [true, true],
            [true, false]
        ]
    },
    2: {
        shape: [
            [true, true, true],
            [true, false, true]
        ]
    },
    3: {
        shape: [
            [true, false, false],
            [true, true, true],
            [false, false, true]
        ]
    },
    4: {
        shape: [
            [false, true],
            [false, true],
            [true, true],
            [true, false]
        ]
    },
    5: {
        shape: [
            [false, true],
            [true, true],
            [true, true]
        ]
    },
    6: {
        shape: [
            [false, false, true],
            [false, false, true],
            [true, true, true]
        ]
    },
    7: {
        shape: [
            [true, true],
            [true, true],
            [true, true]
        ]
    },
    8: {
        shape: [
            [true, false],
            [true, false],
            [true, false],
            [true, true]
        ]
    }
};

/**
 * Get the base shape for a piece by ID.
 * @param id - Piece ID (1-8)
 * @returns The boolean grid representing the piece shape
 */
export const getPieceShape = (id: number): boolean[][] =>
    PIECE_DATA[id as PieceId].shape;
