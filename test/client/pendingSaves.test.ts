/**
 * @jest-environment jsdom
 */
import { addPendingSave, flushPendingSaves, hasPendingSave, sendPendingSave, type PendingSave } from "../../src/client/service/pendingSaves";
import { recordCompletion, recordStart } from "../../src/client/service/puzzleService";

jest.mock("../../src/client/service/puzzleService", () => ({
    recordStart: jest.fn(),
    recordCompletion: jest.fn()
}));

const mockStart = recordStart as jest.Mock;
const mockCompletion = recordCompletion as jest.Mock;
const JAN_1 = { month: 0, day: 1 };

const completion: PendingSave = { userId: "u1", date: JAN_1, kind: "complete", pieces: [] };
const start: PendingSave = { userId: "u1", date: JAN_1, kind: "start" };

describe("pendingSaves", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        mockStart.mockResolvedValue("saved");
        mockCompletion.mockResolvedValue({ outcome: "saved", tokenGranted: true });
    });

    it("sends starts before solves and reports what was saved", async () => {
        const order: string[] = [];
        mockStart.mockImplementation(async () => {
            order.push("start");
            return "saved";
        });
        mockCompletion.mockImplementation(async () => {
            order.push("complete");
            return { outcome: "saved", tokenGranted: true };
        });
        addPendingSave(completion);
        addPendingSave(start);

        await expect(flushPendingSaves("u1")).resolves.toEqual({ started: [JAN_1], solved: [JAN_1], tokensGranted: 1 });

        expect(order).toEqual(["start", "complete"]);
        expect(hasPendingSave("u1", "complete", JAN_1)).toBe(false);
        expect(hasPendingSave("u1", "start", JAN_1)).toBe(false);
    });

    it("does not send the saves of another user", async () => {
        addPendingSave(completion);

        await flushPendingSaves("u2");

        expect(mockCompletion).not.toHaveBeenCalled();
        expect(hasPendingSave("u1", "complete", JAN_1)).toBe(true);
    });

    it.each([
        ["saved", false],
        ["rejected", false],
        ["failed", true]
    ])("after a %s answer, keeps the save: %s", async (outcome, kept) => {
        mockCompletion.mockResolvedValue({ outcome, tokenGranted: false });
        addPendingSave(completion);

        await flushPendingSaves("u1");

        expect(hasPendingSave("u1", "complete", JAN_1)).toBe(kept);
    });

    it("keeps the save when the request throws", async () => {
        mockCompletion.mockRejectedValue(new TypeError("Failed to fetch"));
        addPendingSave(completion);

        await flushPendingSaves("u1");

        expect(hasPendingSave("u1", "complete", JAN_1)).toBe(true);
    });

    it("shares one request between two callers", async () => {
        addPendingSave(completion);

        await Promise.all([sendPendingSave(completion), sendPendingSave(completion)]);

        expect(mockCompletion).toHaveBeenCalledTimes(1);
    });

    it("ignores stored data that is not a list", async () => {
        localStorage.setItem("calendar-puzzle-pending-saves", "{broken");

        await expect(flushPendingSaves("u1")).resolves.toEqual({ started: [], solved: [], tokensGranted: 0 });
    });
});
