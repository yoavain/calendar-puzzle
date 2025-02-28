import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Position, Piece as PieceType, DragItem, GameStateAction, BoardCell } from '../types/types';
import Board from './Board';
import Piece from './Piece';
import PieceControls from './PieceControls';
import { initializeGame } from '../utils/initialize';
import { 
    rotatePiece, 
    flipPieceHorizontal, 
    flipPieceVertical, 
    isValidPlacement, 
    clearPieceFromBoard,
    getTransformedShape
} from '../utils/gameLogic';
import { useGameHistory } from '../hooks/useGameHistory';

const Game: React.FC = () => {
    const {
        gameState,
        pushState,
        undo,
        redo,
        canUndo,
        canRedo
    } = useGameHistory(initializeGame());

    const handlePieceSelect = (pieceId: number) => {
        pushState(
            {
                ...gameState,
                selectedPieceId: pieceId
            },
            { type: 'SELECT_PIECE', pieceId }
        );
    };

    const handleRotate = () => {
        if (gameState.selectedPieceId === null) return;
        
        const newState = (() => {
            const newPieces = [...gameState.pieces];
            const pieceIndex = newPieces.findIndex(p => p.id === gameState.selectedPieceId);
            const piece = newPieces[pieceIndex];
            
            // Update rotation by 90 degrees clockwise
            const newRotation = ((piece.rotation + 90) % 360) as 0 | 90 | 180 | 270;
            
            newPieces[pieceIndex] = {
                ...piece,
                rotation: newRotation
            };
            
            return {
                ...gameState,
                pieces: newPieces
            };
        })();

        pushState(newState, {
            type: 'ROTATE_PIECE',
            pieceId: gameState.selectedPieceId
        });
    };

    const handleFlipH = () => {
        if (gameState.selectedPieceId === null) return;
        
        const newState = (() => {
            const newPieces = [...gameState.pieces];
            const pieceIndex = newPieces.findIndex(p => p.id === gameState.selectedPieceId);
            const piece = newPieces[pieceIndex];
            
            newPieces[pieceIndex] = {
                ...piece,
                isFlippedH: !piece.isFlippedH
            };
            
            return {
                ...gameState,
                pieces: newPieces
            };
        })();

        pushState(newState, {
            type: 'FLIP_PIECE_H',
            pieceId: gameState.selectedPieceId
        });
    };

    const handleFlipV = () => {
        if (gameState.selectedPieceId === null) return;
        
        const newState = (() => {
            const newPieces = [...gameState.pieces];
            const pieceIndex = newPieces.findIndex(p => p.id === gameState.selectedPieceId);
            const piece = newPieces[pieceIndex];
            
            newPieces[pieceIndex] = {
                ...piece,
                isFlippedV: !piece.isFlippedV
            };
            
            return {
                ...gameState,
                pieces: newPieces
            };
        })();

        pushState(newState, {
            type: 'FLIP_PIECE_V',
            pieceId: gameState.selectedPieceId
        });
    };

    const handleCellClick = (position: Position) => {
        // For now, do nothing when clicking cells
        // Remove this function if cell clicks aren't needed
    };

    const updateBoardAndPieces = (
        piece: PieceType,
        newPosition: Position | null,
        currentBoard: BoardCell[][]
    ): { board: BoardCell[][], pieces: PieceType[] } => {
        // Create new board
        let newBoard = currentBoard.map(row => [...row]);
        
        // Clear old position if exists
        if (piece.position) {
            newBoard = clearPieceFromBoard(newBoard, piece);
        }

        // Place in new position if provided
        if (newPosition) {
            const transformedShape = getTransformedShape(piece);
            for (let y = 0; y < transformedShape.length; y++) {
                for (let x = 0; x < transformedShape[0].length; x++) {
                    if (transformedShape[y][x]) {
                        const boardY = newPosition.y + y;
                        const boardX = newPosition.x + x;
                        if (boardY < newBoard.length && boardX < newBoard[0].length) {
                            newBoard[boardY][boardX].isOccupied = true;
                        }
                    }
                }
            }
        }

        // Update pieces array
        const newPieces = gameState.pieces.map(p => 
            p.id === piece.id 
                ? { ...p, position: newPosition }
                : p
        );

        return { board: newBoard, pieces: newPieces };
    };

    const handlePieceDrop = (position: Position, dragItem: DragItem) => {
        const { pieceId } = dragItem;
        
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (!piece || !isValidPlacement(gameState.board, piece, position)) {
            return;
        }

        const { board: newBoard, pieces: newPieces } = updateBoardAndPieces(
            piece,
            position,
            gameState.board
        );

        // Create a completely new state object
        const newState = {
            ...gameState,
            board: newBoard,
            pieces: newPieces,
            selectedPieceId: null
        };

        pushState(newState, {
            type: 'PLACE_PIECE',
            pieceId,
            position
        });
    };

    const handlePieceReturnToPile = (pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (!piece) return;

        const { board: newBoard, pieces: newPieces } = updateBoardAndPieces(
            piece,
            null,  // Setting position to null returns it to the pile
            gameState.board
        );

        const newState = {
            ...gameState,
            board: newBoard,
            pieces: newPieces,
            selectedPieceId: null
        };

        pushState(newState, {
            type: 'REMOVE_PIECE',
            pieceId
        });
    };

    const handlePileDropZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handlePileDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        const { pieceId } = JSON.parse(data) as DragItem;
        handlePieceReturnToPile(pieceId);
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            if (e.shiftKey) {
                if (canRedo) redo();
            } else {
                if (canUndo) undo();
            }
        }
    }, [canUndo, canRedo, undo, redo]);

    React.useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="game">
            <div className="game-controls">
                <button 
                    onClick={undo} 
                    disabled={!canUndo}
                    className="control-button"
                >
                    Undo
                </button>
                <button 
                    onClick={redo} 
                    disabled={!canRedo}
                    className="control-button"
                >
                    Redo
                </button>
            </div>
            <Board 
                board={gameState.board} 
                pieces={gameState.pieces}
                onCellClick={handleCellClick}
                onPieceDrop={handlePieceDrop}
            />
            <div 
                className="pieces-container"
                onDragOver={handlePileDropZoneDragOver}
                onDrop={handlePileDropZoneDrop}
            >
                {gameState.pieces
                    .filter(piece => !piece.position) // Only show unplaced pieces
                    .map(piece => (
                        <div key={piece.id} className="piece-wrapper">
                            <Piece
                                piece={piece}
                                isSelected={piece.id === gameState.selectedPieceId}
                                onClick={() => handlePieceSelect(piece.id)}
                            />
                            {piece.id === gameState.selectedPieceId && (
                                <PieceControls
                                    piece={piece}
                                    onRotate={handleRotate}
                                    onFlipH={handleFlipH}
                                    onFlipV={handleFlipV}
                                />
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Game; 