import React, { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { DragItem, Piece as PieceType, Position, Board, PuzzleDate, toPuzzleDate } from '../../common/types';
import { clearPieceFromBoard, getTransformedShape, isPuzzleSolved, isValidPlacement } from '../../common/gameLogic';
import { Board as BoardComponent } from './Board';
import { Piece } from './Piece';
import { PieceControls } from './PieceControls';
import ThemeToggle from './ThemeToggle';
import { SuccessMessage } from './SuccessMessage';
import { SolutionButton } from './SolutionButton';
import { HintButton } from './HintButton';
import { DatePicker } from './DatePicker';
import { initializeGame } from '../utils/initialize';
import { useGameHistory } from '../hooks/useGameHistory';
import { getSolution, getHint } from '../service/puzzleService';

export const Game: React.FC = () => {
    // State for the playing date (initialized to today)
    const [playingDate, setPlayingDate] = useState<PuzzleDate>(() => toPuzzleDate(new Date()));
    
    const {
        gameState,
        pushState,
        undo,
        redo,
        clearHistory,
        canUndo,
        canRedo
    } = useGameHistory(initializeGame(new Date()));

    // State for the puzzle solver
    const [isLoading, setIsLoading] = useState(false);
    const [isHintLoading, setIsHintLoading] = useState(false);
    const [solverError, setSolverError] = useState<string | null>(null);

    // Handle date change from date picker
    const handleDateChange = (newDate: PuzzleDate) => {
        setPlayingDate(newDate);
        // Create a new Date object from PuzzleDate for initialization
        // We use a fixed year (2024) since the puzzle only cares about month and day
        const jsDate = new Date(2024, newDate.month, newDate.day);
        const newGameState = initializeGame(jsDate);
        clearHistory(newGameState);
        setSolverError(null);
    };

    // Handle reset button - reinitialize game for current date
    const handleReset = () => {
        const jsDate = new Date(2024, playingDate.month, playingDate.day);
        const newGameState = initializeGame(jsDate);
        clearHistory(newGameState);
        setSolverError(null);
    };

    // Check if board is empty (no pieces placed)
    const isBoardEmpty = gameState.pieces.every(piece => piece.position === null);

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
        if (isPuzzleSolved(newBoard, playingDate)) {
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
        if (isPuzzleSolved(newBoard, playingDate)) {
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

    // Format playing date as DD/MM
    const formattedDate = `${String(playingDate.day).padStart(2, '0')}/${String(playingDate.month + 1).padStart(2, '0')}`;

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
            // Call the server to get the solution using the playing date
            const solutionPieces = await getSolution(playingDate);

            // Build the new board state with the solution pieces placed
            let newBoard = gameState.board.map(row => 
                row.map(cell => ({ ...cell, isOccupied: false }))
            );

            // Place each piece on the board
            for (const piece of solutionPieces) {
                if (piece.position) {
                    const transformedShape = getTransformedShape(piece);
                    for (let y = 0; y < transformedShape.length; y++) {
                        for (let x = 0; x < transformedShape[y].length; x++) {
                            if (transformedShape[y][x]) {
                                const boardY = piece.position.y + y;
                                const boardX = piece.position.x + x;
                                if (boardY < newBoard.length && boardX < newBoard[boardY].length) {
                                    newBoard[boardY][boardX].isOccupied = true;
                                }
                            }
                        }
                    }
                }
            }

            // Mark all pieces as locked when showing solution
            const lockedPieces = solutionPieces.map(piece => ({
                ...piece,
                isLocked: true
            }));

            const solvedState = {
                ...gameState,
                board: newBoard,
                pieces: lockedPieces,
                isSolved: true,
                solutionRevealed: true,  // Mark that solution was revealed, not solved by user
                selectedPieceId: null
            };

            // Clear history to prevent undoing the solution (like hint)
            clearHistory(solvedState);

            console.log("Solution revealed!");
        } catch (error) {
            // Handle any errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setSolverError(errorMessage);
            console.error('Error finding solution:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHint = async () => {
        if (gameState.isSolved || isHintLoading || !isBoardEmpty) return;

        setSolverError(null);
        setIsHintLoading(true);

        try {
            // Call the server to get a hint (one random piece placement) using the playing date
            const hintPiece = await getHint(playingDate);

            // Find the original piece to get its shape
            const originalPiece = gameState.pieces.find(p => p.id === hintPiece.id);
            if (!originalPiece) {
                throw new Error('Hint piece not found in game state');
            }

            // Create the updated piece with hint data - mark as locked
            const updatedPiece = {
                ...originalPiece,
                position: hintPiece.position,
                rotation: hintPiece.rotation,
                isFlippedH: hintPiece.isFlippedH,
                isFlippedV: hintPiece.isFlippedV,
                isLocked: true  // Mark the hint piece as locked/unmovable
            };

            // Update the board with the hint piece
            let newBoard = gameState.board.map(row => 
                row.map(cell => ({ ...cell }))
            );

            if (updatedPiece.position) {
                const transformedShape = getTransformedShape(updatedPiece);
                for (let y = 0; y < transformedShape.length; y++) {
                    for (let x = 0; x < transformedShape[y].length; x++) {
                        if (transformedShape[y][x]) {
                            const boardY = updatedPiece.position.y + y;
                            const boardX = updatedPiece.position.x + x;
                            if (boardY < newBoard.length && boardX < newBoard[boardY].length) {
                                newBoard[boardY][boardX].isOccupied = true;
                            }
                        }
                    }
                }
            }

            // Update pieces array
            const newPieces = gameState.pieces.map(p => 
                p.id === hintPiece.id ? updatedPiece : p
            );

            const newState = {
                ...gameState,
                board: newBoard,
                pieces: newPieces,
                selectedPieceId: null
            };

            // Clear history to prevent undoing the hint
            clearHistory(newState);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setSolverError(errorMessage);
            console.error('Error getting hint:', error);
        } finally {
            setIsHintLoading(false);
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
        <Container maxWidth="lg" sx={{ py: 2, minHeight: '100vh' }}>
            {/* Top Bar */}
            <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ mb: 2 }}
            >
                <ThemeToggle />
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <DatePicker currentDate={playingDate} onDateChange={handleDateChange} />
                    <Button 
                        variant="contained"
                        onClick={undo} 
                        disabled={!canUndo}
                        size="small"
                        startIcon={<UndoIcon />}
                    >
                        Undo
                    </Button>
                    <Button 
                        variant="contained"
                        onClick={redo} 
                        disabled={!canRedo}
                        size="small"
                        startIcon={<RedoIcon />}
                    >
                        Redo
                    </Button>
                    <Button 
                        variant="outlined"
                        onClick={handleReset}
                        disabled={isBoardEmpty}
                        size="small"
                        startIcon={<RestartAltIcon />}
                        color="warning"
                    >
                        Reset
                    </Button>
                    {solverError && (
                        <Alert severity="error" sx={{ py: 0 }}>
                            {solverError}
                        </Alert>
                    )}
                    <HintButton onHint={handleHint} isLoading={isHintLoading} disabled={!isBoardEmpty} />
                    <SolutionButton onSolve={handleSolve} isLoading={isLoading} />
                </Stack>
            </Stack>

            {/* Title */}
            <Typography 
                variant="h4" 
                component="h1" 
                align="center" 
                sx={{ mb: 2, fontWeight: 'bold' }}
            >
                Calendar Puzzle
            </Typography>

            {/* Success Message Dialog */}
            <SuccessMessage isVisible={gameState.isSolved && !gameState.solutionRevealed} />

            {/* Game Area */}
            <Box component="main">
                <BoardComponent 
                    board={gameState.board} 
                    pieces={gameState.pieces}
                    onCellClick={handleCellClick}
                    onPieceDrop={handlePieceDrop}
                    data-testid="board"
                />
                <Box 
                    className="pieces-container"
                    onDragOver={handlePileDropZoneDragOver}
                    onDrop={handlePileDropZoneDrop}
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1,
                        mt: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        justifyItems: 'center',
                        maxWidth: 900,
                        mx: 'auto',
                    }}
                >
                    {gameState.pieces
                        .filter(piece => !piece.position)
                        .map(piece => (
                            <Box 
                                key={piece.id} 
                                className="piece-wrapper"
                                sx={{
                                    position: 'relative',
                                    p: 1,
                                    bgcolor: 'background.default',
                                    borderRadius: 2,
                                    width: 210,
                                    height: 280,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                }}
                            >
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
                            </Box>
                        ))}
                </Box>
            </Box>
        </Container>
    );
};
