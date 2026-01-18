import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifySecureSession from '@fastify/secure-session';
import fastifyPassport from '@fastify/passport';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyRateLimit from '@fastify/rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registerSolutionRoutes } from './rest/solutionRest.js';
import { registerHintRoutes } from './rest/hintRest.js';
import { registerAuthRoutes } from './rest/authRest.js';
import { registerStatsRoutes } from './rest/statsRest.js';
import { setupPassport } from './auth/passport.js';
import { decryptPayload, EncryptedPayload } from './utils/encryption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validates a path to prevent path traversal attacks.
 * Returns the resolved path if valid, or null if the path attempts traversal.
 */
function validatePath(basePath: string, requestedPath: string): string | null {
    // Normalize and resolve the full path
    const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.resolve(basePath, normalizedPath);
    
    // Ensure the resolved path is within the base directory
    if (!fullPath.startsWith(basePath + path.sep) && fullPath !== basePath) {
        return null;
    }
    
    return fullPath;
}

export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: true,
        trustProxy: true  // Trust X-Forwarded-* headers from reverse proxies
    });

    // Polyfill for Express compatibility (some passport strategies expect req.connection.encrypted)
    // Note: The primary fix for passport-oauth2 is the `proxy: true` option in GoogleStrategy
    app.addHook('onRequest', async (request) => {
        const rawReq = request.raw as any;
        const proto = request.headers['x-forwarded-proto'];
        const socket = request.raw.socket as any;
        const isEncrypted = proto === 'https' || (socket && socket.encrypted === true);
        
        const connection = {
            encrypted: isEncrypted,
            remoteAddress: request.ip
        };

        // Polyfill both the Node.js request and the Fastify request object
        // Some strategies look at request.raw.connection, others at request.connection
        rawReq.connection = connection;
        (request as any).connection = connection;
    });

    // Global decryption hook
    app.addHook('preValidation', async (request, reply) => {
        if (request.headers['x-encrypted'] === 'true' && request.body) {
            try {
                const decryptedBody = decryptPayload(request.body as EncryptedPayload);
                request.body = decryptedBody;
            } catch (error) {
                app.log.error(error, 'Decryption failed');
                return reply.code(400).send({ error: 'Decryption failed' });
            }
        }
    });

    // Read secret key for secure session
    const secretKeyPath = path.join(__dirname, '..', '..', 'secret-key');
    if (!fs.existsSync(secretKeyPath)) {
        throw new Error('secret-key file not found. Generate it with: npx @fastify/secure-session > secret-key');
    }

    // Register secure session (must be before passport)
    await app.register(fastifySecureSession, {
        key: fs.readFileSync(secretKeyPath),
        cookie: {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        }
    });

    // Register rate limiting
    await app.register(fastifyRateLimit, {
        max: 100,
        timeWindow: '1 minute'
    });

    // Register CSRF protection after secure session
    await app.register(fastifyCsrf, {
        sessionPlugin: '@fastify/secure-session'
    });

    // Register passport
    await app.register(fastifyPassport.initialize());
    await app.register(fastifyPassport.secureSession());

    // Setup Google OAuth strategy
    setupPassport();

    const clientBuildPath = path.join(__dirname, '..', '..', 'build');
    
    // Serve index.html at root path only
    app.get('/', async (request, reply) => {
        return reply.type('text/html').send(
            fs.readFileSync(path.join(clientBuildPath, 'index.html'), 'utf-8')
        );
    });

    // Serve favicon
    app.get('/favicon.ico', async (request, reply) => {
        return reply.sendFile('favicon.ico', clientBuildPath);
    });

    // Serve static client files from /client/* with path traversal protection
    app.get('/client/*', async (request, reply) => {
        // Extract the path after /client/
        const requestedPath = (request.params as { '*': string })['*'];
        
        if (!requestedPath) {
            return reply.code(404).send({ error: 'Not found' });
        }
        
        // Validate path to prevent traversal attacks
        const validatedPath = validatePath(clientBuildPath, requestedPath);
        
        if (!validatedPath) {
            app.log.warn(`Path traversal attempt blocked: ${requestedPath}`);
            return reply.code(403).send({ error: 'Forbidden' });
        }
        
        // Check if file exists
        if (!fs.existsSync(validatedPath) || fs.statSync(validatedPath).isDirectory()) {
            return reply.code(404).send({ error: 'Not found' });
        }
        
        return reply.sendFile(requestedPath, clientBuildPath);
    });

    // Register fastify-static for sendFile support (but not serving automatically)
    app.register(fastifyStatic, {
        root: clientBuildPath,
        serve: false // Don't auto-serve, we handle it manually
    });

    // CSRF Protection Hook - Apply to all non-GET/HEAD/OPTIONS requests
    app.addHook('preValidation', async (request, reply) => {
        // Skip CSRF check for GET, HEAD, OPTIONS
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
            return;
        }

        // Skip for health check
        if (request.url === '/api/health') {
            return;
        }

        try {
            // Use the decorated csrfProtection method on the app instance
            // Wrap it in a Promise because it's a callback-based function
            await new Promise<void>((resolve, reject) => {
                (app as any).csrfProtection(request, reply, (err: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (err) {
            const hasSession = !!request.session;
            const sessionData = hasSession ? (request.session as any).get('_csrf') : null;
            const tokenInHeader = request.headers['x-csrf-token'];
            app.log.warn(
                { 
                    url: request.url, 
                    method: request.method, 
                    hasSession, 
                    hasCsrfSecret: !!sessionData,
                    hasTokenInHeader: !!tokenInHeader,
                    tokenLength: typeof tokenInHeader === 'string' ? tokenInHeader.length : 0,
                    bodyKeys: request.body ? Object.keys(request.body as object) : [],
                    err 
                }, 
                'CSRF validation failed'
            );
            return reply.code(403).send({ error: 'Invalid CSRF token' });
        }
    });

    // Health check endpoint
    app.get('/api/health', async () => {
        return { status: 'ok' };
    });

    // Register auth routes
    registerAuthRoutes(app);

    // Register API routes
    registerSolutionRoutes(app);
    registerHintRoutes(app);
    registerStatsRoutes(app);

    // Block all other routes
    app.setNotFoundHandler(async (request, reply) => {
        return reply.code(404).send({ error: 'Not found' });
    });

    return app;
}
