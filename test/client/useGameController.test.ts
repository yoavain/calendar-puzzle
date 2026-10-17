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
import { getHint, getHintState, HintRequestError, recordCompletion, recordStart } from "../../src/client/service/puzzleService";
import type { UserSettings } from "../../src/common/restTypes";
import { HINT_TOKEN_COPY } from "../../src/client/copy/hintTokenCopy";
import { logToServer } from "../../src/client/service/logService";

jest.mock("canvas-confetti", () => jest.fn(() => Promise.resolve()));
jest.mock("../../src/client/service/logService", () => ({ logToServer: jest.fn() }));
jest.mock("../../src/client/service/puzzleService", () => {
    const actual = jest.requireActual("../../src/client/service/puzzleService");
    return {
        ...actual,
        getHint: jest.fn(),
        getHintState: jest.fn(),
        recordStart: jest.fn(),
        recordCompletion: jest.fn()
    };
});

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

describe("useGameController hint tokens", () => {
    const user = { id: "u1", isAdmin: false };
    const mockGetHint = getHint as jest.Mock;
    const mockGetHintState = getHintState as jest.Mock;
    let setTokenBalance: jest.Mock;
    let updateSettings: jest.Mock;
    let addCompletedDate: jest.Mock;

    interface SavedBoard {
        /** Hint pieces on the saved Jan 1 board, locked */
        hints?: number;
        /** Pieces the user placed after the hints */
        userPieces?: number;
        isSolved?: boolean;
    }

    /** Save a Jan 1 board as the session, the way the page restores it on load. */
    const saveSession = ({ hints = 0, userPieces = 0, isSolved = false }: SavedBoard) => {
        const placedCount = hints + userPieces;
        if (placedCount === 0) {
            return;
        }
        const pieces = solvedPieces.map((p, i) => {
            if (i < hints) {
                return { ...p, isLocked: true };
            }
            return i < placedCount ? p : { ...p, position: null };
        });
        localStorage.setItem(SESSION_KEY, JSON.stringify({ date: { month: 0, day: 1 }, pieces, isSolved }));
    };

    /**
     * Render signed in on a saved board. `serverHints` answers the load-time hint fetch
     * (an Error rejects it); it defaults to the board's own hints.
     */
    const renderSignedIn = async (options: SavedBoard & {
        tokenBalance: number;
        settings?: UserSettings;
        serverHints?: Piece[] | Error | Promise<Piece[]>;
    }) => {
        saveSession(options);
        const serverHints = options.serverHints ?? solvedPieces.slice(0, options.hints ?? 0);
        if (serverHints instanceof Error) {
            mockGetHintState.mockRejectedValueOnce(serverHints);
        }
        else if (serverHints instanceof Promise) {
            mockGetHintState.mockReturnValueOnce(serverHints);
        }
        else if (serverHints.length > 0 || options.serverHints) {
            mockGetHintState.mockResolvedValueOnce(serverHints);
        }
        const signedInWrapper = ({ children }: { children: ReactNode }) =>
            React.createElement(MockUserProvider, {
                user,
                tokenBalance: options.tokenBalance,
                settings: options.settings ?? {},
                setTokenBalance,
                updateSettings,
                addCompletedDate,
                children
            });
        const rendered = renderHook(() => useGameController(), { wrapper: signedInWrapper });
        await act(async () => {}); // let the load-time hint fetch settle
        return rendered;
    };

    const lockedIds = (pieces: Piece[]) => pieces.filter(p => p.isLocked && p.position).map(p => p.id);

    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2024, 0, 1, 12) });
        localStorage.clear();
        setTokenBalance = jest.fn();
        updateSettings = jest.fn().mockResolvedValue(undefined);
        addCompletedDate = jest.fn();
        mockGetHint.mockReset();
        mockGetHintState.mockReset().mockResolvedValue([]);
        (recordStart as jest.Mock).mockResolvedValue(true);
        (recordCompletion as jest.Mock).mockResolvedValue({ success: true, tokenGranted: false });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("asks for hint #1 on an empty board and locks it", async () => {
        mockGetHint.mockResolvedValue({ pieces: [solvedPieces[0]], tokenBalance: 0 });
        const { result } = await renderSignedIn({ tokenBalance: 0 });
        expect(result.current.hintAvailability).toBe("free");

        await act(async () => {
            await result.current.handleHint();
        });

        expect(mockGetHint).toHaveBeenCalledWith({ month: 0, day: 1 }, 1);
        expect(lockedIds(result.current.gameState.pieces)).toEqual([solvedPieces[0].id]);
        expect(setTokenBalance).toHaveBeenCalledWith(0);
    });

    it("opens the confirm dialog for a token hint instead of calling the server", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 1, hints: 1 });
        expect(result.current.hintAvailability).toBe("token");

        await act(async () => {
            await result.current.handleHint();
        });

        expect(result.current.modals.tokenConfirm.isOpen).toBe(true);
        expect(mockGetHint).not.toHaveBeenCalled();
    });

    it("confirm with don't-ask-again saves the setting and requests hint #2", async () => {
        mockGetHint.mockResolvedValue({ pieces: [solvedPieces[0], solvedPieces[1]], tokenBalance: 0 });
        const { result } = await renderSignedIn({ tokenBalance: 1, hints: 1 });

        await act(async () => {
            await result.current.handleConfirmTokenHint(true);
        });

        expect(updateSettings).toHaveBeenCalledWith({ skipTokenConfirm: true });
        expect(mockGetHint).toHaveBeenCalledWith({ month: 0, day: 1 }, 2);
        expect(result.current.modals.tokenConfirm.isOpen).toBe(false);
        expect(lockedIds(result.current.gameState.pieces)).toEqual([solvedPieces[0].id, solvedPieces[1].id]);
        expect(setTokenBalance).toHaveBeenCalledWith(0);
    });

    it("skips the dialog when skipTokenConfirm is set", async () => {
        mockGetHint.mockResolvedValue({ pieces: [solvedPieces[0], solvedPieces[1]], tokenBalance: 2 });
        const { result } = await renderSignedIn({ tokenBalance: 3, hints: 1, settings: { skipTokenConfirm: true } });

        await act(async () => {
            await result.current.handleHint();
        });

        expect(result.current.modals.tokenConfirm.isOpen).toBe(false);
        expect(mockGetHint).toHaveBeenCalledWith({ month: 0, day: 1 }, 2);
    });

    it("does nothing with no tokens left", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1 });
        expect(result.current.hintAvailability).toBe("no-tokens");

        await act(async () => {
            await result.current.handleHint();
        });

        expect(mockGetHint).not.toHaveBeenCalled();
        expect(result.current.modals.tokenConfirm.isOpen).toBe(false);
    });

    it("NO_TOKENS: takes the balance from the error and shows the toast message", async () => {
        mockGetHint.mockRejectedValue(new HintRequestError("No hint tokens left.", "NO_TOKENS", 0));
        const { result } = await renderSignedIn({ tokenBalance: 1, hints: 1, settings: { skipTokenConfirm: true } });

        await act(async () => {
            await result.current.handleHint();
        });

        expect(setTokenBalance).toHaveBeenCalledWith(0);
        expect(result.current.hintMessage).toBe(HINT_TOKEN_COPY.errors.NO_TOKENS);
        expect(result.current.solverError).toBeNull();
        expect(lockedIds(result.current.gameState.pieces)).toEqual([solvedPieces[0].id]);
    });

    it("rate limited: shows the friendly message, not the raw server text", async () => {
        mockGetHint.mockRejectedValue(new HintRequestError("Too Many Requests", null, null, 429));
        const { result } = await renderSignedIn({ tokenBalance: 2, hints: 1, settings: { skipTokenConfirm: true } });

        await act(async () => {
            await result.current.handleHint();
        });

        expect(result.current.hintMessage).toBe(HINT_TOKEN_COPY.rateLimited);
    });

    it("ALREADY_SOLVED: records the date as solved so the button stops offering paid hints", async () => {
        mockGetHint.mockRejectedValue(new HintRequestError("This date is already solved.", "ALREADY_SOLVED", 2));
        const { result } = await renderSignedIn({ tokenBalance: 2, hints: 1, settings: { skipTokenConfirm: true } });

        await act(async () => {
            await result.current.handleHint();
        });

        expect(addCompletedDate).toHaveBeenCalledWith({ month: 0, day: 1 });
        expect(result.current.hintMessage).toBe(HINT_TOKEN_COPY.errors.ALREADY_SOLVED);
    });

    it("restored board behind the server: adopts the server's hints on load", async () => {
        // Hints #2 and #3 were used on another device; this device restores a board with hint #1
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1, serverHints: solvedPieces.slice(0, 3) });

        expect(mockGetHintState).toHaveBeenCalledWith({ month: 0, day: 1 });
        expect(lockedIds(result.current.gameState.pieces)).toEqual(solvedPieces.slice(0, 3).map(p => p.id));
        expect(result.current.hintMessage).toBeNull(); // no user pieces were cleared
        expect(result.current.canUndo).toBe(false); // the adopted hints cannot be undone
    });

    it("restored board behind the server: the Hint button waits for the hint fetch", async () => {
        let resolveLoad: (pieces: Piece[]) => void = () => {};
        const serverHints = new Promise<Piece[]>(resolve => {
            resolveLoad = resolve;
        });
        const { result } = await renderSignedIn({ tokenBalance: 2, hints: 1, serverHints });

        // Hint #2 would look paid, but the server replays it for free
        expect(result.current.hintAvailability).toBe("loading");

        await act(async () => {
            resolveLoad(solvedPieces.slice(0, 3));
            await serverHints;
        });

        expect(lockedIds(result.current.gameState.pieces)).toHaveLength(3);
        expect(result.current.hintAvailability).toBe("token"); // hint #4 does cost a token
    });

    it("restored board, user acts during the hint fetch: still adopts the server's hints", async () => {
        let resolveLoad: (pieces: Piece[]) => void = () => {};
        const serverHints = new Promise<Piece[]>(resolve => {
            resolveLoad = resolve;
        });
        const poolPiece = solvedPieces[5];
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1, serverHints });

        act(() => result.current.handlePieceSelect(poolPiece.id));
        await act(async () => {
            resolveLoad(solvedPieces.slice(0, 3));
            await serverHints;
        });

        expect(lockedIds(result.current.gameState.pieces)).toEqual(solvedPieces.slice(0, 3).map(p => p.id));
        expect(result.current.gameState.selectedPieceId).toBeNull();
    });

    it("date change: fetches the new date's hints once", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1 });
        mockGetHintState.mockClear();

        await act(async () => {
            result.current.handleDateChange({ month: 0, day: 2 });
        });

        expect(mockGetHintState.mock.calls).toEqual([[{ month: 0, day: 2 }]]);
    });

    it("date change: restores the hints the user has for the new date", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 0 });
        mockGetHintState.mockResolvedValueOnce([solvedPieces[0]]);

        await act(async () => {
            result.current.handleDateChange({ month: 0, day: 2 });
        });

        expect(result.current.gameState.currentDate).toEqual({ month: 0, day: 2 });
        expect(lockedIds(result.current.gameState.pieces)).toEqual([solvedPieces[0].id]);
    });

    it("reset: clears the user's pieces and reloads the server's hints", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1, userPieces: 2 });
        mockGetHintState.mockResolvedValueOnce(solvedPieces.slice(0, 3));

        await act(async () => {
            result.current.handleReset();
        });

        expect(lockedIds(result.current.gameState.pieces)).toEqual(solvedPieces.slice(0, 3).map(p => p.id));
        expect(result.current.hintMessage).toBeNull(); // the user asked for the reset
    });

    it("restored board ahead of the server: adopts the server's hints on load", async () => {
        // e.g. the server data was restored from a backup taken before hints #2 and #3
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 3, serverHints: [solvedPieces[0]] });

        expect(lockedIds(result.current.gameState.pieces)).toEqual([solvedPieces[0].id]);
    });

    it("restored board behind the server with the user's pieces: clears them and says so", async () => {
        // Pieces 1 and 2 are the user's; the server's hint #2 is piece 3
        const serverHints = [solvedPieces[0], solvedPieces[3]];
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1, userPieces: 2, serverHints });

        const placedIds = result.current.gameState.pieces.filter(p => p.position).map(p => p.id);
        expect(placedIds).toEqual(serverHints.map(p => p.id));
        expect(lockedIds(result.current.gameState.pieces)).toEqual(serverHints.map(p => p.id));
        expect(result.current.hintMessage).toBe(HINT_TOKEN_COPY.hintsReconciled);
    });

    it("restored board matching the server: keeps the user's pieces on load", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1, userPieces: 2 });

        const placedIds = result.current.gameState.pieces.filter(p => p.position).map(p => p.id);
        expect(placedIds).toEqual(solvedPieces.slice(0, 3).map(p => p.id));
        expect(lockedIds(result.current.gameState.pieces)).toEqual([solvedPieces[0].id]);
        expect(result.current.hintMessage).toBeNull();
    });

    it("restored solved board: does not fetch the server's hints", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 0, userPieces: solvedPieces.length, isSolved: true });

        expect(mockGetHintState).not.toHaveBeenCalled();
        expect(result.current.gameState.isSolved).toBe(true);
    });

    it("restored board, signed out: does not fetch the server's hints", async () => {
        saveSession({ hints: 2 });
        const { result } = renderHook(() => useGameController(), { wrapper });

        await act(async () => {});

        expect(mockGetHintState).not.toHaveBeenCalled();
        expect(lockedIds(result.current.gameState.pieces)).toEqual(solvedPieces.slice(0, 2).map(p => p.id));
    });

    it("restored board, hint fetch fails: keeps the board as it is", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1, userPieces: 1, serverHints: new Error("Failed to load hint state") });

        const placedIds = result.current.gameState.pieces.filter(p => p.position).map(p => p.id);
        expect(placedIds).toEqual(solvedPieces.slice(0, 2).map(p => p.id));
        expect(result.current.hintMessage).toBeNull();
        expect(logToServer).toHaveBeenCalledWith("error", expect.any(String), expect.any(Error));
    });

    it("restored board, date changed during the hint fetch: drops the fetched hints", async () => {
        let resolveLoad: (pieces: Piece[]) => void = () => {};
        const serverHints = new Promise<Piece[]>(resolve => {
            resolveLoad = resolve;
        });
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 1, serverHints });

        await act(async () => {
            result.current.handleDateChange({ month: 0, day: 2 });
            await Promise.resolve();
        });
        await act(async () => {
            resolveLoad(solvedPieces.slice(0, 3));
            await serverHints;
        });

        expect(result.current.gameState.currentDate).toEqual({ month: 0, day: 2 });
        expect(lockedIds(result.current.gameState.pieces)).toEqual([]);
    });

    it("restored board with hints the server does not have: clears them on load", async () => {
        const { result } = await renderSignedIn({ tokenBalance: 0, hints: 2, serverHints: [] });

        expect(lockedIds(result.current.gameState.pieces)).toEqual([]);
        expect(result.current.hintAvailability).toBe("free");
    });

    it("STALE_HINT_NUMBER with no hints on the server: clears the stale hint pieces", async () => {
        // e.g. the server data was restored from a backup taken before these hints
        mockGetHint.mockRejectedValue(new HintRequestError("Your hints are out of date.", "STALE_HINT_NUMBER", 2));
        mockGetHintState.mockResolvedValue([]);
        const { result } = await renderSignedIn({ tokenBalance: 2, hints: 1, settings: { skipTokenConfirm: true } });

        await act(async () => {
            await result.current.handleHint();
        });

        expect(lockedIds(result.current.gameState.pieces)).toEqual([]);
        expect(result.current.hintAvailability).toBe("free");
    });

    it("STALE_HINT_NUMBER: keeps the board's hints when the reload fails", async () => {
        mockGetHint.mockRejectedValue(new HintRequestError("Your hints are out of date.", "STALE_HINT_NUMBER", 2));
        mockGetHintState.mockRejectedValue(new Error("Failed to load hint state: Too Many Requests"));
        const { result } = await renderSignedIn({ tokenBalance: 2, hints: 1, settings: { skipTokenConfirm: true } });

        await act(async () => {
            await result.current.handleHint();
        });

        expect(lockedIds(result.current.gameState.pieces)).toEqual([solvedPieces[0].id]);
    });

    it("STALE_HINT_NUMBER: drops the reloaded hints when the user switched dates meanwhile", async () => {
        mockGetHint.mockRejectedValue(new HintRequestError("Your hints are out of date.", "STALE_HINT_NUMBER", 2));
        const { result } = await renderSignedIn({ tokenBalance: 2, hints: 1, settings: { skipTokenConfirm: true } });

        let resolveStale: (pieces: Piece[]) => void = () => {};
        mockGetHintState.mockImplementationOnce(() => new Promise<Piece[]>(resolve => {
            resolveStale = resolve;
        }));

        let pending: Promise<void> = Promise.resolve();
        await act(async () => {
            pending = result.current.handleHint();
            await Promise.resolve();
        });
        await act(async () => {
            result.current.handleDateChange({ month: 0, day: 2 });
            await Promise.resolve();
        });
        await act(async () => {
            resolveStale([solvedPieces[0], solvedPieces[1], solvedPieces[2]]);
            await pending;
        });

        expect(result.current.gameState.currentDate).toEqual({ month: 0, day: 2 });
        expect(lockedIds(result.current.gameState.pieces)).toEqual([]);
    });

    it("STALE_HINT_NUMBER: reloads the hints from the server without an error", async () => {
        mockGetHint.mockRejectedValue(new HintRequestError("Your hints are out of date.", "STALE_HINT_NUMBER", 2));
        mockGetHintState.mockResolvedValue([solvedPieces[0], solvedPieces[1], solvedPieces[2]]);
        const { result } = await renderSignedIn({ tokenBalance: 2, hints: 1, settings: { skipTokenConfirm: true } });

        await act(async () => {
            await result.current.handleHint();
        });

        expect(lockedIds(result.current.gameState.pieces)).toHaveLength(3);
        expect(result.current.hintMessage).toBeNull();
        expect(setTokenBalance).toHaveBeenCalledWith(2);
    });
});

describe("useGameController post-solve timing", () => {
    const user = { id: "u1", isAdmin: false };

    const renderSolvable = (completedDates: { month: number; day: number }[]) => {
        const pieces = solvedPieces.map(p => (p.id === lastPiece.id ? { ...p, position: null } : p));
        localStorage.setItem(SESSION_KEY, JSON.stringify({ date: { month: 0, day: 1 }, pieces, isSolved: false }));
        const signedInWrapper = ({ children }: { children: ReactNode }) =>
            React.createElement(MockUserProvider, { user, completedDates, children });
        return renderHook(() => useGameController(), { wrapper: signedInWrapper });
    };

    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2024, 0, 1, 12) });
        localStorage.clear();
        (getHintState as jest.Mock).mockReset().mockResolvedValue([]);
        (recordStart as jest.Mock).mockResolvedValue(true);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("waits for the token to land before opening stats on a first solve", async () => {
        (recordCompletion as jest.Mock).mockResolvedValue({ success: true, tokenGranted: true });
        const { result } = renderSolvable([]);

        act(() => result.current.handlePieceDrop(lastPiece.position!, { pieceId: lastPiece.id }));
        await act(async () => {
            await Promise.resolve();
        });
        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(result.current.pendingTokenFlights).toBe(1);
        expect(result.current.modals.stats.isOpen).toBe(false);

        act(() => result.current.landTokenFlight());
        act(() => {
            jest.advanceTimersByTime(250);
        });

        expect(result.current.pendingTokenFlights).toBe(0);
        expect(result.current.modals.stats.isOpen).toBe(true);
    });

    it("adds the earned token at the grant, and shows it once the flight lands", async () => {
        // Counting at the grant keeps the balance right if the layout remounts mid-flight
        // (a rotation) or a server balance arrives during the flight
        (recordCompletion as jest.Mock).mockResolvedValue({ success: true, tokenGranted: true });
        const adjustTokenBalance = jest.fn();
        const pieces = solvedPieces.map(p => (p.id === lastPiece.id ? { ...p, position: null } : p));
        localStorage.setItem(SESSION_KEY, JSON.stringify({ date: { month: 0, day: 1 }, pieces, isSolved: false }));
        const wrapper3 = ({ children }: { children: ReactNode }) =>
            React.createElement(MockUserProvider, { user, completedDates: [], tokenBalance: 3, adjustTokenBalance, children });
        const { result } = renderHook(() => useGameController(), { wrapper: wrapper3 });

        act(() => result.current.handlePieceDrop(lastPiece.position!, { pieceId: lastPiece.id }));
        await act(async () => {
            await Promise.resolve();
        });

        expect(adjustTokenBalance).toHaveBeenCalledWith(1);
        expect(result.current.pendingTokenFlights).toBe(1);
        // The mock context stays at 3; the shown balance holds back the token in flight
        expect(result.current.tokenBalance).toBe(2);

        act(() => result.current.landTokenFlight());

        expect(adjustTokenBalance).toHaveBeenCalledTimes(1);
        expect(result.current.tokenBalance).toBe(3);
    });

    it("opens stats at 1500 ms when the date was already solved", () => {
        (recordCompletion as jest.Mock).mockResolvedValue({ success: true, tokenGranted: false });
        const { result } = renderSolvable([{ month: 0, day: 1 }]);

        act(() => result.current.handlePieceDrop(lastPiece.position!, { pieceId: lastPiece.id }));
        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(result.current.modals.stats.isOpen).toBe(true);
    });

    it("falls back to opening stats when an expected token never arrives", async () => {
        (recordCompletion as jest.Mock).mockResolvedValue({ success: false, tokenGranted: false });
        const { result } = renderSolvable([]);

        act(() => result.current.handlePieceDrop(lastPiece.position!, { pieceId: lastPiece.id }));
        await act(async () => {
            await Promise.resolve();
        });
        act(() => {
            jest.advanceTimersByTime(2500);
        });

        expect(result.current.modals.stats.isOpen).toBe(true);
    });
});
