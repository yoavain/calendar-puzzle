import type { FastifyInstance } from "fastify";
import type { QueryConfig } from "pg";
import { pool } from "../db/connection.js";
import { API_HEALTH } from "../../common/restPaths.js";
import type { HealthResponse } from "../../common/restTypes.js";

// One time for good and failed results. A time near the monitor interval can delay an alert by a full interval.
const CACHE_MS = 10_000;
const QUERY_TIMEOUT_MS = 2000;

// pg reads query_timeout from a query config, but @types/pg does not declare it there.
const HEALTH_QUERY: QueryConfig & { query_timeout: number } = { text: "SELECT 1", query_timeout: QUERY_TIMEOUT_MS };

export interface HealthDependencies {
    checkDatabase?: () => Promise<unknown>;
    now?: () => number;
}

export const registerHealthRoutes = (app: FastifyInstance, dependencies: HealthDependencies = {}): void => {
    const { checkDatabase = () => pool.query(HEALTH_QUERY), now = Date.now } = dependencies;

    let cached: { healthy: boolean; expiresAt: number } | undefined;
    let inFlight: Promise<boolean> | undefined;
    let wasHealthy = true;

    // Without a listener, an error on an idle connection is an unhandled "error" event, which stops the process.
    // Log only these two fields. pg-pool puts the whole client on the error, with its connection details.
    pool.on("error", (error: Error & { code?: string }) => {
        app.log.error({ reason: error.message, code: error.code }, "[Health] Idle database connection error");
    });

    // Logs only a change of state, so public calls cannot flood the journal.
    const runCheck = async (): Promise<boolean> => {
        let healthy = true;
        try {
            await checkDatabase();
            if (!wasHealthy) {
                app.log.info("[Health] Database check recovered");
            }
        }
        catch (error) {
            healthy = false;
            if (wasHealthy) {
                app.log.error(error, "[Health] Database check failed");
            }
        }

        wasHealthy = healthy;
        cached = { healthy, expiresAt: now() + CACHE_MS };
        return healthy;
    };

    // Requests that arrive during a check share it.
    const isDatabaseHealthy = (): Promise<boolean> => {
        if (cached && now() < cached.expiresAt) {
            return Promise.resolve(cached.healthy);
        }

        inFlight ??= runCheck().finally(() => {
            inFlight = undefined;
        });
        return inFlight;
    };

    app.get<{ Reply: HealthResponse }>(API_HEALTH, async (_request, reply) => {
        const healthy = await isDatabaseHealthy();

        // The failure detail stays in the log, because the endpoint is public.
        return reply
            .header("Cache-Control", "no-store")
            .code(healthy ? 200 : 503)
            .send({ status: healthy ? "ok" : "error" });
    });
};
