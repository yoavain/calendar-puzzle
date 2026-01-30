import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Piece as PieceType } from "../../common/types";

interface DraggableBoardCellProps {
    /** The piece this cell belongs to */
    piece: PieceType;
    /** Whether dragging is enabled */
    isDraggable: boolean;
    /** Children to render */
    children: React.ReactNode;
}

/**
 * Wrapper that makes a board cell draggable when it contains a placed piece.
 * All cells of the same piece share the same piece data for drag operations.
 */
export const DraggableBoardCell: React.FC<DraggableBoardCellProps> = ({
    piece,
    isDraggable,
    children
}) => {
    const canDrag = isDraggable && !piece.isLocked;
    
    const {
        attributes,
        listeners,
        setNodeRef,
        isDragging
    } = useDraggable({
        id: `board-piece-${piece.id}`,
        data: {
            type: "piece",
            pieceId: piece.id,
            piece,
            fromBoard: true // Flag to indicate this piece is being dragged from the board
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
