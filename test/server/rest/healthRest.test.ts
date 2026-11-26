import Fastify, { type FastifyInstance } from "fastify";
import { registerHealthRoutes, type HealthDependencies } from "../../../src/server/rest/healthRest";
import { pool } from "../../../src/server/db/connection";

jest.mock("../../../src/server/db/connection", () => ({
    pool: {
        query: jest.fn(),
        on: jest.fn()
    }
}));

const mockQuery = pool.query as unknown as jest.Mock;
const mockOn = pool.on as unknown as jest.Mock;

describe("healthRest", () => {
    let server: FastifyInstance;
    let time: number;
    let logError: jest.SpyInstance;
    let logInfo: jest.SpyInstance;

    const buildServer = async (dependencies: HealthDependencies = {}) => {
        server = Fastify({ logger: false });
        logError = jest.spyOn(server.log, "error");
        logInfo = jest.spyOn(server.log, "info");
        registerHealthRoutes(server, { now: () => time, ...dependencies });
        await server.ready();
    };

    const getHealth = () => server.inject({ method: "GET", url: "/api/health" });

    beforeEach(() => {
        jest.clearAllMocks();
        time = 1_000_000;
        mockQuery.mockResolvedValue({ rows: [] });
    });

    afterEach(async () => {
        await server.close();
    });

    it("returns 200 when the database answers, with a query timeout", async () => {
        await buildServer();

        const res = await getHealth();

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ status: "ok" });
        expect(res.headers["cache-control"]).toBe("no-store");
        expect(mockQuery).toHaveBeenCalledWith({ text: "SELECT 1", query_timeout: 2000 });
    });

    it("returns 503 without error detail when the query fails", async () => {
        mockQuery.mockRejectedValue(new Error("Query read timeout"));
        await buildServer();

        const res = await getHealth();

        expect(res.statusCode).toBe(503);
        expect(res.json()).toEqual({ status: "error" });
        expect(res.headers["cache-control"]).toBe("no-store");
    });

    it.each([
        ["good", () => mockQuery.mockResolvedValue({ rows: [] }), 200],
        ["failed", () => mockQuery.mockRejectedValue(new Error("db down")), 503]
    ])("caches a %s result for 10 seconds", async (_name, arrange, status) => {
        arrange();
        await buildServer();
        await getHealth();

        time += 9999;
        expect((await getHealth()).statusCode).toBe(status);
        expect(mockQuery).toHaveBeenCalledTimes(1);

        time += 1;
        await getHealth();
        expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("shares one check between concurrent requests", async () => {
        let finish: () => void = () => {};
        const checkDatabase = jest.fn(() => new Promise<void>((resolve) => {
            finish = resolve;
        }));
        await buildServer({ checkDatabase });

        const first = getHealth();
        const second = getHealth();
        // inject() starts on "then", so both requests must be started before the check can finish.
        const both = Promise.all([first, second]);
        await new Promise((resolve) => setTimeout(resolve, 20));
        finish();
        const responses = await both;

        expect(responses.map((res) => res.statusCode)).toEqual([200, 200]);
        expect(checkDatabase).toHaveBeenCalledTimes(1);
    });

    it("logs only when the state changes, with the error", async () => {
        const failure = new Error("Connection terminated due to connection timeout");
        await buildServer();
        // Fastify writes its own request lines to the same logger.
        const healthInfo = () => logInfo.mock.calls.filter(([message]) => String(message).startsWith("[Health]"));
        const checkAfterExpiry = async () => {
            time += 10_000;
            await getHealth();
        };

        await checkAfterExpiry();
        expect(healthInfo()).toEqual([]);

        mockQuery.mockRejectedValue(failure);
        await checkAfterExpiry();
        await checkAfterExpiry();
        expect(logError).toHaveBeenCalledTimes(1);
        expect(logError).toHaveBeenCalledWith(failure, "[Health] Database check failed");

        mockQuery.mockResolvedValue({ rows: [] });
        await checkAfterExpiry();
        await checkAfterExpiry();
        expect(healthInfo()).toEqual([["[Health] Database check recovered"]]);
    });

    it("logs an error on an idle pool connection without the client object", async () => {
        await buildServer();
        const [event, listener] = mockOn.mock.calls[0] as [string, (error: Error) => void];
        const failure = Object.assign(new Error("terminating connection"), { code: "57P01", client: { user: "puzzle" } });

        listener(failure);

        expect(event).toBe("error");
        expect(logError).toHaveBeenCalledWith({ reason: "terminating connection", code: "57P01" }, "[Health] Idle database connection error");
    });
});
