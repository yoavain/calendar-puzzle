import { Board, Piece, MONTHS, PuzzleDate } from '../../common/types';

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
            content: '',
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
    if (board[0]?.[6]) board[0][6].isPlayable = false;
    if (board[1]?.[6]) board[1][6].isPlayable = false;

    return board;
}

/**
 * Initialize the game pieces
 */
export function initializePieces(): Piece[] {
    return [
        {
            id: 1,
            shape: [
                [true, false],
                [true, false],
                [true, true],
                [true, false]
            ],
            position: null,
            isFlippedH: false,
            isFlippedV: false,
            rotation: 0
        },
        {
            id: 2,
            shape: [
                [true, true, true],
                [true, false, true]
            ],
            position: null,
            isFlippedH: false,
            isFlippedV: false,
            rotation: 0
        },
        {
            id: 3,
            shape: [
                [true, false, false],
                [true, true, true],
                [false, false, true]
            ],
            position: null,
            isFlippedH: false,
            isFlippedV: false,
            rotation: 0
        },
        {
            id: 4,
            shape: [
                [false, true],
                [false, true],
                [true, true],
                [true, false]
            ],
            position: null,
            isFlippedH: false,
            isFlippedV: false,
            rotation: 0
        },
        {
            id: 5,
            shape: [
                [false, true],
                [true, true],
                [true, true]
            ],
            position: null,
            isFlippedH: false,
            isFlippedV: false,
            rotation: 0
        },
        {
            id: 6,
            shape: [
                [false, false, true],
                [false, false, true],
                [true, true, true]
            ],
            position: null,
            isFlippedH: false,
            isFlippedV: false,
            rotation: 0
        },
        {
            id: 7,
            shape: [
                [true, true],
                [true, true],
                [true, true]
            ],
            position: null,
            isFlippedH: false,
            isFlippedV: false,
            rotation: 0
        },
        {
            id: 8,
            shape: [
                [true, false],
                [true, false],
                [true, false],
                [true, true]
            ],
            position: null,
            isFlippedH: false,
            isFlippedV: false,
            rotation: 0
        }
    ];
}
