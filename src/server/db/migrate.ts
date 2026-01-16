import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './connection.js';

export const runMigrations = async (): Promise<void> => {
    console.log('Running database migrations...');
    await migrate(db, { migrationsFolder: './src/server/db/migrations' });
    console.log('Migrations completed.');
};
