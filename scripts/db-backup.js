#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const getEnvVar = (name) => {
    const value = process.env[name];
    if (!value) {
        console.error(`Error: ${name} is not set.`);
        process.exit(1);
    }
    return value;
};

const formatDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const printUsageAndExit = () => {
    console.error("Usage: node --env-file=.env scripts/db-backup.js --env <dev|production>");
    console.error("  --env <dev|production>  Target environment");
    process.exit(1);
};

const main = async () => {
    let values;
    try {
        ({ values } = parseArgs({
            options: {
                env: { type: "string", short: "e" }
            },
            strict: true
        }));
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        printUsageAndExit();
    }

    const env = values.env;
    if (!env || !["dev", "production"].includes(env)) {
        printUsageAndExit();
    }

    const backupDir = getEnvVar("CALENDAR_PUZZLE_DB_BACKUP_PATH");
    const date = formatDate();
    const containerName = `calendar-puzzle-${env}-postgres-1`;
    const filename = `${date}-${env}.sql`;
    const filepath = join(backupDir, filename);

    console.log(`[${date}] Backing up ${env} database...`);
    console.log(`  Container: ${containerName}`);
    console.log(`  Output:    ${filepath}`);

    try {
        if (!existsSync(backupDir)) {
            mkdirSync(backupDir, { recursive: true });
            console.log(`  Created directory: ${backupDir}`);
        }
    }
    catch (err) {
        console.error(`Error creating backup directory: ${err.message}`);
        process.exit(1);
    }

    const pg_dump = spawn("docker", ["exec", containerName, "pg_dump", "-U", "puzzle", "puzzle"], {
        stdio: ["inherit", "pipe", "pipe"]
    });

    const writeStream = createWriteStream(filepath);
    const startTime = Date.now();

    pg_dump.stdout.pipe(writeStream);

    return new Promise((resolve) => {
        pg_dump.on("close", (code) => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

            if (code !== 0) {
                console.error(`Error: pg_dump exited with code ${code}`);
                if (existsSync(filepath)) {
                    try {
                        unlinkSync(filepath);
                    }
                    catch {
                        // ignored
                    }
                }
                process.exit(1);
            }

            writeStream.on("finish", () => {
                const stat = statSync(filepath);
                if (stat.size === 0) {
                    console.error("Error: backup file is empty");
                    unlinkSync(filepath);
                    process.exit(1);
                }
                const sizeKB = (stat.size / 1024).toFixed(1);
                console.log(`✓ Backup complete (${sizeKB} KB, ${elapsed}s)`);
                resolve();
            });
        });

        pg_dump.on("error", (err) => {
            console.error(`Error spawning pg_dump: ${err.message}`);
            process.exit(1);
        });

        pg_dump.stderr.on("data", (data) => {
            console.error(`[pg_dump stderr] ${data}`);
        });
    });
};

main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
