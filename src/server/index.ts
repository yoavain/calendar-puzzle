import { buildApp } from './app.js';
import { runMigrations } from './db/migrate.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
    // Run database migrations before starting the server
    await runMigrations();

    const app = buildApp();

    try {
        await app.listen({ port: PORT, host: HOST });
        console.log(`Server listening on http://${HOST}:${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
