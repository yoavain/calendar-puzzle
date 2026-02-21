import type { FastifyInstance } from "fastify";
import fs from "node:fs/promises";
import { buildTestServer } from "./helpers/buildTestServer";
import { mockUser } from "./helpers/fixtures";
import { registerAuthRoutes } from "../../../src/server/rest/authRest";
import { db } from "../../../src/server/db/connection";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("@fastify/passport", () => ({
    __esModule: true,
    default: {
        authenticate: jest.fn(() => async () => { /* no-op: OAuth routes not tested */ })
    }
}));

jest.mock("../../../src/server/db/connection", () => ({
    db: {
        select: jest.fn()
    }
}));

// config is mocked so that config.ts (which uses import.meta.url) is not loaded
jest.mock("../../../src/server/config", () => ({
    config: {
        paths: {
            publicKey: "/test/public-key.pem"
        }
    }
}));

jest.mock("node:fs/promises");

// ---------------------------------------------------------------------------
// Typed references to mocks
// ---------------------------------------------------------------------------

const mockSelect = db.select as jest.Mock;
const mockFsAccess = fs.access as jest.Mock;
const mockFsReadFile = fs.readFile as jest.Mock;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("authRest", () => {
    let unauthServer: FastifyInstance;
    let authServer: FastifyInstance;

    beforeAll(async () => {
        unauthServer = await buildTestServer(registerAuthRoutes);
        authServer = await buildTestServer(registerAuthRoutes, mockUser);
    });

    afterAll(async () => {
        await unauthServer.close();
        await authServer.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Default: select returns no rows
        mockSelect.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([])
            })
        });
    });

    // -----------------------------------------------------------------------
    // GET /api/auth/me
    // -----------------------------------------------------------------------

    describe("GET /api/auth/me", () => {
        it("returns { user: null } when not authenticated", async () => {
            const res = await unauthServer.inject({
                method: "GET",
                url: "/api/auth/me"
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({
                user: null,
                completedDates: [],
                playedDates: []
            });
        });

        it("returns user with empty arrays when authenticated and no history", async () => {
            const res = await authServer.inject({
                method: "GET",
                url: "/api/auth/me"
            });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.user).toMatchObject({ id: mockUser.id });
            expect(body.completedDates).toEqual([]);
            expect(body.playedDates).toEqual([]);
        });

        it("returns correct completedDates / playedDates split from DB rows", async () => {
            mockSelect.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([
                        { month: 0, day: 1, firstCompletedAt: new Date("2024-01-01") },
                        { month: 0, day: 2, firstCompletedAt: null }, // played but not completed
                        { month: 1, day: 5, firstCompletedAt: new Date("2024-02-05") }
                    ])
                })
            });

            const res = await authServer.inject({
                method: "GET",
                url: "/api/auth/me"
            });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.completedDates).toHaveLength(2);
            expect(body.completedDates).toContainEqual({ month: 0, day: 1 });
            expect(body.completedDates).toContainEqual({ month: 1, day: 5 });
            expect(body.playedDates).toHaveLength(3);
        });
    });

    // -----------------------------------------------------------------------
    // GET /api/auth/public-key
    // -----------------------------------------------------------------------

    describe("GET /api/auth/public-key", () => {
        it("returns 401 when not authenticated", async () => {
            const res = await unauthServer.inject({
                method: "GET",
                url: "/api/auth/public-key"
            });
            expect(res.statusCode).toBe(401);
        });

        it("returns 500 when the public key file is missing", async () => {
            mockFsAccess.mockRejectedValue(new Error("ENOENT"));

            const res = await authServer.inject({
                method: "GET",
                url: "/api/auth/public-key"
            });

            expect(res.statusCode).toBe(500);
            expect(res.json()).toMatchObject({ error: "Server encryption not configured" });
        });

        it("returns 200 with publicKey when the file exists", async () => {
            mockFsAccess.mockResolvedValue(undefined);
            mockFsReadFile.mockResolvedValue("-----BEGIN PUBLIC KEY-----\nMIIB...\n-----END PUBLIC KEY-----");

            const res = await authServer.inject({
                method: "GET",
                url: "/api/auth/public-key"
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toMatchObject({ publicKey: expect.stringContaining("BEGIN PUBLIC KEY") });
        });
    });
});
