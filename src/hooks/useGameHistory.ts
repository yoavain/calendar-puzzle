import { useState, useCallback } from 'react';
import { GameState, GameStateAction } from '../types/types';

const MAX_HISTORY = 50; // Maximum number of undo steps

// Helper function to deep clone the game state
function cloneGameState(state: GameState): GameState {
    return {
        ...state,
        board: state.board.map(row => [...row.map(cell => ({ ...cell }))]),
        pieces: state.pieces.map(piece => ({ ...piece })),
        currentDate: new Date(state.currentDate)
    };
}

export function useGameHistory(initialState: GameState) {
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
        setHistory(prev => ({
            past: [...prev.past, cloneGameState(prev.present)],
            present: cloneGameState(newState),
            future: []
        }));
    }, []);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const previous = prev.past[prev.past.length - 1];
            const newPast = prev.past.slice(0, -1);

            return {
                past: newPast,
                present: cloneGameState(previous),
                future: [cloneGameState(prev.present), ...prev.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const next = prev.future[0];
            const newFuture = prev.future.slice(1);

            return {
                past: [...prev.past, cloneGameState(prev.present)],
                present: cloneGameState(next),
                future: newFuture
            };
        });
    }, []);

    return {
        gameState: history.present,
        pushState,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0
    };
} 