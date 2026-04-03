import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { isDragItem } from "../../common/types";
import type { Board as BoardType, DragItem, GameState, Piece as PieceType, Position } from "../../common/types";
import { getTransformedShape } from "../../common/gameLogic";
import { findFirstFilledCell } from "../../common/utils/shapeHelpers";
import { getPieceColor } from "../utils/pieceColors";
import { logToServer } from "../service/logService.js";
import { getScaledCellSize } from "../utils/measureUtils";
import type { InvalidDropCell } from "../layouts/common/useGameController";
import { BoardCell, BoardContainer, BoardRow, StyledCellText } from "./Board.styled";
import { WinCelebration } from "./WinCelebration";

interface BoardProps {
    board: BoardType;
    pieces: GameState["pieces"];
    onCellClick: (position: Position) => void;
    onPieceDrop: (position: Position, dragItem: DragItem) => void;
    invalidDropCells?: InvalidDropCell[];
    solutionRevealed?: boolean;
    isSolved?: boolean;
    draggedPieceId: number | null;
    onDragStart: (pieceId: number) => void;
    onDragEnd: () => void;
    /**
     * The currently-selected pool piece. When set, the board becomes a
     * keyboard-navigable grid: arrow keys move a cursor across playable
     * cells and Enter/Space places the piece at the cursor.
     */
    selectedPieceId?: number | null;
}

export const Board = React.memo<BoardProps>(({
    board, pieces, onCellClick, onPieceDrop,
    invalidDropCells = [], solutionRevealed = false, isSolved = false,
    draggedPieceId, onDragStart, onDragEnd,
    selectedPieceId = null
}) => {
    const theme = useTheme();
    const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null);
    // Store the anchor offset (in piece coordinates) set during handleDragStart.
    // getData() is unavailable during dragover in HTML5 DnD, so we persist the
    // anchor in a ref instead.
    const anchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    // Tracks whether the current drag originated from the board (vs carousel)
    const dragFromBoardRef = useRef(false);

    // Keyboard cursor for the keyboard-drag fallback. Only visible while the
    // board has keyboard focus AND a pool piece is selected.
    const [keyboardCursor, setKeyboardCursor] = useState<Position | null>(null);
    const [isBoardFocused, setIsBoardFocused] = useState(false);

    const selectedPoolPiece = pieces.find(p => p.id === selectedPieceId && p.position === null);
    const isKeyboardDragReady = !!selectedPoolPiece && !isSolved;

    // Reset the cursor when keyboard-drag becomes unavailable so the ring
    // never lingers after the piece is placed or deselected.
    useEffect(() => {
        if (!isKeyboardDragReady) {
            setKeyboardCursor(null);
        }
    }, [isKeyboardDragReady]);

    const firstPlayableCell = useCallback((): Position | null => {
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x].isPlayable) {
                    return { x, y };
                }
            }
        }
        return null;
    }, [board]);

    const moveCursor = useCallback((dx: number, dy: number) => {
        setKeyboardCursor(prev => {
            const start = prev ?? firstPlayableCell();
            if (!start) {
                return null;
            }
            const maxY = board.length;
            const maxX = board[0]?.length ?? 0;
            let { x, y } = start;
            // Walk in the requested direction until we land on a playable cell,
            // or fall off the board (in which case stay put).
            for (let i = 0; i < Math.max(maxX, maxY); i++) {
                x += dx;
                y += dy;
                if (y < 0 || y >= maxY || x < 0 || x >= maxX) {
                    return start;
                }
                if (board[y][x].isPlayable) {
                    return { x, y };
                }
            }
            return start;
        });
    }, [board, firstPlayableCell]);

    const handleBoardFocus = useCallback(() => {
        setIsBoardFocused(true);
        setKeyboardCursor(prev => prev ?? firstPlayableCell());
    }, [firstPlayableCell]);

    const handleBoardBlur = useCallback(() => {
        setIsBoardFocused(false);
    }, []);

    const handleBoardKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isKeyboardDragReady) {
            return;
        }
        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault();
                moveCursor(-1, 0);
                break;
            case "ArrowRight":
                e.preventDefault();
                moveCursor(1, 0);
                break;
            case "ArrowUp":
                e.preventDefault();
                moveCursor(0, -1);
                break;
            case "ArrowDown":
                e.preventDefault();
                moveCursor(0, 1);
                break;
            case "Enter":
            case " ": {
                e.preventDefault();
                const cursor = keyboardCursor ?? firstPlayableCell();
                if (cursor && selectedPoolPiece) {
                    // The cursor represents where the piece's first filled cell
                    // lands. Translate that into a top-left bounding-box position
                    // for the placement logic, matching how drag-and-drop anchors
                    // work (see handleDrop above).
                    const anchor = findFirstFilledCell(getTransformedShape(selectedPoolPiece));
                    onCellClick({
                        x: cursor.x - anchor.x,
                        y: cursor.y - anchor.y
                    });
                }
                break;
            }
            default:
                break;
        }
    }, [isKeyboardDragReady, keyboardCursor, firstPlayableCell, selectedPoolPiece, moveCursor, onCellClick]);

    const handleDragEnd = () => {
        dragFromBoardRef.current = false;
        onDragEnd();
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, x: number, y: number) => {
        if (isSolved) {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        if (dragFromBoardRef.current) {
            // Board-to-board drag: use the anchor set in handleDragStart
            setDragOverCell({
                x: x - anchorRef.current.x,
                y: y - anchorRef.current.y
            });
        }
        else {
            // Carousel-to-board drag: derive offset from the piece's first filled cell
            const draggedPiece = pieces.find(p => p.id === draggedPieceId);
            if (draggedPiece) {
                const first = findFirstFilledCell(getTransformedShape(draggedPiece));
                setDragOverCell({ x: x - first.x, y: y - first.y });
            }
            else {
                setDragOverCell({ x, y });
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        // Only clear if we're actually leaving the board container
        const rect = e.currentTarget.getBoundingClientRect();
        const { clientX, clientY } = e;
        const isLeaving = clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom;
        
        if (isLeaving) {
            setDragOverCell(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, position: Position) => {
        if (isSolved) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        setDragOverCell(null);
        handleDragEnd();
        
        const data = e.dataTransfer.getData("text/plain");

        try {
            if (!data) {
                throw new Error("No data found in dataTransfer");
            }
            const parsed: unknown = JSON.parse(data);
            if (!isDragItem(parsed)) {
                throw new Error("Invalid drag payload");
            }
            const dragItem: DragItem = parsed;

            // Determine the anchor offset for computing the piece's top-left drop position.
            // Board drags include cellX/cellY; carousel drags don't, so fall back to firstFilledCell.
            const piece = pieces.find(p => p.id === dragItem.pieceId);
            const fallback = piece ? findFirstFilledCell(getTransformedShape(piece)) : { x: 0, y: 0 };
            const anchorX = dragItem.cellX ?? fallback.x;
            const anchorY = dragItem.cellY ?? fallback.y;
            const dropPosition = {
                x: position.x - anchorX,
                y: position.y - anchorY
            };

            onPieceDrop(dropPosition, dragItem);
        }
        catch (err) {
            logToServer("error", "Board: Failed to handle drop", err);
        }
    };

    const handleBoardAreaDrop = (e: React.DragEvent<HTMLDivElement>) => {
        // This handler catches drops on the BoardContainer itself (the padding/border area)
        // or any cell that didn't handle the drop.
        // We stop propagation to ensure the global drop handler doesn't return the piece to the pile.
        e.preventDefault();
        e.stopPropagation();
        handleDragEnd();
    };

    // Function to check if a cell is part of a placed piece
    const getPieceAtCell = useCallback((x: number, y: number) => {
        return pieces.find(piece => {
            if (!piece.position) {
                return false;
            }
            const shape = getTransformedShape(piece);
            const pieceX = x - piece.position.x;
            const pieceY = y - piece.position.y;
            return pieceY >= 0 && pieceY < shape.length &&
                   pieceX >= 0 && pieceX < shape[0].length &&
                   shape[pieceY][pieceX];
        });
    }, [pieces]);

    // Function to check if a cell is in the invalid drop feedback zone
    const isInvalidDropCell = useCallback((x: number, y: number) => {
        return invalidDropCells.some(cell => cell.x === x && cell.y === y);
    }, [invalidDropCells]);

    // Function to check if a cell would be occupied by the dragged piece preview
    const isDragPreviewCell = useCallback((x: number, y: number): boolean => {
        if (dragOverCell === null || !draggedPieceId) {
            return false;
        }

        const draggedPiece = pieces.find(p => p.id === draggedPieceId);
        if (!draggedPiece) {
            return false;
        }

        const shape = getTransformedShape(draggedPiece);
        const relativeX = x - dragOverCell.x;
        const relativeY = y - dragOverCell.y;

        return relativeY >= 0 && relativeY < shape.length &&
            relativeX >= 0 && relativeX < shape[0].length &&
            shape[relativeY][relativeX];
    }, [dragOverCell, draggedPieceId, pieces]);

    // Function to check if a cell would be occupied by the keyboard-drag preview.
    // The cursor represents where the selected piece's first filled cell will land.
    const isKeyboardPreviewCell = useCallback((x: number, y: number): boolean => {
        if (!isBoardFocused || !keyboardCursor || !selectedPoolPiece) {
            return false;
        }
        const shape = getTransformedShape(selectedPoolPiece);
        const anchor = findFirstFilledCell(shape);
        const relativeX = x - (keyboardCursor.x - anchor.x);
        const relativeY = y - (keyboardCursor.y - anchor.y);
        return relativeY >= 0 && relativeY < shape.length &&
            relativeX >= 0 && relativeX < shape[0].length &&
            shape[relativeY][relativeX];
    }, [isBoardFocused, keyboardCursor, selectedPoolPiece]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, piece: PieceType) => {
        if (!piece.position) {
            e.preventDefault();
            return;
        }

        // Resolve the cell that was touched from the event target
        let target: HTMLElement | null = e.target as HTMLElement;
        while (target && (target.dataset.cellX === undefined || target.dataset.cellY === undefined)) {
            target = target.parentElement;
        }
        if (!target) {
            e.preventDefault();
            return;
        }
        const cellX = parseInt(target.dataset.cellX ?? "", 10);
        const cellY = parseInt(target.dataset.cellY ?? "", 10);
        if (isNaN(cellX) || isNaN(cellY)) {
            e.preventDefault();
            return;
        }

        const shape = getTransformedShape(piece);
        const anchorX = cellX - piece.position.x;
        const anchorY = cellY - piece.position.y;
        if (anchorY < 0 || anchorY >= shape.length || anchorX < 0 || anchorX >= shape[0].length || !shape[anchorY][anchorX]) {
            e.preventDefault();
            return;
        }

        // Persist anchor so handleDragOver can use it (getData is blocked during dragover)
        anchorRef.current = { x: anchorX, y: anchorY };
        dragFromBoardRef.current = true;

        onDragStart(piece.id);

        const scaledCellSize = getScaledCellSize(theme.game.cellSize, theme.game.cellSizePx);
        const offsetX = anchorX * scaledCellSize + scaledCellSize / 2;
        const offsetY = anchorY * scaledCellSize + scaledCellSize / 2;

        const data = JSON.stringify({
            pieceId: piece.id,
            cellX: anchorX,
            cellY: anchorY
        });

        try {
            e.dataTransfer.setData("text/plain", data);
            e.dataTransfer.effectAllowed = "move"; // Set effectAllowed
        }
        catch (err) {
            logToServer("error", "Board: Failed to set drag data", err);
        }

        // Create a drag preview that represents the entire piece
        const dragPreview = document.createElement("div");
        dragPreview.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 1000;
            display: grid;
            gap: 0;
            background-color: transparent;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25)) drop-shadow(0 2px 4px rgba(0,0,0,0.15));
        `;

        shape.forEach((row) => {
            const rowDiv = document.createElement("div");
            rowDiv.style.cssText = "display: flex; gap: 0;";
            row.forEach((cell) => {
                const cellDiv = document.createElement("div");

                cellDiv.style.cssText = `
                    width: ${scaledCellSize}px;
                    height: ${scaledCellSize}px;
                    border: none;
                `;

                if (cell) {
                    cellDiv.style.backgroundColor = getPieceColor(piece.id);
                }
                else {
                    cellDiv.style.visibility = "hidden";
                }

                rowDiv.appendChild(cellDiv);
            });
            dragPreview.appendChild(rowDiv);
        });

        document.body.appendChild(dragPreview);
        
        e.dataTransfer.setDragImage(dragPreview, offsetX, offsetY);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <BoardContainer
            onDragLeave={handleDragLeave}
            onDrop={handleBoardAreaDrop}
            onDragOver={(e) => {
                if (isSolved) {
                    return;
                }
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            }}
            tabIndex={isKeyboardDragReady ? 0 : -1}
            role={isKeyboardDragReady ? "grid" : undefined}
            aria-label={isKeyboardDragReady ? "Puzzle board. Arrow keys to move, Enter to place piece." : undefined}
            onFocus={handleBoardFocus}
            onBlur={handleBoardBlur}
            onKeyDown={handleBoardKeyDown}
            data-testid="board"
        >
            <WinCelebration active={isSolved} />
            {board.map((row, y) => (
                <BoardRow key={y}>
                    {row.map((cell, x) => {
                        const piece = getPieceAtCell(x, y);

                        // Check for hidden cells (6 redundant cells)
                        const isHiddenCell =
                            (y === 0 && x === 6) ||
                            (y === 1 && x === 6) ||
                            (y === 6 && x >= 3 && x <= 6);

                        // Identify styled cells (month/day labels)
                        const isMonthCell = y < 2 && x < 6;
                        const isDayCell = y >= 2 && cell.isPlayable && !!cell.content;
                        const isStyledCell = isMonthCell || isDayCell;

                        // Check if the piece is locked (hint piece)
                        const isLocked = piece?.isLocked ?? false;

                        // Check if this cell is part of an invalid drop attempt
                        const isInvalid = isInvalidDropCell(x, y);

                        // Check if this cell is part of the drag preview
                        // (mouse/touch drag OR keyboard-drag cursor)
                        const isPreview = isDragPreviewCell(x, y) || isKeyboardPreviewCell(x, y);

                        // Outline the single anchor cell under the keyboard cursor
                        const isCursor = isBoardFocused
                            && keyboardCursor?.x === x
                            && keyboardCursor?.y === y
                            && isKeyboardDragReady;

                        const isDraggable = !!piece && !isLocked && !isSolved;

                        return (
                            <BoardCell
                                key={`${x}-${y}`}
                                style={{ "--reveal-delay": `${(x + y) * 25}ms` } as React.CSSProperties}
                                isPlayable={cell.isPlayable}
                                isHighlighted={cell.isHighlighted}
                                isPieceCell={!!piece}
                                isHidden={isHiddenCell}
                                isStyled={isStyledCell}
                                isLocked={isLocked}
                                isInvalidDrop={isInvalid}
                                isDragOver={isPreview}
                                isKeyboardCursor={isCursor}
                                pieceId={piece?.id}
                                solutionRevealed={solutionRevealed}
                                isSolved={isSolved}
                                onClick={() => onCellClick({ x, y })}
                                onDragOver={(e) => handleDragOver(e, x, y)}
                                onDrop={(e) => handleDrop(e, { x, y })}
                                draggable={isDraggable}
                                onDragStart={(e) => piece && !isLocked && !isSolved && handleDragStart(e, piece)}
                                onDragEnd={handleDragEnd}
                                data-cell-x={x}
                                data-cell-y={y}
                                data-piece-id={piece?.id}
                                data-drag-over={isPreview || undefined}
                                data-testid="board-cell"
                                aria-hidden={isHiddenCell || undefined}
                                aria-label={isDraggable ? `Piece ${piece!.id}` : undefined}
                                aria-roledescription={isDraggable ? "Draggable piece" : undefined}
                            >
                                {!piece && isStyledCell && cell.content && (
                                    <StyledCellText>{cell.content.toUpperCase()}</StyledCellText>
                                )}
                                {!piece && !isStyledCell && cell.content}
                            </BoardCell>
                        );
                    })}
                </BoardRow>
            ))}
        </BoardContainer>
    );
});
Board.displayName = "Board";
