import React from "react";
import { getPieceShape, PIECE_IDS, type PieceId } from "../../common/pieceData";
import { getPieceColor } from "../utils/pieceColors";
import { ThumbnailButton } from "./PieceThumbnail.styled";

/** Cells along one side of the thumbnail grid. The tallest piece is 4 cells. */
const GRID_CELLS = 4;

interface PieceThumbnailProps {
    pieceId: PieceId;
    /** The piece the carousel is showing now. */
    isActive: boolean;
    /** The piece is on the board, so the carousel does not hold it. */
    isPlaced: boolean;
    onSelect: (pieceId: PieceId) => void;
}

/**
 * Tab button of the carousel strip. Draws the piece's own shape in its own colour,
 * in the start orientation, so it does not change when the player rotates or flips.
 * A placed piece is dimmed and does nothing when tapped.
 */
export const PieceThumbnail: React.FC<PieceThumbnailProps> = ({ pieceId, isActive, isPlaced, onSelect }) => {
    const shape = getPieceShape(pieceId);
    const color = getPieceColor(pieceId);
    const offsetX = (GRID_CELLS - shape[0].length) / 2;
    const offsetY = (GRID_CELLS - shape.length) / 2;
    // A cell is identified by its grid position, which never changes for a piece.
    const cells: { x: number; y: number }[] = [];
    shape.forEach((row, y) => row.forEach((filled, x) => {
        if (filled) {
            cells.push({ x, y });
        }
    }));

    return (
        <ThumbnailButton
            type="button"
            role="tab"
            isActive={isActive}
            isPlaced={isPlaced}
            aria-label={`Piece ${pieceId} of ${PIECE_IDS.length}${isPlaced ? ", placed" : ""}`}
            aria-selected={isActive}
            aria-disabled={isPlaced || undefined}
            tabIndex={isPlaced ? -1 : 0}
            onClick={() => {
                if (!isPlaced) {
                    onSelect(pieceId);
                }
            }}
        >
            <svg
                viewBox={`0 0 ${GRID_CELLS} ${GRID_CELLS}`}
                width="80%"
                height="80%"
                shapeRendering="crispEdges"
                aria-hidden="true"
                focusable="false"
            >
                {cells.map(({ x, y }) => (
                    <rect key={`${x}-${y}`} x={x + offsetX} y={y + offsetY} width={1} height={1} fill={color} />
                ))}
            </svg>
        </ThumbnailButton>
    );
};
