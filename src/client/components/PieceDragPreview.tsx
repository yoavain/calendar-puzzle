import React from "react";
import { styled } from "@mui/material/styles";
import type { Piece as PieceType } from "../../common/types";
import { getTransformedShape } from "../../common/gameLogic";
import { getPieceColor } from "../utils/pieceColors";

interface PieceDragPreviewProps {
    piece: PieceType;
}

/**
 * Grid container for the drag preview.
 */
const PreviewGrid = styled("div")<{ columns: number; rows: number }>(
    ({ theme, columns, rows }) => ({
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, ${theme.game.cellSizePx})`,
        gridTemplateRows: `repeat(${rows}, ${theme.game.cellSizePx})`,
        gap: 0,
        backgroundColor: "transparent",
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        opacity: 0.9,
        pointerEvents: "none"
    })
);

/**
 * Individual cell in the drag preview.
 */
const PreviewCell = styled("div")<{ isFilled: boolean; pieceId: number }>(
    ({ theme, isFilled, pieceId }) => ({
        width: theme.game.cellSizePx,
        height: theme.game.cellSizePx,
        border: "none",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        visibility: isFilled ? "visible" : "hidden",
        backgroundColor: isFilled ? getPieceColor(pieceId) : "transparent",
        backgroundImage: isFilled
            ? "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
            : "none",
        // Prevent sub-pixel gaps
        boxShadow: isFilled ? `inset 0 0 0 1px ${getPieceColor(pieceId)}` : "none"
    })
);

/**
 * Drag preview component rendered inside DragOverlay.
 * Shows the transformed piece shape following the cursor/finger.
 */
export const PieceDragPreview: React.FC<PieceDragPreviewProps> = ({ piece }) => {
    // Get the transformed shape for rendering
    const transformedShape = getTransformedShape(piece);
    const rows = transformedShape.length;
    const columns = transformedShape[0]?.length ?? 0;

    return (
        <PreviewGrid columns={columns} rows={rows}>
            {transformedShape.map((row, y) =>
                row.map((cell, x) => (
                    <PreviewCell
                        key={`${x}-${y}`}
                        isFilled={cell}
                        pieceId={piece.id}
                    />
                ))
            )}
        </PreviewGrid>
    );
};
