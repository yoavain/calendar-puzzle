import React, { useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Piece as PieceType } from '../../common/types';
import { getTransformedShape, isEdgeCell, getEdgeDirections } from '../../common/gameLogic';

interface PieceProps {
    piece: PieceType;
    isSelected: boolean;
    onClick: () => void;
}

export const Piece: React.FC<PieceProps> = ({ piece, isSelected, onClick }) => {
    // Track cumulative rotation to ensure smooth clockwise animation
    // (avoids counter-clockwise jump when going from 270° to 0°)
    const prevRotation = useRef(piece.rotation);
    const [cumulativeRotation, setCumulativeRotation] = useState(piece.rotation);

    useEffect(() => {
        const prev = prevRotation.current;
        const curr = piece.rotation;

        if (prev !== curr) {
            // Calculate the delta, ensuring always clockwise rotation
            let delta = curr - prev;
            if (delta < 0) {
                // Wrapping from 270 to 0 means we need +90, not -270
                delta += 360;
            }
            setCumulativeRotation(r => r + delta);
            prevRotation.current = curr;
        }
    }, [piece.rotation]);

    // Use base shape for visual rendering (CSS handles rotation/flip)
    const baseShape = piece.shape;
    const baseWidth = baseShape[0].length;
    const baseHeight = baseShape.length;
    
    // Still need transformed shape for drag preview (used for placement)
    const transformedShape = getTransformedShape(piece);

    // Build CSS transform string
    // CSS applies transforms RIGHT-TO-LEFT, so we need to reverse the order
    // to match getTransformedShape which applies: rotation → flipH → flipV
    // Always include all transforms to maintain consistent structure for smooth animations
    const transformStyle = [
        `scaleY(${piece.isFlippedV ? -1 : 1})`,
        `scaleX(${piece.isFlippedH ? -1 : 1})`,
        `rotate(${cumulativeRotation}deg)`
    ].join(' ');

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        // Use transformed shape for drag preview (for accurate placement)
        e.dataTransfer.setData('application/json', JSON.stringify({
            pieceId: piece.id,
            shape: transformedShape
        }));

        // Create a drag preview that represents the transformed piece
        const dragPreview = document.createElement('div');
        dragPreview.className = 'piece-drag-preview';

        transformedShape.forEach((row, y) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'preview-row';
            row.forEach((cell, x) => {
                const cellDiv = document.createElement('div');
                let className = `preview-cell ${cell ? 'filled' : ''}`;

                if (cell) {
                    const isEdge = isEdgeCell(transformedShape, x, y);
                    if (isEdge) {
                        const edgeDirections = getEdgeDirections(transformedShape, x, y);
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
                height: 'calc(100% - 50px)',
                minHeight: 200,
            }}
        >
            <Box 
                className="piece-grid"
                sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${baseWidth}, var(--cell-size))`,
                    gridTemplateRows: `repeat(${baseHeight}, var(--cell-size))`,
                    // Smooth CSS rotation/flip animation
                    transform: transformStyle,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {baseShape.map((row, y) =>
                    row.map((cell, x) => {
                        let className = `piece-cell ${cell ? 'filled' : 'empty'}`;

                        // Calculate edges based on base shape
                        if (cell && isEdgeCell(baseShape, x, y)) {
                            const edgeDirections = getEdgeDirections(baseShape, x, y);
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
