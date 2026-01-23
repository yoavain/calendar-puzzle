import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import type { DragItem, GameState, Piece as PieceType, Position, Board as BoardType } from "../../common/types";
import { getTransformedShape } from "../../common/gameLogic";
import { getPieceColor } from "../../common/pieceData";
import { logToServer } from "../service/logService.js";
import type { InvalidDropCell } from "./Game";
import {
    BoardContainer,
    BoardRow,
    BoardCell,
    StyledCellText
} from "./Board.styled";

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
}

export const Board: React.FC<BoardProps> = ({ board, pieces, onCellClick, onPieceDrop, invalidDropCells = [], solutionRevealed = false, isSolved = false, draggedPieceId, onDragStart, onDragEnd }) => {
    const theme = useTheme();
    const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, x: number, y: number) => {
        if (isSolved) {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        
        const draggedPiece = pieces.find(p => p.id === draggedPieceId);
        if (draggedPiece) {
            const shape = getTransformedShape(draggedPiece);
            let firstFilledX = -1;
            let firstFilledY = -1;
            outerLoop: for (let fy = 0; fy < shape.length; fy++) {
                for (let fx = 0; fx < shape[fy].length; fx++) {
                    if (shape[fy][fx]) {
                        firstFilledX = fx;
                        firstFilledY = fy;
                        break outerLoop;
                    }
                }
            }
            // The cursor is on cell (x, y), which corresponds to (firstFilledX, firstFilledY) of the piece.
            // Therefore, the top-left (0,0) of the piece should be at (x - firstFilledX, y - firstFilledY).
            setDragOverCell({ 
                x: x - firstFilledX, 
                y: y - firstFilledY 
            });
        } else {
            setDragOverCell({ x, y });
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
        
        const dropPosition = dragOverCell || position;

        setDragOverCell(null);
        onDragEnd();
        
        const data = e.dataTransfer.getData("text/plain");

        try {
            if (!data) {
                throw new Error("No data found in dataTransfer");
            }
            const dragItem: DragItem = JSON.parse(data);
            
            onPieceDrop(dropPosition, dragItem);
        }
        catch (err) {
            logToServer("error", "Board: Failed to handle drop", err);
        }
    };

    // Function to check if a cell is part of a placed piece
    const getPieceAtCell = (x: number, y: number) => {
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
    };

    // Function to check if a cell is in the invalid drop feedback zone
    const isInvalidDropCell = (x: number, y: number) => {
        return invalidDropCells.some(cell => cell.x === x && cell.y === y);
    };

    // Function to check if a cell would be occupied by the dragged piece preview
    const isDragPreviewCell = (x: number, y: number): boolean => {
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
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, piece: PieceType) => {
        // Track the dragged piece for preview
        onDragStart(piece.id);

        const shape = getTransformedShape(piece);
        let firstFilledX = -1;
        let firstFilledY = -1;
        outerLoop: for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    firstFilledX = x;
                    firstFilledY = y;
                    break outerLoop;
                }
            }
        }
        const cellSize = theme.game.cellSize;
        const offsetX = (firstFilledX * cellSize) + (cellSize / 2);
        const offsetY = (firstFilledY * cellSize) + (cellSize / 2);
        
        const data = JSON.stringify({
            pieceId: piece.id
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
                    width: ${theme.game.cellSize}px;
                    height: ${theme.game.cellSize}px;
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
        <BoardContainer onDragLeave={handleDragLeave}>
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
                        const isPreview = isDragPreviewCell(x, y);

                        return (
                            <BoardCell
                                key={`${x}-${y}`}
                                isPlayable={cell.isPlayable}
                                isHighlighted={cell.isHighlighted}
                                isPieceCell={!!piece}
                                isHidden={isHiddenCell}
                                isStyled={isStyledCell}
                                isLocked={isLocked}
                                isInvalidDrop={isInvalid}
                                isDragOver={isPreview}
                                pieceId={piece?.id}
                                solutionRevealed={solutionRevealed}
                                isSolved={isSolved}
                                onClick={() => onCellClick({ x, y })}
                                onDragOver={(e) => handleDragOver(e, x, y)}
                                onDrop={(e) => handleDrop(e, { x, y })}
                                draggable={!!piece && !isLocked && !isSolved}
                                onDragStart={(e) => piece && !isLocked && !isSolved && handleDragStart(e, piece)}
                                onDragEnd={() => onDragEnd()}
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
};
