import React from 'react';
import { Piece as PieceType } from '../types/types';
import { getTransformedShape } from '../utils/gameLogic';

interface PieceProps {
    piece: PieceType;
    isSelected: boolean;
    onClick: () => void;
}

export const Piece: React.FC<PieceProps> = ({ piece, isSelected, onClick }) => {
    const shape = getTransformedShape(piece);
    const width = shape[0].length;
    const height = shape.length;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        console.log('Piece: Starting drag for piece:', piece.id, 'position:', piece.position, 'rotation:', piece.rotation);
        e.dataTransfer.setData('application/json', JSON.stringify({
            pieceId: piece.id,
            shape
        }));

        // Create a drag preview that represents the entire piece
        const dragPreview = document.createElement('div');
        dragPreview.className = 'piece-drag-preview';
        
        shape.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'preview-row';
            row.forEach(cell => {
                const cellDiv = document.createElement('div');
                cellDiv.className = `preview-cell ${cell ? 'filled' : ''}`;
                rowDiv.appendChild(cellDiv);
            });
            dragPreview.appendChild(rowDiv);
        });

        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 25, 25);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <div
            className={`piece ${isSelected ? 'selected' : ''} ${piece.position ? 'placed' : ''}`}
            onClick={onClick}
            draggable={!piece.position}
            onDragStart={handleDragStart}
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
                        />
                    ))
                )}
            </div>
        </div>
    );
};
