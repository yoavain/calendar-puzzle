import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import type { Piece as PieceType } from "../../common/types";
import { getTransformedShape } from "../../common/gameLogic";
import { getPieceShape } from "../../common/pieceData";
import { getPieceColor } from "../utils/pieceColors";
import { logToServer } from "../service/logService.js";
import { getScaledCellSize } from "../utils/measureUtils";
import { PieceCell, PieceGrid, PieceWrapper } from "./Piece.styled";

interface PieceProps {
    piece: PieceType;
    onClick: () => void;
    onDragStart?: (pieceId: number) => void;
    onDragEnd?: () => void;
    /** Optional override for cell size in px (e.g. to match scaled board in carousel). */
    cellSizePx?: string;
}

export const Piece: React.FC<PieceProps> = ({ piece, onClick, onDragStart, onDragEnd, cellSizePx }) => {
    const theme = useTheme();
    
    // Track cumulative rotation to ensure smooth clockwise animation
    // (avoids counter-clockwise jump when going from 270° to 0°)
    const prevRotation = useRef<number>(piece.rotation);
    const [cumulativeRotation, setCumulativeRotation] = useState<number>(piece.rotation);

    useEffect(() => {
        const prev = prevRotation.current;
        const curr = piece.rotation;

        if (prev !== curr) {
            // Calculate the delta, detecting shortest rotation path (CW or CCW)
            const cwDelta = (curr - prev + 360) % 360; // Clockwise distance
            const ccwDelta = (prev - curr + 360) % 360; // Counter-clockwise distance
            
            // Choose the shorter path
            let delta: number;
            if (cwDelta <= ccwDelta) {
                // Clockwise is shorter or equal
                delta = cwDelta;
            }
            else {
                // Counter-clockwise is shorter (use negative delta)
                delta = -ccwDelta;
            }
            
            // When exactly one flip is active (XOR), the CSS scale transform reverses
            // the visual rotation direction. However, we now handle this by inverting
            // the logical rotation in the Game state handlers, so the visual rotation
            // here should always follow the logical rotation to stay in sync.
            const adjustedDelta = delta;
            
            setCumulativeRotation(r => r + adjustedDelta);
            prevRotation.current = curr;
        }
    }, [piece.rotation]);

    // Use base shape for visual rendering (CSS handles rotation/flip)
    const baseShape = getPieceShape(piece.id);
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
    ].join(" ");

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        // Notify parent that drag started
        onDragStart?.(piece.id);

        let firstFilledX = -1;
        let firstFilledY = -1;
        outerLoop: for (let y = 0; y < transformedShape.length; y++) {
            for (let x = 0; x < transformedShape[y].length; x++) {
                if (transformedShape[y][x]) {
                    firstFilledX = x;
                    firstFilledY = y;
                    break outerLoop;
                }
            }
        }
        // Calculate scale by measuring an actual board cell
        const scaledCellSizeForOffset = getScaledCellSize(theme.game.cellSize, theme.game.cellSizePx);

        const offsetX = (firstFilledX * scaledCellSizeForOffset) + (scaledCellSizeForOffset / 2);
        const offsetY = (firstFilledY * scaledCellSizeForOffset) + (scaledCellSizeForOffset / 2);

        const data = JSON.stringify({
            pieceId: piece.id
        });
        
        try {
            e.dataTransfer.setData("text/plain", data);
            e.dataTransfer.effectAllowed = "move"; // Set effectAllowed
        }
        catch (err) {
            logToServer("error", "Piece: Failed to set drag data", err);
        }

        // Create a drag preview that represents the transformed piece
        const dragPreview = document.createElement("div");
        dragPreview.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 1000;
            display: grid;
            gap: 0;
            background-color: transparent;
        `;

        transformedShape.forEach((row, y) => {
            const rowDiv = document.createElement("div");
            rowDiv.style.cssText = "display: flex; gap: 0;";
            row.forEach((cell) => {
                const cellDiv = document.createElement("div");

                cellDiv.style.cssText = `
                    width: ${scaledCellSizeForOffset}px;
                    height: ${scaledCellSizeForOffset}px;
                    border: none;
                `;

                if (cell) {
                    cellDiv.style.backgroundColor = getPieceColor(piece.id);
                }
                else {
                    cellDiv.style.visibility = "hidden";
                }

                rowDiv.appendChild(cellDiv);
            });
            dragPreview.appendChild(rowDiv);
        });

        document.body.appendChild(dragPreview);
        
        e.dataTransfer.setDragImage(dragPreview, offsetX, offsetY);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <PieceWrapper
            isPlaced={!!piece.position}
            onClick={onClick}
            draggable={!piece.position}
            onDragStart={handleDragStart}
            onDragEnd={() => onDragEnd?.()}
            data-piece-id={piece.id}
            data-testid={`piece-${piece.id}`}
        >
            <PieceGrid
                columns={baseWidth}
                rows={baseHeight}
                transformStyle={transformStyle}
                cellSizePx={cellSizePx}
            >
                {baseShape.map((row, y) =>
                    row.map((cell, x) => (
                        <PieceCell
                            key={`${x}-${y}`}
                            isFilled={cell}
                            pieceId={piece.id}
                            cellSizePx={cellSizePx}
                        />
                    ))
                )}
            </PieceGrid>
        </PieceWrapper>
    );
};
