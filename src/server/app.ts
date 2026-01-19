import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import type { Session } from "@fastify/secure-session";
import fastifySecureSession from "@fastify/secure-session";
import fastifyPassport from "@fastify/passport";
import fastifyCsrf from "@fastify/csrf-protection";
import fastifyRateLimit from "@fastify/rate-limit";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { registerSolutionRoutes } from "./rest/solutionRest.js";
import { registerHintRoutes } from "./rest/hintRest.js";
import { registerAuthRoutes } from "./rest/authRest.js";
import { registerStatsRoutes } from "./rest/statsRest.js";
import { setupPassport } from "./auth/passport.js";
import { decryptPayload } from "./utils/encryption.js";
import { getCachedFile, validatePath } from "./utils/resourceUtils.js";
import type { EncryptedPayload } from "../common/types.js";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const buildApp = async (): Promise<FastifyInstance> => {
    const app = Fastify({
        logger: true,
        trustProxy: true // Trust X-Forwarded-* headers from reverse proxies
    });

    // Polyfill for Express compatibility (some passport strategies expect req.connection.encrypted)
    // Note: The primary fix for passport-oauth2 is the `proxy: true` option in GoogleStrategy
    app.addHook("onRequest", async (request) => {
        const rawReq = request.raw as IncomingMessage & { connection?: unknown };
        const proto = request.headers["x-forwarded-proto"];
        const socket = request.raw.socket as Duplex & { encrypted?: boolean };
        const isEncrypted = proto === "https" || (socket && socket.encrypted === true);
        
        const connection = {
            encrypted: isEncrypted,
            remoteAddress: request.ip
        };

        // Polyfill both the Node.js request and the Fastify request object
        // Some strategies look at request.raw.connection, others at request.connection
        (rawReq as any).connection = connection;
        (request as unknown as { connection: unknown }).connection = connection;
    });

    // Global decryption hook
    app.addHook("preValidation", async (request, reply) => {
        if (request.headers["x-encrypted"] === "true" && request.body) {
            try {
                const decryptedBody = await decryptPayload(request.body as EncryptedPayload);
                request.body = decryptedBody;
            }
            catch (error) {
                app.log.error(error, "Decryption failed");
                return reply.code(400).send({ error: "Decryption failed" });
            }
        }
    });

    // Read secret key for secure session
    const secretKeyPath = path.join(__dirname, "..", "..", "secret-key");
    try {
        await fs.access(secretKeyPath);
    }
    catch {
        throw new Error("secret-key file not found. Generate it with: npx @fastify/secure-session > secret-key");
    }

    // Register secure session (must be before passport)
    await app.register(fastifySecureSession, {
        key: await fs.readFile(secretKeyPath),
        cookie: {
            path: "/",
            httpOnly: true,
            secure: config.server.nodeEnv === "production",
            sameSite: "lax"
        }
    });

    // Register rate limiting
    await app.register(fastifyRateLimit, {
        max: 100,
        timeWindow: "1 minute"
    });

    // Register CSRF protection after secure session
    await app.register(fastifyCsrf, {
        sessionPlugin: "@fastify/secure-session"
    });

    // Register passport
    await app.register(fastifyPassport.initialize());
    await app.register(fastifyPassport.secureSession());

    // Setup Google OAuth strategy
    setupPassport();

    const clientBuildPath = path.join(__dirname, "..", "..", "build");
    
    // Serve index.html at root path only
    app.get("/", async (request, reply) => {
        const file = await getCachedFile(clientBuildPath, "index.html");
        if (file) {
            return reply.type(file.contentType).send(file.content);
        }
        return reply.code(404).send({ error: "Not found" });
    });

    // Serve favicon
    app.get("/favicon.ico", async (request, reply) => {
        const file = await getCachedFile(clientBuildPath, "favicon.ico");
        if (file) {
            return reply.type(file.contentType).send(file.content);
        }
        return reply.code(404).send({ error: "Not found" });
    });

    // Serve static client files from /client/* with path traversal protection
    app.get("/client/*", async (request, reply) => {
        // Extract the path after /client/
        const requestedPath = (request.params as { "*": string })["*"];
        
        if (!requestedPath) {
            return reply.code(404).send({ error: "Not found" });
        }

        // Validate path to prevent traversal attacks
        const validatedPath = validatePath(clientBuildPath, requestedPath);
        if (!validatedPath) {
            app.log.warn(`Path traversal attempt blocked: ${requestedPath}`);
            return reply.code(403).send({ error: "Forbidden" });
        }

        const file = await getCachedFile(clientBuildPath, requestedPath);
        if (file) {
            return reply.type(file.contentType).send(file.content);
        }
        
        return reply.code(404).send({ error: "Not found" });
    });

    // Register fastify-static for sendFile support (but not serving automatically)
    app.register(fastifyStatic, {
        root: clientBuildPath,
        serve: false // Don't auto-serve, we handle it manually
    });

    // CSRF Protection Hook - Apply to all non-GET/HEAD/OPTIONS requests
    app.addHook("preValidation", async (request, reply) => {
        // Skip CSRF check for GET, HEAD, OPTIONS
        if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
            return;
        }

        // Skip for health check
        if (request.url === "/api/health") {
            return;
        }

        try {
            // Use the decorated csrfProtection method on the app instance
            // Wrap it in a Promise because it's a callback-based function
            await new Promise<void>((resolve, reject) => {
                const appWithCsrf = app as FastifyInstance & { 
                    csrfProtection: (req: FastifyRequest, reply: FastifyReply, next: (err?: Error) => void) => void 
                };
                appWithCsrf.csrfProtection(request, reply, (err?: Error) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
        catch (err) {
            const hasSession = !!request.session;
            const sessionData = hasSession ? (request.session as Session).get("_csrf") : null;
            const tokenInHeader = request.headers["x-csrf-token"];
            app.log.warn(
                { 
                    url: request.url, 
                    method: request.method, 
                    hasSession, 
                    hasCsrfSecret: !!sessionData,
                    hasTokenInHeader: !!tokenInHeader,
                    tokenLength: typeof tokenInHeader === "string" ? tokenInHeader.length : 0,
                    bodyKeys: request.body ? Object.keys(request.body as object) : [],
                    err 
                }, 
                "CSRF validation failed"
            );
            return reply.code(403).send({ error: "Invalid CSRF token" });
        }
    });

    // Health check endpoint
    app.get("/api/health", async () => {
        return { status: "ok" };
    });

    // Register auth routes
    registerAuthRoutes(app);

    // Register API routes
    registerSolutionRoutes(app);
    registerHintRoutes(app);
    registerStatsRoutes(app);

    // Block all other routes
    app.setNotFoundHandler(async (request, reply) => {
        return reply.code(404).send({ error: "Not found" });
    });

    return app;
};
