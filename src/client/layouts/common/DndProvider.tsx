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
import type { DragStartEvent, DragEndEvent, Modifier, ClientRect } from "@dnd-kit/core";
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
export function calculateCellFromPointer(
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
    const cellX = Math.floor(relativeX / scaledCellSize);
    const cellY = Math.floor(relativeY / scaledCellSize);
    
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
    
    // Store whether the piece being dragged is from the board
    const isFromBoardRef = useRef<boolean>(false);
    // Store the last pointer position for accurate drop calculation
    const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);
    // Store the board element ref for hover calculations
    const boardElementRef = useRef<HTMLElement | null>(null);
    // Store the initial click offset within the draggable element (for accurate overlay positioning)
    const initialClickOffsetRef = useRef<{ x: number; y: number } | null>(null);
    // Store the initial draggable element rect
    const initialDragRectRef = useRef<ClientRect | null>(null);
    const cellOffsetRef = useRef<{ x: number; y: number } | null>(null);
 
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
                    // Convert the pointer‑to‑element click offset into grid cells
                    // This tells us WHICH cell of the piece was clicked (e.g., 0,0 or 1,2)
                    const clickX = initialClickOffsetRef.current?.x ?? 0;
                    const clickY = initialClickOffsetRef.current?.y ?? 0;
                    
                    // We need to use the piece's own scale for this calculation
                    // If it's from the board, it's already boardScale.
                    // If it's from the carousel, it's scale(1) (but visual size might differ).
                    // However, PieceDragPreview is rendered at boardScale, and our clickOffset
                    // is relative to the draggable element's initial rect.
                    const scaledCellSize = theme.game.cellSize * boardScale;
                    
                    const cellOffset = {
                        x: Math.floor(clickX / scaledCellSize),
                        y: Math.floor(clickY / scaledCellSize)
                    };
                    
                    const piecePosition: Position = {
                        x: cellPosition.x - cellOffset.x,
                        y: cellPosition.y - cellOffset.y
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
    // 
    // Key insight: @dnd-kit's DragOverlay positions based on the draggable element's rect,
    // not the pointer position. The transform represents delta from initial pointer to current.
    // We need to account for:
    // 1. Where the user clicked within the draggable element
    // 2. The first filled cell position within the scaled piece
    const dragOverlayModifier: Modifier = useCallback(({ transform }) => {
        if (!activePiece) {
            return transform;
        }

        const cellOffset = cellOffsetRef.current;
        const clickOffset = initialClickOffsetRef.current;
        const initialRect = initialDragRectRef.current;

        if (cellOffset && clickOffset && initialRect) {
            const targetClickX = cellOffset.x * boardScale * theme.game.cellSize;
            const targetClickY = cellOffset.y * boardScale * theme.game.cellSize;
            return {
                ...transform,
                x: transform.x + (clickOffset.x - targetClickX),
                y: transform.y + (clickOffset.y - targetClickY)
            };
        }
        return transform;
    }, [activePiece, boardScale, theme.game.cellSize]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active, activatorEvent } = event;
        const pieceId = active.data.current?.pieceId as number | undefined;
        
        if (pieceId !== undefined) {
            const piece = pieces.find(p => p.id === pieceId);
            if (piece) {
                setActivePiece(piece);
                setIsDragging(true);
                
                // Capture initial pointer position and element rect for accurate overlay positioning
                let pointerX = 0;
                let pointerY = 0;
                
                if (activatorEvent instanceof PointerEvent || activatorEvent instanceof MouseEvent) {
                    pointerX = activatorEvent.clientX;
                    pointerY = activatorEvent.clientY;
                    lastPointerPositionRef.current = { x: pointerX, y: pointerY };
                }
                else if (activatorEvent instanceof TouchEvent && activatorEvent.touches[0]) {
                    pointerX = activatorEvent.touches[0].clientX;
                    pointerY = activatorEvent.touches[0].clientY;
                    lastPointerPositionRef.current = { x: pointerX, y: pointerY };
                }
                
                // Store the initial element rect and click offset
                // This is needed because DragOverlay positions based on element rect, not pointer
                const initialRect = active.rect.current.initial;
                isFromBoardRef.current = active.data.current?.fromBoard === true;

                if (initialRect) {
                    initialDragRectRef.current = initialRect;
                    // Calculate where the user clicked relative to the element's top-left
                    const clickOffset = {
                        x: pointerX - initialRect.left,
                        y: pointerY - initialRect.top
                    };
                    // Determine cell offset within the piece based on clickOffset and boardScale
                    const scaledCellSize = theme.game.cellSize * boardScale;
                    const cellOffset = {
                        x: Math.floor(clickOffset.x / scaledCellSize),
                        y: Math.floor(clickOffset.y / scaledCellSize)
                    };
                    // Validate that the clicked cell is filled in the piece
                    const shape = getTransformedShape(piece);
                    if (!shape[cellOffset.y] || !shape[cellOffset.y][cellOffset.x]) {
                        // Clicked on empty cell; abort drag
                        setActivePiece(null);
                        setIsDragging(false);
                        return;
                    }
                    // Store for later use
                    cellOffsetRef.current = cellOffset;
                }
                else {
                    // Fallback: use pointer position as offset if rect unavailable
                    initialDragRectRef.current = null;
                    initialClickOffsetRef.current = {
                        x: 0,
                        y: 0
                    };
                    cellOffsetRef.current = null;
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
                        // Convert the pointer‑to‑element click offset into grid cells
                            const cellOffset = cellOffsetRef.current || { x:0, y:0 };
                            dropPosition = {
                                x: cellPosition.x - cellOffset.x,
                                y: cellPosition.y - cellOffset.y
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
        initialClickOffsetRef.current = null;
        initialDragRectRef.current = null;
        isFromBoardRef.current = false;
        // Don't clear boardElementRef - it should persist for future drags
        onDragEnd?.();
    }, [onPieceDrop, onPieceRemove, onDragEnd, hoverPosition, boardScale, theme.game.cellSize]);

    const handleDragCancel = useCallback(() => {
        setActivePiece(null);
        setIsDragging(false);
        setHoverPosition(null);
        lastPointerPositionRef.current = null;
        initialClickOffsetRef.current = null;
        initialDragRectRef.current = null;
        isFromBoardRef.current = false;
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
