/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { findLandedPiece, useBoardAnimations } from "../../src/client/hooks/useBoardAnimations";
import { initializePieces } from "../../src/common/initialize";
import type { Piece } from "../../src/common/types";

const place = (pieces: Piece[], id: number, patch: Partial<Piece>): Piece[] =>
    pieces.map(p => p.id === id ? { ...p, ...patch } : p);

describe("findLandedPiece", () => {
    const pool = initializePieces();

    it("returns the id of a piece placed from the pool", () => {
        const next = place(pool, 3, { position: { x: 1, y: 2 } });
        expect(findLandedPiece(pool, next)).toBe(3);
    });

    it("returns the id of a piece moved on the board", () => {
        const before = place(pool, 3, { position: { x: 1, y: 2 } });
        const after = place(before, 3, { position: { x: 2, y: 2 } });
        expect(findLandedPiece(before, after)).toBe(3);
    });

    it("returns the id of a placed piece that was rotated in place", () => {
        const before = place(pool, 3, { position: { x: 1, y: 2 } });
        const after = place(before, 3, { rotation: 90 });
        expect(findLandedPiece(before, after)).toBe(3);
    });

    it("returns null when a piece goes back to the pool", () => {
        const before = place(pool, 3, { position: { x: 1, y: 2 } });
        expect(findLandedPiece(before, pool)).toBeNull();
    });

    it("returns null when a pool piece is only rotated", () => {
        expect(findLandedPiece(pool, place(pool, 3, { rotation: 90 }))).toBeNull();
    });

    it("returns null when several pieces land at once", () => {
        const next = place(place(pool, 1, { position: { x: 0, y: 0 } }), 2, { position: { x: 3, y: 3 } });
        expect(findLandedPiece(pool, next)).toBeNull();
    });
});

describe("useBoardAnimations", () => {
    const pool = initializePieces();

    it("starts with nothing landing and no celebration", () => {
        const { result } = renderHook(() => useBoardAnimations(pool, false));
        expect(result.current).toEqual({ landingPieceId: null, celebrating: false });
    });

    it("marks the piece that was just placed", () => {
        const { result, rerender } = renderHook(({ pieces }) => useBoardAnimations(pieces, false), {
            initialProps: { pieces: pool }
        });
        rerender({ pieces: place(pool, 5, { position: { x: 2, y: 3 } }) });
        expect(result.current.landingPieceId).toBe(5);
    });

    it("celebrates when the board becomes solved", () => {
        const { result, rerender } = renderHook(({ solved }) => useBoardAnimations(pool, solved), {
            initialProps: { solved: false }
        });
        rerender({ solved: true });
        expect(result.current.celebrating).toBe(true);
        rerender({ solved: false });
        expect(result.current.celebrating).toBe(false);
    });

    it("does not celebrate a board that loads already solved", () => {
        const { result } = renderHook(() => useBoardAnimations(pool, true));
        expect(result.current.celebrating).toBe(false);
    });
});
