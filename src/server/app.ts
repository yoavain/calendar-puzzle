import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import type { Session } from "@fastify/secure-session";
import fastifySecureSession from "@fastify/secure-session";
import fastifyPassport from "@fastify/passport";
import fastifyCsrf from "@fastify/csrf-protection";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyHelmet from "@fastify/helmet";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { registerAdminRoutes } from "./rest/adminRest.js";
import { registerHintRoutes } from "./rest/hintRest.js";
import { registerAuthRoutes } from "./rest/authRest.js";
import { registerStatsRoutes } from "./rest/statsRest.js";
import { registerIssueRoutes } from "./rest/issueRest.js";
import { registerLogRoutes } from "./rest/logRest.js";
import { setupPassport } from "./auth/passport.js";
import { decryptPayload } from "./utils/encryption.js";
import { getCachedFile, validatePath } from "./utils/resourceUtils.js";
import type { EncryptedPayload } from "../common/types.js";
import { config } from "./config.js";
import { API_HEALTH } from "../common/restPaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const buildApp = async (): Promise<FastifyInstance> => {
    const app = Fastify({
        logger: true,
        trustProxy: 1 // Trust exactly 1 proxy hop (Cloudflare Tunnel/Docker → Fastify)
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

    // Encrypted-request IP rate limiter — fires before body parsing and RSA decryption.
    // Prevents unauthenticated CPU exhaustion via x-encrypted flooding.
    // Uses request.ip (real client IP via trustProxy: 1) since request.user is not yet set.
    const encRateMap = new Map<string, { count: number; resetAt: number }>();
    const ENC_RATE_MAX = 20;
    const ENC_RATE_WINDOW_MS = 60_000;

    app.addHook("onRequest", async (request, reply) => {
        if (request.headers["x-encrypted"] !== "true") {
            return;
        }

        const ip = request.ip;
        const now = Date.now();
        let entry = encRateMap.get(ip);

        if (!entry || now > entry.resetAt) {
            entry = { count: 0, resetAt: now + ENC_RATE_WINDOW_MS };
            encRateMap.set(ip, entry);
        }

        if (++entry.count > ENC_RATE_MAX) {
            return reply.code(429).send({ error: "Too Many Requests" });
        }
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

    // Register helmet for security headers (early in chain)
    await app.register(fastifyHelmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://static.cloudflareinsights.com"],
                styleSrc: ["'self'", "'unsafe-inline'"], // Required for MUI/Emotion
                imgSrc: ["'self'", "data:", "https://api.dicebear.com", "https://lh3.googleusercontent.com"], // data: for inline SVGs, dicebear/Google for avatars
                fontSrc: ["'self'"],
                connectSrc: ["'self'"],
                workerSrc: ["'self'", "blob:"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"]
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
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
        }
    });

    // Register rate limiting — key on user ID when authenticated, fall back to IP.
    // hook: "preHandler" ensures passport has already deserialized the session so
    // request.user is available; otherwise the keyGenerator always falls back to IP.
    await app.register(fastifyRateLimit, {
        max: 100,
        timeWindow: "1 minute",
        hook: "preHandler",
        keyGenerator: (request) => (request.user as { id?: string } | undefined)?.id ?? request.ip
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
    
    // Serve index.html for SPA routes (never cache to ensure fresh deployments)
    const serveIndexHtml = async (request: FastifyRequest, reply: FastifyReply) => {
        const file = await getCachedFile(clientBuildPath, "index.html");
        if (file) {
            return reply
                .header("Cache-Control", "no-store")
                .type(file.contentType)
                .send(file.content);
        }
        return reply.code(404).send({ error: "Not found" });
    };

    app.get("/", serveIndexHtml);
    app.get("/poster", serveIndexHtml);

    // Serve favicon
    app.get("/favicon.ico", async (request, reply) => {
        const file = await getCachedFile(clientBuildPath, "favicon.ico");
        if (file) {
            return reply.type(file.contentType).send(file.content);
        }
        return reply.code(404).send({ error: "Not found" });
    });

    // Serve poster
    app.get("/poster.png", async (request, reply) => {
        const file = await getCachedFile(clientBuildPath, "poster.png");
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

        // Block source maps unless the request arrived on a loopback interface.
        // Uses socket.localAddress (server-side, not client-controlled) to prevent
        // Host header spoofing bypasses.
        if (requestedPath.endsWith(".map")) {
            const localAddress = request.socket.localAddress ?? "";
            const allowedAddresses = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
            if (!allowedAddresses.includes(localAddress)) {
                app.log.warn(`Source map access blocked for address: ${localAddress}`);
                return reply.code(403).send({ error: "Forbidden: Source maps are not allowed" });
            }
        }

        // Validate path to prevent traversal attacks
        const validatedPath = validatePath(clientBuildPath, requestedPath);
        if (!validatedPath) {
            app.log.warn(`Path traversal attempt blocked: ${requestedPath}`);
            return reply.code(403).send({ error: "Forbidden" });
        }

        const file = await getCachedFile(clientBuildPath, requestedPath, request.log);
        if (file) {
            // Static assets have content hashes in filenames, safe to cache long-term
            return reply
                .header("Cache-Control", "public, max-age=31536000, immutable")
                .type(file.contentType)
                .send(file.content);
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

        // Skip for health check (GET, no auth, no side effects)
        if (request.url === API_HEALTH) {
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
    app.get(API_HEALTH, async () => {
        return { status: "ok" };
    });

    // Register auth routes
    registerAuthRoutes(app);

    // Register API routes
    registerAdminRoutes(app);
    registerHintRoutes(app);
    registerStatsRoutes(app);
    registerIssueRoutes(app);
    registerLogRoutes(app);

    // Block all other routes
    app.setNotFoundHandler(async (request, reply) => {
        return reply.code(404).send({ error: "Not found" });
    });

    return app;
};
