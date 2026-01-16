import { buildApp } from './app.js';
import { runMigrations } from './db/migrate.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
    const app = buildApp();
    const log = app.log.child({});
    
    log.info('[Server] Starting calendar-puzzle server');
    
    // Run database migrations before starting the server
    await runMigrations(log);

    try {
        await app.listen({ port: PORT, host: HOST });
        log.info({ host: HOST, port: PORT }, '[Server] Listening');
    } catch (err) {
        log.error(err, '[Server] Failed to start');
        process.exit(1);
    }
};

start();
