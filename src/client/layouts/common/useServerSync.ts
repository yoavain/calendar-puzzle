import { useEffect, useRef } from "react";
import type { GameState, PuzzleDate } from "../../../common/types";
import { addPendingSave, hasPendingSave, sendPendingSave, type PendingSave } from "../../service/pendingSaves";
import type { User } from "../../context/UserContext";

/**
 * Syncs puzzle start/completion events to the server and reports earned hint tokens.
 * Tracks which dates have already been reported to avoid duplicate calls.
 * Each event is stored first and removed when the server confirms it, so a failure loses nothing.
 */
export function useServerSync({
    user,
    userLoading,
    gameState,
    playedDates,
    completedDates,
    addPlayedDate,
    addCompletedDate,
    onTokenGranted,
    savingPaused,
    onSolveDeferred,
    onSolveWithoutToken,
    onSignInNeeded
}: {
    user: User | null;
    userLoading: boolean;
    gameState: GameState;
    playedDates: PuzzleDate[];
    completedDates: PuzzleDate[];
    addPlayedDate: (date: PuzzleDate) => void;
    addCompletedDate: (date: PuzzleDate) => void;
    onTokenGranted: () => void;
    savingPaused: boolean;
    /** A solve that is stored on this device and not yet on the server */
    onSolveDeferred: () => void;
    /** The server answered a solve, and no token follows */
    onSolveWithoutToken: () => void;
    /** A solve is stored on this device, and the login has expired */
    onSignInNeeded: () => void;
}) {
    const startedDatesRef = useRef<Set<string>>(new Set());
    const completedDatesRef = useRef<Set<string>>(new Set());
    // Tells a solve made now from a solved board that was restored on load
    const previousBoardRef = useRef({
        date: `${gameState.currentDate.month}-${gameState.currentDate.day}`,
        isSolved: gameState.isSolved && !gameState.solutionRevealed
    });

    useEffect(() => {
        const { currentDate, pieces, isSolved, solutionRevealed } = gameState;
        const date = `${currentDate.month}-${currentDate.day}`;
        // Only sync completion if user solved it (not solution-revealed)
        const isOwnSolve = isSolved && !solutionRevealed;
        const previous = previousBoardRef.current;
        const isNewSolve = isOwnSolve && !previous.isSolved && previous.date === date;
        previousBoardRef.current = { date, isSolved: isOwnSolve };

        if (!user || userLoading) {
            return;
        }

        const dateKey = `${user.id}|${date}`;
        const isStarted = pieces.some(p => p.position !== null);

        // A save that is already pending belongs to the flush, which sends it without any animation
        if (isStarted && !startedDatesRef.current.has(dateKey)) {
            const alreadyPlayed = playedDates.some(d => d.month === currentDate.month && d.day === currentDate.day);
            if (!alreadyPlayed && !hasPendingSave(user.id, "start", currentDate)) {
                const start: PendingSave = { userId: user.id, date: currentDate, kind: "start" };
                addPendingSave(start);
                if (!savingPaused) {
                    sendPendingSave(start).then(({ outcome }) => {
                        if (outcome === "saved") {
                            addPlayedDate(currentDate);
                        }
                    }).catch(() => {});
                }
            }
            startedDatesRef.current.add(dateKey);
        }

        // A new solve is sent even when the date was handled before: the earlier send may have failed
        if (isOwnSolve && (isNewSolve || !completedDatesRef.current.has(dateKey))) {
            completedDatesRef.current.add(dateKey);
            const alreadyCompleted = completedDates.some(d => d.month === currentDate.month && d.day === currentDate.day);
            // A restored board with a pending save belongs to the flush, which sends it without any animation
            if (alreadyCompleted || (!isNewSolve && hasPendingSave(user.id, "complete", currentDate))) {
                return;
            }

            const completion: PendingSave = { userId: user.id, date: currentDate, kind: "complete", pieces };
            addPendingSave(completion);
            if (savingPaused) {
                onSolveDeferred();
                return;
            }
            sendPendingSave(completion).then(({ outcome, tokenGranted }) => {
                if (outcome === "signed-out") {
                    onSignInNeeded();
                }
                else if (outcome === "failed") {
                    onSolveDeferred();
                }
                else if (outcome === "rejected") {
                    onSolveWithoutToken();
                }
                else {
                    addCompletedDate(currentDate);
                    // Only the server knows whether this was the first solve of the date
                    if (tokenGranted) {
                        onTokenGranted();
                    }
                    else {
                        onSolveWithoutToken();
                    }
                }
            }).catch(() => {});
        }
    }, [user, userLoading, gameState.currentDate, gameState.pieces, gameState.isSolved, gameState.solutionRevealed, playedDates, completedDates,
        addPlayedDate, addCompletedDate, onTokenGranted, savingPaused, onSolveDeferred, onSolveWithoutToken, onSignInNeeded]);
}
