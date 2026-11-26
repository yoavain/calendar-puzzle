/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useServerSync } from "../../src/client/layouts/common/useServerSync";
import { recordCompletion, recordStart } from "../../src/client/service/puzzleService";
import { addPendingSave, hasPendingSave } from "../../src/client/service/pendingSaves";
import { initializeGame } from "../../src/common/initialize";
import type { GameState } from "../../src/common/types";
import solution0101 from "../common/resources/01-01.json";

jest.mock("../../src/client/service/puzzleService", () => ({
    recordStart: jest.fn(),
    recordCompletion: jest.fn()
}));

const mockRecordCompletion = recordCompletion as jest.Mock;
const JAN_1 = { month: 0, day: 1 };

const solvedState = (overrides: Partial<GameState> = {}): GameState => ({
    ...initializeGame(new Date(2024, 0, 1)),
    pieces: solution0101.pieces as GameState["pieces"],
    isSolved: true,
    solutionRevealed: false,
    ...overrides
});

const render = (gameState: GameState, { savingPaused = false } = {}) => {
    const props = {
        user: { id: "u1", isAdmin: false },
        userLoading: false,
        gameState,
        playedDates: [JAN_1],
        completedDates: [],
        addPlayedDate: jest.fn(),
        addCompletedDate: jest.fn(),
        onTokenGranted: jest.fn(),
        savingPaused,
        onSolveDeferred: jest.fn()
    };
    renderHook(() => useServerSync(props));
    return props;
};

const isPending = () => hasPendingSave("u1", "complete", JAN_1);

describe("useServerSync", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        (recordStart as jest.Mock).mockResolvedValue("saved");
    });

    it("reports a granted token once, after the server confirms", async () => {
        mockRecordCompletion.mockResolvedValue({ outcome: "saved", tokenGranted: true });
        const props = render(solvedState());

        await waitFor(() => expect(props.addCompletedDate).toHaveBeenCalledWith(JAN_1));
        expect(props.onTokenGranted).toHaveBeenCalledTimes(1);
        expect(props.onSolveDeferred).not.toHaveBeenCalled();
        expect(isPending()).toBe(false);
    });

    it("records the date but grants nothing when the server says the date was already solved", async () => {
        mockRecordCompletion.mockResolvedValue({ outcome: "saved", tokenGranted: false });
        const props = render(solvedState());

        await waitFor(() => expect(props.addCompletedDate).toHaveBeenCalled());
        expect(props.onTokenGranted).not.toHaveBeenCalled();
    });

    it("does not report a revealed solution", () => {
        const props = render(solvedState({ solutionRevealed: true }));

        expect(mockRecordCompletion).not.toHaveBeenCalled();
        expect(props.onTokenGranted).not.toHaveBeenCalled();
        expect(isPending()).toBe(false);
    });

    it("keeps a solve that fails, and says so", async () => {
        mockRecordCompletion.mockResolvedValue({ outcome: "failed", tokenGranted: false });
        const props = render(solvedState());

        await waitFor(() => expect(props.onSolveDeferred).toHaveBeenCalledTimes(1));
        expect(props.addCompletedDate).not.toHaveBeenCalled();
        expect(isPending()).toBe(true);
    });

    it("stores a solve without sending it while saving is paused", () => {
        const props = render(solvedState(), { savingPaused: true });

        expect(mockRecordCompletion).not.toHaveBeenCalled();
        expect(props.onSolveDeferred).toHaveBeenCalledTimes(1);
        expect(isPending()).toBe(true);
    });

    it("leaves an already pending solve to the flush", () => {
        addPendingSave({ userId: "u1", date: JAN_1, kind: "complete", pieces: [] });
        const props = render(solvedState());

        expect(mockRecordCompletion).not.toHaveBeenCalled();
        expect(props.onSolveDeferred).not.toHaveBeenCalled();
    });
});
