import { Piece, BoardCell, Position } from '../types/types';
import { MONTHS } from './initialize';

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
    let tempBoard = board.map(row => [...row]);
    
    if (piece.position) {
        console.log('Clearing piece from current position:', piece.position);
        tempBoard = clearPieceFromBoard(tempBoard, piece);
    }

    const shape = getTransformedShape(piece);
    
    console.log('Attempting placement at position:', position);
    console.log('Piece shape:', shape);
    console.log('Current board state:', tempBoard);

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
            if (shape[y][x]) {
                const boardY = position.y + y;
                const boardX = position.x + x;

                if (boardY < 0 || boardY >= tempBoard.length ||
                    boardX < 0 || boardX >= tempBoard[boardY].length) {
                    console.log(`Position out of bounds: (${boardX}, ${boardY})`);
                    return false;
                }

                console.log(`Checking cell at (${boardX}, ${boardY}):`, {
                    isPlayable: tempBoard[boardY][boardX].isPlayable,
                    isOccupied: tempBoard[boardY][boardX].isOccupied
                });

                if (!tempBoard[boardY][boardX].isPlayable || 
                    tempBoard[boardY][boardX].isOccupied) {
                    console.log(`Invalid placement - Cell not playable or occupied at (${boardX}, ${boardY})`);
                    return false;
                }
            }
        }
    }

    console.log('Valid placement found!');
    return true;
}

export function clearPieceFromBoard(board: BoardCell[][], piece: Piece): BoardCell[][] {
    if (!piece.position) {
        console.log('No position to clear - piece is not on board');
        return board;
    }

    console.log('Clearing piece:', {
        pieceId: piece.id,
        position: piece.position,
        shape: getTransformedShape(piece)
    });

    const newBoard = board.map(row => [...row]);
    const shape = getTransformedShape(piece);

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
            if (shape[y][x]) {
                const boardY = piece.position.y + y;
                const boardX = piece.position.x + x;
                if (boardY >= 0 && boardY < newBoard.length && 
                    boardX >= 0 && boardX < newBoard[boardY].length) {
                    console.log(`Clearing cell at (${boardX}, ${boardY})`);
                    newBoard[boardY][boardX].isOccupied = false;
                }
            }
        }
    }

    console.log('Board cleared');
    return newBoard;
}

export function isPuzzleSolved(board: BoardCell[][], currentDate: Date): boolean {
    const month = currentDate.getMonth(); // 0-11
    const day = currentDate.getDate(); // 1-31 (1-based)

    let occupiedCount = 0;
    let uncoveredCells = 0;
    let monthUncovered = false;
    let dayUncovered = false;

    // Check all cells in the board
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const cell = board[y][x];
            if (cell.isOccupied) {
                occupiedCount++;
            } else {
                uncoveredCells++;
                // Check if the uncovered cell corresponds to the current month
                if (y < 2 && cell.content === MONTHS[month]) {
                    monthUncovered = true; // Check if the content matches the current month
                }
                // Check if the uncovered cell corresponds to the current day
                if (y >= 2 && parseInt(cell.content) === day) {
                    dayUncovered = true; // Check if the content matches the current day
                }
            }
        }
    }

    // Total cells on the board
    const totalCells = board.reduce((sum, row) => sum + row.length, 0);

    // There should be exactly two uncovered cells (month and day)
    return occupiedCount === (totalCells - 2) && monthUncovered && dayUncovered;
} 