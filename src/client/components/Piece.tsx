import React from "react";
import { useTheme } from "@mui/material/styles";
import type { Piece as PieceType } from "../../common/types";
import { getTransformedShape } from "../../common/gameLogic";
import { getPieceShape } from "../../common/pieceData";
import { getPieceColor } from "../utils/pieceColors";
import { logToServer } from "../service/logService.js";
import { getScaledCellSize } from "../utils/measureUtils";
import { buildPieceTransform } from "../utils/pieceTransform";
import { useCumulativeRotation } from "../hooks/useCumulativeRotation";
import { PieceCell, PieceGrid, PieceWrapper } from "./Piece.styled";

interface PieceProps {
    piece: PieceType;
    onClick: () => void;
    onDragStart?: (pieceId: number) => void;
    onDragEnd?: () => void;
    /** Optional override for cell size in px (e.g. to match scaled board in carousel). */
    cellSizePx?: string;
    /**
     * When true, the piece wrapper is focusable via Tab and activatable with
     * Enter/Space. Enables keyboard-driven selection of pool pieces for the
     * tap-to-place flow. Disabled by default because DraggablePiece (mobile)
     * provides its own tabIndex/role via dnd-kit attributes.
     */
    keyboardSelectable?: boolean;
    /** Whether this piece is currently selected (for aria-pressed). */
    isSelected?: boolean;
}

export const Piece: React.FC<PieceProps> = ({ piece, onClick, onDragStart, onDragEnd, cellSizePx, keyboardSelectable = false, isSelected = false }) => {
    const theme = useTheme();
    
    // Cumulative rotation keeps the animation on the short way round
    // (avoids a jump back from 270° to 0°). The carousel thumbnail uses the same hook.
    const cumulativeRotation = useCumulativeRotation(piece.rotation);

    // Use base shape for visual rendering (CSS handles rotation/flip)
    const baseShape = getPieceShape(piece.id);
    const baseWidth = baseShape[0].length;
    const baseHeight = baseShape.length;
    
    // Still need transformed shape for drag preview (used for placement)
    const transformedShape = getTransformedShape(piece);

    // CSS transform that matches getTransformedShape (rotation → flipH → flipV)
    const transformStyle = buildPieceTransform(piece, cumulativeRotation);

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

        transformedShape.forEach((row) => {
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

    const keyboardProps = keyboardSelectable && !piece.position
        ? {
            tabIndex: 0,
            role: "button" as const,
            "aria-label": `Piece ${piece.id}${isSelected ? " (selected)" : ""}`,
            "aria-pressed": isSelected,
            onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }
        }
        : {};

    return (
        <PieceWrapper
            isPlaced={!!piece.position}
            onClick={onClick}
            draggable={!piece.position}
            onDragStart={handleDragStart}
            onDragEnd={() => onDragEnd?.()}
            data-piece-id={piece.id}
            data-testid={`piece-${piece.id}`}
            {...keyboardProps}
        >
            <PieceGrid
                columns={baseWidth}
                rows={baseHeight}
                transformStyle={transformStyle}
                cellSizePx={cellSizePx}
                data-testid="piece-grid"
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
