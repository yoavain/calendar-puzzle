import React, { useCallback, useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import BugReportIcon from "@mui/icons-material/BugReport";
import type { DragItem, GameState, Piece as PieceType, Position, Board, PuzzleDate } from "../../common/types";
import { toPuzzleDate } from "../../common/types";
import { calculateProgress, clearPieceFromBoard, getTransformedShape, puzzleSolvedForDate, isValidPlacement } from "../../common/gameLogic";
import { Board as BoardComponent } from "./Board";
import { Piece } from "./Piece";
import { PieceControls } from "./PieceControls";
import ThemeToggle from "./ThemeToggle";
import { SuccessMessage } from "./SuccessMessage";
import { SolutionButton } from "./SolutionButton";
import { HintButton } from "./HintButton";
import { LoginButton } from "./LoginButton";
import { UserMenu } from "./UserMenu";
import { useUser } from "../context/UserContext";
import { DatePicker } from "./DatePicker";
import { StatsModal } from "./StatsModal";
import { IssueModal } from "./IssueModal";
import { ProgressBar } from "./ProgressBar";
import { initializeGame, initializeBoard } from "../utils/initialize";
import { useGameHistory } from "../hooks/useGameHistory";
import { getSolution, getHint, getHintState, recordStart, recordCompletion } from "../service/puzzleService";
import { saveSession, loadSession, clearSession } from "../hooks/useGameSession";
import { logToServer } from "../service/logService";
import { PiecesContainer, PiecePoolWrapper } from "./Game.styled";
import BarChartIcon from "@mui/icons-material/BarChart";

/**
 * Rebuild game state from saved pieces.
 * Reconstructs the board by placing each piece at its saved position.
 */
const rebuildGameState = (pieces: PieceType[], date: PuzzleDate, isSolved: boolean): GameState => {
    const board = initializeBoard(date);

    // Place each piece on the board
    for (const piece of pieces) {
        if (piece.position) {
            const shape = getTransformedShape(piece);
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        const boardY = piece.position.y + y;
                        const boardX = piece.position.x + x;
                        if (boardY < board.length && boardX < board[boardY].length) {
                            board[boardY][boardX].isOccupied = true;
                        }
                    }
                }
            }
        }
    }

    return {
        board,
        pieces,
        selectedPieceId: null,
        currentDate: date,
        isSolved,
        isGameComplete: isSolved,
        solutionRevealed: false
    };
};

/**
 * Get the initial game state, restoring from session if available and date matches today.
 */
const getInitialGameState = (): { state: GameState; date: PuzzleDate } => {
    const today = toPuzzleDate(new Date());
    const session = loadSession();

    if (session && session.date.month === today.month && session.date.day === today.day) {
        // Restore from session
        return {
            state: rebuildGameState(session.pieces, session.date, session.isSolved),
            date: session.date
        };
    }

    // Fresh game for today
    return {
        state: initializeGame(new Date()),
        date: today
    };
};

// Type for invalid drop feedback
export interface InvalidDropCell {
    x: number;
    y: number;
}

export const Game: React.FC = () => {
    // Get user authentication state
    const { 
        user, 
        loading: userLoading, 
        addCompletedDate, 
        addPlayedDate,
        completedDates,
        playedDates
    } = useUser();

    // Track which dates have been reported as started/completed in this session
    const startedDatesRef = useRef<Set<string>>(new Set());
    const completedDatesRef = useRef<Set<string>>(new Set());
    const getDateKey = useCallback((date: PuzzleDate) => `${date.month}-${date.day}`, []);

    // Get initial state (from session or fresh game)
    const [initial] = useState(getInitialGameState);
    
    const {
        gameState,
        pushState,
        updatePresent,
        undo,
        redo,
        clearHistory,
        canUndo,
        canRedo
    } = useGameHistory(initial.state);

    // State for the puzzle solver
    const [isLoading, setIsLoading] = useState(false);
    const [isHintLoading, setIsHintLoading] = useState(false);
    const [solverError, setSolverError] = useState<string | null>(null);

    // State for invalid drop visual feedback
    const [invalidDropCells, setInvalidDropCells] = useState<InvalidDropCell[]>([]);
    const invalidDropTimeoutRef = useRef<number | null>(null);

    // State for statistics modal
    const [isStatsOpen, setIsStatsOpen] = useState(false);

    // State for issue modal
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

    // State for success message popup
    const [isSuccessMessageOpen, setIsSuccessMessageOpen] = useState(false);

    // Handle date change from date picker
    const handleDateChange = async (newDate: PuzzleDate) => {
        clearSession(); // Clear saved session when changing date
        setIsSuccessMessageOpen(false);
        // Create a new Date object from PuzzleDate for initialization
        // We use a fixed year (2024) since the puzzle only cares about month and day
        const jsDate = new Date(2024, newDate.month, newDate.day);
        const newGameState = initializeGame(jsDate);
        
        // Immediately clear history with the new game state for instant feedback
        clearHistory(newGameState);
        
        // Load persistent hint if available
        loadPersistentHint(newDate, newGameState.pieces).then(hintState => {
            if (hintState) {
                const stateWithHint = {
                    ...newGameState,
                    board: hintState.board,
                    pieces: hintState.pieces
                };
                // Use updatePresent since we already cleared history for the date change
                updatePresent(stateWithHint);
            }
        }).catch(err => {
            logToServer("error", "Game: Failed to handle persistent hint on date change", err, user?.name);
        });
        
        setSolverError(null);
    };

    // Handle reset button - reinitialize game for current date
    const handleReset = async () => {
        const currentDate = gameState.currentDate;
        const jsDate = new Date(2024, currentDate.month, currentDate.day);
        const newGameState = initializeGame(jsDate);
        setIsSuccessMessageOpen(false);

        // Immediately clear history
        clearHistory(newGameState);

        // Load persistent hint if available
        loadPersistentHint(currentDate, newGameState.pieces).then(hintState => {
            if (hintState) {
                const stateWithHint = {
                    ...newGameState,
                    board: hintState.board,
                    pieces: hintState.pieces
                };
                updatePresent(stateWithHint);
            }
        }).catch(err => {
            logToServer("error", "Game: Failed to handle persistent hint on reset", err, user?.name);
        });
        
        setSolverError(null);
    };

    // Check if board is empty (no pieces placed)
    const isBoardEmpty = gameState.pieces.every(piece => piece.position === null);

    // Reset is disabled if no pieces are placed OR if only locked pieces (hints) are placed
    const isResetDisabled = gameState.pieces.every(piece => piece.position === null || piece.isLocked);

    const handlePieceSelect = (pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || piece?.isLocked) {
            return;
        }

        updatePresent({
            ...gameState,
            selectedPieceId: pieceId
        });
    };

    const handleRotate = () => {
        if (gameState.selectedPieceId === null || gameState.isSolved) {
            return;
        }

        const piece = gameState.pieces.find(p => p.id === gameState.selectedPieceId);
        if (piece?.isLocked) {
            return;
        }

        const newState = (() => {
            const newPieces = [...gameState.pieces];
            const pieceIndex = newPieces.findIndex(p => p.id === gameState.selectedPieceId);
            const pieceToRotate = newPieces[pieceIndex];

            // When exactly one flip is active, we must invert the rotation step
            // to maintain a consistent visual clockwise rotation.
            const isFlipped = pieceToRotate.isFlippedH !== pieceToRotate.isFlippedV;
            const rotationStep = isFlipped ? -90 : 90;
            const newRotation = ((pieceToRotate.rotation + rotationStep + 360) % 360) as 0 | 90 | 180 | 270;

            newPieces[pieceIndex] = {
                ...pieceToRotate,
                rotation: newRotation
            };

            return {
                ...gameState,
                pieces: newPieces
            };
        })();

        pushState(newState, {
            type: "ROTATE_PIECE",
            pieceId: gameState.selectedPieceId
        });
    };

    const handleFlipH = () => {
        if (gameState.selectedPieceId === null || gameState.isSolved) {
            return;
        }

        const piece = gameState.pieces.find(p => p.id === gameState.selectedPieceId);
        if (piece?.isLocked) {
            return;
        }

        const newState = (() => {
            const newPieces = [...gameState.pieces];
            const pieceIndex = newPieces.findIndex(p => p.id === gameState.selectedPieceId);
            const pieceToFlip = newPieces[pieceIndex];

            newPieces[pieceIndex] = {
                ...pieceToFlip,
                isFlippedH: !pieceToFlip.isFlippedH
            };

            return {
                ...gameState,
                pieces: newPieces
            };
        })();

        pushState(newState, {
            type: "FLIP_PIECE_H",
            pieceId: gameState.selectedPieceId
        });
    };

    const handleFlipV = () => {
        if (gameState.selectedPieceId === null || gameState.isSolved) {
            return;
        }

        const piece = gameState.pieces.find(p => p.id === gameState.selectedPieceId);
        if (piece?.isLocked) {
            return;
        }

        const newState = (() => {
            const newPieces = [...gameState.pieces];
            const pieceIndex = newPieces.findIndex(p => p.id === gameState.selectedPieceId);
            const pieceToFlip = newPieces[pieceIndex];

            newPieces[pieceIndex] = {
                ...pieceToFlip,
                isFlippedV: !pieceToFlip.isFlippedV
            };

            return {
                ...gameState,
                pieces: newPieces
            };
        })();

        pushState(newState, {
            type: "FLIP_PIECE_V",
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
        currentBoard: Board,
        currentPieces: PieceType[]
    ): { board: Board, pieces: PieceType[] } => {
        // Create new board - deep clone cells to avoid mutating the original state
        let newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

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
        const newPieces = currentPieces.map(p => 
            p.id === piece.id 
                ? { ...p, position: newPosition, rotation: piece.rotation, isFlippedH: piece.isFlippedH, isFlippedV: piece.isFlippedV, isLocked: piece.isLocked }
                : p
        );

        return { board: newBoard, pieces: newPieces };
    };

    // Helper to load persistent hint from server
    const loadPersistentHint = useCallback(async (date: PuzzleDate, currentPieces: PieceType[]) => {
        if (!user) {
            return null;
        }
        
        try {
            const hintPiece = await getHintState(date);
            if (hintPiece) {
                // Find the original piece to get its metadata
                const originalPiece = currentPieces.find(p => p.id === hintPiece.id);
                if (!originalPiece) {
                    return null;
                }

                // Create the updated piece with hint data - mark as locked
                const updatedPiece = {
                    ...originalPiece,
                    position: hintPiece.position,
                    rotation: hintPiece.rotation,
                    isFlippedH: hintPiece.isFlippedH,
                    isFlippedV: hintPiece.isFlippedV,
                    isLocked: true
                };

                // Update the board
                const { board: newBoard, pieces: newPieces } = updateBoardAndPieces(
                    updatedPiece,
                    hintPiece.position,
                    initializeBoard(date),
                    currentPieces
                );

                return { board: newBoard, pieces: newPieces };
            }
        }
        catch (error) {
            logToServer("error", "Game: Failed to load persistent hint", error, user?.name);
        }
        return null;
    }, [user, updateBoardAndPieces]);

    // Helper function to trigger invalid drop feedback
    const triggerInvalidDropFeedback = (piece: PieceType, position: Position) => {
        // Clear any existing timeout
        if (invalidDropTimeoutRef.current) {
            window.clearTimeout(invalidDropTimeoutRef.current);
        }

        // Calculate which cells the piece would occupy
        const transformedShape = getTransformedShape(piece);
        const cells: InvalidDropCell[] = [];

        for (let y = 0; y < transformedShape.length; y++) {
            for (let x = 0; x < transformedShape[y].length; x++) {
                if (transformedShape[y][x]) {
                    cells.push({
                        x: position.x + x,
                        y: position.y + y
                    });
                }
            }
        }

        setInvalidDropCells(cells);

        // Clear the feedback after animation duration (500ms)
        invalidDropTimeoutRef.current = window.setTimeout(() => {
            setInvalidDropCells([]);
            invalidDropTimeoutRef.current = null;
        }, 500);
    };

    const handlePieceDrop = (position: Position, dragItem: DragItem) => {
        const { pieceId } = dragItem;
        if (gameState.isSolved) {
            return;
        }

        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (!piece) {
            return;
        }

        // If piece is dropped back to the same position, do nothing
        if (piece.position && piece.position.x === position.x && piece.position.y === position.y) {
            updatePresent({
                ...gameState,
                selectedPieceId: null
            });
            return;
        }
        
        const valid = isValidPlacement(gameState.board, piece, position, true);
        if (!valid) {
            // Trigger visual feedback for invalid drop
            triggerInvalidDropFeedback(piece, position);
            return;
        }

        const { board: newBoard, pieces: newPieces } = updateBoardAndPieces(
            piece,
            position,
            gameState.board,
            gameState.pieces
        );

        // Check if the puzzle is solved BEFORE creating the state
        const solvedDate = puzzleSolvedForDate(newPieces);
        const solved = !!solvedDate && 
                       solvedDate.month === gameState.currentDate.month && 
                       solvedDate.day === gameState.currentDate.day;
        if (solved) {
            setIsSuccessMessageOpen(true);
            // Automatically show stats on completion after a short delay
            if (user) {
                setTimeout(() => setIsStatsOpen(true), 1500);
            }
        }

        // Create a completely new state object
        const newState = {
            ...gameState,
            board: newBoard,
            pieces: newPieces,
            selectedPieceId: null,
            isSolved: solved,
            solutionRevealed: false // User solved it manually
        };

        pushState(newState, {
            type: "PLACE_PIECE",
            pieceId,
            position
        });
    };

    const handlePieceReturnToPile = (pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece?.position || piece.isLocked) {
            return;
        }

        const { board: newBoard, pieces: newPieces } = updateBoardAndPieces(
            piece,
            null, // Setting position to null returns it to the pile
            gameState.board,
            gameState.pieces
        );

        const newState = {
            ...gameState,
            board: newBoard,
            pieces: newPieces,
            selectedPieceId: null
        };

        pushState(newState, {
            type: "REMOVE_PIECE",
            pieceId
        });
    };

    const handlePileDropZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handlePileDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        try {
            if (!data) {
                throw new Error("No data found in dataTransfer");
            }
            const { pieceId } = JSON.parse(data) as DragItem;
            handlePieceReturnToPile(pieceId);
        }
        catch (err) {
            logToServer("error", "Game: Failed to handle pile drop", err, user?.name);
        }
    };

    // Sync progress with server when user logs in or state changes
    useEffect(() => {
        if (!user || userLoading) {
            return;
        }

        const dateKey = getDateKey(gameState.currentDate);
        const isStarted = gameState.pieces.some(p => p.position !== null);
        const isSolved = gameState.isSolved;
        const solutionRevealed = gameState.solutionRevealed;
        const currentDate = gameState.currentDate;

        // Sync start progress
        if (isStarted && !startedDatesRef.current.has(dateKey)) {
            const alreadyPlayed = playedDates.some(d => d.month === currentDate.month && d.day === currentDate.day);
            if (!alreadyPlayed) {
                recordStart(currentDate).then(success => {
                    if (success) {
                        addPlayedDate(currentDate);
                    }
                });
            }
            startedDatesRef.current.add(dateKey);
        }

        // Sync completion progress
        // Only sync if solved by user (not revealed)
        if (isSolved && !solutionRevealed && !completedDatesRef.current.has(dateKey)) {
            const alreadyCompleted = completedDates.some(d => d.month === currentDate.month && d.day === currentDate.day);
            if (!alreadyCompleted) {
                recordCompletion(currentDate, gameState.pieces).then(success => {
                    if (success) {
                        addCompletedDate(currentDate);
                    }
                });
            }
            completedDatesRef.current.add(dateKey);
        }
    }, [user, userLoading, gameState.currentDate, gameState.pieces, gameState.isSolved, gameState.solutionRevealed, playedDates, completedDates, addPlayedDate, addCompletedDate, getDateKey]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            e.preventDefault();
            if (e.shiftKey) {
                if (canRedo) {
                    redo();
                }
            }
            else {
                if (canUndo) {
                    undo();
                }
            }
        }
        // Alternative: Ctrl+Y for redo (common on Windows)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            if (canRedo) {
                redo();
            }
        }
        // Escape to reset
        if (e.key === "Escape" && !isResetDisabled) {
            e.preventDefault();
            handleReset();
        }
    }, [canUndo, canRedo, undo, redo, isResetDisabled, handleReset]);

    useEffect(() => {
        const checkInitialHint = async () => {
            const currentDate = gameState.currentDate;
            if (user && isBoardEmpty) {
                try {
                    const hintState = await loadPersistentHint(currentDate, gameState.pieces);
                    if (hintState) {
                        const stateWithHint = {
                            ...gameState,
                            board: hintState.board,
                            pieces: hintState.pieces
                        };
                        clearHistory(stateWithHint);
                    }
                }
                catch (err) {
                    logToServer("error", "Game: Failed to load initial hint", err, user.name);
                }
            }
        };
        checkInitialHint();
    }, [user, gameState.currentDate]); // Run when user logs in or date is set

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Format current date as DD/MM
    const formattedDate = `${String(gameState.currentDate.day).padStart(2, "0")}/${String(gameState.currentDate.month + 1).padStart(2, "0")}`;

    // Update document title when date changes
    React.useEffect(() => {
        document.title = `Calendar Puzzle - ${formattedDate}`;
    }, [formattedDate]);

    // Save session on state changes (skip if solution was revealed)
    useEffect(() => {
        // Don't save if solution was revealed via button
        if (gameState.solutionRevealed) {
            clearSession();
            return;
        }

        saveSession({
            date: gameState.currentDate,
            pieces: gameState.pieces,
            isSolved: gameState.isSolved
        });
    }, [gameState]);

    const handleSolve = async () => {
        if (gameState.isSolved || isLoading) {
            return;
        }

        // Reset any previous errors
        setSolverError(null);
        setIsLoading(true);

        try {
            // Call the server to get the solution using the playing date
            const solutionPieces = await getSolution(gameState.currentDate);

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
                solutionRevealed: true, // Mark that solution was revealed, not solved by user
                selectedPieceId: null
            };

            // Clear history to prevent undoing the solution (like hint)
            clearHistory(solvedState);

        }
        catch (error) {
            // Handle any errors
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            logToServer("error", `Game: Solution failed: ${errorMessage}`, error, user?.name);
            setSolverError(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleHint = async () => {
        if (gameState.isSolved || isHintLoading || !isBoardEmpty) {
            return;
        }

        setSolverError(null);
        setIsHintLoading(true);

        try {
            // Call the server to get a hint (one random piece placement) using the playing date
            const hintPiece = await getHint(gameState.currentDate);

            // Find the original piece to get its shape
            const originalPiece = gameState.pieces.find(p => p.id === hintPiece.id);
            if (!originalPiece) {
                throw new Error("Hint piece not found in game state");
            }

            // Create the updated piece with hint data - mark as locked
            const updatedPiece = {
                ...originalPiece,
                position: hintPiece.position,
                rotation: hintPiece.rotation,
                isFlippedH: hintPiece.isFlippedH,
                isFlippedV: hintPiece.isFlippedV,
                isLocked: true // Mark the hint piece as locked/unmovable
            };

            // Update the board and pieces
            const { board: newBoard, pieces: newPieces } = updateBoardAndPieces(
                updatedPiece,
                hintPiece.position,
                gameState.board,
                gameState.pieces
            );

            const newState = {
                ...gameState,
                board: newBoard,
                pieces: newPieces,
                selectedPieceId: null
            };

            // Clear history to prevent undoing the hint
            clearHistory(newState);

        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            logToServer("error", `Game: Hint failed: ${errorMessage}`, error, user?.name);
            setSolverError(errorMessage);
        }
        finally {
            setIsHintLoading(false);
        }
    };

    // Add new handlers for per-piece controls
    const handleRotatePiece = (pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece || piece.isLocked) {
            return;
        }
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        
        // When exactly one flip is active, we must invert the rotation step
        // to maintain a consistent visual clockwise rotation.
        const isFlipped = piece.isFlippedH !== piece.isFlippedV;
        const rotationStep = isFlipped ? -90 : 90;
        const newRotation = ((piece.rotation + rotationStep + 360) % 360) as 0 | 90 | 180 | 270;
        
        newPieces[pieceIndex] = { ...piece, rotation: newRotation };
        pushState({ ...gameState, pieces: newPieces }, { type: "ROTATE_PIECE", pieceId });
    };

    const handleRotateCCWPiece = (pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece || piece.isLocked) {
            return;
        }
        
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        
        // When exactly one flip is active, we must invert the rotation step
        // to maintain a consistent visual counter-clockwise rotation.
        const isFlipped = piece.isFlippedH !== piece.isFlippedV;
        const rotationStep = isFlipped ? 90 : -90;
        const newRotation = ((piece.rotation + rotationStep + 360) % 360) as 0 | 90 | 180 | 270;
        
        newPieces[pieceIndex] = { ...piece, rotation: newRotation };
        pushState({ ...gameState, pieces: newPieces }, { type: "ROTATE_PIECE", pieceId });
    };

    const handleFlipHPiece = (pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece || piece.isLocked) {
            return;
        }
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        newPieces[pieceIndex] = { ...piece, isFlippedH: !piece.isFlippedH };
        pushState({ ...gameState, pieces: newPieces }, { type: "FLIP_PIECE_H", pieceId });
    };

    const handleFlipVPiece = (pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece || piece.isLocked) {
            return;
        }
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        newPieces[pieceIndex] = { ...piece, isFlippedV: !piece.isFlippedV };
        pushState({ ...gameState, pieces: newPieces }, { type: "FLIP_PIECE_V", pieceId });
    };

    return (
        <Container maxWidth="lg" sx={{ py: 2, minHeight: "100vh" }}>
            {/* Top Bar */}
            <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ mb: 2 }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <ThemeToggle />
                    {!userLoading && (user ? <UserMenu /> : <LoginButton />)}
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    {solverError && (
                        <Alert severity="error" sx={{ py: 0 }}>
                            {solverError}
                        </Alert>
                    )}
                    <SolutionButton onSolve={handleSolve} isLoading={isLoading} disabled={gameState.isSolved} />
                    <Tooltip title={!user ? "Sign-in to submit a bug or request a feature" : "Submit bug / Request Feature"} arrow>
                        <span>
                            <Button
                                variant="contained"
                                onClick={() => setIsIssueModalOpen(true)}
                                size="small"
                                sx={{ minWidth: 40, px: 1 }}
                                disabled={!user}
                                color="info"
                            >
                                <BugReportIcon />
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title={!user ? "Sign-in to see statistics" : "Statistics"} arrow>
                        <span>
                            <Button
                                variant="contained"
                                onClick={() => setIsStatsOpen(true)}
                                size="small"
                                sx={{ minWidth: 40, px: 1 }}
                                disabled={!user}
                            >
                                <BarChartIcon />
                            </Button>
                        </span>
                    </Tooltip>
                    <DatePicker currentDate={gameState.currentDate} onDateChange={handleDateChange} />
                    <HintButton onHint={handleHint} isLoading={isHintLoading} disabled={!isBoardEmpty || gameState.isSolved} />
                    <Tooltip title="Ctrl+Z" arrow>
                        <span>
                            <Button 
                                variant="contained"
                                onClick={undo} 
                                disabled={!canUndo || gameState.isSolved}
                                size="small"
                                startIcon={<UndoIcon />}
                            >
                                Undo
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Ctrl+Y or Ctrl+Shift+Z" arrow>
                        <span>
                            <Button 
                                variant="contained"
                                onClick={redo} 
                                disabled={!canRedo || gameState.isSolved}
                                size="small"
                                startIcon={<RedoIcon />}
                            >
                                Redo
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Esc" arrow>
                        <span>
                            <Button 
                                variant="outlined"
                                onClick={handleReset}
                                disabled={isResetDisabled}
                                size="small"
                                startIcon={<RestartAltIcon />}
                                color="warning"
                            >
                                Reset
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* Title */}
            <Typography 
                variant="h4" 
                component="h1" 
                align="center" 
                sx={{ mb: 2, fontWeight: "bold" }}
            >
                Calendar Puzzle
            </Typography>

            {/* Progress Bar */}
            <ProgressBar {...calculateProgress(gameState.pieces)} />

            {/* Success Message Dialog */}
            <SuccessMessage 
                isVisible={isSuccessMessageOpen} 
                onClose={() => setIsSuccessMessageOpen(false)} 
            />

            {/* Statistics Modal */}
            <StatsModal open={isStatsOpen} onClose={() => setIsStatsOpen(false)} />

            {/* Issue Modal */}
            <IssueModal open={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} />

            {/* Game Area */}
            <Box component="main">
                <BoardComponent 
                    board={gameState.board} 
                    pieces={gameState.pieces}
                    onCellClick={handleCellClick}
                    onPieceDrop={handlePieceDrop}
                    invalidDropCells={invalidDropCells}
                    solutionRevealed={gameState.solutionRevealed}
                    isSolved={gameState.isSolved}
                    data-testid="board"
                />
                <PiecesContainer
                    onDragOver={handlePileDropZoneDragOver}
                    onDrop={handlePileDropZoneDrop}
                >
                    {gameState.pieces
                        .filter(piece => !piece.position)
                        .map(piece => (
                            <PiecePoolWrapper key={piece.id}>
                                <Piece
                                    piece={piece}
                                    isSelected={piece.id === gameState.selectedPieceId}
                                    onClick={() => handlePieceSelect(piece.id)}
                                    data-testid={`piece-${piece.id}`}
                                />
                                <PieceControls
                                    piece={piece}
                                    onRotate={() => handleRotatePiece(piece.id)}
                                    onRotateCCW={() => handleRotateCCWPiece(piece.id)}
                                    onFlipH={() => handleFlipHPiece(piece.id)}
                                    onFlipV={() => handleFlipVPiece(piece.id)}
                                />
                            </PiecePoolWrapper>
                        ))}
                </PiecesContainer>
            </Box>
        </Container>
    );
};
