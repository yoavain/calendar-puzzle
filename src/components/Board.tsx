import React from 'react';
import { BoardCell, Position, DragItem, GameState } from '../types/types';
import { getTransformedShape } from '../utils/gameLogic';

interface BoardProps {
    board: BoardCell[][];
    pieces: GameState['pieces'];  // Add pieces to props
    onCellClick: (position: Position) => void;
    onPieceDrop: (position: Position, dragItem: DragItem) => void;
}

const Board: React.FC<BoardProps> = ({ board, pieces, onCellClick, onPieceDrop }) => {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, position: Position) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        const dragItem: DragItem = JSON.parse(data);
        onPieceDrop(position, dragItem);
    };

    // Function to check if a cell is part of a placed piece
    const getPieceAtCell = (x: number, y: number) => {
        return pieces.find(piece => {
            if (!piece.position) return false;
            const shape = getTransformedShape(piece);
            const pieceX = x - piece.position.x;
            const pieceY = y - piece.position.y;
            return pieceY >= 0 && pieceY < shape.length &&
                   pieceX >= 0 && pieceX < shape[0].length &&
                   shape[pieceY][pieceX];
        });
    };

    return (
        <div className="board">
            {board.map((row, y) => (
                <div key={y} className="board-row">
                    {row.map((cell, x) => {
                        const piece = getPieceAtCell(x, y);
                        return (
                            <div
                                key={`${x}-${y}`}
                                className={`board-cell ${cell.isPlayable ? 'playable' : ''} ${piece ? 'piece-cell' : ''}`}
                                onClick={() => onCellClick({ x, y })}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, { x, y })}
                            >
                                {cell.content}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Board; 