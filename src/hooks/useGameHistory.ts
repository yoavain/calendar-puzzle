import { useState, useCallback } from 'react';
import { GameState, GameHistory, GameStateAction } from '../types/types';

const MAX_HISTORY = 50; // Maximum number of undo steps

export function useGameHistory(initialState: GameState) {
    const [history, setHistory] = useState<GameHistory>({
        past: [],
        present: initialState,
        future: []
    });

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    const pushState = useCallback((newState: GameState, action: GameStateAction) => {
        setHistory(prev => {
            const past = [...prev.past, prev.present].slice(-MAX_HISTORY);
            return {
                past,
                present: newState,
                future: []
            };
        });
    }, []);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const previous = prev.past[prev.past.length - 1];
            const newPast = prev.past.slice(0, -1);

            return {
                past: newPast,
                present: previous,
                future: [prev.present, ...prev.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const next = prev.future[0];
            const newFuture = prev.future.slice(1);

            return {
                past: [...prev.past, prev.present],
                present: next,
                future: newFuture
            };
        });
    }, []);

    return {
        gameState: history.present,
        pushState,
        undo,
        redo,
        canUndo,
        canRedo
    };
} 