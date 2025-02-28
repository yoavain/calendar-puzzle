import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Position, Piece as PieceType, DragItem, GameStateAction } from '../types/types';
import Board from './Board';
import Piece from './Piece';
import PieceControls from './PieceControls';
import { initializeGame } from '../utils/initialize';
import { rotatePiece, flipPiece, isValidPlacement, clearPieceFromBoard } from '../utils/gameLogic';
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

    const handleFlip = () => {
        if (gameState.selectedPieceId === null) return;
        
        const newState = (() => {
            const newPieces = [...gameState.pieces];
            const pieceIndex = newPieces.findIndex(p => p.id === gameState.selectedPieceId);
            const piece = newPieces[pieceIndex];
            
            const newShape = flipPiece(piece);
            
            newPieces[pieceIndex] = {
                ...piece,
                isFlipped: !piece.isFlipped,
                shape: newShape
            };
            
            return {
                ...gameState,
                pieces: newPieces
            };
        })();

        pushState(newState, {
            type: 'FLIP_PIECE',
            pieceId: gameState.selectedPieceId
        });
    };

    const handleCellClick = (position: Position) => {
        // Implement piece placement logic
    };

    const handlePieceDrop = (position: Position, dragItem: DragItem) => {
        const { pieceId, shape } = dragItem;
        
        const newState = (() => {
            // Check if placement is valid
            const piece = gameState.pieces.find(p => p.id === pieceId);
            if (!piece || !isValidPlacement(gameState.board, piece, position)) {
                return gameState;
            }

            // Create new board with piece placed
            const newBoard = gameState.board.map(row => [...row]);
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[0].length; x++) {
                    if (shape[y][x]) {
                        const boardY = position.y + y;
                        const boardX = position.x + x;
                        if (boardY < newBoard.length && boardX < newBoard[0].length) {
                            newBoard[boardY][boardX].isOccupied = true;
                        }
                    }
                }
            }

            // Update piece position
            const newPieces = gameState.pieces.map(p => 
                p.id === pieceId 
                    ? { ...p, position }
                    : p
            );

            return {
                ...gameState,
                board: newBoard,
                pieces: newPieces,
                selectedPieceId: null
            };
        })();

        if (newState !== gameState) {
            pushState(newState, {
                type: 'PLACE_PIECE',
                pieceId,
                position
            });
        }
    };

    const handlePiecePickup = (pieceId: number) => {
        const newState = (() => {
            const piece = gameState.pieces.find(p => p.id === pieceId);
            if (!piece || !piece.position) return gameState;

            // Create new board with piece removed
            const newBoard = clearPieceFromBoard(gameState.board, piece);

            // Update piece position to null
            const newPieces = gameState.pieces.map(p => 
                p.id === pieceId 
                    ? { ...p, position: null }
                    : p
            );

            return {
                ...gameState,
                board: newBoard,
                pieces: newPieces,
                selectedPieceId: pieceId
            };
        })();

        if (newState !== gameState) {
            pushState(newState, {
                type: 'REMOVE_PIECE',
                pieceId
            });
        }
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
                onCellClick={handleCellClick}
                onPieceDrop={handlePieceDrop}
            />
            <div className="pieces-container">
                {gameState.pieces.map(piece => (
                    <div key={piece.id} className="piece-wrapper">
                        <Piece
                            piece={piece}
                            isSelected={piece.id === gameState.selectedPieceId}
                            onClick={() => piece.position ? handlePiecePickup(piece.id) : handlePieceSelect(piece.id)}
                        />
                        {piece.id === gameState.selectedPieceId && (
                            <PieceControls
                                piece={piece}
                                onRotate={handleRotate}
                                onFlip={handleFlip}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Game; 