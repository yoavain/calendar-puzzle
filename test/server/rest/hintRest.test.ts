import type { FastifyInstance } from "fastify";
import { buildTestServer } from "./helpers/buildTestServer";
import { mockPiece, mockUser } from "./helpers/fixtures";
import { registerHintRoutes } from "../../../src/server/rest/hintRest";
import { getHintsUsed, spendHint } from "../../../src/server/db/hintRepository";
import { getHintPieces } from "../../../src/server/service/solverService";

// requireAuth imports the real connection module; keep it (and config.ts) out of the test
jest.mock("../../../src/server/db/connection", () => ({
    db: {}
}));

jest.mock("../../../src/server/db/hintRepository", () => ({
    spendHint: jest.fn(),
    getHintsUsed: jest.fn()
}));

jest.mock("../../../src/server/service/solverService", () => ({
    getHintPieces: jest.fn()
}));

const mockSpendHint = spendHint as jest.Mock;
const mockGetHintsUsed = getHintsUsed as jest.Mock;
const mockGetHintPieces = getHintPieces as jest.Mock;

const putHint = (server: FastifyInstance, payload: object) =>
    server.inject({
        method: "PUT",
        url: "/api/hint",
        headers: { "content-type": "application/json" },
        payload
    });

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
        mockSpendHint.mockResolvedValue({ ok: true, hintsUsed: 1, tokenBalance: 0 });
        mockGetHintsUsed.mockResolvedValue(0);
        mockGetHintPieces.mockImplementation(async (_m: number, _d: number, count: number) =>
            Array.from({ length: count }, () => mockPiece));
    });

    describe("PUT /api/hint", () => {
        it("returns 401 when not authenticated", async () => {
            const res = await putHint(unauthServer, { month: 0, day: 1, hintNumber: 1 });
            expect(res.statusCode).toBe(401);
        });

        it("returns 400 when hintNumber is missing", async () => {
            const res = await putHint(authServer, { month: 0, day: 1 });
            expect(res.statusCode).toBe(400);
        });

        it("returns 400 when hintNumber is past MAX_HINTS", async () => {
            const res = await putHint(authServer, { month: 0, day: 1, hintNumber: 8 });
            expect(res.statusCode).toBe(400);
            expect(mockSpendHint).not.toHaveBeenCalled();
        });

        it("returns all hints so far and the new balance", async () => {
            mockSpendHint.mockResolvedValue({ ok: true, hintsUsed: 2, tokenBalance: 4 });

            const res = await putHint(authServer, { month: 0, day: 1, hintNumber: 2 });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ pieces: [mockPiece, mockPiece], tokenBalance: 4 });
            expect(mockSpendHint).toHaveBeenCalledWith(mockUser.id, 0, 1, 2);
            expect(mockGetHintPieces).toHaveBeenCalledWith(0, 1, 2, expect.anything());
        });

        it("a replayed hint number returns every hint the user already has", async () => {
            // Client asks for #2, server already has 3 (e.g. a second tab)
            mockSpendHint.mockResolvedValue({ ok: true, hintsUsed: 3, tokenBalance: 1 });

            const res = await putHint(authServer, { month: 0, day: 1, hintNumber: 2 });

            expect(res.statusCode).toBe(200);
            expect(res.json().pieces).toHaveLength(3);
        });

        it.each(["STALE_HINT_NUMBER", "ALREADY_SOLVED", "NO_TOKENS"])("returns 409 with code %s", async (code) => {
            mockSpendHint.mockResolvedValue({ ok: false, code, tokenBalance: 0 });

            const res = await putHint(authServer, { month: 0, day: 1, hintNumber: 2 });

            expect(res.statusCode).toBe(409);
            expect(res.json()).toMatchObject({ code, tokenBalance: 0, error: expect.any(String) });
            expect(mockGetHintPieces).not.toHaveBeenCalled();
        });

        it("returns 500 when the solver fails after the spend (a retry is a free replay)", async () => {
            mockGetHintPieces.mockRejectedValue(new Error("Solver failure"));

            const res = await putHint(authServer, { month: 0, day: 1, hintNumber: 1 });

            expect(res.statusCode).toBe(500);
            expect(res.json()).toMatchObject({ error: expect.stringContaining("hint") });
        });
    });

    describe("GET /api/hint/:date/state", () => {
        it("returns 401 when not authenticated", async () => {
            const res = await unauthServer.inject({ method: "GET", url: "/api/hint/01-01/state" });
            expect(res.statusCode).toBe(401);
        });

        it("returns 400 for invalid date format", async () => {
            // 02-30 passes Fastify's MM-DD schema regex but fails parseDate (Feb has ≤29 days)
            const res = await authServer.inject({ method: "GET", url: "/api/hint/02-30/state" });
            expect(res.statusCode).toBe(400);
            expect(res.json()).toMatchObject({ error: "Invalid date format" });
        });

        it("returns { pieces: [] } without solving when no hint was used", async () => {
            const res = await authServer.inject({ method: "GET", url: "/api/hint/01-01/state" });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ pieces: [] });
            expect(mockGetHintPieces).not.toHaveBeenCalled();
        });

        it("returns every used hint", async () => {
            mockGetHintsUsed.mockResolvedValue(3);

            const res = await authServer.inject({ method: "GET", url: "/api/hint/01-01/state" });

            expect(res.statusCode).toBe(200);
            expect(res.json().pieces).toHaveLength(3);
            expect(mockGetHintsUsed).toHaveBeenCalledWith(mockUser.id, 0, 1);
        });
    });
});
