import type { Board, Piece, Position, PuzzleDate } from "./types";
import { MONTHS } from "./types";
import { getPieceShape } from "./pieceData";

/**
 * Get the transformed shape of a piece based on its rotation and flips
 */
export const getTransformedShape = (piece: Piece): boolean[][] => {
    const shape = getPieceShape(piece.id);
    const { rotation, isFlippedH, isFlippedV } = piece;
    let transformedShape = [...shape.map(row => [...row])];

    // Apply rotation
    if (rotation === 90 || rotation === 180 || rotation === 270) {
        const height = transformedShape.length;
        const width = transformedShape[0].length;
        
        if (rotation === 90) {
            // Rotate 90 degrees clockwise
            const rotated = Array(width).fill(null).map(() => Array(height).fill(false));
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    rotated[x][height - 1 - y] = transformedShape[y][x];
                }
            }
            transformedShape = rotated;
        }
        else if (rotation === 180) {
            // Rotate 180 degrees
            const rotated = Array(height).fill(null).map(() => Array(width).fill(false));
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    rotated[height - 1 - y][width - 1 - x] = transformedShape[y][x];
                }
            }
            transformedShape = rotated;
        }
        else if (rotation === 270) {
            // Rotate 270 degrees clockwise (or 90 degrees counter-clockwise)
            const rotated = Array(width).fill(null).map(() => Array(height).fill(false));
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    rotated[width - 1 - x][y] = transformedShape[y][x];
                }
            }
            transformedShape = rotated;
        }
    }

    // Apply horizontal flip
    if (isFlippedH) {
        transformedShape = transformedShape.map(row => [...row].reverse());
    }

    // Apply vertical flip
    if (isFlippedV) {
        transformedShape = [...transformedShape].reverse();
    }

    return transformedShape;
};

/**
 * Check if a piece placement is valid (fits on the board and doesn't overlap existing pieces)
 */
export const isValidPlacement = (board: Board, piece: Piece, position: Position, checkHighlight: boolean = false): boolean => {
    if (!piece || !position) {
        return false;
    }

    const { x, y } = position;
    const shape = getTransformedShape(piece);
    const shapeHeight = shape.length;
    const shapeWidth = shape[0].length;

    // Helper to check if a cell is part of the piece's current placement.
    // We ignore these cells to allow checking validity while moving the piece.
    const isPartOfCurrentPiece = (bx: number, by: number): boolean => {
        if (!piece.position) {
            return false;
        }
        const { x: currentX, y: currentY } = piece.position;
        const pieceX = bx - currentX;
        const pieceY = by - currentY;
        return pieceY >= 0 && pieceY < shapeHeight &&
               pieceX >= 0 && pieceX < shapeWidth &&
               shape[pieceY][pieceX];
    };

    // Check if the new position is valid
    let isValid = true;
    for (let dy = 0; dy < shapeHeight; dy++) {
        for (let dx = 0; dx < shapeWidth; dx++) {
            if (shape[dy][dx]) {
                const boardY = y + dy;
                const boardX = x + dx;

                // Check if this part of the piece is outside the board
                if (boardY >= board.length || boardX >= board[boardY].length) {
                    isValid = false;
                    break;
                }

                const cell = board[boardY][boardX];

                // If the cell is not playable, occupied, or highlighted, the placement is invalid.
                // We ignore occupancy if the cell is part of the piece's current position.
                const isOccupiedByOthers = cell.isOccupied && !isPartOfCurrentPiece(boardX, boardY);

                if (!cell.isPlayable || isOccupiedByOthers || (checkHighlight && cell.isHighlighted)) {
                    isValid = false;
                    break;
                }
            }
        }
        if (!isValid) {
            break;
        }
    }

    return isValid;
};

/**
 * For debugging and validation: Check if the pieces represent a valid solved date.
 * Returns the date if exactly one valid month and one day are visible, or null otherwise.
 * Performs strict validation: all 8 pieces must be placed, no overlaps, no out-of-bounds.
 */
export const puzzleSolvedForDate = (pieces: Piece[]): PuzzleDate | null => {
    // 1. All 8 pieces must be placed
    if (pieces.filter(p => p.position !== null).length !== 8) {
        return null;
    }

    // 2. Create occupancy grid (7x7) and check for overlaps/out-of-bounds
    const occupied = Array(7).fill(null).map(() => Array(7).fill(false));
    
    for (const piece of pieces) {
        if (!piece.position) return null;
        const shape = getTransformedShape(piece);
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[0].length; dx++) {
                if (shape[dy][dx]) {
                    const by = piece.position.y + dy;
                    const bx = piece.position.x + dx;

                    // Out of bounds or non-playable cells
                    if (by < 0 || by >= 7 || bx < 0 || bx >= 7) {
                        return null;
                    }

                    // Check if cell is playable
                    const isPlayable = (
                        (by < 2 && bx < 6) || // Months
                        (by >= 2 && by <= 5 && bx < 7) || // Days 1-28
                        (by === 6 && bx < 3) // Days 29-31
                    );

                    if (!isPlayable || occupied[by][bx]) {
                        return null;
                    }

                    occupied[by][bx] = true;
                }
            }
        }
    }

    // 3. Define board layout and check for uncovered cells
    let foundMonth: number | null = null;
    let foundDay: number | null = null;

    // Check Month cells (Rows 0-1, Cols 0-5)
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 6; x++) {
            if (!occupied[y][x]) {
                if (foundMonth !== null) return null; // More than one month visible
                foundMonth = y * 6 + x;
            }
        }
    }

    // Check Day cells (Rows 2-6)
    const daysLayout = [
        [1, 2, 3, 4, 5, 6, 7],
        [8, 9, 10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19, 20, 21],
        [22, 23, 24, 25, 26, 27, 28],
        [29, 30, 31]
    ];

    for (let dy = 0; dy < daysLayout.length; dy++) {
        const y = dy + 2;
        const row = daysLayout[dy];
        for (let x = 0; x < row.length; x++) {
            if (!occupied[y][x]) {
                if (foundDay !== null) return null; // More than one day visible
                foundDay = row[x];
            }
        }
    }

    // 4. Ensure exactly one of each was found and it's a valid calendar date
    if (foundMonth !== null && foundDay !== null) {
        // Basic date validation
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (foundDay <= daysInMonth[foundMonth]) {
            return { month: foundMonth, day: foundDay };
        }
    }

    return null;
};

/**
 * Remove a piece from the board
 */
export const clearPieceFromBoard = (board: Board, piece: Piece): void => {
    if (!piece.position) {
        return;
    }
    
    const { x, y } = piece.position;
    const shape = getTransformedShape(piece);
    
    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[0].length; dx++) {
            if (shape[dy][dx]) {
                const boardY = y + dy;
                const boardX = x + dx;
                
                if (boardY < board.length && boardX < board[boardY].length) {
                    board[boardY][boardX].isOccupied = false;
                }
            }
        }
    }
};

/**
 * Check if a cell is on the edge of a shape
 */
export const isEdgeCell = (shape: boolean[][], x: number, y: number): boolean => {
    if (!shape[y][x]) {
        return false;
    }
    
    // Check if any adjacent cell is empty or out of bounds
    return (
        y === 0 || !shape[y - 1][x] || // Top
        x === shape[0].length - 1 || !shape[y][x + 1] || // Right
        y === shape.length - 1 || !shape[y + 1][x] || // Bottom
        x === 0 || !shape[y][x - 1] // Left
    );
};

/**
 * Get the edge directions for a cell
 */
export const getEdgeDirections = (shape: boolean[][], x: number, y: number): { top: boolean, right: boolean, bottom: boolean, left: boolean } => {
    if (!shape[y][x]) {
        return { top: false, right: false, bottom: false, left: false };
    } // Empty cell has no edges

    // Initialize result with all edges as false
    const result = { top: false, right: false, bottom: false, left: false };

    // Check top edge
    if (y === 0 || !shape[y - 1][x]) {
        result.top = true;
    }

    // Check right edge
    if (x === shape[0].length - 1 || !shape[y][x + 1]) {
        result.right = true;
    }

    // Check bottom edge
    if (y === shape.length - 1 || !shape[y + 1][x]) {
        result.bottom = true;
    }

    // Check left edge
    if (x === 0 || !shape[y][x - 1]) {
        result.left = true;
    }

    return result;
};

/** Total playable cells that need to be covered (41 = 12 months + 31 days - 2 highlighted) */
const TOTAL_PLAYABLE_CELLS = 41;

/**
 * Calculate puzzle progress based on placed pieces
 * Uses piece weights (cell count per piece) for efficient calculation
 */
export const calculateProgress = (pieces: Piece[]): { covered: number; total: number; percentage: number } => {
    const covered = pieces
        .filter(p => p.position !== null)
        .reduce((sum, p) => sum + getPieceShape(p.id).flat().filter(Boolean).length, 0);
    
    return {
        covered,
        total: TOTAL_PLAYABLE_CELLS,
        percentage: (covered / TOTAL_PLAYABLE_CELLS) * 100
    };
};
