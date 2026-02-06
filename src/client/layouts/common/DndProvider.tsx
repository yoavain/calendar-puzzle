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
    // Store the board grid origin at drag start for snapping overlay to board grid
    const boardGridOriginRef = useRef<{ left: number; top: number; gridOriginX: number; gridOriginY: number } | null>(null);
 
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
                    // Use the pre-computed cellOffset from handleDragStart
                    // (which accounts for the piece's own DOM dimensions,
                    //  not the board's scaled cell size).
                    const cellOffset = cellOffsetRef.current ?? { x: 0, y: 0 };
                    
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
    // Snap the DragOverlay so each piece cell aligns with the
    // corresponding board cell. This eliminates the sub-cell offset
    // between the overlay and the hover preview (shadow).
    const dragOverlayModifier: Modifier = useCallback(({ transform }) => {
        if (!activePiece) {
            return transform;
        }

        const cellOffset = cellOffsetRef.current;
        const clickOffset = initialClickOffsetRef.current;
        const initialRect = initialDragRectRef.current;
        const boardInfo = boardGridOriginRef.current;

        if (cellOffset && clickOffset && initialRect && boardInfo) {
            const scaledCellSize = boardScale * theme.game.cellSize;

            // Reconstruct current pointer position
            const pointerX = initialRect.left + clickOffset.x + transform.x;
            const pointerY = initialRect.top + clickOffset.y + transform.y;

            // Cell under pointer (same logic as calculateCellFromPointer)
            const cellPosX = Math.floor((pointerX - boardInfo.left) / scaledCellSize);
            const cellPosY = Math.floor((pointerY - boardInfo.top) / scaledCellSize);

            // Hover position = cellPosition - cellOffset
            const hoverX = cellPosX - cellOffset.x;
            const hoverY = cellPosY - cellOffset.y;

            // Align overlay cell (0,0) with the shadow cell at game position (hoverX, hoverY)
            const desiredX = boardInfo.gridOriginX + hoverX * scaledCellSize;
            const desiredY = boardInfo.gridOriginY + hoverY * scaledCellSize;

            return {
                ...transform,
                x: desiredX - initialRect.left,
                y: desiredY - initialRect.top
            };
        }

        // Fallback: use sub-cell offset adjustment
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
                const fromBoard = active.data.current?.fromBoard === true;
                isFromBoardRef.current = fromBoard;

                const shape = getTransformedShape(piece);

                if (fromBoard && active.data.current?.anchorX !== undefined && active.data.current?.anchorY !== undefined) {
                    // Anchor from board: use anchor from draggable data (single-cell wrapper)
                    const anchorX = active.data.current.anchorX as number;
                    const anchorY = active.data.current.anchorY as number;
                    if (!shape[anchorY]?.[anchorX]) {
                        setActivePiece(null);
                        setIsDragging(false);
                        return;
                    }
                    cellOffsetRef.current = { x: anchorX, y: anchorY };
                    initialDragRectRef.current = initialRect ?? null;
                    const scaledCellSize = theme.game.cellSize * boardScale;
                    initialClickOffsetRef.current = {
                        x: anchorX * scaledCellSize + scaledCellSize / 2,
                        y: anchorY * scaledCellSize + scaledCellSize / 2
                    };
                }
                else if (initialRect) {
                    initialDragRectRef.current = initialRect;
                    const clickOffset = {
                        x: pointerX - initialRect.left,
                        y: pointerY - initialRect.top
                    };
                    // For carousel pieces, calculate cellOffset using the piece
                    // element's own dimensions (which may differ from the board
                    // scale in landscape mode).
                    const shapeCols = shape[0]?.length ?? 1;
                    const shapeRows = shape.length;
                    const pieceCellW = initialRect.width / shapeCols;
                    const pieceCellH = initialRect.height / shapeRows;
                    const cellOffset = {
                        x: Math.floor(clickOffset.x / pieceCellW),
                        y: Math.floor(clickOffset.y / pieceCellH)
                    };
                    if (!shape[cellOffset.y]?.[cellOffset.x]) {
                        setActivePiece(null);
                        setIsDragging(false);
                        return;
                    }
                    cellOffsetRef.current = cellOffset;
                    initialClickOffsetRef.current = clickOffset;
                }
                else {
                    // @dnd-kit's rect measurement may be null when drag is
                    // initiated via CDP touch events. Fall back to reading the
                    // DOM element's bounding rect directly.
                    const evtTarget = (activatorEvent as Event)?.target as HTMLElement | null;
                    const draggableEl = evtTarget?.closest?.("[data-piece-id]") as HTMLElement
                        ?? document.querySelector(`[data-piece-id="${pieceId}"]`) as HTMLElement | null;
                    const domRect = draggableEl?.getBoundingClientRect?.();
                    if (domRect && domRect.width > 0) {
                        const fallbackRect = { left: domRect.left, top: domRect.top, right: domRect.right, bottom: domRect.bottom, width: domRect.width, height: domRect.height };
                        initialDragRectRef.current = fallbackRect;
                        const clickOffset = {
                            x: pointerX - fallbackRect.left,
                            y: pointerY - fallbackRect.top
                        };
                        // For carousel pieces, use the piece element's own
                        // dimensions to compute cellOffset (the board's scaled
                        // cell size may differ significantly in landscape).
                        const shapeCols = shape[0]?.length ?? 1;
                        const shapeRows = shape.length;
                        const pieceCellW = fallbackRect.width / shapeCols;
                        const pieceCellH = fallbackRect.height / shapeRows;
                        const cellOffset = {
                            x: Math.floor(clickOffset.x / pieceCellW),
                            y: Math.floor(clickOffset.y / pieceCellH)
                        };
                        if (!shape[cellOffset.y]?.[cellOffset.x]) {
                            setActivePiece(null);
                            setIsDragging(false);
                            return;
                        }
                        cellOffsetRef.current = cellOffset;
                        initialClickOffsetRef.current = clickOffset;
                    }
                    else {
                        initialDragRectRef.current = null;
                        initialClickOffsetRef.current = { x: 0, y: 0 };
                        cellOffsetRef.current = null;
                    }
                }
                
                // Capture board rect and grid origin at drag start for
                // the grid-snapping modifier. We find cell (0,0) in the DOM
                // to get the exact visual grid origin (avoids CSS transform
                // scaling issues with computed border/padding values).
                const boardEl = boardElementRef.current;
                if (boardEl) {
                    const bRect = boardEl.getBoundingClientRect();
                    const firstCell = boardEl.querySelector("[data-cell-x=\"0\"][data-cell-y=\"0\"]") as HTMLElement | null;
                    if (firstCell) {
                        const fcRect = firstCell.getBoundingClientRect();
                        boardGridOriginRef.current = {
                            left: bRect.left,
                            top: bRect.top,
                            gridOriginX: fcRect.left,
                            gridOriginY: fcRect.top
                        };
                    }
                    else {
                        boardGridOriginRef.current = null;
                    }
                }
                else {
                    boardGridOriginRef.current = null;
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
