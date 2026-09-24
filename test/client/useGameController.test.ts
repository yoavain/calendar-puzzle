/**
 * @jest-environment jsdom
 */
import React from "react";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import confetti from "canvas-confetti";
import { useGameController } from "../../src/client/layouts/common/useGameController";
import { MockUserProvider } from "../../src/client/storybook/MockUserProvider";
import type { Piece } from "../../src/common/types";
import solution0101 from "../common/resources/01-01.json";

jest.mock("canvas-confetti", () => jest.fn(() => Promise.resolve()));

const SESSION_KEY = "calendar-puzzle-session";
const solvedPieces = solution0101.pieces as Piece[];
const lastPiece = solvedPieces[solvedPieces.length - 1];

const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(MockUserProvider, null, children);

/** Start on Jan 1 with every piece placed as in the solution except the last one. */
const renderWithOnePieceLeft = () => {
    const pieces = solvedPieces.map(p => (p.id === lastPiece.id ? { ...p, position: null } : p));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ date: { month: 0, day: 1 }, pieces, isSolved: false }));
    return renderHook(() => useGameController(), { wrapper });
};

describe("useGameController solve detection", () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2024, 0, 1, 12) });
        localStorage.clear();
        (confetti as unknown as jest.Mock).mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("solves the puzzle when the last piece is placed by drag", () => {
        const { result } = renderWithOnePieceLeft();

        act(() => result.current.handlePieceDrop(lastPiece.position!, { pieceId: lastPiece.id }));

        expect(result.current.gameState.isSolved).toBe(true);
    });

    it("solves the puzzle when the last piece is placed by tap or keyboard (cell click)", () => {
        const { result } = renderWithOnePieceLeft();

        act(() => result.current.handlePieceSelect(lastPiece.id));
        act(() => result.current.handleCellClick(lastPiece.position!));

        expect(result.current.gameState.pieces.find(p => p.id === lastPiece.id)?.position).toEqual(lastPiece.position);
        expect(result.current.gameState.isSolved).toBe(true);
        expect(result.current.gameState.solutionRevealed).toBe(false);
    });

    it("fires the confetti after a tap or keyboard solve", () => {
        const { result } = renderWithOnePieceLeft();

        act(() => result.current.handlePieceSelect(lastPiece.id));
        act(() => result.current.handleCellClick(lastPiece.position!));
        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(confetti).toHaveBeenCalled();
    });
});
