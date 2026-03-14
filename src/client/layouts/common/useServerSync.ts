import { useEffect, useRef } from "react";
import type { GameState, PuzzleDate } from "../../../common/types";
import { recordCompletion, recordStart } from "../../service/puzzleService";
import type { User } from "../../context/UserContext";

/**
 * Syncs puzzle start/completion events to the server.
 * Tracks which dates have already been reported to avoid duplicate calls.
 */
export function useServerSync({
    user,
    userLoading,
    gameState,
    playedDates,
    completedDates,
    addPlayedDate,
    addCompletedDate
}: {
    user: User | null;
    userLoading: boolean;
    gameState: GameState;
    playedDates: PuzzleDate[];
    completedDates: PuzzleDate[];
    addPlayedDate: (date: PuzzleDate) => void;
    addCompletedDate: (date: PuzzleDate) => void;
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

        // Only sync completion if user solved it (not solution-revealed)
        if (isSolved && !solutionRevealed && !completedDatesRef.current.has(dateKey)) {
            const alreadyCompleted = completedDates.some(d => d.month === currentDate.month && d.day === currentDate.day);
            if (!alreadyCompleted) {
                recordCompletion(currentDate, pieces).then(success => {
                    if (success) {
                        addCompletedDate(currentDate);
                    }
                });
            }
            completedDatesRef.current.add(dateKey);
        }
    }, [user, userLoading, gameState.currentDate, gameState.pieces, gameState.isSolved, gameState.solutionRevealed, playedDates, completedDates, addPlayedDate, addCompletedDate]);
}
