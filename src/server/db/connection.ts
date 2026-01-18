import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import { config } from "../config.js";

const pool = new pg.Pool({
    connectionString: config.database.url as string
});

export const db = drizzle(pool, { schema });
