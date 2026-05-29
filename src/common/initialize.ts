import type { Board, GameState, Piece, PuzzleDate } from "./types";
import { toPuzzleDate } from "./types";
import { BOARD_HEIGHT, BOARD_WIDTH, DAYS_LAYOUT, MONTHS } from "./consts";
import { isCellPlayable } from "./boardGeometry";
import { PIECE_IDS } from "./pieceData";

/**
 * Initialize the game board with month and day cells.
 * Playable region is derived from `isCellPlayable` (single source of truth in boardGeometry.ts).
 */
export const initializeBoard = (puzzleDate: PuzzleDate): Board => {
    const board: Board = Array.from({ length: BOARD_HEIGHT }, (_, y) =>
        Array.from({ length: BOARD_WIDTH }, (_, x) => ({
            x,
            y,
            content: "",
            isOccupied: false,
            isPlayable: isCellPlayable(x, y),
            isHighlighted: false
        }))
    );

    const monthIndex = puzzleDate.month; // 0-11
    const day = puzzleDate.day; // 1-31

    // Month cells (rows 0-1, cols 0-5)
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 6; x++) {
            const monthContentIndex = y * 6 + x;
            const cell = board[y][x];
            cell.content = MONTHS[monthContentIndex];
            cell.isHighlighted = monthContentIndex === monthIndex;
        }
    }

    // Day cells (rows 2-6)
    DAYS_LAYOUT.forEach((dayRow, rowIndex) => {
        const y = rowIndex + 2;
        dayRow.forEach((dayContent, x) => {
            const cell = board[y][x];
            cell.content = dayContent.toString();
            cell.isHighlighted = dayContent === day;
        });
    });

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
        solutionRevealed: false
    };
};
