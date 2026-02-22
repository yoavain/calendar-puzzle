import { useCallback, useState } from "react";
import type { Board, GameState, GameStateAction } from "../../common/types";
import { debugLogger } from "../utils/debugLogger";

const MAX_HISTORY = 50; // Maximum number of undo steps

// Helper function to deep clone the game state
const cloneGameState = (state: GameState): GameState => {
    return {
        ...state,
        board: state.board.map(row => [...row.map(cell => ({ ...cell }))]) as Board,
        pieces: state.pieces.map(piece => ({ ...piece })),
        currentDate: { ...state.currentDate }
    };
};

export const useGameHistory = (initialState: GameState) => {
    const [history, setHistory] = useState<{
        past: GameState[];
        present: GameState;
        future: GameState[];
    }>({
        past: [],
        present: initialState,
        future: []
    });

    const pushState = useCallback((newState: GameState, action: GameStateAction) => {
        debugLogger.log("history:pushState", { action, state: newState });
        setHistory(prev => ({
            past: [...prev.past, cloneGameState(prev.present)],
            present: cloneGameState(newState),
            future: []
        }));
    }, []);

    const updatePresent = useCallback((newState: GameState) => {
        debugLogger.log("history:updatePresent", { state: newState });
        setHistory(prev => ({
            ...prev,
            present: cloneGameState(newState)
        }));
    }, []);

    const undo = useCallback(() => {
        debugLogger.log("history:undo", {});
        setHistory(prev => {
            if (prev.past.length === 0) {
                return prev;
            }

            const previous = prev.past[prev.past.length - 1];
            const newPast = prev.past.slice(0, -1);

            debugLogger.log("history:undo:result", { state: previous });
            return {
                past: newPast,
                present: cloneGameState(previous),
                future: [cloneGameState(prev.present), ...prev.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        debugLogger.log("history:redo", {});
        setHistory(prev => {
            if (prev.future.length === 0) {
                return prev;
            }

            const next = prev.future[0];
            const newFuture = prev.future.slice(1);

            debugLogger.log("history:redo:result", { state: next });
            return {
                past: [...prev.past, cloneGameState(prev.present)],
                present: cloneGameState(next),
                future: newFuture
            };
        });
    }, []);

    // Clear all history (used when placing a hint - prevents undoing hints)
    const clearHistory = useCallback((newState: GameState) => {
        setHistory({
            past: [],
            present: cloneGameState(newState),
            future: []
        });
    }, []);

    return {
        gameState: history.present,
        pushState,
        updatePresent,
        undo,
        redo,
        clearHistory,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0
    };
}; 