import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registerSolutionRoutes } from './rest/solutionRest';
import { registerHintRoutes } from './rest/hintRest';

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

export function buildApp(): FastifyInstance {
    const app = Fastify({
        logger: true
    });

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

    // Register API routes
    registerSolutionRoutes(app);
    registerHintRoutes(app);

    // Block all other routes
    app.setNotFoundHandler(async (request, reply) => {
        return reply.code(404).send({ error: 'Not found' });
    });

    return app;
}
