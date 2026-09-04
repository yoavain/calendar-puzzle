#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Deploys the application to a Proxmox LXC.
 *
 * Unlike the Docker path this builds a file tree rather than an image, ships it
 * over SSH, and restarts a systemd unit rather than a Compose project.
 *
 * It deliberately ships NO secrets. `secret-key`, the two `.pem` files and the
 * environment file live on the target and are managed separately. A deploy that
 * carried them would turn every deploy into a secret-handling event.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
    APP_DIR,
    ENVIRONMENTS,
    SERVICE_NAME,
    SERVICE_PORT,
    proxmoxHost,
    sshDestination,
    sshOptions
} from "./proxmox-hosts.mjs";

/** Everything the service needs at runtime. Nothing here is secret. */
const PAYLOAD = ["dist", "build", "package.json", "package-lock.json", ".npmrc", "src/server/db/migrations"];

const REMOTE_ARCHIVE = "/tmp/calendar-puzzle-payload.tar.gz";

// npm is a .cmd shim on Windows. Node refuses to spawn a .cmd without a shell
// (the CVE-2024-27980 fix), so the npm calls opt into one. The arguments are
// fixed literals below, never interpolated input.
// Passing an args array alongside shell:true is deprecated (DEP0190), so on Windows
// the whole invocation goes as one already-safe string. These arguments are fixed
// literals defined in this file, never interpolated input.
/**
 * Windows has two tars and which one is on PATH depends on the shell.
 *
 * GNU tar (Git Bash) reads "C:\..." as host:path and tries to connect to a host
 * called "C", so it needs --force-local. bsdtar (C:\Windows\System32\tar.exe)
 * handles the drive letter natively and REJECTS --force-local outright.
 *
 * So the flag cannot be chosen from the platform alone. Ask the tar that is
 * actually on PATH whether it accepts the flag.
 */
const tarFlags = () => {
    if (process.platform !== "win32") {
        return [];
    }
    const probe = spawnSync("tar", ["--force-local", "--version"], { stdio: "ignore" });
    return probe.status === 0 ? ["--force-local"] : [];
};

const runNpm = (args) =>
    process.platform === "win32"
        ? run(`npm ${args.join(" ")}`, [], { shell: true })
        : run("npm", args);

const printUsageAndExit = () => {
    console.error("Usage: node scripts/deploy-proxmox.mjs --env <dev|production> [--skip-tests]");
    console.error("  --env <dev|production>   Target environment");
    console.error("  --skip-tests             Skip the test gate. Use only to retry a failed ship.");
    process.exit(1);
};

const step = (message) => console.log(`\n==> ${message}`);

/** Runs a command, streaming its output. Exits the process if it fails. */
const run = (command, args, { allowFailure = false, shell = false } = {}) => {
    const result = spawnSync(command, args, { stdio: "inherit", shell });
    if (result.error) {
        console.error(`Error running ${command}: ${result.error.message}`);
        process.exit(1);
    }
    if (result.status !== 0 && !allowFailure) {
        console.error(`Error: ${command} exited with code ${result.status}`);
        process.exit(1);
    }
    return result.status;
};

/**
 * Wraps a string in POSIX single quotes so the remote shell sees it as one word.
 * ssh joins its trailing arguments with spaces and hands the result to the remote
 * shell, so an unquoted script would be re-split there.
 */
const shellQuote = (value) => `'${value.split("'").join("'\\''")}'`;

/** The remote invocation, as ONE argument. A login shell is required: /opt/node/bin
 * reaches PATH through /etc/profile.d, which a non-login ssh shell never sources. */
const remoteCommand = (script) => `bash -lc ${shellQuote(script)}`;

/** Runs a command on the target through a LOGIN shell. */
const runRemote = (env, script, options) =>
    run("ssh", [...sshOptions(), sshDestination(env), remoteCommand(script)], options);

/** Captures the output of a remote command instead of streaming it. */
const captureRemote = (env, script) => {
    const result = spawnSync("ssh", [...sshOptions(), sshDestination(env), remoteCommand(script)], {
        encoding: "utf8"
    });
    return { status: result.status, stdout: (result.stdout || "").trim() };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForHealth = async (env) => {
    const url = `http://localhost:${SERVICE_PORT}/api/health`;
    const attempts = 30;
    for (let i = 1; i <= attempts; i++) {
        const { stdout } = captureRemote(env, `curl -sS -o /dev/null -w '%{http_code}' --max-time 5 ${url} || true`);
        if (stdout === "200") {
            console.log(`  healthy after ${i} attempt(s)`);
            return true;
        }
        process.stdout.write(`  attempt ${i}/${attempts}: ${stdout || "no response"}\r`);
        await sleep(1000);
    }
    console.error("");
    return false;
};

const main = async () => {
    let values;
    try {
        ({ values } = parseArgs({
            options: {
                env: { type: "string", short: "e" },
                "skip-tests": { type: "boolean", default: false }
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

    const target = sshDestination(env);
    console.log(`Deploying ${env} to ${target} (${proxmoxHost(env)})`);

    step(`Checking ${target} is reachable`);
    if (run("ssh", [...sshOptions(), target, "true"], { allowFailure: true }) !== 0) {
        console.error(`Error: cannot reach ${target}.`);
        console.error("Is the container running? A dev LXC is stopped unless in use.");
        process.exit(1);
    }

    if (values["skip-tests"]) {
        console.log("\n!!! Skipping the test gate. The Docker path never skips it. !!!");
    }
    else {
        step("Running the test gate");
        runNpm(["run", "test"]);
    }

    step("Building");
    runNpm(["run", "build"]);

    const stagingDir = mkdtempSync(join(tmpdir(), "calendar-puzzle-deploy-"));
    const archive = join(stagingDir, "payload.tar.gz");

    try {
        step("Packing the payload");
        console.log(`  ${PAYLOAD.join(", ")}`);
        run("tar", [...tarFlags(), "-czf", archive, ...PAYLOAD]);

        step(`Shipping to ${target}`);
        run("scp", [...sshOptions(), archive, `${target}:${REMOTE_ARCHIVE}`]);

        step("Unpacking on the target");
        runRemote(env, `tar -xzf ${REMOTE_ARCHIVE} -C ${APP_DIR} && rm -f ${REMOTE_ARCHIVE}`);

        step("Installing production dependencies");
        // --ignore-scripts is also set in the shipped .npmrc. Passing it documents intent.
        // npm needs a login shell: /opt/node/bin reaches PATH through /etc/profile.d, and
        // npm's own shebang is `#!/usr/bin/env node`.
        runRemote(env, `cd ${APP_DIR} && npm ci --omit=dev --ignore-scripts`);

        step(`Restarting ${SERVICE_NAME}`);
        runRemote(env, `sudo -n systemctl restart ${SERVICE_NAME}`);

        step("Waiting for health");
        if (!(await waitForHealth(env))) {
            console.error(`Error: ${SERVICE_NAME} did not become healthy.`);
            // This needs the deploy account to be in the systemd-journal group, which
            // provision-calendar-puzzle.sh grants. Without it journalctl prints nothing
            // and still exits 0, which reads as "no interesting logs" rather than "no
            // access" -- so if this comes back empty, check `id -nG` before believing it.
            console.error(`Read the log: ssh ${target} 'journalctl -u ${SERVICE_NAME} --no-pager -n 50'`);
            process.exit(1);
        }

        console.log(`\n✓ Deployed ${env} to ${target}`);
        console.log(`  Origin: http://${proxmoxHost(env)}:${SERVICE_PORT}`);
        console.log("  Test the origin FROM THE TUNNEL CONTAINER before changing any ingress:");
        console.log(
            "    pct exec 182 -- curl -sS -o /dev/null -w '%{http_code}\\n' " +
            `http://${proxmoxHost(env)}:${SERVICE_PORT}/api/health`
        );
    }
    finally {
        rmSync(stagingDir, { recursive: true, force: true });
    }
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
