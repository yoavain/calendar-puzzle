import type { Board, GameState, Piece, PuzzleDate } from "../../common/types";
import { toPuzzleDate } from "../../common/types";
import { MONTHS, DAYS_LAYOUT } from "../../common/consts";
import { PIECE_IDS } from "../../common/pieceData";

/**
 * Initialize the game board with month and day cells
 */
export const initializeBoard = (puzzleDate: PuzzleDate): Board => {
    const boardWidth = 7;
    const boardHeight = 7;
    const board: Board = Array.from({ length: boardHeight }, (_, y) =>
        Array.from({ length: boardWidth }, (_, x) => ({
            x,
            y,
            content: "", // Default content
            isOccupied: false,
            isPlayable: false, // Default to not playable
            isHighlighted: false
        }))
    );

    // Use PuzzleDate directly
    const monthIndex = puzzleDate.month; // 0-11
    const day = puzzleDate.day; // 1-31

    // Set up month cells (Rows 0, 1; Cols 0-5)
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 6; x++) {
            const monthContentIndex = y * 6 + x;
            const cell = board[y][x];
            cell.content = MONTHS[monthContentIndex];
            cell.isPlayable = true;
            cell.isHighlighted = monthContentIndex === monthIndex;
        }
    }

    // Set up day cells (Rows 2-6)
    DAYS_LAYOUT.forEach((dayRow, rowIndex) => {
        const y = rowIndex + 2;
        dayRow.forEach((dayContent, x) => {
            if (x < boardWidth) { // Ensure we don't go out of bounds horizontally
                const cell = board[y][x];
                cell.content = dayContent.toString();
                cell.isPlayable = true;
                cell.isHighlighted = dayContent === day;
            }
        });
    });

    // Specifically mark remaining cells in the last row as not playable
    const lastRowY = 2 + DAYS_LAYOUT.length - 1; // Should be 6
    for (let x = DAYS_LAYOUT[DAYS_LAYOUT.length - 1].length; x < boardWidth; x++) {
        if (board[lastRowY]?.[x]) { // Check if cell exists
            board[lastRowY][x].isPlayable = false;
        }
    }
    // Also mark x=6 in rows 0 and 1 as not playable
    if (board[0]?.[6]) {
        board[0][6].isPlayable = false;
    }
    if (board[1]?.[6]) {
        board[1][6].isPlayable = false;
    }


    return board;
};

/**
 * Initialize the game pieces with default state.
 * Shape data is accessed via PIECE_DATA when needed.
 */
export const initializePieces = (): Piece[] => {
    return PIECE_IDS.map(id => ({
        id,
        position: null,
        isFlippedH: false,
        isFlippedV: false,
        rotation: 0 as const
    }));
};

/**
 * Initialize the game state
 * Converts JavaScript Date to PuzzleDate once at initialization.
 * From this point forward, only PuzzleDate is used.
 */
export const initializeGame = (date: Date = new Date()): GameState => {
    // Convert to PuzzleDate once - this is the only place we use JavaScript Date
    const puzzleDate = toPuzzleDate(date);
    
    return {
        board: initializeBoard(puzzleDate),
        pieces: initializePieces(),
        selectedPieceId: null,
        currentDate: puzzleDate,
        isSolved: false,
        isGameComplete: false
    };
};
