/* eslint-disable no-console */
import pg from "pg";

/**
 * DB utility CLI.
 * Usage: node scripts/db-utils.js <command> [flags]
 *
 * Requires DATABASE_URL env var.
 */

const printUsage = () => {
    console.log("Usage: node scripts/db-utils.js <command> [flags]");
    console.log("");
    console.log("Commands:");
    console.log("  hint-list  --id <id>                 List dates where the user requested a hint");
    console.log("  hint-clear --id <id> --date <MM-DD>  Clear a recorded hint for a user on a date");
};

const withPool = async (fn) => {
    if (!process.env.DATABASE_URL) {
        console.error("Error: DATABASE_URL env var is not set.");
        process.exit(1);
    }
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        await fn(pool);
    }
    finally {
        await pool.end();
    }
};

const parseFlags = (args, allowed) => {
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg.startsWith("--")) {
            throw new Error(`Unexpected argument: ${arg}`);
        }
        const name = arg.slice(2);
        if (!allowed.includes(name)) {
            throw new Error(`Unknown flag: --${name}`);
        }
        const value = args[i + 1];
        if (value === undefined || value.startsWith("--")) {
            throw new Error(`Flag --${name} requires a value.`);
        }
        result[name] = value;
        i++;
    }
    return result;
};

const formatDate = (month, day) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${mm}-${dd}`;
};

const parseDate = (dateStr) => {
    const match = /^(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) {
        throw new Error(`Invalid date "${dateStr}". Expected MM-DD.`);
    }
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    if (month < 1 || month > 12) {
        throw new Error(`Invalid month in "${dateStr}". Expected 01-12.`);
    }
    if (day < 1 || day > 31) {
        throw new Error(`Invalid day in "${dateStr}". Expected 01-31.`);
    }
    return { month: month - 1, day };
};

const listHints = async (userId) => {
    await withPool(async (pool) => {
        const { rows } = await pool.query(
            `SELECT month, day
             FROM user_puzzle_stats
             WHERE user_id = $1 AND hint_used = true
             ORDER BY month, day`,
            [userId]
        );

        if (rows.length === 0) {
            console.log(`No hints used by user ${userId}.`);
            return;
        }

        console.log(`Hints used by user ${userId} (${rows.length}):`);
        for (const { month, day } of rows) {
            console.log(`  ${formatDate(month, day)}`);
        }
    });
};

const clearHint = async (userId, month, day) => {
    await withPool(async (pool) => {
        const dateLabel = formatDate(month, day);

        const { rows } = await pool.query(
            `SELECT hint_used
             FROM user_puzzle_stats
             WHERE user_id = $1 AND month = $2 AND day = $3`,
            [userId, month, day]
        );

        if (rows.length === 0) {
            console.log(`No stats recorded for user ${userId} on ${dateLabel}. Nothing to clear.`);
            return;
        }

        if (rows[0].hint_used === false) {
            console.log(`Hint is already cleared for user ${userId} on ${dateLabel}. Nothing to do.`);
            return;
        }

        await pool.query(
            `UPDATE user_puzzle_stats
             SET hint_used = false
             WHERE user_id = $1 AND month = $2 AND day = $3`,
            [userId, month, day]
        );
        console.log(`Cleared hint for user ${userId} on ${dateLabel}.`);
    });
};

const commands = {
    "hint-list": {
        allowedFlags: ["id"],
        requiredFlags: ["id"],
        usage: "--id <id>",
        run: ({ id }) => listHints(id)
    },
    "hint-clear": {
        allowedFlags: ["id", "date"],
        requiredFlags: ["id", "date"],
        usage: "--id <id> --date <MM-DD>",
        run: ({ id, date }) => {
            const { month, day } = parseDate(date);
            return clearHint(id, month, day);
        }
    }
};

const main = async () => {
    const [commandName, ...args] = process.argv.slice(2);

    if (!commandName) {
        printUsage();
        process.exit(1);
    }

    const command = commands[commandName];
    if (!command) {
        console.error(`Unknown command: ${commandName}`);
        printUsage();
        process.exit(1);
    }

    let flags;
    try {
        flags = parseFlags(args, command.allowedFlags);
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        console.error(`Usage: node scripts/db-utils.js ${commandName} ${command.usage}`);
        process.exit(1);
    }

    const missing = command.requiredFlags.filter((name) => flags[name] === undefined);
    if (missing.length > 0) {
        console.error(`Error: \`${commandName}\` requires ${missing.map((n) => `--${n}`).join(", ")}.`);
        console.error(`Usage: node scripts/db-utils.js ${commandName} ${command.usage}`);
        process.exit(1);
    }

    await command.run(flags);
};

main().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
});
