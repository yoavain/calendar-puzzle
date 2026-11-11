import React from "react";
import { getTransformedShape } from "../../common/gameLogic";
import { PIECE_IDS, type PieceId } from "../../common/pieceData";
import type { Piece } from "../../common/types";
import { getPieceColor } from "../utils/pieceColors";
import { ThumbnailButton } from "./PieceThumbnail.styled";

/** Cells along one side of the thumbnail grid. The tallest piece is 4 cells, in every orientation. */
const GRID_CELLS = 4;

interface PieceThumbnailProps {
    /** The piece to draw. The thumbnail follows its rotation and flips, also after the piece is placed. */
    piece: Piece;
    /** The piece the carousel is showing now. */
    isActive: boolean;
    /** The piece is on the board, so the carousel does not hold it. */
    isPlaced: boolean;
    onSelect: (pieceId: PieceId) => void;
}

/**
 * Tab button of the carousel strip. Draws the piece's own shape in its own colour,
 * in its current orientation. A placed piece is dimmed, keeps the orientation it has
 * on the board, and does nothing when tapped.
 */
export const PieceThumbnail: React.FC<PieceThumbnailProps> = ({ piece, isActive, isPlaced, onSelect }) => {
    const shape = getTransformedShape(piece);
    const color = getPieceColor(piece.id);
    const offsetX = (GRID_CELLS - shape[0].length) / 2;
    const offsetY = (GRID_CELLS - shape.length) / 2;
    // A cell is identified by its grid position within this orientation.
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
            aria-label={`Piece ${piece.id} of ${PIECE_IDS.length}${isPlaced ? ", placed" : ""}`}
            aria-selected={isActive}
            aria-disabled={isPlaced || undefined}
            tabIndex={isPlaced ? -1 : 0}
            onClick={() => {
                if (!isPlaced) {
                    onSelect(piece.id);
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
