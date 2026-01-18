import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifySecureSession from '@fastify/secure-session';
import fastifyPassport from '@fastify/passport';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registerSolutionRoutes } from './rest/solutionRest.js';
import { registerHintRoutes } from './rest/hintRest.js';
import { registerAuthRoutes } from './rest/authRest.js';
import { registerStatsRoutes } from './rest/statsRest.js';
import { setupPassport } from './auth/passport.js';

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
            secure: process.env.NODE_ENV === 'production'
        }
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
