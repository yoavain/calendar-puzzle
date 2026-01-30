import { useCallback, useEffect, useRef, useState } from "react";
import type { Board, DragItem, GameState, Piece as PieceType, Position, PuzzleDate } from "../../../common/types";
import { toPuzzleDate } from "../../../common/types";
import { calculateProgress, clearPieceFromBoard, getTransformedShape, isValidPlacement, puzzleSolvedForDate } from "../../../common/gameLogic";
import { initializeBoard, initializeGame } from "../../utils/initialize";
import { useGameHistory } from "../../hooks/useGameHistory";
import { getHint, getHintState, getSolution, recordCompletion, recordStart } from "../../service/puzzleService";
import { clearSession, loadSession, saveSession } from "../../hooks/useGameSession";
import { logToServer } from "../../service/logService";
import { useUser } from "../../context/UserContext";

// Type for invalid drop feedback
export interface InvalidDropCell {
    x: number;
    y: number;
}

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

/**
 * Hook that encapsulates all game state and handlers.
 * This is the main controller for the game logic, independent of layout.
 */
export function useGameController() {
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

    // State for modals
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isSuccessMessageOpen, setIsSuccessMessageOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    // State for tracking dragged piece for preview
    const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);

    // Helper to update board and pieces
    const updateBoardAndPieces = useCallback((
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
    }, []);

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
    const triggerInvalidDropFeedback = useCallback((piece: PieceType, position: Position) => {
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
    }, []);

    // Check if board is empty (no pieces placed)
    const isBoardEmpty = gameState.pieces.every(piece => piece.position === null);

    // Reset is disabled if no pieces are placed OR if only locked pieces (hints) are placed
    const isResetDisabled = gameState.pieces.every(piece => piece.position === null || piece.isLocked);

    // Format current date as DD/MM
    const formattedDate = `${String(gameState.currentDate.day).padStart(2, "0")}/${String(gameState.currentDate.month + 1).padStart(2, "0")}`;

    // === HANDLERS ===

    const handleDateChange = useCallback(async (newDate: PuzzleDate) => {
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
    }, [clearHistory, loadPersistentHint, updatePresent, user?.name]);

    const handleReset = useCallback(async () => {
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
    }, [gameState.currentDate, clearHistory, loadPersistentHint, updatePresent, user?.name]);

    const handlePieceSelect = useCallback((pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || piece?.isLocked) {
            return;
        }

        updatePresent({
            ...gameState,
            selectedPieceId: pieceId
        });
    }, [gameState, updatePresent]);

    const handleRotate = useCallback(() => {
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
    }, [gameState, pushState]);

    const handleFlipH = useCallback(() => {
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
    }, [gameState, pushState]);

    const handleFlipV = useCallback(() => {
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
    }, [gameState, pushState]);

    const handleCellClick = useCallback((_position: Position) => {
        // For now, do nothing when clicking cells
    }, []);

    const handlePieceDrop = useCallback((position: Position, dragItem: DragItem) => {
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
    }, [gameState, updatePresent, updateBoardAndPieces, triggerInvalidDropFeedback, pushState, user]);

    const handlePieceReturnToPile = useCallback((pieceId: number) => {
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
    }, [gameState, updateBoardAndPieces, pushState]);

    const handlePileDropZoneDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const handlePileDropZoneDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
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
    }, [handlePieceReturnToPile, user?.name]);

    const handleSolve = useCallback(async () => {
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
    }, [gameState, isLoading, clearHistory, user?.name]);

    const handleHint = useCallback(async () => {
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
    }, [gameState, isHintLoading, isBoardEmpty, updateBoardAndPieces, clearHistory, user?.name]);

    // Per-piece control handlers
    const handleRotatePiece = useCallback((pieceId: number) => {
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
    }, [gameState, pushState]);

    const handleRotateCCWPiece = useCallback((pieceId: number) => {
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
    }, [gameState, pushState]);

    const handleFlipHPiece = useCallback((pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece || piece.isLocked) {
            return;
        }
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        newPieces[pieceIndex] = { ...piece, isFlippedH: !piece.isFlippedH };
        pushState({ ...gameState, pieces: newPieces }, { type: "FLIP_PIECE_H", pieceId });
    }, [gameState, pushState]);

    const handleFlipVPiece = useCallback((pieceId: number) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece || piece.isLocked) {
            return;
        }
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        newPieces[pieceIndex] = { ...piece, isFlippedV: !piece.isFlippedV };
        pushState({ ...gameState, pieces: newPieces }, { type: "FLIP_PIECE_V", pieceId });
    }, [gameState, pushState]);

    const handleGlobalDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        
        // Check if the drop target is the board or a cell within the board
        const boardElement = document.querySelector("[data-testid=\"board\"]");
        if (boardElement && boardElement.contains(e.target as Node)) {
            // Drop is inside the board area, ignore here
            return;
        }

        const data = e.dataTransfer.getData("text/plain");
        try {
            if (!data) {
                return;
            }
            const { pieceId } = JSON.parse(data) as DragItem;
            handlePieceReturnToPile(pieceId);
        }
        catch {
            // Ignore errors from non-game drag events
        }
    }, [handlePieceReturnToPile]);

    const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    // Keyboard shortcuts handler
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

    // === EFFECTS ===

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

    // Check for initial hint on mount
    useEffect(() => {
        const checkInitialHint = async () => {
            const currentDate = gameState.currentDate;
            if (!userLoading && user && isBoardEmpty) {
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
    }, [user, userLoading, gameState.currentDate]); // Run when user logs in or date is set

    // Keyboard event listener
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Update document title when date changes
    useEffect(() => {
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

    // Return all state and handlers
    return {
        // User state
        user,
        userLoading,

        // Game state
        gameState,
        isLoading,
        isHintLoading,
        solverError,
        invalidDropCells,
        draggedPieceId,
        isBoardEmpty,
        isResetDisabled,
        formattedDate,

        // History
        canUndo,
        canRedo,
        undo,
        redo,

        // Modal state
        modals: {
            stats: {
                isOpen: isStatsOpen,
                open: () => setIsStatsOpen(true),
                close: () => setIsStatsOpen(false)
            },
            issue: {
                isOpen: isIssueModalOpen,
                open: () => setIsIssueModalOpen(true),
                close: () => setIsIssueModalOpen(false)
            },
            success: {
                isOpen: isSuccessMessageOpen,
                open: () => setIsSuccessMessageOpen(true),
                close: () => setIsSuccessMessageOpen(false)
            },
            help: {
                isOpen: isHelpModalOpen,
                open: () => setIsHelpModalOpen(true),
                close: () => setIsHelpModalOpen(false)
            }
        },

        // Drag state
        setDraggedPieceId,

        // Game handlers
        handleDateChange,
        handleReset,
        handlePieceSelect,
        handleRotate,
        handleFlipH,
        handleFlipV,
        handleCellClick,
        handlePieceDrop,
        handlePieceReturnToPile,
        handleSolve,
        handleHint,

        // Per-piece handlers
        handleRotatePiece,
        handleRotateCCWPiece,
        handleFlipHPiece,
        handleFlipVPiece,

        // Pile drop zone handlers
        handlePileDropZoneDragOver,
        handlePileDropZoneDrop,

        // Global drag handlers
        handleGlobalDrop,
        handleGlobalDragOver,

        // Utility
        calculateProgress: () => calculateProgress(gameState.pieces)
    };
}

export type GameController = ReturnType<typeof useGameController>;
