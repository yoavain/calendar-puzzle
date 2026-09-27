import {
    computeTokenBalance,
    countHintPieces,
    evaluateHintRequest,
    getHintAvailability,
    MAX_HINTS
} from "../../src/common/hintTokens";
import type { Piece } from "../../src/common/types";

const piece = (id: number, placed: boolean, isLocked = false): Piece => ({
    id: id as Piece["id"],
    position: placed ? { x: id, y: 0 } : null,
    isFlippedH: false,
    isFlippedV: false,
    rotation: 0,
    isLocked
});

/** 8 pieces: the first `hints` placed+locked, the next `own` placed+unlocked, the rest in the pool. */
const board = (hints: number, own = 0): Piece[] =>
    Array.from({ length: 8 }, (_, i) => piece(i + 1, i < hints + own, i < hints));

describe("computeTokenBalance", () => {
    it("is 0 with no rows", () => {
        expect(computeTokenBalance([])).toBe(0);
    });

    it("gives one token per solved date", () => {
        const rows = Array.from({ length: 10 }, () => ({ completed: true, hintsUsed: 0 }));
        expect(computeTokenBalance(rows)).toBe(10);
    });

    it("never charges for the first hint of a date", () => {
        expect(computeTokenBalance([{ completed: false, hintsUsed: 1 }])).toBe(0);
        expect(computeTokenBalance([{ completed: true, hintsUsed: 1 }])).toBe(1);
    });

    it("charges one token per hint after the first", () => {
        const rows = [
            { completed: true, hintsUsed: 0 },
            { completed: true, hintsUsed: 0 },
            { completed: true, hintsUsed: 3 }
        ];
        expect(computeTokenBalance(rows)).toBe(1);
    });
});

describe("evaluateHintRequest", () => {
    it("grants hint #1 for free, even with no tokens", () => {
        expect(evaluateHintRequest({ hintNumber: 1, hintsUsed: 0, isSolved: false, balance: 0 }))
            .toEqual({ kind: "grant", cost: 0 });
    });

    it("grants hint #1 on a solved date (today's behavior)", () => {
        expect(evaluateHintRequest({ hintNumber: 1, hintsUsed: 0, isSolved: true, balance: 0 }))
            .toEqual({ kind: "grant", cost: 0 });
    });

    it("charges one token for hint #2", () => {
        expect(evaluateHintRequest({ hintNumber: 2, hintsUsed: 1, isSolved: false, balance: 1 }))
            .toEqual({ kind: "grant", cost: 1 });
    });

    it("rejects hint #2 with no tokens", () => {
        expect(evaluateHintRequest({ hintNumber: 2, hintsUsed: 1, isSolved: false, balance: 0 }))
            .toEqual({ kind: "reject", code: "NO_TOKENS" });
    });

    it("rejects a token hint on a solved date, even with tokens", () => {
        expect(evaluateHintRequest({ hintNumber: 2, hintsUsed: 1, isSolved: true, balance: 5 }))
            .toEqual({ kind: "reject", code: "ALREADY_SOLVED" });
    });

    it("replays an already-used hint number at no cost (retry / double click / second tab)", () => {
        expect(evaluateHintRequest({ hintNumber: 2, hintsUsed: 3, isSolved: false, balance: 0 }))
            .toEqual({ kind: "replay" });
        expect(evaluateHintRequest({ hintNumber: 3, hintsUsed: 3, isSolved: false, balance: 0 }))
            .toEqual({ kind: "replay" });
    });

    it("rejects a skipped hint number", () => {
        expect(evaluateHintRequest({ hintNumber: 3, hintsUsed: 1, isSolved: false, balance: 5 }))
            .toEqual({ kind: "reject", code: "STALE_HINT_NUMBER" });
    });

    it("rejects a hint number past MAX_HINTS", () => {
        expect(evaluateHintRequest({ hintNumber: MAX_HINTS + 1, hintsUsed: MAX_HINTS, isSolved: false, balance: 5 }))
            .toEqual({ kind: "reject", code: "STALE_HINT_NUMBER" });
    });
});

describe("countHintPieces", () => {
    it("counts placed, locked pieces only", () => {
        expect(countHintPieces(board(0))).toBe(0);
        expect(countHintPieces(board(2, 3))).toBe(2);
    });
});

describe("getHintAvailability", () => {
    const base = { isLoggedIn: true, isSolved: false, isDateSolved: false, isLoading: false, tokenBalance: 0 };

    it("requires login", () => {
        expect(getHintAvailability({ ...base, isLoggedIn: false, pieces: board(0) })).toBe("login-required");
    });

    it("is blocked on a solved board", () => {
        expect(getHintAvailability({ ...base, isSolved: true, pieces: board(0) })).toBe("solved");
    });

    it("is blocked while a hint request runs", () => {
        expect(getHintAvailability({ ...base, isLoading: true, pieces: board(0) })).toBe("loading");
    });

    it("offers the free hint on an empty board", () => {
        expect(getHintAvailability({ ...base, pieces: board(0) })).toBe("free");
    });

    it("is blocked while the user's own pieces are on the board", () => {
        expect(getHintAvailability({ ...base, pieces: board(0, 1) })).toBe("own-pieces");
        expect(getHintAvailability({ ...base, tokenBalance: 3, pieces: board(1, 1) })).toBe("own-pieces");
    });

    it("offers a token hint when only hints are placed and a token is left", () => {
        expect(getHintAvailability({ ...base, tokenBalance: 1, pieces: board(1) })).toBe("token");
    });

    it("reports no tokens after the free hint", () => {
        expect(getHintAvailability({ ...base, tokenBalance: 0, pieces: board(1) })).toBe("no-tokens");
    });

    it("blocks paid hints on a date the user already solved (replay)", () => {
        expect(getHintAvailability({ ...base, isDateSolved: true, tokenBalance: 3, pieces: board(1) })).toBe("date-solved");
    });

    it("still offers the free first hint on a date the user already solved", () => {
        expect(getHintAvailability({ ...base, isDateSolved: true, pieces: board(0) })).toBe("free");
    });

    it("stops at MAX_HINTS", () => {
        expect(getHintAvailability({ ...base, tokenBalance: 3, pieces: board(MAX_HINTS) })).toBe("max-reached");
    });
});
