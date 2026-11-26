import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import { config } from "../config.js";

export const pool = new pg.Pool({
    connectionString: config.database.url as string,
    // The default waits forever. The health check and every route must fail on a database that does not answer.
    connectionTimeoutMillis: 2000,
    // A stalled database must not hang a request. Migrations use their own connection, without this limit.
    query_timeout: 5000
});

export const db = drizzle(pool, { schema });
