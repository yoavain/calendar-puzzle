/**
 * Starts and solves that the server has not confirmed. They stay in localStorage, so they survive
 * a reload and midnight. Each one carries its user, so another account on this browser gets no credit.
 */
import type { Piece, PuzzleDate } from "../../common/types";
import { recordCompletion, recordStart, type SaveOutcome } from "./puzzleService.js";

const STORAGE_KEY = "calendar-puzzle-pending-saves";

export type PendingSave = { userId: string; date: PuzzleDate } & ({ kind: "start" } | { kind: "complete"; pieces: Piece[] });

export interface SaveResult {
    outcome: SaveOutcome;
    tokenGranted: boolean;
}

export interface FlushResult {
    started: PuzzleDate[];
    solved: PuzzleDate[];
    tokensGranted: number;
}

const keyOf = (save: Pick<PendingSave, "userId" | "kind" | "date">) => `${save.userId}|${save.kind}|${save.date.month}-${save.date.day}`;

const load = (): PendingSave[] => {
    try {
        const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        return Array.isArray(stored) ? stored as PendingSave[] : [];
    }
    catch {
        return [];
    }
};

const store = (saves: PendingSave[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    }
    catch {
        // Without storage, a save is still sent once
    }
};

export const addPendingSave = (save: PendingSave): void => {
    store([...load().filter(other => keyOf(other) !== keyOf(save)), save]);
};

export const hasPendingSave = (userId: string, kind: PendingSave["kind"], date: PuzzleDate): boolean =>
    load().some(save => keyOf(save) === keyOf({ userId, kind, date }));

const inFlight = new Map<string, Promise<SaveResult>>();

const send = async (save: PendingSave): Promise<SaveResult> => {
    let result: SaveResult;
    try {
        result = save.kind === "start"
            ? { outcome: await recordStart(save.date), tokenGranted: false }
            : await recordCompletion(save.date, save.pieces);
    }
    catch {
        result = { outcome: "failed", tokenGranted: false };
    }

    // A rejected save can never succeed. Anything else that failed is sent again later.
    if (result.outcome !== "failed") {
        store(load().filter(other => keyOf(other) !== keyOf(save)));
    }
    return result;
};

/** Sends one save. A second call for the same save, while the first runs, shares its result. */
export const sendPendingSave = (save: PendingSave): Promise<SaveResult> => {
    const key = keyOf(save);
    let request = inFlight.get(key);
    if (!request) {
        request = send(save).finally(() => inFlight.delete(key));
        inFlight.set(key, request);
    }
    return request;
};

/** Sends every pending save of the user, starts before solves. */
export const flushPendingSaves = async (userId: string): Promise<FlushResult> => {
    const result: FlushResult = { started: [], solved: [], tokensGranted: 0 };
    const saves = load()
        .filter(save => save.userId === userId)
        .sort((a, b) => Number(a.kind === "complete") - Number(b.kind === "complete"));

    for (const save of saves) {
        const { outcome, tokenGranted } = await sendPendingSave(save);
        if (outcome === "saved") {
            (save.kind === "start" ? result.started : result.solved).push(save.date);
            result.tokensGranted += tokenGranted ? 1 : 0;
        }
    }
    return result;
};
