/**
 * Resolves how the backup and restore scripts reach a database.
 *
 * Two targets exist. `docker` reaches the Postgres container on this host.
 * `proxmox` reaches the Postgres installed on the LXC over SSH.
 *
 * The migration itself is a backup on one target and a restore on the other,
 * so both scripts must accept both.
 */

import { ENVIRONMENTS, sshDestination, sshOptions } from "./proxmox-hosts.mjs";

export { ENVIRONMENTS };

export const TARGETS = ["docker", "proxmox"];

const DB_USER = "puzzle";
const DB_NAME = "puzzle";

/**
 * Force a TCP connection on the LXC. Without -h, libpq uses the Unix socket, and
 * Debian's default pg_hba maps that to peer authentication: the OS user `deploy`
 * would have to BE the `puzzle` role, which it is not. TCP to loopback takes the
 * password path instead.
 *
 * The Docker branches must not get this. The official Postgres image trusts local
 * connections, which is why that side already works.
 */
const PG_HOST_ARGS = ["-h", "127.0.0.1"];

/**
 * psql continues after an error by default and still exits 0, so a partial restore
 * looks like a successful one. ON_ERROR_STOP makes it stop and report.
 *
 * --single-transaction is what makes that safe. Without it, stopping at the first
 * error leaves a half-restored database, which is worse than either finishing or
 * not starting. With it the restore is all-or-nothing.
 *
 * Together these turn "restoring a dump onto tables that already exist" from a wall
 * of ignored "already exists" errors into one clean, loud failure.
 */
const PSQL_RESTORE_ARGS = ["-v", "ON_ERROR_STOP=1", "--single-transaction"];

/**
 * Make the dump able to land on a populated database.
 *
 * A plain pg_dump emits CREATE but never DROP, so it only restores into an empty
 * database. That contradicts what the restore script's own banner promises, and it
 * is why restoring twice fails on "schema drizzle already exists".
 *
 * --clean emits DROP for every object it is about to create; --if-exists keeps those
 * DROPs quiet when the object is absent, so one dump serves both an empty target and
 * a populated one. Combined with --single-transaction on the restore, the drop and
 * the reload are one atomic step: a failure leaves the old data in place.
 */
const PG_DUMP_ARGS = ["--clean", "--if-exists"];

const dockerContainer = (env) => `calendar-puzzle-${env}-postgres-1`;

/** One line naming where the data comes from or goes to, for the console. */
export const describeTarget = (target, env) =>
    target === "docker" ? `docker container ${dockerContainer(env)}` : `ssh ${sshDestination(env)}`;

/** Command that writes a plain-SQL dump to stdout. */
export const dumpCommand = (target, env) => {
    if (target === "docker") {
        return { command: "docker", args: ["exec", dockerContainer(env), "pg_dump", ...PG_DUMP_ARGS, "-U", DB_USER, DB_NAME] };
    }
    return { command: "ssh", args: [...sshOptions(), sshDestination(env), "pg_dump", ...PG_DUMP_ARGS, ...PG_HOST_ARGS, "-U", DB_USER, DB_NAME] };
};

/** Command that reads a plain-SQL dump from stdin. */
export const restoreCommand = (target, env) => {
    if (target === "docker") {
        return { command: "docker", args: ["exec", "-i", dockerContainer(env), "psql", ...PSQL_RESTORE_ARGS, "-U", DB_USER, DB_NAME] };
    }
    return { command: "ssh", args: [...sshOptions(), sshDestination(env), "psql", ...PSQL_RESTORE_ARGS, ...PG_HOST_ARGS, "-U", DB_USER, DB_NAME] };
};
