import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableCellProps {
    /** Position x coordinate */
    x: number;
    /** Position y coordinate */
    y: number;
    /** Whether this cell can accept drops */
    isDroppable?: boolean;
    /** Children to render inside the droppable area */
    children: React.ReactNode;
    /** Optional className for styling */
    className?: string;
}

/**
 * Wrapper component that makes a board cell droppable using @dnd-kit.
 * Each cell has a unique ID based on its grid position.
 * 
 * Provides isOver state for visual feedback when a draggable
 * item is hovering over this cell.
 */
export const DroppableCell: React.FC<DroppableCellProps> = ({
    x,
    y,
    isDroppable = true,
    children,
    className
}) => {
    const {
        setNodeRef,
        isOver,
        active
    } = useDroppable({
        id: `cell-${x}-${y}`,
        data: {
            type: "cell",
            position: { x, y }
        },
        disabled: !isDroppable
    });

    // Check if a piece is being dragged over this cell
    const isDragOver = isOver && active?.data?.current?.type === "piece";

    return (
        <div
            ref={setNodeRef}
            className={className}
            data-drag-over={isDragOver}
            style={{ position: "relative" }}
        >
            {children}
        </div>
    );
};

/**
 * Hook to get droppable props for a cell without the wrapper component.
 * Useful when you need more control over the cell rendering.
 */
export function useCellDroppable(x: number, y: number, isDroppable = true) {
    return useDroppable({
        id: `cell-${x}-${y}`,
        data: {
            type: "cell",
            position: { x, y }
        },
        disabled: !isDroppable
    });
}
