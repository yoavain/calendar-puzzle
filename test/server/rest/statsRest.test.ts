import type { FastifyInstance } from "fastify";
import { buildTestServer } from "./helpers/buildTestServer";
import { makeEightPieces, mockUser } from "./helpers/fixtures";
import { registerStatsRoutes } from "../../../src/server/rest/statsRest";
import { db } from "../../../src/server/db/connection";
import { puzzleSolvedForDate } from "../../../src/common/gameLogic";
import { submitInvalidSolutionReport } from "../../../src/server/service/issueSubmitter";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("../../../src/server/db/connection", () => ({
    db: {
        insert: jest.fn()
    }
}));

jest.mock("../../../src/common/gameLogic", () => ({
    puzzleSolvedForDate: jest.fn()
}));

jest.mock("../../../src/server/service/issueSubmitter", () => ({
    submitInvalidSolutionReport: jest.fn()
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockInsert = db.insert as jest.Mock;
const mockPuzzleSolvedForDate = puzzleSolvedForDate as jest.Mock;
const mockSubmitReport = submitInvalidSolutionReport as jest.Mock;

/** Wire up the default happy-path DB insert chain. */
const setupInsertChain = (
    onConflictDoNothing = jest.fn().mockResolvedValue(undefined),
    onConflictDoUpdate = jest.fn().mockResolvedValue(undefined)
) => {
    mockInsert.mockReturnValue({
        values: jest.fn().mockReturnValue({
            onConflictDoNothing,
            onConflictDoUpdate
        })
    });
    return { onConflictDoNothing, onConflictDoUpdate };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("statsRest", () => {
    let unauthServer: FastifyInstance;
    let authServer: FastifyInstance;

    beforeAll(async () => {
        unauthServer = await buildTestServer(registerStatsRoutes);
        authServer = await buildTestServer(registerStatsRoutes, mockUser);
    });

    afterAll(async () => {
        await unauthServer.close();
        await authServer.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        setupInsertChain();
        mockPuzzleSolvedForDate.mockReturnValue({ month: 0, day: 1 });
        mockSubmitReport.mockResolvedValue(undefined);
    });

    // -----------------------------------------------------------------------
    // POST /api/stats/start
    // -----------------------------------------------------------------------

    describe("POST /api/stats/start", () => {
        it("returns 401 when not authenticated", async () => {
            const res = await unauthServer.inject({
                method: "POST",
                url: "/api/stats/start",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1 }
            });
            expect(res.statusCode).toBe(401);
        });

        it("returns 200 and calls db.insert on success", async () => {
            const { onConflictDoNothing } = setupInsertChain();

            const res = await authServer.inject({
                method: "POST",
                url: "/api/stats/start",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1 }
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ success: true });
            expect(mockInsert).toHaveBeenCalledTimes(1);
            expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
        });

        it("returns 500 when db.insert throws", async () => {
            mockInsert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    onConflictDoNothing: jest.fn().mockRejectedValue(new Error("DB error"))
                })
            });

            const res = await authServer.inject({
                method: "POST",
                url: "/api/stats/start",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1 }
            });

            expect(res.statusCode).toBe(500);
            expect(res.json()).toMatchObject({ error: "Failed to record progress" });
        });

        it("returns 400 when required field day is missing", async () => {
            const res = await authServer.inject({
                method: "POST",
                url: "/api/stats/start",
                headers: { "content-type": "application/json" },
                payload: { month: 0 } // missing day
            });
            expect(res.statusCode).toBe(400);
        });
    });

    // -----------------------------------------------------------------------
    // POST /api/stats/complete
    // -----------------------------------------------------------------------

    describe("POST /api/stats/complete", () => {
        const pieces = makeEightPieces();

        it("returns 401 when not authenticated", async () => {
            const res = await unauthServer.inject({
                method: "POST",
                url: "/api/stats/complete",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1, pieces }
            });
            expect(res.statusCode).toBe(401);
        });

        it("returns 200 and calls onConflictDoUpdate for a valid solution", async () => {
            const { onConflictDoUpdate } = setupInsertChain();
            mockPuzzleSolvedForDate.mockReturnValue({ month: 0, day: 1 });

            const res = await authServer.inject({
                method: "POST",
                url: "/api/stats/complete",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1, pieces }
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ success: true });
            expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
            expect(mockSubmitReport).not.toHaveBeenCalled();
        });

        it("returns 400 and triggers bug report for a mismatched solution date", async () => {
            // Solver says the pieces solve month=1/day=2, but client claims 0/1
            mockPuzzleSolvedForDate.mockReturnValue({ month: 1, day: 2 });

            const res = await authServer.inject({
                method: "POST",
                url: "/api/stats/complete",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1, pieces }
            });

            expect(res.statusCode).toBe(400);
            expect(res.json()).toMatchObject({ error: "Invalid solution" });
            expect(mockSubmitReport).toHaveBeenCalledTimes(1);
        });

        it("returns 400 and triggers bug report when solver returns null", async () => {
            mockPuzzleSolvedForDate.mockReturnValue(null);

            const res = await authServer.inject({
                method: "POST",
                url: "/api/stats/complete",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1, pieces }
            });

            expect(res.statusCode).toBe(400);
            expect(res.json()).toMatchObject({ error: "Invalid solution" });
            expect(mockSubmitReport).toHaveBeenCalledTimes(1);
        });

        it("returns 500 when db.insert throws after a valid solution", async () => {
            mockPuzzleSolvedForDate.mockReturnValue({ month: 0, day: 1 });
            mockInsert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    onConflictDoUpdate: jest.fn().mockRejectedValue(new Error("DB error"))
                })
            });

            const res = await authServer.inject({
                method: "POST",
                url: "/api/stats/complete",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1, pieces }
            });

            expect(res.statusCode).toBe(500);
            expect(res.json()).toMatchObject({ error: "Failed to record completion" });
        });

        it("returns 400 when pieces array has wrong count (schema validation)", async () => {
            const toofew = pieces.slice(0, 5); // only 5 pieces

            const res = await authServer.inject({
                method: "POST",
                url: "/api/stats/complete",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1, pieces: toofew }
            });

            expect(res.statusCode).toBe(400);
        });
    });
});
