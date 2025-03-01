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
        tempBoard = clearPieceFromBoard(tempBoard, piece);
    }

    const shape = getTransformedShape(piece);
    
    // Debugging: Log the shape being checked
    console.log('Shape being checked:', shape);

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
            if (shape[y][x]) {
                const boardY = position.y + y; // Calculate the board Y position
                const boardX = position.x + x; // Calculate the board X position

                // Check if the position is within bounds before accessing the board
                if (boardY < 0 || boardY >= tempBoard.length ||
                    boardX < 0 || boardX >= tempBoard[boardY].length) {
                    console.log(`Position out of bounds: (${boardX}, ${boardY})`);
                    return false;
                }

                // Debugging output
                console.log(`Checking position: (${boardX}, ${boardY})`);
                console.log(`Cell state:`, tempBoard[boardY]?.[boardX]);

                // Check if the cell is playable and unoccupied
                if (!tempBoard[boardY][boardX].isPlayable || 
                    tempBoard[boardY][boardX].isOccupied) {
                    console.log(`Cell not playable or occupied: (${boardX}, ${boardY})`);
                    return false;
                }
            }
        }
    }

    return true;
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