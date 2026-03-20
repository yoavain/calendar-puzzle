import { useEffect } from "react";
import type { GameState } from "../../../common/types";
import { clearSession, saveSession } from "../../hooks/useGameSession";

/**
 * Persists game state to session storage on every state change.
 * Clears the session when the solution has been revealed.
 */
export function useSessionPersistence({ gameState }: { gameState: GameState }) {
    useEffect(() => {
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
}
