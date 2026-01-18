/**
 * Constant data for puzzle pieces.
 * Shape and color are immutable attributes of each piece.
 */

export interface PieceData {
    shape: boolean[][];
    color: string;
}

export type PieceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * All piece IDs for iteration
 */
export const PIECE_IDS: PieceId[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Constant data for all 8 puzzle pieces.
 * Each piece has a unique shape and color.
 */
export const PIECE_DATA: Record<PieceId, PieceData> = {
    1: {
        shape: [
            [true, false],
            [true, false],
            [true, true],
            [true, false]
        ],
        color: "#E07A5F" // Coral
    },
    2: {
        shape: [
            [true, true, true],
            [true, false, true]
        ],
        color: "#3D9970" // Teal
    },
    3: {
        shape: [
            [true, false, false],
            [true, true, true],
            [false, false, true]
        ],
        color: "#6B4423" // Chocolate
    },
    4: {
        shape: [
            [false, true],
            [false, true],
            [true, true],
            [true, false]
        ],
        color: "#8B5CF6" // Violet
    },
    5: {
        shape: [
            [false, true],
            [true, true],
            [true, true]
        ],
        color: "#DB5B80" // Rose
    },
    6: {
        shape: [
            [false, false, true],
            [false, false, true],
            [true, true, true]
        ],
        color: "#E8AA14" // Marigold
    },
    7: {
        shape: [
            [true, true],
            [true, true],
            [true, true]
        ],
        color: "#8DA547" // Olive
    },
    8: {
        shape: [
            [true, false],
            [true, false],
            [true, false],
            [true, true]
        ],
        color: "#4169E1" // Royal blue
    }
};

/**
 * Get the base shape for a piece by ID.
 * @param id - Piece ID (1-8)
 * @returns The boolean grid representing the piece shape
 */
export const getPieceShape = (id: number): boolean[][] =>
    PIECE_DATA[id as PieceId].shape;

/**
 * Get the color for a piece by ID.
 * @param id - Piece ID (1-8)
 * @returns The hex color string
 */
export const getPieceColor = (id: number): string =>
    PIECE_DATA[id as PieceId].color;
