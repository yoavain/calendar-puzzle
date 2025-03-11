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
    console.log('Getting transformed shape for piece:', piece.id, 'rotation:', piece.rotation, 'flips:', piece.isFlippedH, piece.isFlippedV);
    
    let shape = [...piece.shape.map(row => [...row])];
    console.log('Original shape:', shape);
    
    // Apply rotations
    const rotations = piece.rotation / 90;
    for (let i = 0; i < rotations; i++) {
        shape = rotatePiece({ ...piece, shape });
    }
    console.log('After rotation:', shape);
    
    // Apply flips
    if (piece.isFlippedH) {
        shape = flipPieceHorizontal({ ...piece, shape });
        console.log('After horizontal flip:', shape);
    }
    if (piece.isFlippedV) {
        shape = flipPieceVertical({ ...piece, shape });
        console.log('After vertical flip:', shape);
    }
    
    console.log('Final transformed shape:', shape);
    return shape;
}

export function isValidPlacement(
    board: BoardCell[][],
    piece: Piece,
    position: Position
): boolean {
    console.error('VALIDATING_PLACEMENT', {
        pieceId: piece.id,
        position,
        rotation: piece.rotation,
        isFlippedH: piece.isFlippedH,
        isFlippedV: piece.isFlippedV
    });
    
    let tempBoard = board.map(row => [...row]);
    
    if (piece.position) {
        console.error('PIECE_ALREADY_ON_BOARD', {
            pieceId: piece.id,
            oldPosition: piece.position
        });
        tempBoard = clearPieceFromBoard(tempBoard, piece);
        console.error('CLEARED_FROM_BOARD');
    }

    const shape = getTransformedShape(piece);
    console.error('VALIDATION_SHAPE', shape);

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
            if (shape[y][x]) {
                const boardY = position.y + y;
                const boardX = position.x + x;

                if (boardY < 0 || boardY >= tempBoard.length ||
                    boardX < 0 || boardX >= tempBoard[boardY].length) {
                    console.error('POSITION_OUT_OF_BOUNDS', { x: boardX, y: boardY });
                    return false;
                }

                console.error('CHECKING_CELL', {
                    x: boardX,
                    y: boardY,
                    isPlayable: tempBoard[boardY][boardX].isPlayable,
                    isOccupied: tempBoard[boardY][boardX].isOccupied
                });

                if (!tempBoard[boardY][boardX].isPlayable || 
                    tempBoard[boardY][boardX].isOccupied) {
                    console.error('CELL_BLOCKED', {
                        x: boardX,
                        y: boardY,
                        isPlayable: tempBoard[boardY][boardX].isPlayable,
                        isOccupied: tempBoard[boardY][boardX].isOccupied
                    });
                    return false;
                }
            }
        }
    }

    console.error('PLACEMENT_VALID');
    return true;
}

export const clearPieceFromBoard = (board: BoardCell[][], piece: Piece): BoardCell[][] => {
    if (!piece.position) {
        console.error('NO_POSITION_TO_CLEAR');
        return board;
    }

    console.error('CLEARING_PIECE', {
        pieceId: piece.id,
        position: piece.position,
        rotation: piece.rotation,
        isFlippedH: piece.isFlippedH,
        isFlippedV: piece.isFlippedV,
        hasPlacedShape: piece.placedShape ? true : false
    });

    // Use the stored shape from when the piece was placed, or fall back to current transformed shape
    const shape = piece.placedShape || getTransformedShape(piece);
    console.error('USING_SHAPE', shape);

    // Create a new board to avoid mutating the original
    const newBoard = board.map(row => [...row]);

    // Clear all cells that were occupied by the piece
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardY = piece.position.y + y;
                const boardX = piece.position.x + x;
                if (boardY < newBoard.length && boardX < newBoard[boardY].length) {
                    console.error('CLEARING_CELL', {
                        x: boardX,
                        y: boardY,
                        wasOccupied: newBoard[boardY][boardX].isOccupied
                    });
                    newBoard[boardY][boardX].isOccupied = false;
                }
            }
        }
    }

    console.error('CLEARING_COMPLETE');
    return newBoard;
};

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