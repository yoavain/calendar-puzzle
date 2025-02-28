import { GameState, BoardCell, Piece } from '../types/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function createBoard(): BoardCell[][] {
    const board: BoardCell[][] = [];
    
    // First row: Jan through Jun
    const firstRow: BoardCell[] = [];
    for (let x = 0; x < 6; x++) {  // Only 6 months
        firstRow.push({
            x,
            y: 0,
            content: MONTHS[x],
            isOccupied: false,
            isPlayable: true
        });
    }
    board.push(firstRow);

    // Second row: Jul through Dec
    const secondRow: BoardCell[] = [];
    for (let x = 0; x < 6; x++) {  // Only 6 months
        secondRow.push({
            x,
            y: 1,
            content: MONTHS[x + 6],
            isOccupied: false,
            isPlayable: true
        });
    }
    board.push(secondRow);

    // Days: 5 rows with specific numbers
    const daysLayout = [
        [1, 2, 3, 4, 5, 6, 7],        // Row 1: 1-7
        [8, 9, 10, 11, 12, 13, 14],   // Row 2: 8-14
        [15, 16, 17, 18, 19, 20, 21], // Row 3: 15-21
        [22, 23, 24, 25, 26, 27, 28], // Row 4: 22-28
        [29, 30, 31]                  // Row 5: only 29-31
    ];

    // Add each row of days
    daysLayout.forEach((dayRow, rowIndex) => {
        const row: BoardCell[] = [];
        for (let x = 0; x < (rowIndex === 4 ? 3 : 7); x++) {  // Only create 3 cells in last row
            row.push({
                x,
                y: rowIndex + 2,
                content: dayRow[x].toString(),
                isOccupied: false,
                isPlayable: true
            });
        }
        board.push(row);
    });

    return board;
}

function createInitialPieces(): Piece[] {
    return [
        {
            id: 1,
            shape: [
                [true, true, true],
                [true, false, false],
                [true, false, false]
            ],
            position: null,
            isFlipped: false,
            rotation: 0
        },
        {
            id: 2,
            shape: [
                [true, true, true, true],
                [true, false, false, false]
            ],
            position: null,
            isFlipped: false,
            rotation: 0
        },
        {
            id: 3,
            shape: [
                [true, true, true],
                [false, false, true],
                [false, false, true]
            ],
            position: null,
            isFlipped: false,
            rotation: 0
        },
        {
            id: 4,
            shape: [
                [true, true],
                [true, false],
                [true, false],
                [true, false]
            ],
            position: null,
            isFlipped: false,
            rotation: 0
        },
        {
            id: 5,
            shape: [
                [true, false],
                [true, false],
                [true, true],
                [true, false]
            ],
            position: null,
            isFlipped: false,
            rotation: 0
        },
        {
            id: 6,
            shape: [
                [true, true, true],
                [true, false, false],
                [true, false, false],
                [true, false, false]
            ],
            position: null,
            isFlipped: false,
            rotation: 0
        },
        {
            id: 7,
            shape: [
                [true, true, true, true],
                [false, false, false, true]
            ],
            position: null,
            isFlipped: false,
            rotation: 0
        },
        {
            id: 8,
            shape: [
                [true, true, true],
                [true, false, false],
                [true, false, false],
                [true, false, false]
            ],
            position: null,
            isFlipped: false,
            rotation: 0
        }
    ];
}

export function initializeGame(): GameState {
    return {
        board: createBoard(),
        pieces: createInitialPieces(),
        selectedPieceId: null,
        currentDate: new Date()
    };
} 