import React from 'react';
import { Piece as PieceType, DragItem } from '../types/types';
import { getTransformedShape } from '../utils/gameLogic';

interface PieceProps {
    piece: PieceType;
    isSelected: boolean;
    onClick: () => void;
}

const Piece: React.FC<PieceProps> = ({ piece, isSelected, onClick }) => {
    const gridSize = 30; // pixels per cell
    const transformedShape = getTransformedShape(piece);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const dragItem: DragItem = {
            pieceId: piece.id,
            shape: transformedShape
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
        
        // Create a preview image
        const elem = e.currentTarget.cloneNode(true) as HTMLElement;
        elem.style.position = 'absolute';
        elem.style.top = '-1000px';
        document.body.appendChild(elem);
        e.dataTransfer.setDragImage(elem, gridSize, gridSize);
        setTimeout(() => document.body.removeChild(elem), 0);

        // If piece is placed, remove it from the board
        if (piece.position) {
            onClick(); // This will trigger handlePiecePickup
        }
    };

    return (
        <div 
            className={`piece ${isSelected ? 'selected' : ''} ${piece.position ? 'placed' : ''}`}
            onClick={onClick}
            draggable={true}
            onDragStart={handleDragStart}
            style={{
                display: 'inline-grid',
                gridTemplateRows: `repeat(${transformedShape.length}, ${gridSize}px)`,
                gridTemplateColumns: `repeat(${transformedShape[0].length}, ${gridSize}px)`,
                cursor: piece.position ? 'move' : 'grab',
                margin: '10px',
                opacity: piece.position ? 0.7 : 1
            }}
        >
            {transformedShape.map((row, i) => 
                row.map((cell, j) => (
                    <div
                        key={`${i}-${j}`}
                        style={{
                            width: gridSize,
                            height: gridSize,
                            backgroundColor: cell ? '#666' : 'transparent',
                            border: cell ? '1px solid #999' : 'none'
                        }}
                    />
                ))
            )}
        </div>
    );
};

export default Piece; 