import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { DragItem, GameState, Piece as PieceType, Position, Board as BoardType } from '../../common/types';
import { getTransformedShape } from '../../common/gameLogic';
import { InvalidDropCell } from './Game';
import {
    BoardContainer,
    BoardRow,
    BoardCell,
    StyledCellText,
} from './Board.styled';

interface BoardProps {
    board: BoardType;
    pieces: GameState['pieces'];
    onCellClick: (position: Position) => void;
    onPieceDrop: (position: Position, dragItem: DragItem) => void;
    invalidDropCells?: InvalidDropCell[];
    solutionRevealed?: boolean;
}

export const Board: React.FC<BoardProps> = ({ board, pieces, onCellClick, onPieceDrop, invalidDropCells = [], solutionRevealed = false }) => {
    const theme = useTheme();
    const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, x: number, y: number) => {
        e.preventDefault();
        setDragOverCell({ x, y });
    };

    const handleDragLeave = () => {
        setDragOverCell(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, position: Position) => {
        e.preventDefault();
        setDragOverCell(null);
        const data = e.dataTransfer.getData('application/json');
        const dragItem: DragItem = JSON.parse(data);
        onPieceDrop(position, dragItem);
    };

    // Function to check if a cell is part of a placed piece
    const getPieceAtCell = (x: number, y: number) => {
        return pieces.find(piece => {
            if (!piece.position) return false;
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, piece: PieceType) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            pieceId: piece.id,
            shape: getTransformedShape(piece)
        }));

        // Create a drag preview that represents the entire piece
        const dragPreview = document.createElement('div');
        dragPreview.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 1000;
            display: grid;
            gap: 0;
            background-color: transparent;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25)) drop-shadow(0 2px 4px rgba(0,0,0,0.15));
        `;
        const shape = getTransformedShape(piece);

        shape.forEach((row) => {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display: flex; gap: 0;';
            row.forEach((cell) => {
                const cellDiv = document.createElement('div');
                cellDiv.style.cssText = `
                    width: ${theme.game.cellSize}px;
                    height: ${theme.game.cellSize}px;
                    border: none;
                `;

                if (cell) {
                    cellDiv.style.backgroundColor = theme.game.pieceColors[piece.id - 1];
                } else {
                    cellDiv.style.visibility = 'hidden';
                }

                rowDiv.appendChild(cellDiv);
            });
            dragPreview.appendChild(rowDiv);
        });

        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 25, 25);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <BoardContainer>
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

                        // Check if this cell is being dragged over
                        const isDragOver = dragOverCell?.x === x && dragOverCell?.y === y;

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
                                isDragOver={isDragOver}
                                pieceId={piece?.id}
                                solutionRevealed={solutionRevealed}
                                onClick={() => onCellClick({ x, y })}
                                onDragOver={(e) => handleDragOver(e, x, y)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, { x, y })}
                                draggable={!!piece && !isLocked}
                                onDragStart={(e) => piece && !isLocked && handleDragStart(e, piece)}
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
