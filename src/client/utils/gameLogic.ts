import { Board, Piece, Position } from '../types/types';
import { MONTHS } from './initialize';

/**
 * Get the transformed shape of a piece based on its rotation and flips
 */
export function getTransformedShape(piece: Piece): boolean[][] {
    const { shape, rotation, isFlippedH, isFlippedV } = piece;
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
        } else if (rotation === 180) {
            // Rotate 180 degrees
            const rotated = Array(height).fill(null).map(() => Array(width).fill(false));
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    rotated[height - 1 - y][width - 1 - x] = transformedShape[y][x];
                }
            }
            transformedShape = rotated;
        } else if (rotation === 270) {
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
}

/**
 * Check if a piece placement is valid (fits on the board and doesn't overlap existing pieces)
 */
export function isValidPlacement(board: Board, piece: Piece, position: Position, checkHighlight: boolean = false): boolean {
    if (!piece || !position) return false;

    const { x, y } = position;
    const shape = getTransformedShape(piece);
    const shapeHeight = shape.length;
    const shapeWidth = shape[0].length;

    // Temporarily clear the piece's current position from the board
    const originalPositions: { x: number, y: number }[] = [];
    if (piece.position) {
        const { x: currentX, y: currentY } = piece.position;
        for (let dy = 0; dy < shapeHeight; dy++) {
            for (let dx = 0; dx < shapeWidth; dx++) {
                if (shape[dy][dx]) {
                    const boardY = currentY + dy;
                    const boardX = currentX + dx;
                    if (boardY < board.length && boardX < board[boardY].length && board[boardY][boardX].isOccupied) {
                        originalPositions.push({ x: boardX, y: boardY });
                        board[boardY][boardX].isOccupied = false;
                    }
                }
            }
        }
    }

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

                // If the cell is occupied or highlighted, the placement is invalid
                if (cell.isOccupied || (checkHighlight && cell.isHighlighted)) {
                    isValid = false;
                    break;
                }
            }
        }
        if (!isValid) break;
    }

    // Restore the piece's original position on the board
    originalPositions.forEach(pos => {
        board[pos.y][pos.x].isOccupied = true;
    });

    return isValid;
}

/**
 * Check if the puzzle is solved for the current date
 */
export function isPuzzleSolved(board: Board, currentDate: Date): boolean {
    const month = currentDate.getMonth(); // 0-11
    const day = currentDate.getDate(); // 1-31
    
    // Check if the month cell is visible (not covered)
    let monthVisible = false;
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x].content === MONTHS[month] && !board[y][x].isOccupied) {
                monthVisible = true;
                break;
            }
        }
        if (monthVisible) break;
    }
    
    if (!monthVisible) return false;
    
    // Check if the day cell is visible (not covered)
    let dayVisible = false;
    for (let y = 2; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const content = board[y][x].content;
            if (content && parseInt(content) === day && !board[y][x].isOccupied) {
                dayVisible = true;
                break;
            }
        }
        if (dayVisible) break;
    }
    
    if (!dayVisible) return false;
    
    // Check if all other cells that should be covered are covered
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const cell = board[y][x];
            
            // Skip month and day cells
            if ((y < 2 && cell.content === MONTHS[month]) || 
                (y >= 2 && parseInt(cell.content) === day)) {
                continue;
            }
            
            // All other playable cells should be covered
            if (cell.isPlayable && !cell.isOccupied) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Remove a piece from the board
 */
export function clearPieceFromBoard(board: Board, piece: Piece): void {
    if (!piece.position) return;
    
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
}

/**
 * Check if a cell is on the edge of a shape
 */
export function isEdgeCell(shape: boolean[][], x: number, y: number): boolean {
    if (!shape[y][x]) return false;
    
    // Check if any adjacent cell is empty or out of bounds
    return (
        y === 0 || !shape[y-1][x] ||                  // Top
        x === shape[0].length - 1 || !shape[y][x+1] || // Right
        y === shape.length - 1 || !shape[y+1][x] ||    // Bottom
        x === 0 || !shape[y][x-1]                      // Left
    );
}

/**
 * Get the edge directions for a cell
 */
export function getEdgeDirections(shape: boolean[][], x: number, y: number): { top: boolean, right: boolean, bottom: boolean, left: boolean } {
    if (!shape[y][x]) return { top: false, right: false, bottom: false, left: false }; // Empty cell has no edges

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
} 

