import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Piece as PieceType } from "../../common/types";

interface DraggableBoardCellProps {
    /** The piece this cell belongs to */
    piece: PieceType;
    /** Whether dragging is enabled */
    isDraggable: boolean;
    /** Anchor cell in piece coordinates (cell that was touched). Required for correct hover/drop. */
    anchorInPiece: { x: number; y: number };
    /** Children to render */
    children: React.ReactNode;
}

/**
 * Makes a board cell draggable when it contains a placed piece.
 * Anchor is supplied by the parent so DndProvider can use it for hover and drop.
 */
export const DraggableBoardCell: React.FC<DraggableBoardCellProps> = ({
    piece,
    isDraggable,
    anchorInPiece,
    children
}) => {
    const canDrag = isDraggable && !piece.isLocked;

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `board-piece-${piece.id}-at-${anchorInPiece.x}-${anchorInPiece.y}`,
        data: {
            type: "piece",
            pieceId: piece.id,
            piece,
            fromBoard: true,
            anchorX: anchorInPiece.x,
            anchorY: anchorInPiece.y
        },
        disabled: !canDrag
    });

    const style: React.CSSProperties = {
        opacity: isDragging ? 0.3 : 1,
        cursor: canDrag ? "grab" : "default",
        touchAction: canDrag ? "none" : "auto"
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...(canDrag ? { ...listeners, ...attributes } : {})}
        >
            {children}
        </div>
    );
};
