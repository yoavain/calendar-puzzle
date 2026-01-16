import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { FastifyBaseLogger } from 'fastify';
import { db } from './connection.js';

export const runMigrations = async (log: FastifyBaseLogger): Promise<void> => {
    try {
        console.log('DEBUG: runMigrations called, log type:', typeof log, 'log.info type:', typeof log?.info);
        log.info('[Migrations] Running database migrations');
        await migrate(db, { migrationsFolder: './src/server/db/migrations' });
        log.info('[Migrations] Completed');
    } catch (err) {
        console.error('DEBUG: Migration error:', err);
        throw err;
    }
};
