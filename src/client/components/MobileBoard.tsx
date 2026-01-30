import React, { useCallback, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Board as BoardType, Piece as PieceType, Position } from "../../common/types";
import { getTransformedShape } from "../../common/gameLogic";
import { BoardContainer, BoardRow, BoardCell, StyledCellText } from "./Board.styled";
import { useDragState } from "../layouts/common/DndProvider";
import { DraggableBoardCell } from "./DraggableBoardCell";

interface MobileBoardProps {
    board: BoardType;
    pieces: PieceType[];
    onCellClick: (position: Position) => void;
    invalidDropCells: Array<{ x: number; y: number }>;
    solutionRevealed: boolean;
    isSolved: boolean;
    /** Scale factor applied to the board (needed for accurate drop position calculation) */
    scale: number;
}

/**
 * Mobile-optimized board component that uses @dnd-kit for drop handling.
 * Uses a single droppable for the entire board to avoid issues with CSS transform scaling.
 */
export const MobileBoard: React.FC<MobileBoardProps> = ({
    board,
    pieces,
    onCellClick,
    invalidDropCells,
    solutionRevealed,
    isSolved,
    scale
}) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const { draggedPiece, hoverPosition, registerBoardElement } = useDragState();

    // Make the entire board a single droppable target
    const { setNodeRef } = useDroppable({
        id: "board",
        data: {
            type: "board",
            boardRef,
            scale
        },
        disabled: isSolved
    });

    // Combine refs and register board element for drag position calculations
    const setRefs = useCallback((node: HTMLDivElement | null) => {
        boardRef.current = node;
        setNodeRef(node);
        registerBoardElement(node);
    }, [setNodeRef, registerBoardElement]);

    // Register board element on mount
    useEffect(() => {
        registerBoardElement(boardRef.current);
        return () => registerBoardElement(null);
    }, [registerBoardElement]);

    // Check if a cell is part of the hover preview
    const isHoverPreviewCell = useCallback((x: number, y: number): boolean => {
        if (!draggedPiece || !hoverPosition) {
            return false;
        }
        
        const shape = getTransformedShape(draggedPiece);
        const relX = x - hoverPosition.x;
        const relY = y - hoverPosition.y;
        
        return (
            relY >= 0 &&
            relY < shape.length &&
            relX >= 0 &&
            relX < shape[0].length &&
            shape[relY][relX]
        );
    }, [draggedPiece, hoverPosition]);

    // Check if a cell is showing invalid drop feedback
    const isInvalidDropCell = useCallback((x: number, y: number) => {
        return invalidDropCells.some(cell => cell.x === x && cell.y === y);
    }, [invalidDropCells]);

    // Get piece at position
    const getPieceAtPosition = useCallback((x: number, y: number): PieceType | undefined => {
        return pieces.find(piece => {
            if (!piece.position) {
                return false;
            }
            const shape = getTransformedShape(piece);
            const relX = x - piece.position.x;
            const relY = y - piece.position.y;
            return (
                relY >= 0 &&
                relY < shape.length &&
                relX >= 0 &&
                relX < shape[0].length &&
                shape[relY][relX]
            );
        });
    }, [pieces]);

    // Render a cell, optionally wrapped in DraggableBoardCell if it contains a piece
    const renderCell = (cell: typeof board[0][0], x: number, y: number) => {
        const piece = getPieceAtPosition(x, y);
        const isPieceCell = !!piece;
        const isInvalidDrop = isInvalidDropCell(x, y);
        const isPlayable = cell.isPlayable;
        const isHidden = !cell.content && !isPlayable && !isPieceCell;
        const isHoverPreview = isHoverPreviewCell(x, y);

        const cellElement = (
            <BoardCell
                data-cell-x={x}
                data-cell-y={y}
                isPlayable={isPlayable}
                isPieceCell={isPieceCell}
                isHidden={isHidden}
                isStyled={!isPieceCell}
                isLocked={piece?.isLocked}
                isInvalidDrop={isInvalidDrop}
                pieceId={piece?.id}
                solutionRevealed={solutionRevealed}
                isSolved={isSolved}
                isHighlighted={cell.isHighlighted}
                isDragOver={isHoverPreview && !isPieceCell}
                onClick={() => {
                    if (!isSolved) {
                        onCellClick({ x, y });
                    }
                }}
            >
                {!isPieceCell && cell.content && (
                    <StyledCellText>{cell.content}</StyledCellText>
                )}
            </BoardCell>
        );

        // Wrap piece cells in DraggableBoardCell
        if (piece && !piece.isLocked && !isSolved) {
            return (
                <DraggableBoardCell
                    key={`${x}-${y}`}
                    piece={piece}
                    isDraggable={true}
                >
                    {cellElement}
                </DraggableBoardCell>
            );
        }

        return <React.Fragment key={`${x}-${y}`}>{cellElement}</React.Fragment>;
    };

    return (
        <BoardContainer ref={setRefs} data-droppable-board="true">
            {board.map((row, y) => (
                <BoardRow key={y}>
                    {row.map((cell, x) => renderCell(cell, x, y))}
                </BoardRow>
            ))}
        </BoardContainer>
    );
};
