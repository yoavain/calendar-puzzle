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
    onSolveDeferred
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
}) {
    const startedDatesRef = useRef<Set<string>>(new Set());
    const completedDatesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user || userLoading) {
            return;
        }

        const { currentDate, pieces, isSolved, solutionRevealed } = gameState;
        const dateKey = `${currentDate.month}-${currentDate.day}`;
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

        // Only sync completion if user solved it (not solution-revealed)
        if (isSolved && !solutionRevealed && !completedDatesRef.current.has(dateKey)) {
            const alreadyCompleted = completedDates.some(d => d.month === currentDate.month && d.day === currentDate.day);
            if (!alreadyCompleted && !hasPendingSave(user.id, "complete", currentDate)) {
                const completion: PendingSave = { userId: user.id, date: currentDate, kind: "complete", pieces };
                addPendingSave(completion);
                if (savingPaused) {
                    onSolveDeferred();
                }
                else {
                    sendPendingSave(completion).then(({ outcome, tokenGranted }) => {
                        if (outcome === "failed") {
                            onSolveDeferred();
                        }
                        if (outcome !== "saved") {
                            return;
                        }
                        addCompletedDate(currentDate);
                        // Only the server knows whether this was the first solve of the date
                        if (tokenGranted) {
                            onTokenGranted();
                        }
                    }).catch(() => {});
                }
            }
            completedDatesRef.current.add(dateKey);
        }
    }, [user, userLoading, gameState.currentDate, gameState.pieces, gameState.isSolved, gameState.solutionRevealed, playedDates, completedDates,
        addPlayedDate, addCompletedDate, onTokenGranted, savingPaused, onSolveDeferred]);
}
