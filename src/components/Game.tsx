import React, { useCallback, useState } from 'react';
import { DragItem, Piece as PieceType, Position, Board } from '../types/types';
import { Board as BoardComponent } from './Board';
import { Piece } from './Piece';
import { PieceControls } from './PieceControls';
import ThemeToggle from './ThemeToggle';
import { SuccessMessage } from './SuccessMessage';
import { SolutionButton } from './SolutionButton';
import { initializeGame } from '../utils/initialize';
import { clearPieceFromBoard, getTransformedShape, isPuzzleSolved, isValidPlacement } from '../utils/gameLogic';
import { useGameHistory } from '../hooks/useGameHistory';
import { findSolution as findPuzzleSolution } from '../utils/puzzleSolver';

export const Game: React.FC = () => {
    const {
        gameState,
        pushState,
        undo,
        redo,
        canUndo,
        canRedo
    } = useGameHistory(initializeGame());

    // State for the puzzle solver
    const [isLoading, setIsLoading] = useState(false);
    const [solverError, setSolverError] = useState<string | null>(null);

    const handlePieceSelect = (pieceId: number) => {
        if (gameState.isSolved) return;

        pushState(
            {
                ...gameState,
                selectedPieceId: pieceId
            },
            { type: 'SELECT_PIECE', pieceId }
        );
    };

    const handleRotate = () => {
        if (gameState.selectedPieceId === null || gameState.isSolved) return;

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
        if (gameState.selectedPieceId === null || gameState.isSolved) return;

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
        if (gameState.selectedPieceId === null || gameState.isSolved) return;

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
        currentBoard: Board
    ): { board: Board, pieces: PieceType[] } => {
        // Create new board
        let newBoard = currentBoard.map(row => [...row]);

        // Clear old position if exists
        if (piece.position) {
            clearPieceFromBoard(newBoard, piece);
        }

        // Place in new position if provided
        if (newPosition) {
            const transformedShape = getTransformedShape(piece);
            for (let y = 0; y < transformedShape.length; y++) {
                for (let x = 0; x < transformedShape[y].length; x++) {
                    if (transformedShape[y][x]) {
                        const boardY = newPosition.y + y;
                        const boardX = newPosition.x + x;
                        if (boardY < newBoard.length && boardX < newBoard[boardY].length) {
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
        if (gameState.isSolved) return;

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

        // Check if the puzzle is solved
        if (isPuzzleSolved(newBoard, newState.currentDate)) {
            console.log("Puzzle Solved!");
            newState.isSolved = true;
        }
    };

    const handlePieceReturnToPile = (pieceId: number) => {
        if (gameState.isSolved) return;

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

        // Check if the puzzle is solved
        if (isPuzzleSolved(newBoard, newState.currentDate)) {
            console.log("Puzzle Solved!");
            newState.isSolved = true;
        }
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

    // Format current date as DD/MM
    const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit'
    });

    // Update document title when date changes
    React.useEffect(() => {
        document.title = `Calendar Puzzle - ${formattedDate}`;
    }, [formattedDate]);

    const handleSolve = async () => {
        if (gameState.isSolved || isLoading) return;

        // Reset any previous errors
        setSolverError(null);
        setIsLoading(true);

        try {
            // Remove all pieces from the board first
            const clearedPieces = gameState.pieces.map(piece => ({
                ...piece,
                position: null
            }));

            // Use the improved puzzle solver
            const solution = findPuzzleSolution(
                gameState.board, 
                clearedPieces, 
                gameState.currentDate
            );

            if (solution) {
                // Push the solved GameState directly
                pushState(solution, { 
                    type: 'SOLVE_PUZZLE',
                    pieceId: -1 // We need to provide a pieceId even though it's not used for solve
                });

                if (solution.isSolved) {
                    console.log("Puzzle Solved!");
                }
            } else {
                // No solution found
                setSolverError('No solution found for the current date.');
            }
        } catch (error) {
            // Handle any errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setSolverError(errorMessage);
            console.error('Error finding solution:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Add new handlers for per-piece controls
    const handleRotatePiece = (pieceId: number) => {
        if (gameState.isSolved) return;
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        const piece = newPieces[pieceIndex];
        const newRotation = ((piece.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        newPieces[pieceIndex] = { ...piece, rotation: newRotation };
        pushState({ ...gameState, pieces: newPieces }, { type: 'ROTATE_PIECE', pieceId });
    };

    const handleFlipHPiece = (pieceId: number) => {
        if (gameState.isSolved) return;
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        const piece = newPieces[pieceIndex];
        newPieces[pieceIndex] = { ...piece, isFlippedH: !piece.isFlippedH };
        pushState({ ...gameState, pieces: newPieces }, { type: 'FLIP_PIECE_H', pieceId });
    };

    const handleFlipVPiece = (pieceId: number) => {
        if (gameState.isSolved) return;
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        const piece = newPieces[pieceIndex];
        newPieces[pieceIndex] = { ...piece, isFlippedV: !piece.isFlippedV };
        pushState({ ...gameState, pieces: newPieces }, { type: 'FLIP_PIECE_V', pieceId });
    };

    return (
        <div className="app">
            <div className="top-bar">
                <ThemeToggle />
                <h1>Calendar Puzzle - {formattedDate}</h1>
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
                    {solverError && (
                        <div className="error-message" style={{ color: 'red', marginRight: '10px' }}>
                            {solverError}
                        </div>
                    )}
                    <SolutionButton onSolve={handleSolve} isLoading={isLoading} />
                </div>
            </div>
            <SuccessMessage isVisible={gameState.isSolved} />
            <main className="game">
                <BoardComponent 
                    board={gameState.board} 
                    pieces={gameState.pieces}
                    onCellClick={handleCellClick}
                    onPieceDrop={handlePieceDrop}
                    data-testid="board"
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
                                    data-testid={`piece-${piece.id}`}
                                />
                                <PieceControls
                                    piece={piece}
                                    onRotate={() => handleRotatePiece(piece.id)}
                                    onFlipH={() => handleFlipHPiece(piece.id)}
                                    onFlipV={() => handleFlipVPiece(piece.id)}
                                />
                            </div>
                        ))}
                </div>
            </main>
        </div>
    );
};
