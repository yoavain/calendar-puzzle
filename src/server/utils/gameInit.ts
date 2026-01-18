import type { Board, Piece, PuzzleDate } from "../../common/types";
import { MONTHS } from "../../common/types";
import { PIECE_IDS } from "../../common/pieceData";

/**
 * Initialize the game board with month and day cells for a given date
 */
export function initializeBoard(puzzleDate: PuzzleDate): Board {
    const { month, day } = puzzleDate;
    const boardWidth = 7;
    const boardHeight = 7;
    const board: Board = Array.from({ length: boardHeight }, (_, y) =>
        Array.from({ length: boardWidth }, (_, x) => ({
            x,
            y,
            content: "",
            isOccupied: false,
            isPlayable: false,
            isHighlighted: false
        }))
    );

    // Set up month cells (Rows 0, 1; Cols 0-5)
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 6; x++) {
            const monthContentIndex = y * 6 + x;
            const cell = board[y][x];
            cell.content = MONTHS[monthContentIndex];
            cell.isPlayable = true;
            cell.isHighlighted = monthContentIndex === month;
        }
    }

    // Set up day cells (Rows 2-6)
    const daysLayout = [
        [1, 2, 3, 4, 5, 6, 7],
        [8, 9, 10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19, 20, 21],
        [22, 23, 24, 25, 26, 27, 28],
        [29, 30, 31]
    ];

    daysLayout.forEach((dayRow, rowIndex) => {
        const y = rowIndex + 2;
        dayRow.forEach((dayContent, x) => {
            if (x < boardWidth) {
                const cell = board[y][x];
                cell.content = dayContent.toString();
                cell.isPlayable = true;
                cell.isHighlighted = dayContent === day;
            }
        });
    });

    // Mark remaining cells in the last row as not playable
    const lastRowY = 2 + daysLayout.length - 1;
    for (let x = daysLayout[daysLayout.length - 1].length; x < boardWidth; x++) {
        if (board[lastRowY]?.[x]) {
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
}

/**
 * Initialize the game pieces with default state.
 * Shape data is accessed via PIECE_DATA when needed.
 */
export function initializePieces(): Piece[] {
    return PIECE_IDS.map(id => ({
        id,
        position: null,
        isFlippedH: false,
        isFlippedV: false,
        rotation: 0 as const
    }));
}
