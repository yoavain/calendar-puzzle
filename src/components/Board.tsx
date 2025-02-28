import React from 'react';
import { BoardCell, Position, DragItem } from '../types/types';

interface BoardProps {
    board: BoardCell[][];
    onCellClick: (position: Position) => void;
    onPieceDrop: (position: Position, dragItem: DragItem) => void;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, onPieceDrop }) => {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Allow drop
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, position: Position) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        const dragItem: DragItem = JSON.parse(data);
        onPieceDrop(position, dragItem);
    };

    return (
        <div className="board">
            {board.map((row, y) => (
                <div key={y} className="board-row">
                    {row.map((cell, x) => (
                        <div
                            key={`${x}-${y}`}
                            className={`board-cell ${cell.isOccupied ? 'occupied' : ''} ${cell.isPlayable ? 'playable' : ''}`}
                            onClick={() => onCellClick({ x, y })}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, { x, y })}
                        >
                            {cell.content}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Board; 