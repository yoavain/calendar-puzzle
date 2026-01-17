import { FastifyInstance } from 'fastify';
import fastifyPassport from '@fastify/passport';
import { SessionUser } from '../auth/passport.js';

export function registerAuthRoutes(app: FastifyInstance): void {
    // Initiate Google OAuth flow
    app.get('/auth/google', {
        preValidation: fastifyPassport.authenticate('google', {
            scope: ['profile', 'email']
        })
    }, async () => {
        // This handler is never called - passport redirects to Google
    });

    // Handle Google OAuth callback
    app.get('/auth/google/callback', {
        preValidation: fastifyPassport.authenticate('google', {
            failureRedirect: '/?error=auth_failed'
        })
    }, async (request, reply) => {
        // Authentication successful, redirect to home
        return reply.redirect('/');
    });

    // Get current authenticated user
    app.get('/auth/user', async (request, reply) => {
        if (request.user) {
            return request.user as SessionUser;
        }
        return reply.code(401).send({ error: 'Not authenticated' });
    });

    // Logout
    app.post('/auth/logout', async (request, reply) => {
        await request.logout();
        return { success: true };
    });
}
