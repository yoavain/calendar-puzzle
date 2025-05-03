import React from 'react';
import { BoardCell, DragItem, GameState, Piece as PieceType, Position, Board as BoardType } from '../types/types';
import { getTransformedShape, isEdgeCell, getEdgeDirections } from '../utils/gameLogic';

interface BoardProps {
    board: BoardType;
    pieces: GameState['pieces'];  // Add pieces to props
    onCellClick: (position: Position) => void;
    onPieceDrop: (position: Position, dragItem: DragItem) => void;
}

export const Board: React.FC<BoardProps> = ({ board, pieces, onCellClick, onPieceDrop }) => {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, position: Position) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, piece: PieceType) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            pieceId: piece.id,
            shape: getTransformedShape(piece)
        }));

        // Create a drag preview that represents the entire piece
        const dragPreview = document.createElement('div');
        dragPreview.className = 'piece-drag-preview';
        const shape = getTransformedShape(piece);

        shape.forEach((row, y) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'preview-row';
            row.forEach((cell, x) => {
                const cellDiv = document.createElement('div');
                let className = `preview-cell ${cell ? 'filled' : ''}`;

                if (cell) {
                    const isEdge = isEdgeCell(shape, x, y);
                    if (isEdge) {
                        // Add direction-specific edge classes
                        const edgeDirections = getEdgeDirections(shape, x, y);
                        if (edgeDirections.top) className += ' edge-top';
                        if (edgeDirections.right) className += ' edge-right';
                        if (edgeDirections.bottom) className += ' edge-bottom';
                        if (edgeDirections.left) className += ' edge-left';
                    }
                }

                cellDiv.className = className;
                rowDiv.appendChild(cellDiv);
            });
            dragPreview.appendChild(rowDiv);
        });

        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 25, 25);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <div className="board">
            {board.map((row, y) => (
                <div key={y} className="board-row">
                    {row.map((cell, x) => {
                        const piece = getPieceAtCell(x, y);

                        // Determine if this cell is on the edge of a piece and which directions
                        let isEdge = false;
                        let edgeClasses = '';

                        if (piece) {
                            const shape = getTransformedShape(piece);
                            const pieceX = x - piece.position!.x;
                            const pieceY = y - piece.position!.y;
                            isEdge = isEdgeCell(shape, pieceX, pieceY);

                            if (isEdge) {
                                const edgeDirections = getEdgeDirections(shape, pieceX, pieceY);
                                if (edgeDirections.top) edgeClasses += ' edge-top';
                                if (edgeDirections.right) edgeClasses += ' edge-right';
                                if (edgeDirections.bottom) edgeClasses += ' edge-bottom';
                                if (edgeDirections.left) edgeClasses += ' edge-left';
                            }
                        }

                        // Add hidden-cell class for the 6 redundant cells
                        const isHiddenCell =
                            (y === 0 && x === 6) ||
                            (y === 1 && x === 6) ||
                            (y === 6 && x >= 3 && x <= 6);

                        // Identify month cells (Rows 0,1 and Cols 0-5)
                        const isMonthCell = y < 2 && x < 6;
                        // Identify day number cells (Rows 2-6, playable, with content)
                        const isDayCell = y >= 2 && cell.isPlayable && cell.content;

                        const isStyledCell = isMonthCell || isDayCell;

                        return (
                            <div
                                key={`${x}-${y}`}
                                className={`board-cell${isStyledCell ? ' styled-cell' : ''} ${cell.isPlayable ? 'playable' : ''} ${piece ? 'piece-cell' : ''} ${cell.isHighlighted ? 'highlighted' : ''} ${edgeClasses}${isHiddenCell ? ' hidden-cell' : ''}`}
                                onClick={() => onCellClick({ x, y })}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, { x, y })}
                                draggable={!!piece}
                                onDragStart={(e) => piece && handleDragStart(e, piece)}
                            >
                                {!piece && isStyledCell && cell.content && (
                                    <span className="styled-cell-text">{cell.content.toUpperCase()}</span>
                                )}
                                {!piece && !isStyledCell && cell.content}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
