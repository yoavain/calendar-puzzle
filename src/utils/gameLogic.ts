import { Piece, BoardCell, Position } from '../types/types';

export function rotatePiece(piece: Piece): boolean[][] {
    const height = piece.shape.length;
    const width = piece.shape[0].length;
    const rotated: boolean[][] = Array(width).fill(null).map(() => Array(height).fill(false));

    // Rotate 90 degrees clockwise
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            rotated[x][height - 1 - y] = piece.shape[y][x];
        }
    }

    return rotated;
}

export function flipPieceHorizontal(piece: Piece): boolean[][] {
    const height = piece.shape.length;
    const width = piece.shape[0].length;
    const flipped: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

    // Flip horizontally (left-right)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            flipped[y][width - 1 - x] = piece.shape[y][x];
        }
    }

    return flipped;
}

export function flipPieceVertical(piece: Piece): boolean[][] {
    const height = piece.shape.length;
    const width = piece.shape[0].length;
    const flipped: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

    // Flip vertically (up-down)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            flipped[height - 1 - y][x] = piece.shape[y][x];
        }
    }

    return flipped;
}

// Helper function to get the transformed shape based on rotation and flip
export function getTransformedShape(piece: Piece): boolean[][] {
    let shape = [...piece.shape.map(row => [...row])];
    
    // Apply rotations
    const rotations = piece.rotation / 90;
    for (let i = 0; i < rotations; i++) {
        shape = rotatePiece({ ...piece, shape });
    }
    
    // Apply flips
    if (piece.isFlippedH) {
        shape = flipPieceHorizontal({ ...piece, shape });
    }
    if (piece.isFlippedV) {
        shape = flipPieceVertical({ ...piece, shape });
    }
    
    return shape;
}

export function isValidPlacement(
    board: BoardCell[][],
    piece: Piece,
    position: Position
): boolean {
    const shape = getTransformedShape(piece);
    const height = shape.length;
    const width = shape[0].length;

    // Check if piece fits within board boundaries
    if (position.y + height > board.length || 
        position.x + width > board[0].length) {
        return false;
    }

    // Check if all cells are unoccupied and playable
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (shape[y][x]) {
                const boardY = position.y + y;
                const boardX = position.x + x;
                if (!board[boardY][boardX].isPlayable || 
                    board[boardY][boardX].isOccupied) {
                    return false;
                }
            }
        }
    }

    return true;
}

export function isSolutionValid(
    board: BoardCell[][],
    currentDate: Date
): boolean {
    const month = currentDate.getMonth(); // 0-11
    const day = currentDate.getDate() - 1; // 0-30

    // Count uncovered cells and check if they match current date
    let uncoveredCells = 0;
    let monthUncovered = false;
    let dayUncovered = false;

    // Check months (first two rows)
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 7; x++) {
            if (!board[y][x].isOccupied) {
                uncoveredCells++;
                const monthIndex = y * 7 + x;
                if (monthIndex === month) {
                    monthUncovered = true;
                }
            }
        }
    }

    // Check days (remaining rows)
    for (let y = 2; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (!board[y][x].isOccupied) {
                uncoveredCells++;
                const dayIndex = (y - 2) * 7 + x;
                if (dayIndex === day) {
                    dayUncovered = true;
                }
            }
        }
    }

    return uncoveredCells === 2 && monthUncovered && dayUncovered;
}

export function clearPieceFromBoard(board: BoardCell[][], piece: Piece): BoardCell[][] {
    if (!piece.position) return board;

    const newBoard = board.map(row => [...row]);
    const shape = getTransformedShape(piece);

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
            if (shape[y][x]) {
                const boardY = piece.position.y + y;
                const boardX = piece.position.x + x;
                if (boardY < newBoard.length && boardX < newBoard[0].length) {
                    newBoard[boardY][boardX].isOccupied = false;
                }
            }
        }
    }

    return newBoard;
} 