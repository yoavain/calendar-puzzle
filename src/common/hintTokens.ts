/**
 * Hint token rules, shared by server and client.
 *
 * The balance is derived, never stored: one token per solved date, minus one
 * token for every hint after the first on each date.
 */
import type { Piece } from "./types";

/** Hint #8 would place the last piece, which the board already forces. */
export const MAX_HINTS = 7;

export interface BalanceRow {
    completed: boolean;
    hintsUsed: number;
}

export const computeTokenBalance = (rows: readonly BalanceRow[]): number =>
    rows.reduce((balance, row) => balance + (row.completed ? 1 : 0) - Math.max(row.hintsUsed - 1, 0), 0);

export type HintErrorCode = "STALE_HINT_NUMBER" | "ALREADY_SOLVED" | "NO_TOKENS";

export type HintDecision =
    | { kind: "replay" }
    | { kind: "grant"; cost: 0 | 1 }
    | { kind: "reject"; code: HintErrorCode };

/**
 * Server-side decision for "give me hint #hintNumber".
 * A number the user already has is a free replay, which makes retries,
 * double clicks and a second tab safe.
 */
export const evaluateHintRequest = ({ hintNumber, hintsUsed, isSolved, balance }: {
    hintNumber: number;
    hintsUsed: number;
    isSolved: boolean;
    balance: number;
}): HintDecision => {
    if (hintNumber <= hintsUsed) {
        return { kind: "replay" };
    }
    if (hintNumber !== hintsUsed + 1 || hintNumber > MAX_HINTS) {
        return { kind: "reject", code: "STALE_HINT_NUMBER" };
    }
    if (hintNumber === 1) {
        return { kind: "grant", cost: 0 };
    }
    if (isSolved) {
        return { kind: "reject", code: "ALREADY_SOLVED" };
    }
    if (balance < 1) {
        return { kind: "reject", code: "NO_TOKENS" };
    }
    return { kind: "grant", cost: 1 };
};

/** Hint pieces are the placed, locked pieces of an unsolved board. */
export const countHintPieces = (pieces: readonly Piece[]): number =>
    pieces.filter(p => p.isLocked && p.position !== null).length;

export type HintAvailability =
    | "login-required"
    | "solved"
    | "loading"
    | "max-reached"
    | "own-pieces"
    | "no-tokens"
    | "date-solved"
    | "free"
    | "token";

/** Client-side: can the user ask for the next hint right now, and what does it cost? */
export const getHintAvailability = ({ isLoggedIn, isSolved, isDateSolved, isLoading, pieces, tokenBalance }: {
    isLoggedIn: boolean;
    isSolved: boolean;
    /** The user solved this date before (a replay): the server refuses paid hints */
    isDateSolved: boolean;
    isLoading: boolean;
    pieces: readonly Piece[];
    tokenBalance: number;
}): HintAvailability => {
    if (!isLoggedIn) {
        return "login-required";
    }
    if (isSolved) {
        return "solved";
    }
    if (isLoading) {
        return "loading";
    }
    const hintsUsed = countHintPieces(pieces);
    if (hintsUsed >= MAX_HINTS) {
        return "max-reached";
    }
    if (pieces.some(p => p.position !== null && !p.isLocked)) {
        return "own-pieces";
    }
    if (hintsUsed === 0) {
        return "free";
    }
    if (isDateSolved) {
        return "date-solved";
    }
    return tokenBalance > 0 ? "token" : "no-tokens";
};
