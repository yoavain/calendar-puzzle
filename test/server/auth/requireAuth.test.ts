import type { FastifyInstance } from "fastify";
import { buildTestServer } from "../rest/helpers/buildTestServer";
import { mockUser } from "../rest/helpers/fixtures";
import { requireAdmin } from "../../../src/server/auth/requireAuth";
import { db } from "../../../src/server/db/connection";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("../../../src/server/db/connection", () => ({
    db: {
        select: jest.fn()
    }
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockSelect = db.select as jest.Mock;

const registerDummyAdminRoute = (app: FastifyInstance) => {
    app.get("/test-admin", { preHandler: requireAdmin }, async () => ({ ok: true }));
};

const setupSelectChain = (rows: { isAdmin: boolean }[]) => {
    mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(rows)
        })
    });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("requireAdmin", () => {
    let unauthServer: FastifyInstance;
    let authServer: FastifyInstance;

    beforeAll(async () => {
        unauthServer = await buildTestServer(registerDummyAdminRoute);
        authServer = await buildTestServer(registerDummyAdminRoute, mockUser);
    });

    afterAll(async () => {
        await unauthServer.close();
        await authServer.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns 401 when not authenticated", async () => {
        const res = await unauthServer.inject({ method: "GET", url: "/test-admin" });
        expect(res.statusCode).toBe(401);
        expect(mockSelect).not.toHaveBeenCalled();
    });

    it("returns 403 when DB returns isAdmin: false", async () => {
        setupSelectChain([{ isAdmin: false }]);

        const res = await authServer.inject({ method: "GET", url: "/test-admin" });
        expect(res.statusCode).toBe(403);
        expect(res.json()).toMatchObject({ error: "Admin access required" });
    });

    it("returns 403 when user is not found in DB (empty result)", async () => {
        setupSelectChain([]);

        const res = await authServer.inject({ method: "GET", url: "/test-admin" });
        expect(res.statusCode).toBe(403);
        expect(res.json()).toMatchObject({ error: "Admin access required" });
    });

    it("allows request when DB confirms isAdmin: true (regardless of session value)", async () => {
        // mockUser has isAdmin: false in session — only the DB row should matter
        setupSelectChain([{ isAdmin: true }]);

        const res = await authServer.inject({ method: "GET", url: "/test-admin" });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ ok: true });
    });

    it("queries DB with the authenticated user's ID", async () => {
        setupSelectChain([{ isAdmin: true }]);

        await authServer.inject({ method: "GET", url: "/test-admin" });

        expect(mockSelect).toHaveBeenCalledTimes(1);
        const whereCall = mockSelect.mock.results[0].value.from.mock.results[0].value.where;
        expect(whereCall).toHaveBeenCalledTimes(1);
    });
});
