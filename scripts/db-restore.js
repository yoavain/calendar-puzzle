#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { describeTarget, ENVIRONMENTS, restoreCommand, TARGETS } from "./db-target.mjs";

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
    console.error("Usage: node --env-file=.env scripts/db-restore.js --env <dev|production> --date YYYY-MM-DD [--target <docker|proxmox>]");
    console.error("  --env <dev|production>      Target environment");
    console.error("  --date <YYYY-MM-DD>         Backup date to restore");
    console.error("  --target <docker|proxmox>   Where the database runs (default: docker)");
    console.error("  --from <dev|production>     Environment the backup came FROM (default: same as --env)");
    process.exit(1);
};

const main = async () => {
    let values;
    try {
        ({ values } = parseArgs({
            options: {
                env: { type: "string", short: "e" },
                date: { type: "string", short: "d" },
                target: { type: "string", short: "t", default: "docker" },
                from: { type: "string", short: "f" }
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

    if (!env || !ENVIRONMENTS.includes(env)) {
        printUsageAndExit();
    }

    const target = values.target;
    if (!TARGETS.includes(target)) {
        console.error(`Error: --target must be one of ${TARGETS.join(", ")}`);
        printUsageAndExit();
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.error("Error: --date must be in YYYY-MM-DD format");
        process.exit(1);
    }

    // Backup filenames carry the environment the dump came FROM. A cross-environment
    // restore (a production dump into a fresh container) must name that source, or the
    // filename is derived from the destination and the file is never found.
    const sourceEnv = values.from || env;
    if (!ENVIRONMENTS.includes(sourceEnv)) {
        console.error(`Error: --from must be one of ${ENVIRONMENTS.join(", ")}`);
        printUsageAndExit();
    }

    // The two cross-environment directions are not equally valid.
    //
    // production -> dev is legitimate: it seeds a fresh container with real data, and
    // it is how the migration itself is rehearsed.
    //
    // dev -> production only ever destroys real data with test data. There is no case
    // where it is the intended action, so it is refused here rather than guarded by
    // the Y prompt. A prompt is not protection at the moment someone is tired and
    // retyping a command that nearly worked.
    if (sourceEnv === "dev" && env === "production") {
        console.error("");
        console.error("REFUSED: restoring DEV data into the PRODUCTION database.");
        console.error("");
        console.error("  This direction is never correct. It replaces real user data with test data.");
        console.error("  There is deliberately no override flag.");
        console.error("");
        console.error("  To seed a container from real data, restore the other way:");
        console.error(`    --env dev --from production --date ${date}`);
        console.error("");
        process.exit(1);
    }

    const backupDir = getEnvVar("CALENDAR_PUZZLE_DB_BACKUP_PATH");
    const filename = `${date}-${sourceEnv}.sql`;
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
    console.log(`  Destination: ${describeTarget(target, env)}`);
    console.log(`  Source:      ${filepath}`);
    console.log(`  Size:        ${sizeKB} KB`);
    if (sourceEnv !== env) {
        console.log("");
        console.log(`  !! CROSS-ENVIRONMENT: ${sourceEnv.toUpperCase()} data into the ${env.toUpperCase()} database !!`);
    }
    console.log("");

    const answer = await prompt("Type Y to proceed, anything else to abort: ");
    if (answer.toLowerCase() !== "y") {
        console.log("Aborted.");
        process.exit(0);
    }

    console.log("");
    console.log("Restoring database...");

    const { command, args } = restoreCommand(target, env);
    const psql = spawn(command, args, {
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
    if (err.isConfigError) {
        console.error(`\n${err.message}\n`);
    }
    else {
        console.error("Unexpected error:", err);
    }
    process.exit(1);
});
