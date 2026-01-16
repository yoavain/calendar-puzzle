import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Piece as PieceType } from '../../common/types';
import { getTransformedShape, isEdgeCell, getEdgeDirections } from '../../common/gameLogic';
import { PieceWrapper, PieceGrid, PieceCell, EdgeDirections } from './Piece.styled';

interface PieceProps {
    piece: PieceType;
    isSelected: boolean;
    onClick: () => void;
}

export const Piece: React.FC<PieceProps> = ({ piece, isSelected, onClick }) => {
    const theme = useTheme();
    
    // Track cumulative rotation to ensure smooth clockwise animation
    // (avoids counter-clockwise jump when going from 270° to 0°)
    const prevRotation = useRef<number>(piece.rotation);
    const [cumulativeRotation, setCumulativeRotation] = useState<number>(piece.rotation);

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
        dragPreview.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 1000;
            display: grid;
            gap: 0;
            background-color: transparent;
        `;

        transformedShape.forEach((row, y) => {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display: flex; gap: 0;';
            row.forEach((cell, x) => {
                const cellDiv = document.createElement('div');
                cellDiv.style.cssText = `
                    width: ${theme.game.cellSize}px;
                    height: ${theme.game.cellSize}px;
                    border: none;
                `;

                if (cell) {
                    cellDiv.style.backgroundColor = theme.game.pieceColor;
                    const isEdge = isEdgeCell(transformedShape, x, y);
                    if (isEdge) {
                        const edgeDirections = getEdgeDirections(transformedShape, x, y);
                        if (edgeDirections.top) cellDiv.style.borderTop = `2px solid ${theme.game.pieceBorderColor}`;
                        if (edgeDirections.right) cellDiv.style.borderRight = `2px solid ${theme.game.pieceBorderColor}`;
                        if (edgeDirections.bottom) cellDiv.style.borderBottom = `2px solid ${theme.game.pieceBorderColor}`;
                        if (edgeDirections.left) cellDiv.style.borderLeft = `2px solid ${theme.game.pieceBorderColor}`;
                    }
                } else {
                    cellDiv.style.visibility = 'hidden';
                }

                rowDiv.appendChild(cellDiv);
            });
            dragPreview.appendChild(rowDiv);
        });

        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 25, 25);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <PieceWrapper
            isSelected={isSelected}
            isPlaced={!!piece.position}
            onClick={onClick}
            draggable={!piece.position}
            onDragStart={handleDragStart}
        >
            <PieceGrid
                columns={baseWidth}
                rows={baseHeight}
                transformStyle={transformStyle}
            >
                {baseShape.map((row, y) =>
                    row.map((cell, x) => {
                        // Calculate edges based on base shape
                        let edges: EdgeDirections | undefined;
                        if (cell && isEdgeCell(baseShape, x, y)) {
                            edges = getEdgeDirections(baseShape, x, y);
                        }

                        return (
                            <PieceCell
                                key={`${x}-${y}`}
                                isFilled={cell}
                                edges={edges}
                            />
                        );
                    })
                )}
            </PieceGrid>
        </PieceWrapper>
    );
};
