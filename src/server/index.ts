import { buildApp } from "./app.js";
import { runMigrations } from "./db/migrate.js";
import { config, validateConfig } from "./config.js";

const start = async () => {
    // Validate environment variables before doing anything else
    validateConfig();

    const app = await buildApp();
    const log = app.log.child({});
    
    log.info("[Server] Starting calendar-puzzle server");
    
    // Run database migrations before starting the server
    await runMigrations(log);

    try {
        await app.listen({ port: config.server.port, host: config.server.host });
        log.info({ host: config.server.host, port: config.server.port }, "[Server] Listening");
    }
    catch (err) {
        log.error(err, "[Server] Failed to start");
        process.exit(1);
    }
};

start();
