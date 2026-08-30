import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ClientRect, DragEndEvent, DragStartEvent, Modifier } from "@dnd-kit/core";
import { DndContext, DragOverlay, PointerSensor, pointerWithin, rectIntersection, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useTheme } from "@mui/material/styles";
import type { Piece as PieceType, Position } from "../../../common/types";
import type { PieceId } from "../../../common/pieceData";
import { getTransformedShape } from "../../../common/gameLogic";
import { findNearestFilledCell } from "../../../common/utils/shapeHelpers";
import { calculateCellFromPointer, findVisualPieceRect } from "../../utils/dragHelpers";
import { PieceDragPreview } from "../../components/PieceDragPreview";
import { debugLogger } from "../../utils/debugLogger";

// ---------------------------------------------------------------------------
// Helpers for handleDragStart — shared by the `else if (initialRect)` and
// `else` (CDP fallback) branches which otherwise duplicate ~45 lines.
// ---------------------------------------------------------------------------

type SimpleRect = { left: number; top: number; width: number; height: number };

/** Find the draggable DOM node for a piece, preferring the touched element. */
function findDraggableNode(evtTarget: HTMLElement | null, pieceId: PieceId): HTMLElement | null {
    return (evtTarget?.closest("[data-piece-id]") as HTMLElement | null)
        ?? document.querySelector(`[data-testid="carousel-piece-${pieceId}"]`)
        ?? document.querySelector(`[data-piece-id="${pieceId}"]`);
}

/**
 * Compute the cell anchor and click offset from a known base rect.
 * Returns null when the touch lands on an empty cell with no nearest filled neighbour.
 */
function computeCellAndClickOffset(
    baseRect: SimpleRect,
    draggableNode: HTMLElement | null,
    pointerX: number,
    pointerY: number,
    shape: boolean[][]
): { cellOffset: { x: number; y: number }; clickOffset: { x: number; y: number } } | null {
    const clickOffset = { x: pointerX - baseRect.left, y: pointerY - baseRect.top };
    // Always use the PieceGrid's VISUAL rect for cellOffset calculation.
    // CSS transforms (rotate/flip) change visual dimensions vs layout dimensions, so
    // getBoundingClientRect on the grid element is the correct reference.
    const visualRect = draggableNode ? findVisualPieceRect(draggableNode) : null;
    const rectForCells = visualRect ?? baseRect;
    const shapeCols = shape[0]?.length ?? 1;
    const shapeRows = shape.length;
    const pieceCellW = rectForCells.width / shapeCols;
    const pieceCellH = rectForCells.height / shapeRows;
    const cellClickOffset = { x: pointerX - rectForCells.left, y: pointerY - rectForCells.top };
    let cellOffset = {
        x: Math.floor(cellClickOffset.x / pieceCellW),
        y: Math.floor(cellClickOffset.y / pieceCellH)
    };
    // If touch landed on an empty cell (transparent gap in piece grid), snap to nearest filled cell
    if (!shape[cellOffset.y]?.[cellOffset.x]) {
        const nearest = findNearestFilledCell(shape, cellOffset.x, cellOffset.y);
        if (!nearest) {
            return null;
        }
        cellOffset = nearest;
    }
    return { cellOffset, clickOffset };
}

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
    onPieceDrop: (position: Position, pieceId: PieceId) => void;
    /** Handler when a piece is removed from the board (dropped outside) */
    onPieceRemove?: (pieceId: PieceId) => void;
    /** Handler when drag starts */
    onDragStart?: (pieceId: PieceId) => void;
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
    // Counter for throttling onDragMove logs (log every 10th move)
    const dragMoveCountRef = useRef(0);

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
                // Use the cached grid origin so we measure from cell (0,0),
                // not the board container edge (which has padding + border).
                const gridOriginForHover = boardGridOriginRef.current
                    ? { left: boardGridOriginRef.current.gridOriginX, top: boardGridOriginRef.current.gridOriginY }
                    : undefined;
                const cellPosition = calculateCellFromPointer(
                    clientX,
                    clientY,
                    boardElement,
                    boardScale,
                    theme.game.cellSize,
                    gridOriginForHover
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
                    dragMoveCountRef.current++;
                    if (dragMoveCountRef.current % 10 === 0) {
                        debugLogger.log("dnd:dragMove", { hoverPosition: piecePosition, pointer: { x: clientX, y: clientY } });
                    }
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
    // Smooth drag overlay modifier: positions the overlay so that the CENTER
    // of the grabbed cell tracks the pointer smoothly (no grid snapping).
    // The board shadow (blue highlight) snaps independently via hoverPosition.
    const dragOverlayModifier: Modifier = useCallback(({ transform }) => {
        if (!activePiece) {
            return transform;
        }

        const cellOffset = cellOffsetRef.current;
        const clickOffset = initialClickOffsetRef.current;

        // Adjust so the grabbed cell CENTER stays under the finger
        if (cellOffset && clickOffset) {
            const scaledCellSize = boardScale * theme.game.cellSize;
            const targetClickX = (cellOffset.x + 0.5) * scaledCellSize;
            const targetClickY = (cellOffset.y + 0.5) * scaledCellSize;
            const adjustX = clickOffset.x - targetClickX;
            const adjustY = clickOffset.y - targetClickY;
            return {
                ...transform,
                x: transform.x + adjustX,
                y: transform.y + adjustY
            };
        }
        return transform;
    }, [activePiece, boardScale, theme.game.cellSize]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active, activatorEvent } = event;
        const pieceId = active.data.current?.pieceId as PieceId | undefined;
        
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
                    // Use actual pointer offset from the single-cell wrapper
                    // (same pattern as carousel). The old code set piece-space
                    // coords which made adjustX/Y always 0 in the modifier.
                    initialClickOffsetRef.current = initialRect
                        ? { x: pointerX - initialRect.left, y: pointerY - initialRect.top }
                        : { x: scaledCellSize / 2, y: scaledCellSize / 2 };
                }
                else if (initialRect) {
                    // IMPORTANT: use activatorEvent.target to find the element the user
                    // actually touched, NOT document.querySelector which always returns
                    // the first DOM node. When the carousel has duplicate slides for the
                    // same piece (count < MIN_SLIDES_FOR_LOOP), querySelector would return
                    // a slide that is not the one being touched, giving a wrong visual rect.
                    const evtTarget = (activatorEvent as Event)?.target as HTMLElement | null;
                    const draggableNode = findDraggableNode(evtTarget, pieceId);
                    const result = computeCellAndClickOffset(initialRect, draggableNode, pointerX, pointerY, shape);
                    if (!result) {
                        setActivePiece(null);
                        setIsDragging(false);
                        return;
                    }
                    initialDragRectRef.current = initialRect;
                    cellOffsetRef.current = result.cellOffset;
                    initialClickOffsetRef.current = result.clickOffset;
                }
                else {
                    // @dnd-kit's rect measurement may be null when drag is
                    // initiated via CDP touch events. Fall back to reading the
                    // DOM element's bounding rect directly.
                    const evtTarget = (activatorEvent as Event)?.target as HTMLElement | null;
                    const draggableEl = findDraggableNode(evtTarget, pieceId);
                    const domRect = draggableEl?.getBoundingClientRect?.();
                    if (domRect && domRect.width > 0) {
                        const fallbackRect = { left: domRect.left, top: domRect.top, right: domRect.right, bottom: domRect.bottom, width: domRect.width, height: domRect.height };
                        const result = computeCellAndClickOffset(fallbackRect, draggableEl, pointerX, pointerY, shape);
                        if (!result) {
                            setActivePiece(null);
                            setIsDragging(false);
                            return;
                        }
                        initialDragRectRef.current = fallbackRect;
                        cellOffsetRef.current = result.cellOffset;
                        initialClickOffsetRef.current = result.clickOffset;
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

                dragMoveCountRef.current = 0;
                debugLogger.log("dnd:dragStart", {
                    pieceId,
                    isFromBoard: fromBoard,
                    pointerPos: lastPointerPositionRef.current,
                    cellOffset: cellOffsetRef.current,
                    boardGridOrigin: boardGridOriginRef.current
                });

                onDragStart?.(pieceId);
            }
        }
    }, [pieces, onDragStart]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        const pieceData = active.data.current;
        
        if (pieceData?.type === "piece") {
            const pieceId = pieceData.pieceId as PieceId;
            const fromBoard = pieceData.fromBoard as boolean | undefined;
            
            if (over) {
                const dropData = over.data.current;
                
                // Check if dropped on the board
                if (dropData?.type === "board") {
                    // Use hoverPosition if available, otherwise calculate from last pointer position
                    let dropPosition = hoverPosition;
                    
                    if (!dropPosition && lastPointerPositionRef.current && boardElementRef.current) {
                        // Fallback: calculate position now (use grid origin for accuracy)
                        const gridOriginForDrop = boardGridOriginRef.current
                            ? { left: boardGridOriginRef.current.gridOriginX, top: boardGridOriginRef.current.gridOriginY }
                            : undefined;
                        const cellPosition = calculateCellFromPointer(
                            lastPointerPositionRef.current.x,
                            lastPointerPositionRef.current.y,
                            boardElementRef.current,
                            boardScale,
                            theme.game.cellSize,
                            gridOriginForDrop
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
        
        debugLogger.log("dnd:dragEnd", {
            pieceId: pieceData?.pieceId,
            dropType: over
                ? (over.data.current?.type === "board" ? "board" : "pile")
                : "cancel",
            dropPosition: hoverPosition,
            fromBoard: pieceData?.fromBoard
        });

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
        debugLogger.log("dnd:dragCancel", { pieceId: activePiece?.id });
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
                
                {createPortal(
                    <DragOverlay 
                        dropAnimation={null}
                        modifiers={[dragOverlayModifier]}
                        zIndex={9999}
                    >
                        {activePiece ? (
                            <div style={{ transform: `scale(${boardScale})`, transformOrigin: "top left" }}>
                                <PieceDragPreview piece={activePiece} />
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </DragStateContext.Provider>
    );
};
