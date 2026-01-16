import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildApp(): FastifyInstance {
    const app = Fastify({
        logger: true
    });

    // In production, serve the built client files from the build directory
    // The build directory is created by react-scripts build
    const clientBuildPath = path.join(__dirname, '..', '..', 'build');
    
    app.register(fastifyStatic, {
        root: clientBuildPath,
        prefix: '/'
    });

    // Health check endpoint
    app.get('/api/health', async () => {
        return { status: 'ok' };
    });

    // Serve index.html for client-side routing (SPA fallback)
    app.setNotFoundHandler(async (request, reply) => {
        // Only serve index.html for non-API routes
        if (!request.url.startsWith('/api/')) {
            return reply.sendFile('index.html');
        }
        return reply.code(404).send({ error: 'Not found' });
    });

    return app;
}
