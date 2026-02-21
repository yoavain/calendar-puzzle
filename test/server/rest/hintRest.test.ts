import type { FastifyInstance } from "fastify";
import { buildTestServer } from "./helpers/buildTestServer";
import { mockPiece, mockUser } from "./helpers/fixtures";
import { registerHintRoutes } from "../../../src/server/rest/hintRest";
import { db } from "../../../src/server/db/connection";
import { getHintPiece } from "../../../src/server/service/solverService";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("../../../src/server/db/connection", () => ({
    db: {
        insert: jest.fn(),
        select: jest.fn()
    }
}));

jest.mock("../../../src/server/service/solverService", () => ({
    getHintPiece: jest.fn()
}));

// ---------------------------------------------------------------------------
// Typed references to mocks
// ---------------------------------------------------------------------------

const mockInsert = db.insert as jest.Mock;
const mockSelect = db.select as jest.Mock;
const mockGetHintPiece = getHintPiece as jest.Mock;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("hintRest", () => {
    let unauthServer: FastifyInstance;
    let authServer: FastifyInstance;

    beforeAll(async () => {
        unauthServer = await buildTestServer(registerHintRoutes);
        authServer = await buildTestServer(registerHintRoutes, mockUser);
    });

    afterAll(async () => {
        await unauthServer.close();
        await authServer.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Default: insert chain succeeds
        mockInsert.mockReturnValue({
            values: jest.fn().mockReturnValue({
                onConflictDoUpdate: jest.fn().mockResolvedValue(undefined)
            })
        });

        // Default: select chain returns no rows (hint not used)
        mockSelect.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([])
                })
            })
        });

        mockGetHintPiece.mockResolvedValue(mockPiece);
    });

    // -----------------------------------------------------------------------
    // PUT /api/hint
    // -----------------------------------------------------------------------

    describe("PUT /api/hint", () => {
        it("returns 401 when not authenticated", async () => {
            const res = await unauthServer.inject({
                method: "PUT",
                url: "/api/hint",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1 }
            });
            expect(res.statusCode).toBe(401);
        });

        it("returns 200 with piece and records hint usage", async () => {
            const onConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
            mockInsert.mockReturnValue({
                values: jest.fn().mockReturnValue({ onConflictDoUpdate })
            });

            const res = await authServer.inject({
                method: "PUT",
                url: "/api/hint",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1 }
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toMatchObject({ piece: mockPiece });
            expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
            expect(mockGetHintPiece).toHaveBeenCalledWith(0, 1, expect.anything());
        });

        it("returns 500 when getHintPiece throws", async () => {
            mockGetHintPiece.mockRejectedValue(new Error("Solver failure"));

            const res = await authServer.inject({
                method: "PUT",
                url: "/api/hint",
                headers: { "content-type": "application/json" },
                payload: { month: 0, day: 1 }
            });

            expect(res.statusCode).toBe(500);
            expect(res.json()).toMatchObject({ error: expect.stringContaining("hint") });
        });
    });

    // -----------------------------------------------------------------------
    // GET /api/hint/:date/state
    // -----------------------------------------------------------------------

    describe("GET /api/hint/:date/state", () => {
        it("returns 401 when not authenticated", async () => {
            const res = await unauthServer.inject({
                method: "GET",
                url: "/api/hint/01-01/state"
            });
            expect(res.statusCode).toBe(401);
        });

        it("returns 400 for invalid date format", async () => {
            // 02-30 passes Fastify's MM-DD schema regex but fails parseDate (Feb has ≤29 days)
            const res = await authServer.inject({
                method: "GET",
                url: "/api/hint/02-30/state"
            });
            expect(res.statusCode).toBe(400);
            expect(res.json()).toMatchObject({ error: "Invalid date format" });
        });

        it("returns { piece: null } when hint was not previously used", async () => {
            // mockSelect already returns empty array by default
            const res = await authServer.inject({
                method: "GET",
                url: "/api/hint/01-01/state"
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ piece: null });
            expect(mockGetHintPiece).not.toHaveBeenCalled();
        });

        it("returns { piece } when hint was previously used", async () => {
            // Simulate a DB row with hintUsed = true
            mockSelect.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([{ hintUsed: true }])
                    })
                })
            });

            const res = await authServer.inject({
                method: "GET",
                url: "/api/hint/01-01/state"
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toMatchObject({ piece: mockPiece });
            expect(mockGetHintPiece).toHaveBeenCalledTimes(1);
        });
    });
});
