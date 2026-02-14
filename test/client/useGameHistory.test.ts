/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useGameHistory } from "../../src/client/hooks/useGameHistory";
import type { GameState, GameStateAction } from "../../src/common/types";
import { initializeGame } from "../../src/client/utils/initialize";

describe("useGameHistory", () => {
    let initialState: GameState;

    beforeEach(() => {
        initialState = initializeGame(new Date(2025, 0, 1));
    });

    const makeAction = (type: GameStateAction["type"] = "PLACE_PIECE"): GameStateAction => ({
        type,
        pieceId: 1,
        position: { x: 0, y: 2 }
    });

    const modifyState = (state: GameState, pieceIndex: number = 0): GameState => ({
        ...state,
        pieces: state.pieces.map((p, i) =>
            i === pieceIndex ? { ...p, position: { x: 0, y: 2 } } : p
        )
    });

    it("should have correct initial state with canUndo=false and canRedo=false", () => {
        const { result } = renderHook(() => useGameHistory(initialState));
        expect(result.current.gameState).toEqual(initialState);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
    });

    it("should set canUndo=true after pushState", () => {
        const { result } = renderHook(() => useGameHistory(initialState));
        const newState = modifyState(initialState);

        act(() => {
            result.current.pushState(newState, makeAction());
        });

        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);
        expect(result.current.gameState.pieces[0].position).toEqual({ x: 0, y: 2 });
    });

    it("should restore previous state on undo", () => {
        const { result } = renderHook(() => useGameHistory(initialState));
        const newState = modifyState(initialState);

        act(() => {
            result.current.pushState(newState, makeAction());
        });

        act(() => {
            result.current.undo();
        });

        expect(result.current.gameState.pieces[0].position).toBeNull();
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(true);
    });

    it("should restore undone state on redo", () => {
        const { result } = renderHook(() => useGameHistory(initialState));
        const newState = modifyState(initialState);

        act(() => {
            result.current.pushState(newState, makeAction());
        });

        act(() => {
            result.current.undo();
        });

        act(() => {
            result.current.redo();
        });

        expect(result.current.gameState.pieces[0].position).toEqual({ x: 0, y: 2 });
        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);
    });

    it("should clear redo stack when pushing after undo", () => {
        const { result } = renderHook(() => useGameHistory(initialState));

        act(() => {
            result.current.pushState(modifyState(initialState, 0), makeAction());
        });

        act(() => {
            result.current.undo();
        });

        expect(result.current.canRedo).toBe(true);

        // Push a different state
        act(() => {
            result.current.pushState(modifyState(initialState, 1), makeAction());
        });

        expect(result.current.canRedo).toBe(false);
    });

    it("should not create history entry with updatePresent", () => {
        const { result } = renderHook(() => useGameHistory(initialState));
        const newState = modifyState(initialState);

        act(() => {
            result.current.updatePresent(newState);
        });

        expect(result.current.gameState.pieces[0].position).toEqual({ x: 0, y: 2 });
        expect(result.current.canUndo).toBe(false);
    });

    it("should reset everything with clearHistory", () => {
        const { result } = renderHook(() => useGameHistory(initialState));

        // Build up some history
        act(() => {
            result.current.pushState(modifyState(initialState, 0), makeAction());
        });
        act(() => {
            result.current.pushState(modifyState(initialState, 1), makeAction());
        });

        expect(result.current.canUndo).toBe(true);

        const freshState = initializeGame(new Date(2025, 5, 15));
        act(() => {
            result.current.clearHistory(freshState);
        });

        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
        expect(result.current.gameState).toEqual(freshState);
    });

    it("should do nothing when undoing with empty past", () => {
        const { result } = renderHook(() => useGameHistory(initialState));
        const beforeUndo = result.current.gameState;

        act(() => {
            result.current.undo();
        });

        expect(result.current.gameState).toEqual(beforeUndo);
    });

    it("should do nothing when redoing with empty future", () => {
        const { result } = renderHook(() => useGameHistory(initialState));
        const beforeRedo = result.current.gameState;

        act(() => {
            result.current.redo();
        });

        expect(result.current.gameState).toEqual(beforeRedo);
    });
});
