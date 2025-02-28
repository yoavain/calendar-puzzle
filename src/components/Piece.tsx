import React from 'react';
import { Piece as PieceType } from '../types/types';
import { getTransformedShape } from '../utils/gameLogic';

interface PieceProps {
    piece: PieceType;
    isSelected: boolean;
    onClick: () => void;
}

const Piece: React.FC<PieceProps> = ({ piece, isSelected, onClick }) => {
    const shape = getTransformedShape(piece);
    const width = shape[0].length;
    const height = shape.length;

    return (
        <div
            className={`piece ${isSelected ? 'selected' : ''} ${piece.position ? 'placed' : ''}`}
            onClick={onClick}
            draggable={!piece.position}
            onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                    pieceId: piece.id,
                    shape
                }));
            }}
        >
            <div 
                className="piece-grid"
                style={{
                    gridTemplateColumns: `repeat(${width}, var(--cell-size))`,
                    gridTemplateRows: `repeat(${height}, var(--cell-size))`
                }}
            >
                {shape.map((row, y) =>
                    row.map((cell, x) => (
                        <div
                            key={`${x}-${y}`}
                            className={`piece-cell ${cell ? 'filled' : 'empty'}`}
                            style={{ visibility: cell ? 'visible' : 'hidden' }}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Piece; 