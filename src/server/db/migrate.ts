import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { FastifyBaseLogger } from "fastify";
import pg from "pg";
import { config } from "../config.js";

export const runMigrations = async (log: FastifyBaseLogger): Promise<void> => {
    // Not the app pool: its query timeout must not cut off a long migration. Startup is not urgent, so the
    // connection gets longer than in the app. Without a limit, a frozen database hangs the start for good.
    const pool = new pg.Pool({ connectionString: config.database.url as string, connectionTimeoutMillis: 10_000 });
    pool.on("error", (error) => log.error({ reason: error.message }, "[Migrations] Idle database connection error"));

    try {
        log.info("[Migrations] Running database migrations");
        await migrate(drizzle(pool), { migrationsFolder: "./src/server/db/migrations" });
        log.info("[Migrations] Completed");
    }
    catch (err) {
        log.error(err, "[Migrations] Migration error");
        throw err;
    }
    finally {
        await pool.end();
    }
};
