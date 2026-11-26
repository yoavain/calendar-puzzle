/**
 * The server side of an outage. Jest cannot load the real passport plugins, so the deserializer
 * is called directly. Passport signs a user out when it throws or returns a falsy value.
 */
import type { FastifyInstance, FastifyRequest } from "fastify";
import Fastify from "fastify";
import { deserializeSessionUser } from "../../../src/server/auth/passport";
import { requireDatabaseUser, requireSameUser } from "../../../src/server/auth/requireAuth";
import { errorHandler } from "../../../src/server/utils/errorHandler";
import { db } from "../../../src/server/db/connection";
import { mockUser } from "../rest/helpers/fixtures";

jest.mock("@fastify/passport", () => ({ __esModule: true, default: {} }));

jest.mock("../../../src/server/db/connection", () => ({
    db: { select: jest.fn() }
}));

jest.mock("../../../src/server/config", () => ({
    config: { google: { clientId: "id", clientSecret: "secret" } }
}));

const mockSelect = db.select as jest.Mock;
const lookupReturns = (rows: unknown[]) => {
    mockSelect.mockReturnValue({ from: () => ({ where: () => Promise.resolve(rows) }) });
};
const lookupFails = () => {
    mockSelect.mockImplementation(() => ({ from: () => ({ where: () => Promise.reject(new Error("db down")) }) }));
};

const sessionUser = { ...mockUser, isAdmin: true };
const log = { error: jest.fn(), info: jest.fn() };
const requestFor = (route: string | undefined) => ({ routeOptions: { url: route }, log } as unknown as FastifyRequest);

describe("deserializeSessionUser", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("keeps the user, without admin rights, when the lookup fails", async () => {
        lookupFails();
        const request = requestFor("/api/auth/me");

        await expect(deserializeSessionUser(sessionUser, request)).resolves.toEqual({ ...sessionUser, isAdmin: false });
        expect(request.databaseUnavailable).toBe(true);
    });

    it("logs a change of state only", async () => {
        lookupReturns([{ isAdmin: false }]);
        await deserializeSessionUser(sessionUser, requestFor("/api/auth/me"));
        jest.clearAllMocks();

        lookupFails();
        await deserializeSessionUser(sessionUser, requestFor("/api/auth/me"));
        await deserializeSessionUser(sessionUser, requestFor("/api/auth/me"));
        expect(log.error).toHaveBeenCalledTimes(1);

        lookupReturns([{ isAdmin: false }]);
        await deserializeSessionUser(sessionUser, requestFor("/api/auth/me"));
        expect(log.info).toHaveBeenCalledWith("[Auth] User lookup recovered");
    });

    it("takes the admin right from the database", async () => {
        lookupReturns([{ isAdmin: true }]);
        await expect(deserializeSessionUser({ ...sessionUser, isAdmin: false }, requestFor("/api/auth/me")))
            .resolves.toEqual(sessionUser);
    });

    it("signs out a user who is not in the database", async () => {
        lookupReturns([]);
        await expect(deserializeSessionUser(sessionUser, requestFor("/api/auth/me"))).resolves.toBeNull();
    });

    it.each(["/", "/client/*", "/api/health", undefined])("does not query the database for the route %s", async (route) => {
        lookupFails();

        await expect(deserializeSessionUser(sessionUser, requestFor(route))).resolves.toEqual({ ...sessionUser, isAdmin: false });
        expect(mockSelect).not.toHaveBeenCalled();
    });
});

describe("a stored save", () => {
    let server: FastifyInstance;

    beforeAll(async () => {
        server = Fastify({ logger: false });
        server.addHook("preHandler", async (request) => {
            request.user = mockUser;
        });
        server.post("/api/save", { preHandler: requireSameUser }, async () => "saved");
        await server.ready();
    });

    afterAll(async () => {
        await server.close();
    });

    it.each([
        [{ "x-expected-user": mockUser.id }, 200],
        [{}, 200],
        [{ "x-expected-user": "someone-else" }, 409]
    ])("with headers %j answers %i", async (headers: Record<string, string>, status) => {
        const res = await server.inject({ method: "POST", url: "/api/save", headers });
        expect(res.statusCode).toBe(status);
    });
});

describe("sign-in errors", () => {
    let server: FastifyInstance;
    let thrown: Record<string, unknown>;

    beforeAll(async () => {
        server = Fastify({ logger: false });
        server.setErrorHandler(errorHandler);
        server.get("/auth/google/callback", async () => {
            throw Object.assign(new Error("sign-in"), thrown);
        });
        await server.ready();
    });

    afterAll(async () => {
        await server.close();
    });

    it.each([
        [{}, "auth_unavailable"],
        [{ status: 502, code: "server_error" }, "auth_unavailable"],
        [{ status: 500, code: "invalid_grant" }, "auth_failed"],
        [{ status: 403, code: "access_denied" }, "auth_failed"],
        [{ statusCode: 429 }, "auth_failed"]
    ])("redirects %j with %s", async (error, code) => {
        thrown = error;
        const res = await server.inject("/auth/google/callback");
        expect(res.headers.location).toBe(`/?error=${code}`);
    });
});

describe("requests during an outage", () => {
    let server: FastifyInstance;

    beforeAll(async () => {
        server = Fastify({ logger: false });
        server.setErrorHandler(errorHandler);
        server.addHook("preHandler", async (request) => {
            request.user = mockUser;
            request.databaseUnavailable = true;
        });
        server.get("/api/data", { preHandler: requireDatabaseUser }, async () => "data");
        server.get("/api/broken", async () => {
            throw new Error("Failed query: select secret_sql params: u1");
        });
        server.get("/api/invalid", { schema: { querystring: { type: "object", required: ["a"], properties: { a: { type: "string" } } } } }, async () => "ok");
        server.get("/auth/google/callback", async () => {
            throw new Error("Failed query: insert");
        });
        await server.ready();
    });

    afterAll(async () => {
        await server.close();
    });

    it("answers 503 at once on a database route", async () => {
        const res = await server.inject("/api/data");

        expect(res.statusCode).toBe(503);
        expect(res.json()).toEqual({ error: "Saving is paused. Please try again later." });
    });

    it("hides the detail of a 5xx error", async () => {
        const res = await server.inject("/api/broken");

        expect(res.statusCode).toBe(500);
        expect(res.json()).toEqual({ error: "Internal Server Error" });
    });

    it("keeps the message of a 4xx error", async () => {
        const res = await server.inject("/api/invalid");

        expect(res.statusCode).toBe(400);
        expect(res.json().message).toContain("required property 'a'");
    });

    it("sends a failed sign-in back to the game", async () => {
        const res = await server.inject("/auth/google/callback");

        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe("/?error=auth_unavailable");
    });
});
