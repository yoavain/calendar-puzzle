import { useCallback, useEffect, useRef, useState } from "react";
import type { DragItem, GameState, Piece as PieceType, Position, PuzzleDate } from "../../../common/types";
import type { PieceId } from "../../../common/pieceData";
import { isDragItem, toPuzzleDate } from "../../../common/types";
import { calculateProgress, getTransformedShape, isValidPlacement, puzzleSolvedForDate } from "../../../common/gameLogic";
import { rebuildGameState, updateBoardAndPieces } from "../../../common/boardOperations";
import { initializeBoard, initializeGame } from "../../utils/initialize";
import { useGameHistory } from "../../hooks/useGameHistory";
import { getHint, getHintState, getSolution } from "../../service/puzzleService";
import { clearSession, loadSession } from "../../hooks/useGameSession";
import { logToServer } from "../../service/logService";
import { useUser } from "../../context/UserContext";
import { debugLogger } from "../../utils/debugLogger";
import { useGameModals } from "./useGameModals";
import { useServerSync } from "./useServerSync";
import { useSessionPersistence } from "./useSessionPersistence";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

// Type for invalid drop feedback
export interface InvalidDropCell {
    x: number;
    y: number;
}

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

    // Generation counter to discard stale hint responses
    const hintLoadIdRef = useRef(0);

    // Always-current ref used by async callbacks to avoid stale closures
    const gameStateRef = useRef(gameState);
    gameStateRef.current = gameState;

    // State for tracking dragged piece for preview
    const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);

    const handleDragEnd = useCallback(() => {
        setDraggedPieceId(null);
    }, []);

    // Modal state and play-another dialog flow
    const {
        justSolvedRef,
        statsAutoOpenTimeoutRef,
        setIsSuccessMessageOpen,
        setIsStatsOpen,
        setIsPlayAnotherOpen,
        modals
    } = useGameModals({ user, userLoading, completedDates, currentDate: gameState.currentDate });

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
    }, [user]);

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

    // Shared initialization logic used by both handleDateChange and handleReset
    const initializeForDate = useCallback((date: PuzzleDate) => {
        setIsSuccessMessageOpen(false);
        // We use a fixed year (2024) since the puzzle only cares about month and day
        const jsDate = new Date(2024, date.month, date.day);
        const newGameState = initializeGame(jsDate);

        // Immediately clear history with the new game state for instant feedback
        clearHistory(newGameState);

        // Load persistent hint if available
        const thisHintLoadId = ++hintLoadIdRef.current;
        loadPersistentHint(date, newGameState.pieces).then(hintState => {
            if (hintLoadIdRef.current !== thisHintLoadId) {
                return;
            }
            if (hintState) {
                updatePresent({ ...newGameState, board: hintState.board, pieces: hintState.pieces });
            }
        }).catch(err => {
            logToServer("error", "Game: Failed to load persistent hint", err, user?.name);
        });

        setSolverError(null);
    }, [clearHistory, loadPersistentHint, updatePresent, user?.name, setIsSuccessMessageOpen]);

    const handleDateChange = useCallback((newDate: PuzzleDate) => {
        clearSession(); // Clear saved session when changing date
        initializeForDate(newDate);
    }, [initializeForDate]);

    const handleReset = useCallback(() => {
        debugLogger.log("ctrl:handleReset", { date: gameState.currentDate });
        initializeForDate(gameState.currentDate);
    }, [gameState.currentDate, initializeForDate]);

    const handlePieceSelect = useCallback((pieceId: PieceId) => {
        debugLogger.log("ctrl:handlePieceSelect", { pieceId });
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || piece?.isLocked) {
            return;
        }

        updatePresent({
            ...gameState,
            selectedPieceId: pieceId
        });
    }, [gameState, updatePresent]);

    const handleCellClick = useCallback((position: Position) => {
        // Tap-to-place: If a piece is selected, try to place it at this position
        if (!gameState.selectedPieceId || gameState.isSolved) {
            return;
        }

        const piece = gameState.pieces.find(p => p.id === gameState.selectedPieceId);
        if (!piece || piece.position) {
            // Piece not found, or it is already placed on the board.
            // Tapping a board cell while a placed piece is selected is intentionally a no-op:
            // the selection stays unchanged and the user must drag the piece to move it.
            return;
        }

        // Check if placement is valid
        const valid = isValidPlacement(gameState.board, piece, position, true);
        if (!valid) {
            // Trigger visual feedback for invalid placement
            triggerInvalidDropFeedback(piece, position);
            return;
        }

        // Place the piece using the helper function
        const { board: newBoard, pieces: newPieces } = updateBoardAndPieces(
            piece,
            position,
            gameState.board,
            gameState.pieces
        );

        const newState: GameState = {
            ...gameState,
            pieces: newPieces,
            board: newBoard,
            selectedPieceId: null // Deselect after placing
        };

        pushState(newState, {
            type: "PLACE_PIECE",
            pieceId: piece.id,
            position
        });
    }, [gameState, pushState, triggerInvalidDropFeedback]);

    const handlePieceDrop = useCallback((position: Position, dragItem: DragItem) => {
        const { pieceId } = dragItem;
        debugLogger.log("ctrl:handlePieceDrop", { pieceId, position });
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
            justSolvedRef.current = true;
            setIsSuccessMessageOpen(true);
            // Automatically show stats on completion after a short delay
            if (user) {
                statsAutoOpenTimeoutRef.current = window.setTimeout(() => {
                    statsAutoOpenTimeoutRef.current = null;
                    setIsStatsOpen(true);
                }, 1500);
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
    }, [gameState, updatePresent, triggerInvalidDropFeedback, pushState, user, justSolvedRef, statsAutoOpenTimeoutRef, setIsSuccessMessageOpen, setIsStatsOpen]);

    const handlePieceReturnToPile = useCallback((pieceId: PieceId) => {
        debugLogger.log("ctrl:handlePieceReturnToPile", { pieceId });
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
    }, [gameState, pushState]);

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
            const parsed: unknown = JSON.parse(data);
            if (!isDragItem(parsed)) {
                throw new Error("Invalid drag payload");
            }
            handlePieceReturnToPile(parsed.pieceId);
        }
        catch (err) {
            logToServer("error", "Game: Failed to handle pile drop", err, user?.name);
        }
    }, [handlePieceReturnToPile, user?.name]);

    const handleSolve = useCallback(async () => {
        debugLogger.log("ctrl:handleSolve", { date: gameState.currentDate });
        if (gameState.isSolved || isLoading) {
            return;
        }

        // Reset any previous errors
        setSolverError(null);
        setIsLoading(true);

        try {
            // Call the server to get the solution using the playing date
            const solutionPieces = await getSolution(gameState.currentDate);

            // Mark all pieces as locked when showing solution
            const lockedPieces = solutionPieces.map(piece => ({
                ...piece,
                isLocked: true
            }));

            const solvedState = {
                ...rebuildGameState(lockedPieces, gameState.currentDate, true),
                solutionRevealed: true // Mark that solution was revealed, not solved by user
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
        debugLogger.log("ctrl:handleHint", { date: gameState.currentDate });
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
    }, [gameState, isHintLoading, isBoardEmpty, clearHistory, user?.name]);

    // Per-piece control handlers
    const rotatePiece = useCallback((pieceId: PieceId, direction: "cw" | "ccw") => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece || piece.isLocked) {
            return;
        }
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);

        // When exactly one flip is active, we must invert the rotation step
        // to maintain a consistent visual rotation direction.
        const isFlipped = piece.isFlippedH !== piece.isFlippedV;
        const rotationStep = direction === "cw"
            ? (isFlipped ? -90 : 90)
            : (isFlipped ? 90 : -90);
        const newRotation = ((piece.rotation + rotationStep + 360) % 360) as 0 | 90 | 180 | 270;

        newPieces[pieceIndex] = { ...piece, rotation: newRotation };
        pushState({ ...gameState, pieces: newPieces }, { type: "ROTATE_PIECE", pieceId });
    }, [gameState, pushState]);

    const handleRotatePiece = useCallback((pieceId: PieceId) => rotatePiece(pieceId, "cw"), [rotatePiece]);
    const handleRotateCCWPiece = useCallback((pieceId: PieceId) => rotatePiece(pieceId, "ccw"), [rotatePiece]);

    const flipPiece = useCallback((pieceId: PieceId, axis: "H" | "V") => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (gameState.isSolved || !piece || piece.isLocked) {
            return;
        }
        const newPieces = [...gameState.pieces];
        const pieceIndex = newPieces.findIndex(p => p.id === pieceId);
        if (axis === "H") {
            newPieces[pieceIndex] = { ...piece, isFlippedH: !piece.isFlippedH };
            pushState({ ...gameState, pieces: newPieces }, { type: "FLIP_PIECE_H", pieceId });
        }
        else {
            newPieces[pieceIndex] = { ...piece, isFlippedV: !piece.isFlippedV };
            pushState({ ...gameState, pieces: newPieces }, { type: "FLIP_PIECE_V", pieceId });
        }
    }, [gameState, pushState]);

    const handleFlipHPiece = useCallback((pieceId: PieceId) => flipPiece(pieceId, "H"), [flipPiece]);
    const handleFlipVPiece = useCallback((pieceId: PieceId) => flipPiece(pieceId, "V"), [flipPiece]);

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
            const parsed: unknown = JSON.parse(data);
            if (!isDragItem(parsed)) {
                throw new Error("Invalid drag payload");
            }
            handlePieceReturnToPile(parsed.pieceId);
        }
        catch {
            // Ignore errors from non-game drag events
        }
    }, [handlePieceReturnToPile]);

    const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    const handlePlayAnother = useCallback((date: PuzzleDate | null) => {
        if (!date) {
            return;
        }
        setIsPlayAnotherOpen(false);
        handleDateChange(date);
    }, [handleDateChange, setIsPlayAnotherOpen]);

    // === SUB-HOOKS (side effects only) ===

    // Check for initial hint on mount / when user logs in / when date changes.
    // gameStateRef is used inside the async callback so reads are always fresh,
    // avoiding a stale-closure bug without adding gameState.pieces to the deps
    // (which would re-run the effect on every piece placement).
    useEffect(() => {
        const checkInitialHint = async () => {
            const currentDate = gameState.currentDate;
            const currentPieces = gameStateRef.current.pieces;
            const isEmpty = gameStateRef.current.pieces.every(p => p.position === null);
            if (!userLoading && user && isEmpty) {
                try {
                    const thisHintLoadId = ++hintLoadIdRef.current;
                    const hintState = await loadPersistentHint(currentDate, currentPieces);
                    if (hintLoadIdRef.current !== thisHintLoadId) {
                        return;
                    }
                    // Re-check emptiness after the async gap to avoid overwriting user moves
                    if (!gameStateRef.current.pieces.every(p => p.position === null)) {
                        return;
                    }
                    if (hintState) {
                        clearHistory({
                            ...gameStateRef.current,
                            board: hintState.board,
                            pieces: hintState.pieces
                        });
                    }
                }
                catch (err) {
                    logToServer("error", "Game: Failed to load initial hint", err, user.name);
                }
            }
        };
        checkInitialHint();
    }, [user, userLoading, gameState.currentDate, loadPersistentHint, clearHistory]);

    useServerSync({ user, userLoading, gameState, playedDates, completedDates, addPlayedDate, addCompletedDate });

    useSessionPersistence({ gameState });

    useKeyboardShortcuts({ canUndo, canRedo, undo, redo, handleReset, isResetDisabled });

    // Update document title when date changes
    useEffect(() => {
        document.title = `Calendar Puzzle - ${formattedDate}`;
    }, [formattedDate]);

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
        modals,

        // Drag state
        setDraggedPieceId,
        handleDragEnd,

        // Game handlers
        handleDateChange,
        handlePlayAnother,
        handleReset,
        handlePieceSelect,
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
