import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Piece as PieceType } from "../../common/types";
import { Piece } from "./Piece";

interface DraggablePieceProps {
    piece: PieceType;
    isSelected: boolean;
    onClick: () => void;
    /** If true, this piece can be dragged */
    isDraggable?: boolean;
    /** If true, hides the selection border (useful in carousel where only one piece is visible) */
    hideSelectionBorder?: boolean;
    /** Optional override for cell size in px (e.g. to match scaled board in carousel). */
    cellSizePx?: string;
}

/**
 * Wrapper component that makes a Piece draggable using @dnd-kit.
 * Works with both touch and mouse input.
 * 
 * The drag data includes the pieceId which is used by droppable
 * cells to determine placement.
 */
export const DraggablePiece: React.FC<DraggablePieceProps> = ({
    piece,
    isSelected,
    onClick,
    isDraggable = true,
    hideSelectionBorder = false,
    cellSizePx
}) => {
    const canDrag = isDraggable && !piece.position;
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useDraggable({
        id: `piece-${piece.id}`,
        data: {
            type: "piece",
            pieceId: piece.id,
            piece
        },
        disabled: !canDrag
    });

    // Apply transform during drag
    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        // Hide the original piece while dragging (DragOverlay shows the preview)
        opacity: isDragging ? 0.3 : 1,
        touchAction: canDrag ? "none" : "auto" // Prevent scroll interference when draggable
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-piece-id={piece.id}
            data-testid={`carousel-piece-${piece.id}`}
            {...(canDrag ? { ...listeners, ...attributes } : {})}
        >
            <Piece
                piece={piece}
                isSelected={isSelected}
                onClick={onClick}
                hideSelectionBorder={hideSelectionBorder}
                cellSizePx={cellSizePx}
            />
        </div>
    );
};
