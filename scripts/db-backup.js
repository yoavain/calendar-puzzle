#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { describeTarget, dumpCommand, ENVIRONMENTS, TARGETS } from "./db-target.mjs";

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
    console.error("Usage: node --env-file=.env scripts/db-backup.js --env <dev|production> [--target <docker|proxmox>]");
    console.error("  --env <dev|production>      Target environment");
    console.error("  --target <docker|proxmox>   Where the database runs (default: docker)");
    process.exit(1);
};

const main = async () => {
    let values;
    try {
        ({ values } = parseArgs({
            options: {
                env: { type: "string", short: "e" },
                target: { type: "string", short: "t", default: "docker" }
            },
            strict: true
        }));
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        printUsageAndExit();
    }

    const env = values.env;
    if (!env || !ENVIRONMENTS.includes(env)) {
        printUsageAndExit();
    }

    const target = values.target;
    if (!TARGETS.includes(target)) {
        console.error(`Error: --target must be one of ${TARGETS.join(", ")}`);
        printUsageAndExit();
    }

    const backupDir = getEnvVar("CALENDAR_PUZZLE_DB_BACKUP_PATH");
    const date = formatDate();
    const filename = `${date}-${env}.sql`;
    const filepath = join(backupDir, filename);

    console.log(`[${date}] Backing up ${env} database...`);
    console.log(`  Source:    ${describeTarget(target, env)}`);
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

    const { command, args } = dumpCommand(target, env);
    const pg_dump = spawn(command, args, {
        stdio: ["inherit", "pipe", "pipe"]
    });

    const writeStream = createWriteStream(filepath);
    const startTime = Date.now();

    pg_dump.stderr.on("data", (data) => {
        console.error(`[pg_dump stderr] ${data}`);
    });

    // Wait for both the child to exit and the file to flush. The stream finishes
    // before the child closes, so a listener attached inside "close" never fires.
    const exited = new Promise((resolve, reject) => {
        pg_dump.on("close", resolve);
        pg_dump.on("error", (err) => reject(new Error(`spawning pg_dump: ${err.message}`)));
    });
    const flushed = new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", (err) => reject(new Error(`writing ${filepath}: ${err.message}`)));
    });

    pg_dump.stdout.pipe(writeStream);

    const discardFile = () => {
        if (!existsSync(filepath)) {
            return;
        }
        try {
            unlinkSync(filepath);
        }
        catch {
            // ignored
        }
    };

    let code;
    try {
        [code] = await Promise.all([exited, flushed]);
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        discardFile();
        process.exit(1);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    if (code !== 0) {
        console.error(`Error: pg_dump exited with code ${code}`);
        discardFile();
        process.exit(1);
    }

    if (statSync(filepath).size === 0) {
        console.error("Error: backup file is empty");
        discardFile();
        process.exit(1);
    }

    const sizeKB = (statSync(filepath).size / 1024).toFixed(1);
    console.log(`✓ Backup complete (${sizeKB} KB, ${elapsed}s)`);
};

main().catch((err) => {
    if (err.isConfigError) {
        console.error(`\n${err.message}\n`);
    }
    else {
        console.error("Unexpected error:", err);
    }
    process.exit(1);
});
