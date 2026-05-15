#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

const getEnvVar = (name) => {
    const value = process.env[name];
    if (!value) {
        console.error(`Error: ${name} is not set.`);
        process.exit(1);
    }
    return value;
};

const prompt = (question) => {
    return new Promise((resolve) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

const printUsageAndExit = () => {
    console.error("Usage: node --env-file=.env scripts/db-restore.js --env <dev|production> --date YYYY-MM-DD");
    console.error("  --env <dev|production>      Target environment");
    console.error("  --date <YYYY-MM-DD>         Backup date to restore");
    process.exit(1);
};

const main = async () => {
    let values;
    try {
        ({ values } = parseArgs({
            options: {
                env: { type: "string", short: "e" },
                date: { type: "string", short: "d" }
            },
            strict: true
        }));
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        printUsageAndExit();
    }

    const env = values.env;
    const date = values.date;

    if (!env || !["dev", "production"].includes(env)) {
        printUsageAndExit();
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.error("Error: --date must be in YYYY-MM-DD format");
        process.exit(1);
    }

    const backupDir = getEnvVar("CALENDAR_PUZZLE_DB_BACKUP_PATH");
    const containerName = `calendar-puzzle-${env}-postgres-1`;
    const filename = `${date}-${env}.sql`;
    const filepath = join(backupDir, filename);

    if (!existsSync(filepath)) {
        console.error(`Error: backup file not found: ${filepath}`);
        process.exit(1);
    }

    const stat = statSync(filepath);
    if (stat.size === 0) {
        console.error(`Error: backup file is empty: ${filepath}`);
        process.exit(1);
    }

    const sizeKB = (stat.size / 1024).toFixed(1);
    console.log("");
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log(
        `║  !!! DESTRUCTIVE: this will OVERWRITE the ${env.toUpperCase()} database !!!${" ".repeat(Math.max(0, 16 - env.length))}║`
    );
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`  Environment: ${env}`);
    console.log(`  Container:   ${containerName}`);
    console.log(`  Source:      ${filepath}`);
    console.log(`  Size:        ${sizeKB} KB`);
    console.log("");

    const answer = await prompt("Type Y to proceed, anything else to abort: ");
    if (answer.toLowerCase() !== "y") {
        console.log("Aborted.");
        process.exit(0);
    }

    console.log("");
    console.log("Restoring database...");

    const psql = spawn("docker", ["exec", "-i", containerName, "psql", "-U", "puzzle", "puzzle"], {
        stdio: ["pipe", "inherit", "inherit"]
    });

    const readStream = createReadStream(filepath);
    readStream.pipe(psql.stdin);

    return new Promise((resolve) => {
        psql.on("close", (code) => {
            if (code !== 0) {
                console.error(`Error: psql exited with code ${code}`);
                process.exit(1);
            }
            console.log("✓ Restore complete");
            resolve();
        });

        psql.on("error", (err) => {
            console.error(`Error spawning psql: ${err.message}`);
            process.exit(1);
        });
    });
};

main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
