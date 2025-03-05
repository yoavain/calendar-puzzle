export interface Position {
    x: number;
    y: number;
}

export interface Piece {
    id: number;
    shape: boolean[][];  // true represents filled cells
    position: Position | null;  // null when not placed on board
    isFlippedH: boolean;  // Horizontal flip
    isFlippedV: boolean;  // Vertical flip
    rotation: 0 | 90 | 180 | 270;  // degrees
}

export interface BoardCell {
    x: number;
    y: number;
    content: string;  // month name or day number
    isOccupied: boolean;
    isPlayable: boolean;  // Add this field to mark cells that are valid for piece placement
}

export interface GameState {
    board: BoardCell[][];
    pieces: Piece[];
    selectedPieceId: number | null;
    currentDate: Date;
    isSolved: boolean;
}

export interface DragItem {
    pieceId: number;
    shape: boolean[][];
}

export interface GameHistory {
    past: GameState[];
    present: GameState;
    future: GameState[];
}

export interface GameStateAction {
    type: 'PLACE_PIECE' | 'REMOVE_PIECE' | 'ROTATE_PIECE' | 'FLIP_PIECE_H' | 'FLIP_PIECE_V' | 'SELECT_PIECE';
    pieceId: number;
    position?: Position;
} 
