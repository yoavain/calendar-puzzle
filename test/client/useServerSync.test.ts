/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useServerSync } from "../../src/client/layouts/common/useServerSync";
import { recordCompletion, recordStart } from "../../src/client/service/puzzleService";
import { initializeGame } from "../../src/common/initialize";
import type { GameState } from "../../src/common/types";
import solution0101 from "../common/resources/01-01.json";

jest.mock("../../src/client/service/puzzleService", () => ({
    recordStart: jest.fn(),
    recordCompletion: jest.fn()
}));

const mockRecordCompletion = recordCompletion as jest.Mock;

const solvedState = (overrides: Partial<GameState> = {}): GameState => ({
    ...initializeGame(new Date(2024, 0, 1)),
    pieces: solution0101.pieces as GameState["pieces"],
    isSolved: true,
    solutionRevealed: false,
    ...overrides
});

const render = (gameState: GameState) => {
    const props = {
        user: { id: "u1", isAdmin: false },
        userLoading: false,
        gameState,
        playedDates: [{ month: 0, day: 1 }],
        completedDates: [],
        addPlayedDate: jest.fn(),
        addCompletedDate: jest.fn(),
        onTokenGranted: jest.fn()
    };
    renderHook(() => useServerSync(props));
    return props;
};

describe("useServerSync token grant", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (recordStart as jest.Mock).mockResolvedValue(true);
    });

    it("reports a granted token once, after the server confirms", async () => {
        mockRecordCompletion.mockResolvedValue({ success: true, tokenGranted: true });
        const props = render(solvedState());

        await waitFor(() => expect(props.addCompletedDate).toHaveBeenCalledWith({ month: 0, day: 1 }));
        expect(props.onTokenGranted).toHaveBeenCalledTimes(1);
    });

    it("records the date but grants nothing when the server says the date was already solved", async () => {
        mockRecordCompletion.mockResolvedValue({ success: true, tokenGranted: false });
        const props = render(solvedState());

        await waitFor(() => expect(props.addCompletedDate).toHaveBeenCalled());
        expect(props.onTokenGranted).not.toHaveBeenCalled();
    });

    it("does not report a revealed solution", () => {
        const props = render(solvedState({ solutionRevealed: true }));

        expect(mockRecordCompletion).not.toHaveBeenCalled();
        expect(props.onTokenGranted).not.toHaveBeenCalled();
    });
});
