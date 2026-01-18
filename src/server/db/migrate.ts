import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { FastifyBaseLogger } from 'fastify';
import { db } from './connection.js';

export const runMigrations = async (log: FastifyBaseLogger): Promise<void> => {
    try {
        log.info('[Migrations] Running database migrations');
        await migrate(db, { migrationsFolder: './src/server/db/migrations' });
        log.info('[Migrations] Completed');
    } catch (err) {
        log.error(err, '[Migrations] Migration error');
        throw err;
    }
};
