import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { DragItem, GameState, Piece as PieceType, Position, PuzzleDate } from "../../../common/types";
import { isDragItem, toPuzzleDate } from "../../../common/types";
import type { PieceId } from "../../../common/pieceData";
import { getPlacementOrder, getTransformedShape, isValidPlacement, puzzleSolvedForDate } from "../../../common/gameLogic";
import { applyHintPieces, rebuildGameState, updateBoardAndPieces } from "../../../common/boardOperations";
import { countHintPieces, getHintAvailability } from "../../../common/hintTokens";
import { initializeBoard, initializeGame } from "../../../common/initialize";
import { getRandomPuzzleDate } from "../../../common/streakUtils";
import { useGameHistory } from "../../hooks/useGameHistory";
import { getHint, getHintState, getSolution, HintRequestError } from "../../service/puzzleService";
import { clearSession, loadSession } from "../../hooks/useGameSession";
import { logToServer } from "../../service/logService";
import { useUser } from "../../context/UserContext";
import { debugLogger } from "../../utils/debugLogger";
import { useGameModals } from "./useGameModals";
import { useServerSync } from "./useServerSync";
import { useSessionPersistence } from "./useSessionPersistence";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { HINT_TOKEN_COPY } from "../../copy/hintTokenCopy";

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

const fireConfetti = () => {
    const count = 400;
    const defaults = { origin: { y: 0.7 }, zIndex: 2000, scalar: 1.4 };
    const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) })?.catch(() => {});
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.20, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 1.1 });
    fire(0.10, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.6 });
    fire(0.10, { spread: 120, startVelocity: 45 });
};

// Post-solve timing: docs/DESIGN.md, Hint Tokens
const STATS_DELAY_MS = 1500; // stats dialog after a solve that earns no token
const TOKEN_FLIGHT_EARLIEST_MS = 1050; // the flight waits for the win sweep
const STATS_AFTER_LANDING_MS = 250; // stats dialog after the token lands
const STATS_FALLBACK_MS = 2500; // stats dialog when an expected token never arrives
const STATS_SAFETY_MS = 3000; // stats dialog if a granted token never lands

/** The player-facing text for a known hint failure, or "" to fall back to the raw message. */
const hintErrorCopy = (error: unknown): string => {
    if (!(error instanceof HintRequestError)) {
        return "";
    }
    if (error.code !== null) {
        return HINT_TOKEN_COPY.errors[error.code];
    }
    return error.status === 429 ? HINT_TOKEN_COPY.rateLimited : "";
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
        playedDates,
        tokenBalance,
        setTokenBalance,
        settings,
        updateSettings,
        adjustTokenBalance
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
    const [hintMessage, setHintMessage] = useState<string | null>(null);
    const [solverError, setSolverError] = useState<string | null>(null);

    // State for invalid drop visual feedback
    const [invalidDropCells, setInvalidDropCells] = useState<InvalidDropCell[]>([]);
    const invalidDropTimeoutRef = useRef<number | null>(null);
    const confettiTimeoutRef = useRef<number | null>(null);

    // Generation counter to discard stale hint responses
    const hintLoadIdRef = useRef(0);

    // Always-current read used by async callbacks to avoid stale closures.
    // A useEffectEvent getter is re-read at each call site, so a read placed
    // after an await still sees the latest committed state.
    const getGameState = useEffectEvent(() => gameState);

    // State for tracking dragged piece for preview
    const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);

    const handleDragEnd = useCallback(() => {
        setDraggedPieceId(null);
    }, []);

    const markTokenIntroSeen = useCallback(() => {
        updateSettings({ tokenIntroSeen: true }).catch(() => {});
    }, [updateSettings]);

    // Modal state and play-another dialog flow
    const {
        justSolvedRef,
        statsAutoOpenTimeoutRef,
        setIsStatsOpen,
        setIsPlayAnotherOpen,
        setIsYearCompleteOpen,
        setIsTokenConfirmOpen,
        modals
    } = useGameModals({
        user,
        userLoading,
        completedDates,
        currentDate: gameState.currentDate,
        settings,
        onTokenIntroSeen: markTokenIntroSeen
    });

    // Post-solve: when stats should wait for the token flight, and when the flight may start
    const statsAfterFlightRef = useRef(false);
    const [tokenFlightNotBefore, setTokenFlightNotBefore] = useState(0);

    // (Re)schedules the post-solve stats dialog; a later call replaces an earlier one
    const scheduleStatsOpen = useCallback((delayMs: number) => {
        if (statsAutoOpenTimeoutRef.current !== null) {
            window.clearTimeout(statsAutoOpenTimeoutRef.current);
        }
        statsAutoOpenTimeoutRef.current = window.setTimeout(() => {
            statsAutoOpenTimeoutRef.current = null;
            statsAfterFlightRef.current = false;
            setIsStatsOpen(true);
        }, delayMs);
    }, [statsAutoOpenTimeoutRef, setIsStatsOpen]);

    // Helper to load every hint the user has used for a date from the server
    const loadPersistentHint = useCallback(async (date: PuzzleDate, currentPieces: PieceType[]) => {
        if (!user) {
            return null;
        }

        try {
            const hintPieces = await getHintState(date);
            if (hintPieces.length > 0) {
                return applyHintPieces(date, currentPieces, hintPieces);
            }
        }
        catch (error) {
            logToServer("error", "Game: Failed to load persistent hint", error);
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

    // What the Hint button offers right now (free, token, or why not)
    const hintAvailability = getHintAvailability({
        isLoggedIn: !!user,
        isSolved: gameState.isSolved,
        isDateSolved: completedDates.some(d => d.month === gameState.currentDate.month && d.day === gameState.currentDate.day),
        isLoading: isHintLoading,
        pieces: gameState.pieces,
        tokenBalance
    });

    // Format current date as DD/MM
    const formattedDate = `${String(gameState.currentDate.day).padStart(2, "0")}/${String(gameState.currentDate.month + 1).padStart(2, "0")}`;

    // === HANDLERS ===

    // Shared initialization logic used by both handleDateChange and handleReset
    const initializeForDate = useCallback((date: PuzzleDate) => {
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
            logToServer("error", "Game: Failed to load persistent hint", err);
        });

        setSolverError(null);
    }, [clearHistory, loadPersistentHint, updatePresent]);

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

    // Commits a validated placement and detects a win. Every placement path
    // (drag, tap, keyboard Enter) goes through here, so the puzzle is solved
    // however the last piece arrives.
    const finalizePlacement = useCallback((piece: PieceType, position: Position) => {
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
            if (confettiTimeoutRef.current !== null) {
                window.clearTimeout(confettiTimeoutRef.current);
            }
            confettiTimeoutRef.current = window.setTimeout(() => {
                fireConfetti();
                confettiTimeoutRef.current = null;
            }, 400);
            // Automatically show stats on completion after a short delay. A first
            // solve earns a token: then stats waits for the token flight to land.
            if (user) {
                const expectsToken = !completedDates.some(d => d.month === gameState.currentDate.month && d.day === gameState.currentDate.day);
                statsAfterFlightRef.current = expectsToken;
                setTokenFlightNotBefore(Date.now() + TOKEN_FLIGHT_EARLIEST_MS);
                scheduleStatsOpen(expectsToken ? STATS_FALLBACK_MS : STATS_DELAY_MS);
            }
        }

        // Create a completely new state object
        const newState: GameState = {
            ...gameState,
            board: newBoard,
            pieces: newPieces,
            selectedPieceId: null,
            isSolved: solved,
            solutionRevealed: false // User solved it manually
        };

        pushState(newState, {
            type: "PLACE_PIECE",
            pieceId: piece.id,
            position
        });
    }, [gameState, pushState, user, completedDates, justSolvedRef, scheduleStatsOpen]);

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

        finalizePlacement(piece, position);
    }, [gameState, finalizePlacement, triggerInvalidDropFeedback]);

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

        finalizePlacement(piece, position);
    }, [gameState, updatePresent, triggerInvalidDropFeedback, finalizePlacement]);

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
            logToServer("error", "Game: Failed to handle pile drop", err);
        }
    }, [handlePieceReturnToPile]);

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
            logToServer("error", `Game: Solution failed: ${errorMessage}`, error);
            setSolverError(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    }, [gameState, isLoading, clearHistory]);

    // Ask the server for the next hint. The server decides the cost and the pieces.
    const requestNextHint = useCallback(async () => {
        const requested = getGameState();
        const hintNumber = countHintPieces(requested.pieces) + 1;

        setHintMessage(null);
        setIsHintLoading(true);

        try {
            const { pieces: hintPieces, tokenBalance: newBalance } = await getHint(requested.currentDate, hintNumber);
            setTokenBalance(newBalance);

            const latest = getGameState();
            if (latest.currentDate.month !== requested.currentDate.month || latest.currentDate.day !== requested.currentDate.day) {
                return; // The user switched dates while the request ran
            }
            const { board, pieces } = applyHintPieces(latest.currentDate, latest.pieces, hintPieces);

            // Clear history to prevent undoing the hint
            clearHistory({ ...latest, board, pieces, selectedPieceId: null });
        }
        catch (error) {
            if (error instanceof HintRequestError && error.tokenBalance !== null) {
                setTokenBalance(error.tokenBalance);
            }
            if (error instanceof HintRequestError && error.code === "STALE_HINT_NUMBER") {
                // The board and the server disagree on the hints used (another tab or device, or
                // server data restored from a backup): adopt the server's hints, which may be none
                try {
                    const serverHints = await getHintState(requested.currentDate);
                    const latest = getGameState();
                    if (latest.currentDate.month !== requested.currentDate.month || latest.currentDate.day !== requested.currentDate.day) {
                        return; // The user switched dates while the request ran
                    }
                    const { board, pieces } = applyHintPieces(latest.currentDate, latest.pieces, serverHints);
                    clearHistory({ ...latest, board, pieces, selectedPieceId: null });
                }
                catch (reloadError) {
                    logToServer("error", "Game: Failed to reload hints", reloadError);
                }
                return;
            }
            if (error instanceof HintRequestError && error.code === "ALREADY_SOLVED") {
                // This device did not know: record it so the button stops offering paid hints
                addCompletedDate(requested.currentDate);
            }
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            logToServer("error", `Game: Hint failed: ${errorMessage}`, error);
            setHintMessage(hintErrorCopy(error) || errorMessage);
        }
        finally {
            setIsHintLoading(false);
        }
    }, [clearHistory, setTokenBalance, addCompletedDate]);

    const clearHintMessage = useCallback(() => setHintMessage(null), []);

    const handleHint = useCallback(async () => {
        debugLogger.log("ctrl:handleHint", { date: gameState.currentDate, hintAvailability });
        if (hintAvailability === "token" && !settings.skipTokenConfirm) {
            setIsTokenConfirmOpen(true);
            return;
        }
        if (hintAvailability === "free" || hintAvailability === "token") {
            await requestNextHint();
        }
    }, [gameState.currentDate, hintAvailability, settings.skipTokenConfirm, setIsTokenConfirmOpen, requestNextHint]);

    const handleConfirmTokenHint = useCallback(async (dontAskAgain: boolean) => {
        setIsTokenConfirmOpen(false);
        if (dontAskAgain) {
            updateSettings({ skipTokenConfirm: true }).catch(() => {});
        }
        await requestNextHint();
    }, [setIsTokenConfirmOpen, updateSettings, requestNextHint]);

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

    // Offered once every date is solved: there is no "next" puzzle to suggest,
    // so any date other than the current one will do.
    const handlePlayRandomDate = useCallback(() => {
        setIsYearCompleteOpen(false);
        handleDateChange(getRandomPuzzleDate(gameState.currentDate));
    }, [handleDateChange, setIsYearCompleteOpen, gameState.currentDate]);

    // === SUB-HOOKS (side effects only) ===

    // Check for initial hint on mount / when user logs in / when date changes.
    // getGameState is used inside the async callback so reads are always fresh,
    // avoiding a stale-closure bug without adding gameState.pieces to the deps
    // (which would re-run the effect on every piece placement).
    useEffect(() => {
        const checkInitialHint = async () => {
            const currentDate = gameState.currentDate;
            const currentPieces = getGameState().pieces;
            const isEmpty = currentPieces.every(p => p.position === null);
            if (!userLoading && user && isEmpty) {
                try {
                    const thisHintLoadId = ++hintLoadIdRef.current;
                    const hintState = await loadPersistentHint(currentDate, currentPieces);
                    if (hintLoadIdRef.current !== thisHintLoadId) {
                        return;
                    }
                    // Re-check emptiness after the async gap to avoid overwriting user moves
                    if (!getGameState().pieces.every(p => p.position === null)) {
                        return;
                    }
                    if (hintState) {
                        clearHistory({
                            ...getGameState(),
                            board: hintState.board,
                            pieces: hintState.pieces
                        });
                    }
                }
                catch (err) {
                    logToServer("error", "Game: Failed to load initial hint", err);
                }
            }
        };
        checkInitialHint().catch(() => {});
    }, [user, userLoading, gameState.currentDate, loadPersistentHint, clearHistory]);

    // Earned tokens count in the balance from the grant on. The shown balance holds
    // them back until their flight lands. If this layout remounts mid-flight (a
    // rotation), the pending count resets and the shown balance is simply right.
    const [pendingTokenFlights, setPendingTokenFlights] = useState(0);
    const shownTokenBalance = Math.max(tokenBalance - pendingTokenFlights, 0);

    const landTokenFlight = useCallback(() => {
        setPendingTokenFlights(n => Math.max(n - 1, 0));
        if (statsAfterFlightRef.current) {
            statsAfterFlightRef.current = false;
            scheduleStatsOpen(STATS_AFTER_LANDING_MS);
        }
    }, [scheduleStatsOpen]);

    const handleTokenGranted = useCallback(() => {
        adjustTokenBalance(1);
        setPendingTokenFlights(n => n + 1);
        if (statsAfterFlightRef.current) {
            // The landing opens stats; this only covers a flight that never lands
            scheduleStatsOpen(STATS_SAFETY_MS);
        }
    }, [adjustTokenBalance, scheduleStatsOpen]);

    useServerSync({ user, userLoading, gameState, playedDates, completedDates, addPlayedDate, addCompletedDate, onTokenGranted: handleTokenGranted });

    useEffect(() => () => {
        if (confettiTimeoutRef.current !== null) {
            window.clearTimeout(confettiTimeoutRef.current);
        }
        if (invalidDropTimeoutRef.current !== null) {
            window.clearTimeout(invalidDropTimeoutRef.current);
        }
    }, []);

    useSessionPersistence({ gameState });

    // Only accept keyboard shortcuts that target a pool piece — placed pieces
    // can't be rotated/flipped in place, and Esc-clear applies only to a
    // pending selection.
    const selectablePieceId = (() => {
        if (gameState.selectedPieceId == null) {
            return null;
        }
        const piece = gameState.pieces.find(p => p.id === gameState.selectedPieceId);
        return piece && !piece.position && !piece.isLocked ? piece.id : null;
    })();

    const handleClearSelection = useCallback(() => {
        if (gameState.selectedPieceId == null) {
            return;
        }
        updatePresent({ ...gameState, selectedPieceId: null });
    }, [gameState, updatePresent]);

    useKeyboardShortcuts({
        canUndo,
        canRedo,
        undo,
        redo,
        handleReset,
        isResetDisabled,
        selectablePieceId,
        onRotateCW: handleRotatePiece,
        onRotateCCW: handleRotateCCWPiece,
        onFlipH: handleFlipHPiece,
        onFlipV: handleFlipVPiece,
        onClearSelection: handleClearSelection
    });

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
        hintAvailability,
        // What the UI shows: excludes tokens still in flight
        tokenBalance: shownTokenBalance,
        completedDates,
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
        handlePlayRandomDate,
        handleReset,
        handlePieceSelect,
        handleCellClick,
        handlePieceDrop,
        handlePieceReturnToPile,
        handleSolve,
        handleHint,
        handleConfirmTokenHint,
        pendingTokenFlights,
        landTokenFlight,
        tokenFlightNotBefore,
        hintMessage,
        clearHintMessage,

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

        // Progress bar: pieces on the board, in placement order
        placementOrder: getPlacementOrder(gameState.pieces)
    };
}

export type GameController = ReturnType<typeof useGameController>;
