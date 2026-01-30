import React, { useState, useCallback, useMemo, useRef, useEffect, createContext, useContext } from "react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    pointerWithin,
    rectIntersection
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, Modifier } from "@dnd-kit/core";
import { useTheme } from "@mui/material/styles";
import type { Piece as PieceType, Position } from "../../../common/types";
import { getTransformedShape } from "../../../common/gameLogic";
import { PieceDragPreview } from "../../components/PieceDragPreview";

/**
 * Context for sharing drag state with board components.
 */
interface DragStateContextValue {
    /** The piece currently being dragged */
    draggedPiece: PieceType | null;
    /** The position where the piece would be placed if dropped now */
    hoverPosition: Position | null;
    /** Register the board element for position calculations */
    registerBoardElement: (element: HTMLElement | null) => void;
}

const DragStateContext = createContext<DragStateContextValue>({
    draggedPiece: null,
    hoverPosition: null,
    registerBoardElement: () => {}
});

/**
 * Hook to access drag state in board components.
 */
export function useDragState(): DragStateContextValue {
    return useContext(DragStateContext);
}

interface DndProviderProps {
    children: React.ReactNode;
    /** All pieces in the game */
    pieces: PieceType[];
    /** Handler when a piece is dropped on a cell */
    onPieceDrop: (position: Position, pieceId: number) => void;
    /** Handler when a piece is removed from the board (dropped outside) */
    onPieceRemove?: (pieceId: number) => void;
    /** Handler when drag starts */
    onDragStart?: (pieceId: number) => void;
    /** Handler when drag ends (regardless of drop success) */
    onDragEnd?: () => void;
    /** Scale factor applied to the board (for drag preview sizing) */
    boardScale: number;
}

/**
 * Provides drag-and-drop context for the mobile layout.
 * 
 * Uses @dnd-kit with configured sensors for both touch and mouse:
 * - PointerSensor: 8px movement threshold before drag starts
 * - TouchSensor: 200ms delay to distinguish from carousel swipe
 * 
 * The DragOverlay renders a preview of the piece being dragged.
 */
/**
 * Find the first filled cell in a piece's transformed shape.
 * This is used to calculate the offset for accurate drop positioning.
 */
function findFirstFilledCell(piece: PieceType): { x: number; y: number } {
    const shape = getTransformedShape(piece);
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                return { x, y };
            }
        }
    }
    return { x: 0, y: 0 };
}

/**
 * Calculate the cell position from pointer coordinates, accounting for board scale.
 */
function calculateCellFromPointer(
    pointerX: number,
    pointerY: number,
    boardElement: HTMLElement,
    scale: number,
    cellSize: number
): Position | null {
    const boardRect = boardElement.getBoundingClientRect();
    
    // Calculate position relative to board, accounting for scale
    // The board rect is in scaled coordinates, so we need to work with that
    const relativeX = pointerX - boardRect.left;
    const relativeY = pointerY - boardRect.top;
    
    // The cell size in screen pixels (scaled)
    const scaledCellSize = cellSize * scale;
    
    // Calculate cell coordinates
    // Board has 1-cell padding, so subtract 1 from the result
    const cellX = Math.floor(relativeX / scaledCellSize) - 1;
    const cellY = Math.floor(relativeY / scaledCellSize) - 1;
    
    // Validate bounds (board is 7x7 playable area)
    if (cellX < 0 || cellX > 6 || cellY < 0 || cellY > 6) {
        return null;
    }
    
    return { x: cellX, y: cellY };
}

export const DndProvider: React.FC<DndProviderProps> = ({
    children,
    pieces,
    onPieceDrop,
    onPieceRemove,
    onDragStart,
    onDragEnd,
    boardScale
}) => {
    const theme = useTheme();
    const [activePiece, setActivePiece] = useState<PieceType | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverPosition, setHoverPosition] = useState<Position | null>(null);
    
    // Store the last pointer position for accurate drop calculation
    const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);
    // Store the board element ref for hover calculations
    const boardElementRef = useRef<HTMLElement | null>(null);

    // Track pointer position globally during drag using event listeners
    // Also calculate hover position for board preview
    useEffect(() => {
        if (!isDragging || !activePiece) {
            setHoverPosition(null);
            return;
        }

        const updatePosition = (clientX: number, clientY: number) => {
            lastPointerPositionRef.current = { x: clientX, y: clientY };
            
            // Calculate hover cell position for board preview
            const boardElement = boardElementRef.current;
            if (boardElement) {
                const cellPosition = calculateCellFromPointer(
                    clientX,
                    clientY,
                    boardElement,
                    boardScale,
                    theme.game.cellSize
                );
                
                if (cellPosition) {
                    // Adjust for first filled cell offset to get piece top-left
                    const firstCell = findFirstFilledCell(activePiece);
                    const piecePosition: Position = {
                        x: cellPosition.x - firstCell.x,
                        y: cellPosition.y - firstCell.y
                    };
                    setHoverPosition(piecePosition);
                }
                else {
                    setHoverPosition(null);
                }
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            updatePosition(e.clientX, e.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (touch) {
                updatePosition(touch.clientX, touch.clientY);
            }
        };

        // Add listeners with passive: true for better scroll performance
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: true });

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("touchmove", handleTouchMove);
            setHoverPosition(null);
        };
    }, [isDragging, activePiece, boardScale, theme.game.cellSize]);

    // Configure sensors with activation constraints
    // TouchSensor has a delay so quick swipes scroll the carousel
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8 // 8px movement before drag starts
            }
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms hold before drag starts
                tolerance: 5 // 5px movement allowed during delay
            }
        })
    );

    // Calculate drag overlay offset to position piece so first filled cell is at pointer
    // The overlay is scaled to match the board, so we use scaled cell size
    const dragOverlayModifier: Modifier = useMemo(() => {
        if (!activePiece) {
            return ({ transform }) => transform;
        }

        const firstCell = findFirstFilledCell(activePiece);
        // Use scaled cell size since we're scaling the DragOverlay to match the board
        const scaledCellSize = theme.game.cellSize * boardScale;
        
        // Offset the overlay so the center of the first filled cell is at the pointer
        const offsetX = (firstCell.x * scaledCellSize) + (scaledCellSize / 2);
        const offsetY = (firstCell.y * scaledCellSize) + (scaledCellSize / 2);

        return ({ transform }) => ({
            ...transform,
            x: transform.x - offsetX,
            y: transform.y - offsetY
        });
    }, [activePiece, theme.game.cellSize, boardScale]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active, activatorEvent } = event;
        const pieceId = active.data.current?.pieceId as number | undefined;
        
        if (pieceId !== undefined) {
            const piece = pieces.find(p => p.id === pieceId);
            if (piece) {
                setActivePiece(piece);
                setIsDragging(true);
                
                // Capture initial pointer position
                if (activatorEvent instanceof PointerEvent || activatorEvent instanceof MouseEvent) {
                    lastPointerPositionRef.current = { 
                        x: activatorEvent.clientX, 
                        y: activatorEvent.clientY 
                    };
                }
                else if (activatorEvent instanceof TouchEvent && activatorEvent.touches[0]) {
                    lastPointerPositionRef.current = { 
                        x: activatorEvent.touches[0].clientX, 
                        y: activatorEvent.touches[0].clientY 
                    };
                }
                
                onDragStart?.(pieceId);
            }
        }
    }, [pieces, onDragStart]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        const pieceData = active.data.current;
        
        if (pieceData?.type === "piece") {
            const pieceId = pieceData.pieceId as number;
            const piece = pieceData.piece as PieceType;
            const fromBoard = pieceData.fromBoard as boolean | undefined;
            
            if (over) {
                const dropData = over.data.current;
                
                // Check if dropped on the board
                if (dropData?.type === "board") {
                    // Use hoverPosition if available, otherwise calculate from last pointer position
                    let dropPosition = hoverPosition;
                    
                    if (!dropPosition && lastPointerPositionRef.current && boardElementRef.current) {
                        // Fallback: calculate position now
                        const cellPosition = calculateCellFromPointer(
                            lastPointerPositionRef.current.x,
                            lastPointerPositionRef.current.y,
                            boardElementRef.current,
                            boardScale,
                            theme.game.cellSize
                        );
                        
                        if (cellPosition) {
                            const firstCell = findFirstFilledCell(piece);
                            dropPosition = {
                                x: cellPosition.x - firstCell.x,
                                y: cellPosition.y - firstCell.y
                            };
                        }
                    }
                    
                    if (dropPosition) {
                        onPieceDrop(dropPosition, pieceId);
                    }
                }
                // If dropped elsewhere (not on board), and piece was from board, remove it
                else if (fromBoard && onPieceRemove) {
                    onPieceRemove(pieceId);
                }
            }
            else {
                // Dropped outside any droppable area
                // If piece was from board, remove it (return to carousel)
                if (fromBoard && onPieceRemove) {
                    onPieceRemove(pieceId);
                }
            }
        }
        
        setActivePiece(null);
        setIsDragging(false);
        setHoverPosition(null);
        lastPointerPositionRef.current = null;
        // Don't clear boardElementRef - it should persist for future drags
        onDragEnd?.();
    }, [onPieceDrop, onPieceRemove, onDragEnd, hoverPosition, boardScale, theme.game.cellSize]);

    const handleDragCancel = useCallback(() => {
        setActivePiece(null);
        setIsDragging(false);
        setHoverPosition(null);
        lastPointerPositionRef.current = null;
        onDragEnd?.();
    }, [onDragEnd]);

    // Register board element for position calculations
    const registerBoardElement = useCallback((element: HTMLElement | null) => {
        boardElementRef.current = element;
    }, []);

    // Custom collision detection that prioritizes the board
    const collisionDetection = useCallback((args: Parameters<typeof pointerWithin>[0]) => {
        // First try pointer within (most precise)
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }
        // Fall back to rect intersection
        return rectIntersection(args);
    }, []);

    // Context value for sharing drag state with board
    const dragStateValue = useMemo<DragStateContextValue>(() => ({
        draggedPiece: activePiece,
        hoverPosition,
        registerBoardElement
    }), [activePiece, hoverPosition, registerBoardElement]);

    return (
        <DragStateContext.Provider value={dragStateValue}>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                {children}
                
                <DragOverlay 
                    dropAnimation={null}
                    modifiers={[dragOverlayModifier]}
                >
                    {activePiece ? (
                        <div style={{ transform: `scale(${boardScale})`, transformOrigin: "top left" }}>
                            <PieceDragPreview piece={activePiece} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </DragStateContext.Provider>
    );
};
