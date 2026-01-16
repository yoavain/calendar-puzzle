import React, { useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Piece as PieceType } from '../../common/types';
import { getTransformedShape, isEdgeCell, getEdgeDirections } from '../../common/gameLogic';

interface PieceProps {
    piece: PieceType;
    isSelected: boolean;
    onClick: () => void;
}

export const Piece: React.FC<PieceProps> = ({ piece, isSelected, onClick }) => {
    const shape = getTransformedShape(piece);
    const width = shape[0].length;
    const height = shape.length;
    
    // Track rotation/flip changes for animation
    const [isTransforming, setIsTransforming] = useState(false);
    const prevTransformRef = useRef({ rotation: piece.rotation, flipH: piece.isFlippedH, flipV: piece.isFlippedV });
    
    useEffect(() => {
        const prev = prevTransformRef.current;
        if (prev.rotation !== piece.rotation || prev.flipH !== piece.isFlippedH || prev.flipV !== piece.isFlippedV) {
            setIsTransforming(true);
            const timer = setTimeout(() => setIsTransforming(false), 200);
            prevTransformRef.current = { rotation: piece.rotation, flipH: piece.isFlippedH, flipV: piece.isFlippedV };
            return () => clearTimeout(timer);
        }
    }, [piece.rotation, piece.isFlippedH, piece.isFlippedV]);

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
        <Box
            className={`piece ${isSelected ? 'selected' : ''} ${piece.position ? 'placed' : ''}`}
            onClick={onClick}
            draggable={!piece.position}
            onDragStart={handleDragStart}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: 'calc(100% - 50px)', // Leave room for controls
                minHeight: 200,
            }}
        >
            <Box 
                className="piece-grid"
                sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${width}, var(--cell-size))`,
                    gridTemplateRows: `repeat(${height}, var(--cell-size))`,
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
                    transform: isTransforming ? 'scale(0.95)' : 'scale(1)',
                    opacity: isTransforming ? 0.8 : 1,
                }}
            >
                {shape.map((row, y) =>
                    row.map((cell, x) => {
                        let className = `piece-cell ${cell ? 'filled' : 'empty'}`;

                        if (cell && isEdgeCell(shape, x, y)) {
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
            </Box>
        </Box>
    );
};
