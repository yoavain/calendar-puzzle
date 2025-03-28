import React from 'react';
import { Piece as PieceType } from '../types/types';
import { getTransformedShape, isEdgeCell, getEdgeDirections } from '../utils/gameLogic';

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
        e.dataTransfer.setData('application/json', JSON.stringify({
            pieceId: piece.id,
            shape
        }));

        // Create a drag preview that represents the entire piece
        const dragPreview = document.createElement('div');
        dragPreview.className = 'piece-drag-preview';

        shape.forEach((row, y) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'preview-row';
            row.forEach((cell, x) => {
                const cellDiv = document.createElement('div');
                let className = `preview-cell ${cell ? 'filled' : ''}`;

                if (cell) {
                    const isEdge = isEdgeCell(shape, x, y);
                    if (isEdge) {
                        // Add direction-specific edge classes
                        const edgeDirections = getEdgeDirections(shape, x, y);
                        if (edgeDirections.top) className += ' edge-top';
                        if (edgeDirections.right) className += ' edge-right';
                        if (edgeDirections.bottom) className += ' edge-bottom';
                        if (edgeDirections.left) className += ' edge-left';
                    }
                }

                cellDiv.className = className;
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
                    row.map((cell, x) => {
                        let className = `piece-cell ${cell ? 'filled' : 'empty'}`;

                        if (cell && isEdgeCell(shape, x, y)) {
                            // Add direction-specific edge classes
                            const edgeDirections = getEdgeDirections(shape, x, y);
                            if (edgeDirections.top) className += ' edge-top';
                            if (edgeDirections.right) className += ' edge-right';
                            if (edgeDirections.bottom) className += ' edge-bottom';
                            if (edgeDirections.left) className += ' edge-left';
                        }

                        return (
                            <div
                                key={`${x}-${y}`}
                                className={className}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
