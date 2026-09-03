import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

export const config = {
    server: {
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
        host: process.env.HOST || "0.0.0.0",
        nodeEnv: process.env.NODE_ENV || "development"
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    database: {
        url: process.env.DATABASE_URL
    },
    github: {
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO
    },
    hallOfFame: {
        // HMAC key for pseudonymizing user IDs in the public Hall of Fame response.
        // Must be a persisted, per-environment secret (generated once, never regenerated
        // at runtime) — same discipline as `secret-key`. Regenerating it reshuffles
        // every user's public userKey/avatar.
        pepper: process.env.HALL_OF_FAME_PEPPER
    },
    paths: {
        root: projectRoot,
        publicKey: path.resolve(projectRoot, "public-key.pem"),
        privateKey: path.resolve(projectRoot, "private-key.pem")
    }
};

export const validateConfig = () => {
    const required = [
        { key: "GOOGLE_CLIENT_ID", value: config.google.clientId },
        { key: "GOOGLE_CLIENT_SECRET", value: config.google.clientSecret },
        { key: "DATABASE_URL", value: config.database.url },
        { key: "GITHUB_TOKEN", value: config.github.token },
        { key: "GITHUB_OWNER", value: config.github.owner },
        { key: "GITHUB_REPO", value: config.github.repo },
        { key: "HALL_OF_FAME_PEPPER", value: config.hallOfFame.pepper }
    ];

    const missing = required.filter(item => !item.value);

    if (missing.length > 0) {
        const missingKeys = missing.map(item => item.key).join(", ");
        throw new Error(`Missing required environment variables: ${missingKeys}`);
    }
};

// Add a type for the config to use in other parts of the app
export type Config = typeof config;
