/**
 * Where the Proxmox LXC targets live, and how to reach them over SSH.
 *
 * Addresses are deliberately NOT hard coded. They describe one person's network,
 * not this project, so they come from the environment and this repository stays
 * usable by anyone. The npm scripts load them from `.env`, which is gitignored.
 *
 * See `.env.example` for the variable names.
 */

export const ENVIRONMENTS = ["dev", "production"];

/** Name of the variable that holds the address for an environment. */
const hostVar = (env) => `CALENDAR_PUZZLE_${env.toUpperCase()}_HOST`;

/**
 * Address of the LXC for an environment. Required; there is no default.
 * The error names the variable, because a missing address is a setup problem
 * rather than a bug, and the fix is one line in `.env`.
 */
export const proxmoxHost = (env) => {
    const name = hostVar(env);
    const value = process.env[name];
    if (!value) {
        const err = new Error(
            `${name} is not set. The proxmox target needs the address of the ${env} LXC.\n\n` +
            "Add it to .env, for example:\n" +
            `  ${name}=192.168.1.50\n\n` +
            "See .env.example. The :docker scripts do not need it."
        );
        // A setup problem, not a bug. The CLI scripts print this without a stack
        // trace, because the stack tells the reader nothing they can act on.
        err.isConfigError = true;
        throw err;
    }
    return value;
};

/** Unprivileged account used for deploys, backups and restores. */
export const deployUser = () => process.env.CALENDAR_PUZZLE_DEPLOY_USER || "deploy";

/** `user@host`, as ssh and scp want it. */
export const sshDestination = (env) => `${deployUser()}@${proxmoxHost(env)}`;

/**
 * Private key for the deploy account. The containers accept this key only; there
 * is no password authentication.
 */
export const sshKeyPath = () =>
    process.env.CALENDAR_PUZZLE_SSH_KEY || `${process.env.HOME || process.env.USERPROFILE}/.ssh/id_ed25519_calpuzzle`;

/** Common ssh/scp flags. Batch mode fails fast instead of prompting in a script. */
export const sshOptions = () => ["-i", sshKeyPath(), "-o", "BatchMode=yes", "-o", "ConnectTimeout=10"];

/** The port the service listens on inside the LXC. No published-port indirection here. */
export const SERVICE_PORT = 3001;

/** systemd unit name on both containers. */
export const SERVICE_NAME = "calendar-puzzle";

/** Application root on the LXC. Must match WorkingDirectory in the unit file. */
export const APP_DIR = "/opt/calendar-puzzle";
